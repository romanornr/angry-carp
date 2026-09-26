import assert from 'node:assert/strict';
import { test } from 'node:test';
import * as v from 'valibot';
import { createRdapBootstrap, domainSchema, lookupRdap } from './rdap.ts';
import { ipAddressSchema, lookupIpRdap } from './ip-rdap.ts';

const domain = v.parse(domainSchema, 'example.com');
const bootstrapUrl = 'https://data.iana.org/rdap/dns.json';
const directory = { services: [[['com'], ['https://registry.example/']]] };
const record = { objectClassName: 'domain', ldhName: 'example.com' };
const epoch = Date.parse('2026-09-23T00:00:00Z');
const headers = { date: new Date(epoch).toUTCString(), 'cache-control': 'max-age=60' };

test('concurrent and subsequent lookups reuse fresh discovery; registry records remain live', async (t) => {
  t.mock.method(Date, 'now', () => epoch);
  const calls: string[] = [];
  t.mock.method(globalThis, 'fetch', async (url: string) => {
    calls.push(url);
    if (url === bootstrapUrl) return Response.json(directory, { headers });
    assert.ok(url.startsWith('https://registry.example/domain/'));

    return Response.json({ ...record, ldhName: url.split('/').at(-1) });
  });
  const signal = new AbortController().signal;
  const options = { signal, bootstrap: createRdapBootstrap(signal) };
  const results = await Promise.all([lookupRdap(domain, options), lookupRdap(v.parse(domainSchema, 'other.com'), options)]);
  results.push(await lookupRdap(domain, options));
  assert.deepEqual(results.map(({ kind }) => kind), ['found', 'found', 'found']);
  assert.equal(calls.filter((url) => url === bootstrapUrl).length, 1);
  assert.equal(calls.length, 4);

  for (const result of results) assert.deepEqual(result.discovery, { sourceUrl: bootstrapUrl, retrievedAt: new Date(epoch).toISOString() });

  await lookupRdap(domain, { signal, bootstrap: createRdapBootstrap(signal) });
  assert.equal(calls.filter((url) => url === bootstrapUrl).length, 2, 'another run owns another cache');
});

test('HTTP freshness bounds reuse, including age, no-store and concurrent uncacheable responses', async (t) => {
  let now = epoch;
  t.mock.method(Date, 'now', () => now);
  let bootstrapRequests = 0;
  let responseHeaders: Record<string, string> = headers;
  t.mock.method(globalThis, 'fetch', async (url: string) => {
    if (url !== bootstrapUrl) return Response.json(record);
    bootstrapRequests++;

    return Response.json(directory, { headers: responseHeaders });
  });
  const samples: { fields: Record<string, string>; advance: number; expected: number }[] = [
    { fields: headers, advance: 61_000, expected: 2 },
    { fields: { ...headers, age: '59' }, advance: 2_000, expected: 2 },
    { fields: { date: headers.date, expires: new Date(epoch + 60_000).toUTCString() }, advance: 1_000, expected: 1 },
    ...['no-store, max-age=60', 'no-cache, max-age=60', 'max-age=0', 'max-age=60, max-age=120', 'max-age', 'max-age=oops', ''].map((value) =>
      ({ fields: { ...headers, 'cache-control': value }, advance: 0, expected: 2 })),
    { fields: { ...headers, vary: '*' }, advance: 0, expected: 2 },
    { fields: { ...headers, vary: 'Accept-Encoding, Accept' }, advance: 0, expected: 1 },
    { fields: { ...headers, vary: 'Accept-Language' }, advance: 0, expected: 2 },
    { fields: { ...headers, age: 'invalid' }, advance: 0, expected: 2 },
  ];

  for (const sample of samples) {
    now = epoch;
    responseHeaders = sample.fields;
    bootstrapRequests = 0;
    const signal = new AbortController().signal;
    const options = { signal, bootstrap: createRdapBootstrap(signal) };
    assert.equal((await lookupRdap(domain, options)).kind, 'found');
    now += sample.advance;
    assert.equal((await lookupRdap(domain, options)).kind, 'found');
    assert.equal(bootstrapRequests, sample.expected, JSON.stringify(sample));
  }

  bootstrapRequests = 0;
  responseHeaders = { ...headers, 'cache-control': 'no-store' };
  const signal = new AbortController().signal;
  const options = { signal, bootstrap: createRdapBootstrap(signal) };
  await Promise.all([lookupRdap(domain, options), lookupRdap(domain, options), lookupRdap(domain, options)]);
  assert.equal(bootstrapRequests, 3);
});

test('failed or invalid discovery never poisons subsequent calls', async (t) => {
  t.mock.method(Date, 'now', () => epoch);
  let reply: () => Response = () => Response.json(directory, { headers });
  let requests = 0;
  t.mock.method(globalThis, 'fetch', async (url: string) => {
    if (url !== bootstrapUrl) return Response.json(record);
    requests++;

    return reply();
  });

  for (const [failure, reason] of [
    [() => { throw new Error('private host', { cause: { code: 'ENOTFOUND' } }); }, 'name_resolution'],
    [() => { throw Object.assign(new Error('private host'), { code: 'EAI_AGAIN' }); }, 'name_resolution'],
    [() => { throw new TypeError('private detail', { cause: { code: 'ECONNRESET' } }); }, 'connection_reset'],
    [() => { throw new Error('private detail'); }, 'request_failed'],
    [() => new Response('private malformed body', { headers }), 'invalid_response'],
    [() => Response.json({ services: 'private invalid shape' }, { headers }), 'invalid_response'],
    [() => new Response(null, { status: 429 }), null],
  ] satisfies [() => Response, string | null][]) {
    requests = 0;
    const signal = new AbortController().signal;
    const options = { signal, bootstrap: createRdapBootstrap(signal) };
    reply = failure;
    const failed = await lookupRdap(domain, options);
    if (reason) assert.partialDeepStrictEqual(failed, { kind: 'unavailable', reason, sourceUrl: bootstrapUrl });
    else assert.partialDeepStrictEqual(failed, { kind: 'http_error', status: 429, sourceUrl: bootstrapUrl });
    assert.doesNotMatch(JSON.stringify(failed), /private/);
    reply = () => Response.json(directory, { headers });
    assert.equal((await lookupRdap(domain, options)).kind, 'found');
    assert.equal(requests, 2);
  }
});

