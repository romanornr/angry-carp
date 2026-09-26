import assert from 'node:assert/strict';
import { test } from 'node:test';
import * as v from 'valibot';
import { domainSchema, lookupRdap } from './rdap.ts';

const domain = v.parse(domainSchema, 'EXAMPLE.COM');
const directory = { services: [[['com'], ['https://registry.example/rdap/']]] };
const sourceUrl = 'https://registry.example/rdap/domain/example.com';
const record = {
  objectClassName: 'domain',
  ldhName: 'EXAMPLE.COM',
  status: ['server transfer prohibited'],
  events: [{ eventAction: 'registration', eventDate: '2020-01-02T00:00:00Z' }],
  entities: [
    {
      roles: ['registrar'],
      publicIds: [{ type: 'IANA Registrar ID', identifier: '123' }],
      vcardArray: ['vcard', [['fn', {}, 'text', 'Example Registrar']]],
      entities: [{
        roles: ['abuse'],
        vcardArray: ['vcard', [['email', {}, 'text', 'abuse@registrar.example']]],
      }],
    },
    {
      roles: ['registrant'],
      vcardArray: ['vcard', [['email', {}, 'text', 'private@owner.example']]],
    },
    {
      roles: ['abuse'],
      vcardArray: ['vcard', [['email', {}, 'text', 'unattributed@registry.example']]],
    },
  ],
  links: [{ rel: 'related', href: 'https://candidate.example/download' }],
};

test('returns attributed registration evidence without personal data or referral requests', async (t) => {
  const requests: { url: string; options: RequestInit | undefined }[] = [];
  t.mock.method(globalThis, 'fetch', async (url: string, options?: RequestInit) => {
    requests.push({ url, options });
    if (url === 'https://data.iana.org/rdap/dns.json') return Response.json(directory);
    if (url === sourceUrl) return Response.json(record);
    throw new Error('Unexpected destination');
  });

  const result = await lookupRdap(domain);
  const { retrievedAt, discovery, ...evidence } = result;
  assert.equal(Number.isFinite(Date.parse(retrievedAt)), true);
  assert.deepEqual(evidence, {
    queriedDomain: 'example.com', sourceUrl, kind: 'found',
    status: ['server transfer prohibited'],
    events: [{ eventAction: 'registration', eventDate: '2020-01-02T00:00:00Z' }],
    registrars: [{ name: 'Example Registrar', ianaId: '123', abuseEmails: ['abuse@registrar.example'] }],
  });
  assert.deepEqual(requests.map(({ url }) => url), ['https://data.iana.org/rdap/dns.json', sourceUrl]);

  for (const { options } of requests) {
    assert.deepEqual(options?.headers, { accept: 'application/rdap+json, application/json' });
    assert.equal(options?.credentials, 'omit');
    assert.equal(options?.redirect, 'manual');
  }
});

test('validates domain tool inputs and rejects URLs, paths, addresses, IPs, and malformed names', () => {
  assert.equal(v.parse(domainSchema, 'EXAMPLE.COM'), 'example.com');

  for (const input of ['https://example.com', '../auth.json', 'me@example.com', '127.0.0.1', 'localhost', '-bad.com', 'x'.repeat(64) + '.com']) {
    assert.equal(v.safeParse(domainSchema, input).success, false, input);
  }
});

test('selects the longest IANA suffix and retains the supplied query domain', async (t) => {
  t.mock.method(globalThis, 'fetch', async (url: string) => {
    if (url.endsWith('dns.json')) return Response.json({ services: [
      [['uk'], ['https://wrong.example/']],
      [['co.uk'], ['https://registry.example/rdap/']],
    ] });
    assert.equal(url, 'https://registry.example/rdap/domain/example.co.uk');

    return Response.json({ ...record, ldhName: 'example.co.uk' });
  });
  const result = await lookupRdap(v.parse(domainSchema, 'example.co.uk'));
  assert.equal(result.kind, 'found');
  if (result.kind === 'found') assert.equal(result.sourceUrl, 'https://registry.example/rdap/domain/example.co.uk');
});

test('distinguishes absent records, throttling, redirects, bad data, and incomplete contacts', async (t) => {
  let reply = new Response(null, { status: 404 });
  t.mock.method(globalThis, 'fetch', async (url: string) => {
    if (url.endsWith('dns.json')) return Response.json(directory);
    assert.equal(url, sourceUrl);

    return reply;
  });

  for (const status of [404, 429, 302]) {
    reply = new Response(null, { status, headers: { location: 'http://127.0.0.1/private' } });
    const result = await lookupRdap(domain);
    const { retrievedAt, discovery, ...evidence } = result;

    if (status === 404) {
      assert.deepEqual(evidence, { queriedDomain: 'example.com', sourceUrl, kind: 'not_found' });
    } else if (status === 302) {
      assert.deepEqual(evidence, { queriedDomain: 'example.com', sourceUrl, kind: 'unavailable', reason: 'redirected' });
    } else {
      assert.deepEqual(evidence, { queriedDomain: 'example.com', sourceUrl, kind: 'http_error', status });
    }
  }

  reply = Response.json({ ...record, ldhName: 'different.com' });
  assert.equal((await lookupRdap(domain)).kind, 'unavailable');
  reply = Response.json({ objectClassName: 'domain', ldhName: 'example.com' });
  const result = await lookupRdap(domain);
  assert.equal(result.kind, 'found');
  if (result.kind === 'found') assert.deepEqual(result.registrars, []);
});

test('sanitizes network errors and bounds streamed responses', async (t) => {
  const fetch = t.mock.method(globalThis, 'fetch', async () => {
    throw new Error('private runtime detail');
  });
  const failed = await lookupRdap(domain);
  const { retrievedAt, discovery, ...evidence } = failed;
  assert.deepEqual(evidence, {
    queriedDomain: 'example.com', sourceUrl: 'https://data.iana.org/rdap/dns.json',
    kind: 'unavailable', reason: 'request_failed',
  });
  fetch.mock.mockImplementation(async () => new Response('x'.repeat(512 * 1024 + 1)));
  const oversized = await lookupRdap(domain);
  assert.equal(oversized.kind, 'unavailable');
  if (oversized.kind === 'unavailable') assert.equal(oversized.reason, 'response_too_large');
});

test('does not invent a service when IANA has none or offers an unsafe endpoint', async (t) => {
  let services: unknown[] = [];
  t.mock.method(globalThis, 'fetch', async () => Response.json({ services }));

  for (const endpoints of [[], ['http://registry.example/'], ['https://user:password@registry.example/'], ['https://127.0.0.1/']]) {
    services = [[['com'], endpoints]];
    const result = await lookupRdap(domain);
    assert.equal(result.kind, 'no_service');
  }
});
