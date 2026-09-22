import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import * as v from 'valibot';
import { findReportingChannels, reportingChannels, reportingQuerySchema, reportingBatchSchema } from './channels.ts';
import { renderReportingChannels } from './render-channels.ts';

test('selects the requested Cloudflare role across both catalogue records', () => {
  const registrar = findReportingChannels(v.parse(reportingQuerySchema, { provider: ' Cloudflare ', serviceRole: 'registrar' }));
  assert.equal(registrar.kind, 'listed');
  if (registrar.kind !== 'listed') return;
  assert.deepEqual(registrar.references[0].channels, [
    { kind: 'form', url: 'https://abuse.cloudflare.com/', condition: 'Select Registrar when case RDAP identifies Cloudflare as the registrar.' },
    { kind: 'email', address: 'registrar-abuse@cloudflare.com', condition: 'Use only when case RDAP identifies Cloudflare as the registrar.' },
  ]);
  assert.equal(registrar.references[0].checkedAt, '2026-09-22');
  assert.deepEqual(registrar.references[0].sources, [
    { label: 'Registrar reporting', url: 'https://www.cloudflare.com/trust-hub/reporting-abuse/' },
  ]);
  for (const serviceRole of ['dns', 'reverse-proxy', 'hosting']) {
    const result = findReportingChannels(v.parse(reportingQuerySchema, { provider: 'cloudflare', serviceRole }));
    assert.equal(result.kind, 'listed');
    if (result.kind !== 'listed') continue;
    assert.equal(result.references.length, 1);
    assert.deepEqual(result.references[0].channels.map((channel) => channel.kind), ['form']);
    assert.match(result.references[0].channels[0].condition, /does not establish Workers\/Pages hosting/);
  }
});

test('keeps unknown providers, unsupported roles, and RDAP fallback distinct', () => {
  assert.deepEqual(findReportingChannels(v.parse(reportingQuerySchema, { provider: 'cloudflare', serviceRole: 'email-delivery' })), {
    query: { provider: 'cloudflare', serviceRole: 'email-delivery' }, kind: 'role_not_listed',
    listedServiceRoles: ['reverse-proxy', 'dns', 'hosting', 'registrar'],
    guidance: 'No reviewed route for this query. Record the official-channel gap; do not construct a contact.',
  });
  for (const provider of ['amazon', 'amazon-ses.attacker.test', 'cloudflare-inc']) {
    const result = findReportingChannels(v.parse(reportingQuerySchema, { provider, serviceRole: 'hosting' }));
    assert.equal(result.kind, 'provider_not_listed');
  }
  assert.deepEqual(findReportingChannels(v.parse(reportingQuerySchema, { provider: 'other', serviceRole: 'registrar' })), {
    query: { provider: 'other', serviceRole: 'registrar' }, kind: 'provider_not_listed',
    guidance: 'Use the registrar abuse contact from case RDAP, retaining its registrar relationship and source. If absent, record the channel gap; do not construct an address.',
  });
});

test('preserves conditional and alternative channels without evaluating case evidence', () => {
  const result = findReportingChannels(v.parse(reportingQuerySchema, { provider: 'trustname', serviceRole: 'registrar' }));
  assert.equal(result.kind, 'listed');
  if (result.kind !== 'listed') return;
  assert.deepEqual(result.references[0].channels, [
    { kind: 'email', address: 'abuse@trustname.com', condition: 'Use when this address is returned as the registrar abuse contact by case RDAP.' },
    { kind: 'instructions', url: 'https://trustname.com/article/202000025104', condition: 'The helpdesk form is an alternative and may be requested in a reply. Follow its category support-code instructions. This link is the instructions page, not the form endpoint.' },
  ]);
  for (const serviceRole of ['registrar', 'hosting']) {
    const hostinger = findReportingChannels(v.parse(reportingQuerySchema, { provider: 'hostinger', serviceRole }));
    assert.equal(hostinger.kind, 'listed');
    if (hostinger.kind !== 'listed') continue;
    assert.match(hostinger.references[0].channels[0].condition, /role established by case evidence/);
  }
});

test('returns independent data and leaves the caller query untouched', () => {
  const query = v.parse(reportingQuerySchema, { provider: 'resend', serviceRole: 'sending-platform' });
  const result = findReportingChannels(query);
  assert.equal(result.kind, 'listed');
  if (result.kind !== 'listed') return;
  Object.assign(result.query, { provider: 'other' });
  Object.assign(result.references[0].channels[0], { condition: 'corrupted' });
  Object.assign(result.references[0].sources[0], { url: 'https://wrong.example' });
  const next = findReportingChannels(query);
  assert.equal(next.kind, 'listed');
  if (next.kind !== 'listed') return;
  assert.equal(next.query.provider, 'resend');
  assert.match(next.references[0].channels[0].condition, /terms designate this support mailbox/);
  assert.equal(next.references[0].sources[0].url, 'https://resend.com/legal/terms-of-service');
});

test('bounds tool batches and normalizes provider names without fuzzy matching', () => {
  const query = { provider: ' Amazon   SES ', serviceRole: 'email-delivery' };
  assert.deepEqual(v.parse(reportingBatchSchema, { queries: [query] }), {
    queries: [{ provider: 'amazon-ses', serviceRole: 'email-delivery' }],
  });
  for (const queries of [[], Array(11).fill(query), [{ ...query, provider: ' ' }],
    [{ ...query, provider: 'x'.repeat(81) }], [{ ...query, serviceRole: 'proxy' }]]) {
    assert.equal(v.safeParse(reportingBatchSchema, { queries }).success, false);
  }
});

test('every maintained route has valid contacts, conditions, sources, dates and unique role coverage', () => {
  const pairs = new Set<string>();
  for (const record of reportingChannels) {
    assert.match(record.provider, /^[a-z]+(?:-[a-z]+)*$/);
    assert.ok(record.channels.length && record.sources.length && record.serviceRoles.length && record.evidence.length);
    assert.match(record.checkedAt, /^\d{4}-\d{2}-\d{2}$/);
    assert.equal(new Date(record.checkedAt).toISOString().slice(0, 10), record.checkedAt);
    for (const role of record.serviceRoles) {
      const pair = `${record.provider}:${role}`;
      assert.equal(pairs.has(pair), false, `Duplicate route coverage: ${pair}`);
      pairs.add(pair);
    }
    for (const source of record.sources) {
      assert.ok(source.label.trim());
      assert.equal(new URL(source.url).protocol, 'https:');
    }
    for (const channel of record.channels) {
      assert.ok(channel.condition.trim());
      if (channel.kind === 'email') assert.ok(v.is(v.pipe(v.string(), v.email()), channel.address));
      else assert.equal(new URL(channel.url).protocol, 'https:');
    }
  }
});

test('generated portable reference preserves every condition and matches the committed file', async () => {
  const rendered = renderReportingChannels();
  for (const record of reportingChannels) {
    assert.ok(rendered.includes(record.checkedAt));
    for (const channel of record.channels) assert.ok(rendered.includes(channel.condition));
    for (const source of record.sources) assert.ok(rendered.includes(source.url));
  }
  assert.equal(await readFile(new URL('../../../reporting-channels.md', import.meta.url), 'utf8'), rendered,
    'Run npm run reporting:generate after editing the channel catalogue.');
});
