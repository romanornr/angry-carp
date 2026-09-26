import assert from 'node:assert/strict';
import { test } from 'node:test';
import * as v from 'valibot';
import { dnsQuerySchema, lookupDns } from './dns.ts';

const query = v.parse(dnsQuerySchema, { name: 'EXAMPLE.COM', type: 'A' });
const sourceUrl = 'https://cloudflare-dns.com/dns-query?name=example.com&type=A';
const record = {
  Status: 0,
  TC: false,
  Question: [{ name: 'example.com.', type: 1 }],
  Answer: [
    { name: 'example.com.', type: 5, TTL: 300, data: 'edge.example.net.' },
    { name: 'edge.example.net.', type: 1, TTL: 60, data: '192.0.2.1' },
  ],
};

test('returns the complete answer chain with provenance through the fixed resolver', async (t) => {
  const requests: { url: string; options: RequestInit | undefined }[] = [];
  t.mock.method(globalThis, 'fetch', async (url: string, options?: RequestInit) => {
    requests.push({ url, options });

    return Response.json(record);
  });
  const { retrievedAt, ...result } = await lookupDns(query);
  assert.equal(Number.isFinite(Date.parse(retrievedAt)), true);
  assert.deepEqual(result, {
    query: { name: 'example.com', type: 'A' }, sourceUrl, kind: 'answered',
    rcode: 'NOERROR', truncated: false,
    answers: [
      { name: 'example.com.', type: 'CNAME', ttl: 300, data: 'edge.example.net.' },
      { name: 'edge.example.net.', type: 'A', ttl: 60, data: '192.0.2.1' },
    ],
  });
  assert.deepEqual(requests.map(({ url }) => url), [sourceUrl]);
  assert.deepEqual(requests[0].options?.headers, { accept: 'application/dns-json' });
  assert.equal(requests[0].options?.credentials, 'omit');
  assert.equal(requests[0].options?.redirect, 'manual');
});

test('accepts DKIM query names and preserves TXT quoting', async (t) => {
  const dkim = v.parse(dnsQuerySchema, { name: 'resend._domainkey.EXAMPLE.COM', type: 'TXT' });
  t.mock.method(globalThis, 'fetch', async () => Response.json({
    Status: 0, TC: false,
    Question: [{ name: 'resend._domainkey.example.com.', type: 16 }],
    Answer: [{ name: 'resend._domainkey.example.com.', type: 16, TTL: 600, data: '"v=DKIM1;" "p=public-key"' }],
  }));
  const { retrievedAt, ...result } = await lookupDns(dkim);
  assert.deepEqual(result, {
    query: { name: 'resend._domainkey.example.com', type: 'TXT' },
    sourceUrl: 'https://cloudflare-dns.com/dns-query?name=resend._domainkey.example.com&type=TXT',
    kind: 'answered', rcode: 'NOERROR', truncated: false,
    answers: [{ name: 'resend._domainkey.example.com.', type: 'TXT', ttl: 600, data: '"v=DKIM1;" "p=public-key"' }],
  });
});

test('validates names and the supported record types at the tool boundary', () => {
  assert.deepEqual(v.parse(dnsQuerySchema, { name: '_dmarc.EXAMPLE.COM', type: 'TXT' }), {
    name: '_dmarc.example.com', type: 'TXT',
  });

  for (const name of ['https://example.com', 'me@example.com', '../auth.json', '127.0.0.1', '::1', 'localhost', '-bad.com', 'bad_.com', '_'.repeat(2) + 'bad.com', 'x'.repeat(64) + '.com']) {
    assert.equal(v.safeParse(dnsQuerySchema, { name, type: 'A' }).success, false, name);
  }

  assert.equal(v.safeParse(dnsQuerySchema, { name: 'example.com', type: 'ANY' }).success, false);
});

test('distinguishes no records, DNS failures, unknown codes, and partial answers', async (t) => {
  let reply: unknown;
  t.mock.method(globalThis, 'fetch', async () => Response.json(reply));

  for (const [status, rcode] of [[0, 'NOERROR'], [3, 'NXDOMAIN'], [2, 'SERVFAIL'], [5, 'REFUSED'], [23, 'RCODE_23']]) {
    reply = { Status: status, TC: false, Question: record.Question };
    const { retrievedAt, ...result } = await lookupDns(query);
    assert.deepEqual(result, { query, sourceUrl, kind: 'answered', rcode, truncated: false, answers: [] });
  }

  reply = { ...record, TC: true };
  const result = await lookupDns(query);
  assert.equal(result.kind, 'answered');
  if (result.kind !== 'answered') assert.fail('Expected partial DNS response');
  assert.equal(result.truncated, true);
  assert.deepEqual(result.answers, [
    { name: 'example.com.', type: 'CNAME', ttl: 300, data: 'edge.example.net.' },
    { name: 'edge.example.net.', type: 'A', ttl: 60, data: '192.0.2.1' },
  ]);
});

test('rejects mismatched and oversized resolver data rather than inventing observations', async (t) => {
  let reply: unknown;
  t.mock.method(globalThis, 'fetch', async () => Response.json(reply));

  for (reply of [
    {},
    { ...record, Question: [{ name: 'other.example.', type: 1 }] },
    { ...record, Question: [{ name: 'example.com.', type: 28 }] },
  ]) {
    const { retrievedAt, ...result } = await lookupDns(query);
    assert.deepEqual(result, { query, sourceUrl, kind: 'unavailable', reason: 'invalid_response' });
  }

  for (reply of [
    { ...record, Answer: Array(21).fill(record.Answer[0]) },
    { ...record, Answer: [{ ...record.Answer[0], data: 'x'.repeat(4097) }] },
  ]) {
    const { retrievedAt, ...result } = await lookupDns(query);
    assert.deepEqual(result, { query, sourceUrl, kind: 'unavailable', reason: 'response_too_large' });
  }

  reply = { ...record, Answer: [{ name: 'example.com.', type: 65280, TTL: 0, data: 'opaque' }] };
  const result = await lookupDns(query);
  if (result.kind !== 'answered') assert.fail('Expected unknown record type to be preserved');
  assert.deepEqual(result.answers, [{ name: 'example.com.', type: 'TYPE65280', ttl: 0, data: 'opaque' }]);
});

test('keeps transport failures safe and treats a retry as a fresh lookup', async (t) => {
  const fetch = t.mock.method(globalThis, 'fetch', async () => {
    throw new Error('private runtime details');
  });
  const { retrievedAt, ...failed } = await lookupDns(query);
  assert.deepEqual(failed, { query, sourceUrl, kind: 'unavailable', reason: 'request_failed' });

  fetch.mock.mockImplementation(async () => new Response(null, { status: 302, headers: { location: 'http://127.0.0.1/' } }));
  const { retrievedAt: redirectTime, ...redirect } = await lookupDns(query);
  assert.deepEqual(redirect, { query, sourceUrl, kind: 'unavailable', reason: 'redirected' });

  fetch.mock.mockImplementation(async () => Response.json(record));
  assert.equal((await lookupDns(query)).kind, 'answered');
  fetch.mock.mockImplementation(async () => Response.json({ ...record, Answer: [] }));
  const { retrievedAt: retryTime, ...retry } = await lookupDns(query);
  assert.deepEqual(retry, { query, sourceUrl, kind: 'answered', rcode: 'NOERROR', truncated: false, answers: [] });
});
