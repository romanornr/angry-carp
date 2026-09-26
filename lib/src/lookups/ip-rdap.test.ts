import assert from 'node:assert/strict';
import { test } from 'node:test';
import * as v from 'valibot';
import { ipAddressSchema, lookupIpRdap } from './ip-rdap.ts';

const address = v.parse(ipAddressSchema, '192.0.2.129');
const bootstrapUrl = 'https://data.iana.org/rdap/ipv4.json';
const sourceUrl = 'https://registry.example/ip/192.0.2.129';
const directory = { services: [[['192.0.2.0/24'], ['https://registry.example/']]] };
const record = { objectClassName: 'ip network', ipVersion: 'v4',
  startAddress: '192.0.2.0', endAddress: '192.0.2.255', name: 'EXAMPLE-NET' };

test('normalizes bare addresses and rejects URLs, ports, CIDRs, zone IDs and malformed input', () => {
  for (const [input, expected] of [['2001:0DB8:0000::1', '2001:db8::1'],
    ['::ffff:192.0.2.1', '::ffff:c000:201'], ['::', '::'], ['192.0.2.1', '192.0.2.1']]) {
    assert.equal(v.parse(ipAddressSchema, input), expected);
  }

  for (const input of ['example.com', 'https://192.0.2.1', '192.0.2.1:443', '192.0.2.1/24',
    '[2001:db8::1]', 'fe80::1%eth0', '1', '010.0.0.1', '192.0.2.999', '2001:::1', '../auth.json']) {
    assert.equal(v.safeParse(ipAddressSchema, input).success, false, input);
  }
});

test('selects the longest binary prefix and returns only a containing network with provenance', async (t) => {
  for (const sample of [
    { input: '192.0.2.129', expected: '192.0.2.129', family: 'v4', bits: 'ipv4',
      prefix: '192.0.2.128/25', broad: '0.0.0.0/0', other: '192.0.2.0/25',
      start: '192.0.2.128', end: '192.0.2.255' },
    { input: '2001:0DB8:8000::1', expected: '2001:db8:8000::1', family: 'v6', bits: 'ipv6',
      prefix: '2001:db8:8000::/33', broad: '2001:db8::/32', other: '2001:db8::/33',
      start: '2001:db8:8000::', end: '2001:db8:ffff:ffff:ffff:ffff:ffff:ffff' },
    { input: '::ffff:192.0.2.1', expected: '::ffff:c000:201', family: 'v6', bits: 'ipv6',
      prefix: '::ffff:192.0.2.1/128', broad: '::/0', other: '2001:db8::/32',
      start: '::ffff:c000:201', end: '::ffff:c000:201' },
    { input: '192.0.2.129', expected: '192.0.2.129', family: 'v4', bits: 'ipv4',
      prefix: '192.0.2.129/32', broad: '192.0.2.0/24', other: '192.0.2.128/32',
      start: '192.0.2.129', end: '192.0.2.129' },
  ]) {
    const requests: string[] = [];
    t.mock.method(globalThis, 'fetch', async (url: string, options?: RequestInit) => {
      requests.push(url);
      assert.equal(options?.credentials, 'omit');
      assert.equal(options?.redirect, 'manual');
      assert.deepEqual(options?.headers, { accept: 'application/rdap+json, application/json' });
      if (url === `https://data.iana.org/rdap/${sample.bits}.json`) return Response.json({ services: [
        [[sample.broad], ['https://wrong.example/']],
        [[sample.prefix], ['http://registry.example/']],
        [[sample.other], ['https://wrong.example/']],
        [[sample.prefix], ['https://registry.example/']],
      ] });
      assert.equal(url, `https://registry.example/ip/${sample.expected}`);

      return Response.json({ ...record, ipVersion: sample.family, startAddress: sample.start, endAddress: sample.end,
        entities: [{ privateDetail: 'omitted' }], links: [{ href: 'https://candidate.example/' }] });
    });
    const { retrievedAt, discovery, ...result } = await lookupIpRdap(v.parse(ipAddressSchema, sample.input));
    assert.equal(Number.isFinite(Date.parse(retrievedAt)), true);
    assert.deepEqual(result, { queriedAddress: sample.expected, sourceUrl: `https://registry.example/ip/${sample.expected}`,
      kind: 'found', network: { startAddress: sample.start, endAddress: sample.end, ipVersion: sample.family,
        name: 'EXAMPLE-NET', handle: null, type: null, country: null } });
    assert.deepEqual(requests, [`https://data.iana.org/rdap/${sample.bits}.json`, result.sourceUrl]);
  }
});

test('keeps missing services, invalid records and transport failures distinct', async (t) => {
  let bootstrap: unknown = directory;
  let response = Response.json(record);
  let failRequest = false;
  t.mock.method(globalThis, 'fetch', async (url: string) => {
    if (failRequest) throw new Error('Private runtime detail');
    if (url === bootstrapUrl) return Response.json(bootstrap);
    assert.equal(url, sourceUrl);

    return response;
  });

  for (const services of [[], [[['192.0.2.0/24'], ['http://registry.example/',
    'https://127.0.0.1/', 'https://user:secret@registry.example/', 'https://registry.example/?x=1']]]]) {
    bootstrap = { services };
    assert.partialDeepStrictEqual(await lookupIpRdap(address), { kind: 'no_service', sourceUrl: bootstrapUrl });
  }

  for (const prefix of ['192.0.2.0/33', '192.0.2.0/-1', '192.0.2.0/8junk', 'invalid/24', '2001:db8::/32']) {
    bootstrap = { services: [[[prefix], ['https://registry.example/']]] };
    assert.partialDeepStrictEqual(await lookupIpRdap(address), { kind: 'unavailable', reason: 'invalid_response' });
  }

  bootstrap = directory;

  for (const invalid of [
    { ...record, startAddress: '198.51.100.0', endAddress: '198.51.100.255' },
    { ...record, startAddress: '192.0.2.255', endAddress: '192.0.2.0' },
    { ...record, ipVersion: 'v6' }, { ...record, startAddress: '::', endAddress: 'ffff::' },
    { objectClassName: 'domain' },
  ]) {
    response = Response.json(invalid);
    assert.partialDeepStrictEqual(await lookupIpRdap(address), { kind: 'unavailable', reason: 'invalid_response' });
  }

  for (const [status, expected] of [[404, { kind: 'not_found' }], [302, { kind: 'unavailable', reason: 'redirected' }],
    [429, { kind: 'http_error', status: 429 }]] satisfies [number, object][]) {
    response = new Response(null, { status, headers: { location: 'https://candidate.example/' } });
    assert.partialDeepStrictEqual(await lookupIpRdap(address), expected);
  }

  failRequest = true;
  assert.partialDeepStrictEqual(await lookupIpRdap(address), { kind: 'unavailable', reason: 'request_failed' });
});
