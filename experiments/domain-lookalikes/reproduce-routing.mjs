import assert from 'node:assert/strict';
import { mock } from 'node:test';
import { analyzeEmail } from '../../lib/src/email-analysis/analyze-email.ts';
import { loadBrandDirectory } from '../../lib/src/brands/load-directory.ts';

const directory = await loadBrandDirectory();
const cases = [
  { host: 'paypal.com.attacker.net', reference: 'paypal.com', sender: 'Sender', expected: 'assessment_required' },
  { host: 'coinbsae.com', reference: 'coinbase.com', sender: 'Sender', expected: 'assessment_required' },
  { host: 'päypal.com', reference: 'paypal.com', sender: 'Sender', expected: 'assessment_required' },
  { host: 'coinbsae.com', reference: null, sender: 'Coinbase', expected: 'no_concerns_detected' },
  { host: 'päypal.com', reference: null, sender: 'PayPal', expected: 'no_concerns_detected' },
  { host: 'paypa1.com', reference: 'paypal.com', sender: 'Sender', expected: 'assessment_required' },
  { host: 'mail.paypal.com', reference: 'paypal.com', sender: 'Sender', expected: 'no_concerns_detected' },
  { host: 'paypal.com.attacker.net', reference: null, sender: 'PayPal', expected: 'assessment_required' },
  { host: 'paypa1.com', reference: null, sender: 'Sender', expected: 'no_concerns_detected' },
];

// All network responses are synthetic. Unexpected destinations fail the run.
mock.method(globalThis, 'fetch', async (input) => {
  const url = new URL(String(input));
  if (url.hostname === 'cloudflare-dns.com') {
    const types = { A: 1, AAAA: 28, NS: 2, MX: 15, TXT: 16 };
    return Response.json({ Status: 0, TC: false,
      Question: [{ name: url.searchParams.get('name'), type: types[url.searchParams.get('type')] }], Answer: [] });
  }
  if (url.href === 'https://data.iana.org/rdap/dns.json') {
    return Response.json({ services: [[['com', 'net'], ['https://registry.example/']]] });
  }
  assert.equal(url.hostname, 'registry.example');
  assert.ok(url.pathname.startsWith('/domain/'));
  return Response.json({ objectClassName: 'domain', ldhName: url.pathname.slice(8), entities: [] });
});

try {
  for (const sample of cases) {
    const message = `From: ${sample.sender} <sender@example.com>\r\nContent-Type: text/plain; charset=utf-8\r\n\r\nhttps://${sample.host}/login`;
    const result = await analyzeEmail(new TextEncoder().encode(message), {
      directory, referenceDomains: sample.reference ? [sample.reference] : [],
    });
    assert.equal(result.kind, 'analyzed');
    assert.equal(result.routing.kind, sample.expected);
    if (sample.expected === 'assessment_required') assert.equal(result.routing.reason, 'concerns_detected');
    console.log(JSON.stringify({ host: sample.host, reference: sample.reference, sender: sample.sender,
      comparisons: result.comparisons.length, concerns: result.findings.filter((finding) => finding.kind === 'concern'),
      routing: result.routing, coverage: result.coverage }));
  }
} finally {
  mock.restoreAll();
}
