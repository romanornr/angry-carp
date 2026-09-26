import assert from 'node:assert/strict';
import { test } from 'node:test';
import { startReportPreparation, checkReportPreparation, reportDigest, MAX_REPORT_BYTES } from './report-preparation.ts';

const bytes = (value: unknown) => new TextEncoder().encode(JSON.stringify(value));
const request = {
  target: { provider: 'Resend', serviceRole: 'sending-platform' },
  destination: { kind: 'email', address: 'support@resend.com' },
  resource: { kind: 'message' }, allegation: 'Deceptive wallet installer email.',
  requestedAction: 'Investigate the supplied lead; act on any associated abusive account.',
  reviewedEvidence: 'Selector and DNS observations are a lead, not proof of custody.',
  permittedSourceHosts: ['resend.com'], candidateHosts: ['lure.example'],
};

async function fixture() {
  const analysis = bytes({ kind: 'analyzed', observations: { hosts: [] }, privateOriginal: 'not disclosed' });
  const preparation = await startReportPreparation(request, analysis);
  preparation.startedAt = '2026-01-01T00:00:00Z';
  const preparationBytes = bytes(preparation);
  const draft = bytes({ destination: { kind: 'email', address: 'support@resend.com' },
    subject: 'Investigate deceptive mail', body: 'Please investigate the documented lead; handling is unconfirmed.' });
  const check = { kind: 'supported', explanation: 'Supports this qualified investigation request.', sourceIds: ['s1'] };
  const research = {
    provenance: 'host_supplied', host: 'Synthetic offline host',
    preparationSha256: await reportDigest(preparationBytes), draftSha256: await reportDigest(draft),
    startedAt: '2026-01-01T00:01:00Z', finishedAt: '2026-01-01T00:03:00Z',
    sources: [{ id: 's1', url: 'https://resend.com/legal/terms-of-service', retrievedAt: '2026-01-01T00:02:00Z',
      claim: 'Synthetic research claim, not a live lookup.', sourceAuthority: 'claimed_official' }],
    checks: { allegation: { ...check }, providerRelationship: { ...check }, reportingChannel: { ...check } },
  };

  return { preparation, research, input: { preparation: preparationBytes, analysis, draft, research: bytes(research) } };
}

test('creates a separate reviewed request and accepts qualified research only for operator review', async () => {
  const { input } = await fixture();
  const preparation = await startReportPreparation(request, input.analysis);
  assert.equal(preparation.request.target.provider, 'resend');
  assert.equal(preparation.analysisSha256, await reportDigest(input.analysis));
  assert.ok(Date.parse(preparation.startedAt) <= Date.now());
  assert.doesNotMatch(JSON.stringify(preparation), /privateOriginal|not disclosed/);
  const result = await checkReportPreparation(input);
  assert.equal(result.kind, 'ready_for_review');
  assert.ok('provenance' in result && result.provenance === 'host_supplied');
  assert.equal('approved' in result, false);
  assert.equal('verified' in result, false);
});

test('holds changed preparation, analysis and outgoing bytes, including recipient edits', async () => {
  const { input } = await fixture();

  for (const [field, reason] of [
    ['preparation', 'preparation_changed'], ['analysis', 'analysis_changed'], ['draft', 'draft_changed'],
  ] as const) {
    const changed = new Uint8Array([...input[field], 32]); // Valid JSON, different retained bytes.
    const result = await checkReportPreparation({ ...input, [field]: changed });
    assert.ok(result.kind === 'held');
    assert.deepEqual(result.reasons, [reason]);
  }

  const result = await checkReportPreparation({ ...input, draft: bytes({
    destination: { kind: 'email', address: 'other@resend.com' }, subject: 'Edited', body: 'Edited',
  }) });
  assert.ok(result.kind === 'held' && result.reasons.includes('draft_changed'));
});

test('failed, unresolved and contradicted checks stay held; missing checks never count as success', async () => {
  for (const kind of ['failed', 'unresolved', 'contradicted']) {
    const { research, input } = await fixture();
    research.checks.providerRelationship.kind = kind;
    const result = await checkReportPreparation({ ...input, research: bytes(research) });
    assert.ok(result.kind === 'held');
    assert.deepEqual(result.reasons, [`providerRelationship:${kind}`]);
  }

  const { research, input } = await fixture();
  const result = await checkReportPreparation({ ...input, research: bytes({ ...research, checks: {} }) });
  assert.deepEqual(result, { kind: 'held', reasons: ['invalid_research'] });
});

