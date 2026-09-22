import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { test } from 'node:test';
import * as v from 'valibot';
import { brandQuerySchema, buildBrandDirectory } from '@angry-carp/checks/brands';
import { loadBrandDirectory } from '@angry-carp/checks/brands/local';
import { createBrandLookupTool } from './tools/brands.ts';
import { compareDomainsTool } from './tools/lookalikes.ts';
import { lookupDnsTool, lookupRdapTool, lookupIpRdapTool } from './tools/lookups.ts';
import { findSharedPassagesTool } from './tools/text-reuse.ts';
import { lookupReportingChannelsTool } from './tools/reporting.ts';

test('the public local-loader export resolves its snapshot without loading the agent', async () => {
  const directory = await loadBrandDirectory();
  const result = directory.lookup(v.parse(brandQuerySchema, { kind: 'hostname', value: 'nordaccount.com' }));
  assert.deepEqual(result.matches.map((entry) => entry.name), ['NordLocker', 'NordPass', 'NordVPN']);
});

test('all tools register with Flue; brand calls validate and run without authentication', async () => {
  const json = JSON.stringify([['Vault', { domain: 'vault.example' }]]);
  const directory = await buildBrandDirectory(json, {
    name: '2FA Directory', dataUrl: 'https://api.2fa.directory/v3/all.json',
    signedUrl: 'https://api.2fa.directory/v3/all.json.sig',
    retrievedAt: '2026-09-22T12:00:00Z', signedAt: '2026-09-21T06:59:46Z',
    sha256: createHash('sha256').update(json).digest('hex'),
    signingKeyFingerprint: '0D504141CE290061BD4F95A4AD8483C1CBABC36D',
    attribution: 'Data sourced from 2FA Directory by 2factorauth',
  });
  const brand = createBrandLookupTool(directory);
  assert.deepEqual([lookupRdapTool, lookupDnsTool, lookupIpRdapTool, compareDomainsTool, findSharedPassagesTool, brand, lookupReportingChannelsTool]
    .map((tool) => tool.name), ['lookup_rdap', 'lookup_dns', 'lookup_ip_rdap', 'compare_domains', 'find_shared_passages', 'lookup_brand', 'lookup_reporting_channels']);

  const noLog = () => assert.fail('Offline lookup must not log query data.');
  const context = { toolCallId: 'offline-brand', log: { info: noLog, warn: noLog, error: noLog } };
  const result = await brand.run({ ...context, data: v.parse(brand.input, { kind: 'hostname', value: 'VAULT.EXAMPLE.' }) });
  assert.partialDeepStrictEqual(result, { output: {
    query: { kind: 'hostname', value: 'vault.example' }, matchedBy: 'exact_hostname',
    matches: [{ name: 'Vault', domain: 'vault.example', matchedHostFields: ['domain'] }],
  } });
  await assert.rejects(async () => brand.run({ ...context, data: { kind: 'hostname', value: '../auth.json' } }), {
    message: 'Supply a nonempty service name or a bare ASCII/punycode hostname.',
  });
});

test('IP RDAP adapter validates an address and returns network evidence without model or auth access', async (t) => {
  t.mock.method(globalThis, 'fetch', async (url: string) => {
    if (url === 'https://data.iana.org/rdap/ipv6.json') {
      return Response.json({ services: [[['2001:db8::/32'], ['https://registry.example/']]] });
    }
    assert.equal(url, 'https://registry.example/ip/2001:db8::1');
    return Response.json({ objectClassName: 'ip network', ipVersion: 'v6',
      startAddress: '2001:db8::', endAddress: '2001:db8::ffff', name: 'EXAMPLE-NET' });
  });
  const noLog = () => assert.fail('IP lookup must not log.');
  const result = await lookupIpRdapTool.run({
    toolCallId: 'offline-ip', log: { info: noLog, warn: noLog, error: noLog },
    data: v.parse(lookupIpRdapTool.input, { address: '2001:0DB8::1' }),
  });
  assert.partialDeepStrictEqual(result, { output: {
    queriedAddress: '2001:db8::1', kind: 'found', sourceUrl: 'https://registry.example/ip/2001:db8::1',
    network: { startAddress: '2001:db8::', endAddress: '2001:db8::ffff', ipVersion: 'v6', name: 'EXAMPLE-NET' },
  } });
  assert.equal(v.safeParse(lookupIpRdapTool.input, { address: 'https://candidate.example/' }).success, false);
});


test('reporting adapter batches role-specific routes without authentication or logging', async () => {
  const noLog = () => assert.fail('Reporting lookup must not log.');
  const result = await lookupReportingChannelsTool.run({
    toolCallId: 'offline-reporting', log: { info: noLog, warn: noLog, error: noLog },
    data: v.parse(lookupReportingChannelsTool.input, { queries: [
      { provider: ' Cloudflare ', serviceRole: 'registrar' },
      { provider: 'Cloudflare', serviceRole: 'dns' },
      { provider: 'Other', serviceRole: 'registrar' },
    ] }),
  });
  assert.partialDeepStrictEqual(result, { output: { results: [
    { kind: 'listed', query: { provider: 'cloudflare', serviceRole: 'registrar' }, references: [{ channels: [
      { kind: 'form', condition: 'Select Registrar when case RDAP identifies Cloudflare as the registrar.' },
      { kind: 'email', address: 'registrar-abuse@cloudflare.com' },
    ] }] },
    { kind: 'listed', query: { provider: 'cloudflare', serviceRole: 'dns' }, references: [{ channels: [
      { kind: 'form', url: 'https://abuse.cloudflare.com/' },
    ] }] },
    { kind: 'provider_not_listed' },
  ] } });
});