test('a cancelled waiter does not cancel siblings; owner cancellation settles the transport', async (t) => {
  t.mock.method(Date, 'now', () => epoch);

  for (const cancelOwner of [false, true]) {
    const owner = new AbortController();
    const caller = new AbortController();
    const started = Promise.withResolvers<void>();
    const release = Promise.withResolvers<Response>();
    let transportCancelled = false;
    let requests = 0;
    t.mock.method(globalThis, 'fetch', async (url: string, init?: RequestInit) => {
      if (url !== bootstrapUrl) return Response.json(record);
      requests++;
      const signal = init?.signal;
      const abort = () => { transportCancelled = true; release.reject(signal?.reason); };
      signal?.addEventListener('abort', abort, { once: true });
      started.resolve();

      try { return await release.promise; }
      finally { signal?.removeEventListener('abort', abort); }
    });
    const bootstrap = createRdapBootstrap(owner.signal);
    const first = lookupRdap(domain, { signal: caller.signal, bootstrap });
    const second = lookupRdap(domain, { signal: owner.signal, bootstrap });
    await started.promise;
    if (cancelOwner) owner.abort();
    else caller.abort();
    assert.partialDeepStrictEqual(await first, { kind: 'unavailable', reason: 'cancelled' });
    assert.equal(transportCancelled, cancelOwner);
    if (cancelOwner) assert.partialDeepStrictEqual(await second, { kind: 'unavailable', reason: 'cancelled' });
    else {
      release.resolve(Response.json(directory, { headers }));
      assert.equal((await second).kind, 'found');
    }
    assert.equal(requests, 1);
  }
});

test('discovery failure after the last waiter aborts is evicted before the next attempt', async (t) => {
  for (const invalidBody of [false, true]) {
    const owner = new AbortController();
    const caller = new AbortController();
    const release = Promise.withResolvers<Response>();
    let requests = 0;
    t.mock.method(globalThis, 'fetch', async (url: string) => {
      if (url !== bootstrapUrl) return Response.json(record);
      requests++;
      if (requests === 1) return release.promise;
      return Response.json(directory);
    });
    const bootstrap = createRdapBootstrap(owner.signal);
    const first = lookupRdap(domain, { signal: caller.signal, bootstrap });
    caller.abort();
    assert.partialDeepStrictEqual(await first, { kind: 'unavailable', reason: 'cancelled' });
    if (invalidBody) release.resolve(Response.json({ services: 'invalid' }, { headers: { date: new Date().toUTCString(), 'cache-control': 'max-age=60' } }));
    else release.reject(new Error('private failed shared request'));
    await new Promise<void>((resolve) => setImmediate(resolve));
    assert.equal((await lookupRdap(domain, { signal: owner.signal, bootstrap })).kind, 'found');
    assert.equal(requests, 2);
  }
});

test('no-service results retain the actual discovery retrieval time on reuse', async (t) => {
  t.mock.method(Date, 'now', () => epoch);
  let requests = 0;
  t.mock.method(globalThis, 'fetch', async () => {
    requests++;

    return Response.json({ services: [] }, { headers });
  });
  const signal = new AbortController().signal;
  const options = { signal, bootstrap: createRdapBootstrap(signal) };
  await lookupRdap(domain, options);
  const result = await lookupRdap(domain, options);
  assert.equal(result.kind, 'no_service');
  assert.equal(result.retrievedAt, new Date(epoch).toISOString());
  assert.equal(requests, 1);
});

test('IPv4 and IPv6 discovery stay separate while each family is reused', async (t) => {
  t.mock.method(Date, 'now', () => epoch);
  const calls: string[] = [];
  t.mock.method(globalThis, 'fetch', async (url: string) => {
    calls.push(url);
    if (url.endsWith('/ipv4.json')) return Response.json({ services: [[['192.0.2.0/24'], ['https://registry.example/']]] }, { headers });
    if (url.endsWith('/ipv6.json')) return Response.json({ services: [[['2001:db8::/32'], ['https://registry.example/']]] }, { headers });
    assert.ok(url.startsWith('https://registry.example/ip/'));
    const address = url.split('/').at(-1);
    let ipVersion = 'v4';
    if (address?.includes(':')) ipVersion = 'v6';
    return Response.json({ objectClassName: 'ip network', startAddress: address, endAddress: address, ipVersion });
  });
  const signal = new AbortController().signal;
  const options = { signal, bootstrap: createRdapBootstrap(signal) };

  for (const address of ['192.0.2.1', '2001:db8::1', '192.0.2.2', '2001:db8::2']) {
    assert.equal((await lookupIpRdap(v.parse(ipAddressSchema, address), options)).kind, 'found');
  }

  assert.equal(calls.filter((url) => url.startsWith('https://data.iana.org/')).length, 2);
  assert.equal(calls.length, 6);
});