test('checks source references, dates and exact allowed hosts without treating claims as verification', async () => {
  const variants = [
    { url: 'https://resend.com.attacker.example/source', reason: 'source_host_not_permitted' },
    { url: 'https://sub.resend.com/source', reason: 'source_host_not_permitted' },
    { url: 'https://resend.com/source', retrievedAt: '2025-12-31T00:00:00Z', reason: 'source_time_outside_research' },
  ];

  for (const variant of variants) {
    const { research, input } = await fixture();
    research.sources[0].url = variant.url;
    if (variant.retrievedAt) research.sources[0].retrievedAt = variant.retrievedAt;
    const result = await checkReportPreparation({ ...input, research: bytes(research) });
    assert.ok(result.kind === 'held' && result.reasons.some((reason) => reason === variant.reason));
  }

  const { research, input } = await fixture();
  research.checks.allegation.sourceIds = ['missing'];
  research.sources.push({ ...research.sources[0] });
  research.startedAt = '2025-12-31T00:00:00Z';
  const result = await checkReportPreparation({ ...input, research: bytes(research) });
  assert.ok(result.kind === 'held');
  assert.deepEqual(result.reasons, ['research_time_outside_preparation', 'duplicate_source_id', 'allegation:missing_source']);
});

test('refuses candidate sources and destinations and unsupported private payload fields', async () => {
  const { input, research } = await fixture();
  await assert.rejects(startReportPreparation({ ...request, permittedSourceHosts: ['sub.lure.example'] }, input.analysis),
    { message: 'A candidate host cannot be a research source.' });

  for (const destination of [{ kind: 'email', address: 'abuse@lure.example' }, { kind: 'form', url: 'https://sub.lure.example/form' }]) {
    const draft = bytes({ destination, subject: 'Title', body: 'Body' });
    research.draftSha256 = await reportDigest(draft);
    const result = await checkReportPreparation({ ...input, draft, research: bytes(research) });
    assert.ok(result.kind === 'held');
    assert.deepEqual(result.reasons, ['destination_changed', 'candidate_destination']);
  }

  const invalid = await checkReportPreparation({ ...input, draft: bytes({
    destination: { kind: 'email', address: 'support@resend.com' }, subject: 'Title', body: 'Body', attachments: ['private.eml'],
  }) });
  assert.deepEqual(invalid, { kind: 'held', reasons: ['invalid_draft'] });
});

test('invalid UTF-8, oversized records and input failures cannot start or pass research', async () => {
  const { input } = await fixture();
  await assert.rejects(startReportPreparation(request, bytes({ kind: 'input_failure' })), { message: 'Invalid report request or analysis.' });

  for (const research of [new Uint8Array([255]), new Uint8Array(MAX_REPORT_BYTES + 1)]) {
    assert.deepEqual(await checkReportPreparation({ ...input, research }), { kind: 'held', reasons: ['invalid_research'] });
  }
});

test('private action hosts block research without being copied into the preparation; images do not', async () => {
  const analysis = bytes({ kind: 'analyzed', observations: { hosts: [
    { role: 'action', context: 'unmarked', host: 'private-token.lure.example' },
    { role: 'action', context: 'marked_quote', host: 'quoted.example' },
    { role: 'action', context: 'embedded_message', host: 'embedded.example' },
    { role: 'text-reference', context: 'marked_quote', host: 'text.example' },
    { role: 'image', context: 'unmarked', host: 'resend.com' },
  ] } });
  const started = await startReportPreparation({ ...request, candidateHosts: [] }, analysis);
  assert.doesNotMatch(JSON.stringify(started), /private-token/);
  await assert.rejects(startReportPreparation({ ...request, candidateHosts: [],
    permittedSourceHosts: ['private-token.lure.example'] }, analysis), { message: 'A candidate host cannot be a research source.' });
  await assert.rejects(startReportPreparation({ ...request, candidateHosts: [],
    resource: { kind: 'domain', name: 'resend.com' } }, analysis), { message: 'A candidate host cannot be a report destination.' });

  for (const host of ['quoted.example', 'embedded.example', 'text.example']) {
    await assert.rejects(startReportPreparation({ ...request, candidateHosts: [], permittedSourceHosts: [host] }, analysis),
      { message: 'A candidate host cannot be a research source.' });
    await assert.rejects(startReportPreparation({ ...request, candidateHosts: [],
      destination: { kind: 'form', url: `https://${host}/report` } }, analysis),
    { message: 'A candidate host cannot be a report destination.' });
  }
});

test('a re-bound draft for a different non-candidate recipient still requires a new preparation', async () => {
  const { input, research } = await fixture();
  const draft = bytes({ destination: { kind: 'email', address: 'other@other-provider.example' }, subject: 'Title', body: 'Body' });
  research.draftSha256 = await reportDigest(draft);
  const result = await checkReportPreparation({ ...input, draft, research: bytes(research) });
  assert.deepEqual(result, { kind: 'held', reasons: ['destination_changed'] });
  research.sources[0].url = 'not a URL';
  assert.deepEqual(await checkReportPreparation({ ...input, research: bytes(research) }), { kind: 'held', reasons: ['invalid_research'] });
});
