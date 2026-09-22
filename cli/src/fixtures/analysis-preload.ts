import assert from 'node:assert/strict';
let forbiddenRequests = 0;
globalThis.fetch = async (input) => {
  const host = new URL(String(input)).hostname;
  if (host === 'cloudflare-dns.com' || host === 'data.iana.org') return new Response(null, { status: 503 });
  forbiddenRequests++;
  throw new Error('Unexpected network destination.');
};
process.on('exit', () => assert.equal(forbiddenRequests, 0));
