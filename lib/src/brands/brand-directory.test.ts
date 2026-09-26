import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { test } from 'node:test';
import * as v from 'valibot';
import { brandQuerySchema, buildBrandDirectory } from './brand-directory.ts';
import { loadBrandDirectory } from './load-brand-directory.ts';

const source = {
  name: '2FA Directory', dataUrl: 'https://api.2fa.directory/v3/all.json',
  signedUrl: 'https://api.2fa.directory/v3/all.json.sig',
  retrievedAt: '2026-09-22T12:00:00Z', signedAt: '2026-09-21T06:59:46Z',
  signingKeyFingerprint: '0D504141CE290061BD4F95A4AD8483C1CBABC36D',
  attribution: 'Data sourced from 2FA Directory by 2factorauth',
};
const rows = [
  ['Google Cloud', { domain: 'cloud.google.com' }],
  ['Google Drive', { domain: 'drive.google.com' }],
  ['Cloud', { domain: 'cloud.example' }],
  ['Vault', { domain: 'vault.example', 'additional-domains': ['account.example'] }],
  ['Pass', { domain: 'pass.example', 'additional-domains': ['account.example'] }],
  ['Agency', { domain: 'login.agency.example', url: 'https://www.gov.example/agency/', regions: ['-us'] }],
  ['Root', { domain: 'root.example', url: 'https://www.root.example/' }],
  ['Scoped', { domain: 'scoped.example', url: 'https://portal.example/?tenant=scoped' }],
];

function metadata(json: string) {
  return { ...source, sha256: createHash('sha256').update(json).digest('hex') };
}

async function directory(data: unknown = rows) {
  const json = JSON.stringify(data);

  return buildBrandDirectory(json, metadata(json));
}

test('exact names take precedence; name words intersect without inferring acronyms', async () => {
  const dir = await directory();
  const lookup = (value: string) => dir.lookup(v.parse(brandQuerySchema, { kind: 'name', value }));
  assert.deepEqual(lookup('  CLOUD ').matches.map((m) => m.name), ['Cloud']);
  assert.equal(lookup('Cloud').matchedBy, 'exact_name');
  assert.deepEqual(lookup('Google').matches.map((m) => m.name), ['Google Cloud', 'Google Drive']);
  assert.equal(lookup('cloud google').matchedBy, 'name_words');
  assert.deepEqual(lookup('cloud google').matches.map((m) => m.domain), ['cloud.google.com']);

  for (const value of ['AWS', 'Google unknown', '!!!']) {
    assert.equal(lookup(value).totalMatches, 0);
    assert.deepEqual(lookup(value).matches, []);
  }
});

test('exact hosts preserve shared services and do not expand parents or path URLs', async () => {
  const dir = await directory();
  const lookup = (value: string) => dir.lookup(v.parse(brandQuerySchema, { kind: 'hostname', value }));
  const shared = lookup('ACCOUNT.EXAMPLE.');
  assert.deepEqual(shared.matches.map((m) => [m.name, m.matchedHostFields]), [
    ['Pass', ['additional-domain']], ['Vault', ['additional-domain']],
  ]);
  assert.deepEqual(lookup('www.root.example').matches.map((m) => m.matchedHostFields), [['url']]);

  for (const value of ['google.com', 'login.vault.example', 'vault.example.attacker.test', 'www.gov.example', 'portal.example']) {
    assert.deepEqual(lookup(value).matches, []);
  }

  const agency = lookup('login.agency.example').matches[0];
  assert.equal(agency.url, 'https://www.gov.example/agency/');
  assert.deepEqual(agency.regions, ['-us']);
});

test('preserves duplicate names, NFC spelling, and punctuation as distinct exact names', async () => {
  const dir = await directory([
    ['Café', { domain: 'cafe.example' }], ['Café', { domain: 'other.example' }],
    ['AT&T', { domain: 'first.example' }], ['AT T', { domain: 'second.example' }],
  ]);
  const lookup = (value: string) => dir.lookup(v.parse(brandQuerySchema, { kind: 'name', value }));
  assert.deepEqual(lookup('Cafe\u0301').matches.map((m) => m.domain), ['cafe.example', 'other.example']);
  assert.deepEqual(lookup('AT&T').matches.map((m) => m.domain), ['first.example']);
  assert.deepEqual(lookup('at t').matches.map((m) => m.domain), ['second.example']);
});

test('caps broad queries and domain arrays deterministically without hiding totals', async () => {
  const data = Array.from({ length: 11 }, (_, i) => [
    `Bank ${i.toString().padStart(2, '0')}`, { domain: `bank${i}.example`,
      'additional-domains': Array.from({ length: 15 }, (_, j) => `extra${j}.example`) },
  ]);
  const first = await directory(data);
  const reversed = await directory([...data].reverse());
  const query = v.parse(brandQuerySchema, { kind: 'name', value: 'bank' });
  const result = first.lookup(query);
  assert.deepEqual(result.matches.map((m) => m.name), ['Bank 00', 'Bank 01', 'Bank 02', 'Bank 03', 'Bank 04', 'Bank 05', 'Bank 06', 'Bank 07']);
  assert.deepEqual([result.totalMatches, result.truncated], [11, true]);
  assert.deepEqual([result.matches[0].additionalDomains.length, result.matches[0].totalAdditionalDomains, result.matches[0].additionalDomainsTruncated], [12, 15, true]);
  assert.deepEqual(result.matches, reversed.lookup(query).matches);
  result.matches[0].additionalDomains.length = 0;
  assert.equal(first.lookup(query).matches[0].additionalDomains.length, 12);
});

test('rejects invalid tool inputs and distinguishes unusable snapshots from no matches', async () => {
  for (const value of ['https://example.com', '../auth.json', '127.0.0.1', 'localhost', 'x@y.com', 'a'.repeat(64) + '.com']) {
    assert.equal(v.safeParse(brandQuerySchema, { kind: 'hostname', value }).success, false);
  }

  for (const value of ['', '   ']) assert.equal(v.safeParse(brandQuerySchema, { kind: 'name', value }).success, false);

  await assert.rejects(buildBrandDirectory('[]', { ...metadata('[]'), sha256: '0'.repeat(64) }), /checksum/);
  await assert.rejects(buildBrandDirectory('{', metadata('{')), /Invalid brand directory JSON/);
  await assert.rejects(buildBrandDirectory('é'.repeat(1_100_000), metadata('')), /size limit/);
  await assert.rejects(directory([]));
  await assert.rejects(directory([['Wrong', { domain: 'https://example.com' }]]));
  const dir = await directory();
  assert.equal(dir.lookup(v.parse(brandQuerySchema, { kind: 'name', value: 'Vault' })).source.name, '2FA Directory');
});

test('loads the installed snapshot offline and preserves source identity', async () => {
  const dir = await loadBrandDirectory();
  const result = dir.lookup(v.parse(brandQuerySchema, { kind: 'hostname', value: 'nordaccount.com' }));
  assert.deepEqual(result.matches.map((m) => m.name), ['NordLocker', 'NordPass', 'NordVPN']);
  assert.equal(result.source.signedUrl, 'https://api.2fa.directory/v3/all.json.sig');
  assert.equal(result.truncated, false);
});
