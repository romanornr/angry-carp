import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { test } from 'node:test';
import * as v from 'valibot';
import { buildBrandDirectory } from './brands/brand-directory.ts';
import { createBrandLookupTool } from './brands/tools.ts';
import { compareDomainsTool } from './lookalikes/tools.ts';
import { lookupDnsTool, lookupRdapTool } from './lookups/tools.ts';
import { findSharedPassagesTool } from './text-reuse/tools.ts';

test('all five tools register with Flue; brand calls validate and run without authentication', async () => {
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
  assert.deepEqual([lookupRdapTool, lookupDnsTool, compareDomainsTool, findSharedPassagesTool, brand]
    .map((tool) => tool.name), ['lookup_rdap', 'lookup_dns', 'compare_domains', 'find_shared_passages', 'lookup_brand']);

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
