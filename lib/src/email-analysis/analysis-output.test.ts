import assert from 'node:assert/strict';
import { test } from 'node:test';
import { analyzeEmail } from './analyze-email.ts';
import { loadBrandDirectory } from '../brands/load-directory.ts';
import { analysisForModel, assessmentEvidence, formatAnalysis, formatAssessment } from './analysis-output.ts';

test('assessment renders only selected records and rejects invented prose or references', () => {
  const evidence = [{ id: 'finding0', text: 'Recorded domain difference; ownership unknown.\n\u001b[31m' }];
  const selection = { concern: 'high', confidence: 'moderate', hypothesis: 'impersonation',
    evidence: [{ id: 'finding0', role: 'supports' }] };
  assert.equal(formatAssessment(selection, evidence), 'Concern: high; confidence: moderate.\n'
    + 'AI hypothesis: impersonation.\nSelected evidence:\n'
    + '- supports [finding0]: Recorded domain difference; ownership unknown.\\u{a}\\u{1b}[31m\n'
    + 'The AI selected the conclusion and evidence. Refer to the recorded findings and coverage for the complete analysis.\n');
  for (const invalid of [undefined, 'An unrelated sender.', { ...selection, explanation: 'An unrelated sender.' },
    { ...selection, evidence: [{ id: 'unrelated sender', role: 'supports' }] }]) {
    assert.throws(() => formatAssessment(invalid, evidence));
  }
});

const original = 'From: private-name <private-user@sender.example.com>\r\n' +
  'DKIM-Signature: d=private-invalid/path?secret; s=test\r\n' +
  'Content-Type: text/html; charset=utf-8\r\n\r\n' +
  '<img src="https://image.example.org/private-logo" alt="private-alt">' +
  '<a href="https://private-user@action.example.com/private-path?private-query">private-body</a>';

test('failed RDAP output distinguishes discovery from registry without exposing exception text', async (t) => {
  let failDiscovery = true;
  const bootstrapUrl = 'https://data.iana.org/rdap/dns.json';
  t.mock.method(globalThis, 'fetch', async (input: string | URL | Request) => {
    const url = String(input);
    if (url.includes('dns-query')) return new Response(null, { status: 429 });
    if (!failDiscovery && url === bootstrapUrl) {
      return Response.json({ services: [[['com', 'org'], ['https://registry.example/']]] });
    }
    throw new Error('private-token-in-error', { cause: { code: 'ENOTFOUND' } });
  });
  const directory = await loadBrandDirectory();
  for (const discoveryFailure of [true, false]) {
    failDiscovery = discoveryFailure;
    const result = await analyzeEmail(new TextEncoder().encode(original), { directory });
    const output = formatAnalysis(result);
    if (discoveryFailure) assert.match(output, /unavailable\/name_resolution at https:\/\/data\.iana\.org\/rdap\/dns\.json/);
    else assert.match(output, /unavailable\/name_resolution at https:\/\/registry\.example\/domain\//);
    assert.doesNotMatch(output, /private-token-in-error/);
    assert.doesNotMatch(JSON.stringify(analysisForModel(result)), /private-token-in-error|data\.iana\.org|registry\.example/);
    assert.equal(result.kind, 'analyzed');
    if (result.kind === 'analyzed') {
      assert.equal(result.routing.kind, 'assessment_required');
      assert.ok(result.retries.some(({ previousResult }) => previousResult.kind === 'unavailable'
        && previousResult.reason === 'name_resolution'));
    }
  }
});

test('the automatic model projection excludes private headers, bodies, URLs and invalid identity text', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => new Response(null, { status: 503 }));
  const result = await analyzeEmail(new TextEncoder().encode(original), { directory: await loadBrandDirectory(), sourceNotes: [{
    url: 'https://support.example.com/platforms', retrievedAt: '2026-09-22', displayedDate: null,
    claim: 'No desktop application.', providedBy: 'agent', sourceAuthority: 'claimed_official',
    relation: 'supports_concern', subjectHosts: ['action.example.com'], messageDateApplicability: 'unknown',
  }] });
  const projection = analysisForModel(result);
  const choices = assessmentEvidence(result);
  assert.equal(choices[0].id, 'reviewed_text');
  assert.ok(choices.some(({ id }) => id === 'finding0'));
  assert.deepEqual(choices.find(({ id }) => id === 'note0'), { id: 'note0',
    text: 'Supplied source claim: No desktop application. Source: https://support.example.com/platforms; retrieved 2026-09-22. Applicability to the message date: unknown. Not independently verified.' });
  assert.doesNotMatch(JSON.stringify(choices), /private-/);
  assert.match(JSON.stringify(projection), /image_action_domain_difference/);
  assert.doesNotMatch(JSON.stringify(projection), /private-/);
  assert.equal(result.kind, 'analyzed');
  if (result.kind === 'analyzed') assert.match(result.source.sha256 ?? '', /^[0-9a-f]{64}$/);
});

test('projection prioritizes action/mail hosts and summarizes skipped checks while retaining found RDAP', async (t) => {
  let failNetwork = false;
  t.mock.method(globalThis, 'fetch', async (input: string | URL | Request) => {
    const url = new URL(String(input));
    if (url.hostname === 'cloudflare-dns.com') {
      const name = url.searchParams.get('name');
      const types: Record<string, number> = { A: 1, AAAA: 28, MX: 15, TXT: 16, NS: 2 };
      const type = types[url.searchParams.get('type') ?? ''];
      const Answer = [];
      if (type === 1) Answer.push({ name, type: 1, TTL: 60, data: '8.8.8.8' });
      if (type === 2) Answer.push({ name, type: 2, TTL: 60, data: 'dan.ns.cloudflare.com.' });
      return Response.json({ Status: 0, TC: false, Question: [{ name, type }], Answer });
    }
    if (url.hostname === 'data.iana.org') {
      let suffixes = ['com', 'net', 'org'];
      if (url.pathname.endsWith('ipv4.json')) suffixes = ['8.8.8.0/24'];
      return Response.json({ services: [[suffixes, ['https://registry.example/']]] });
    }
    assert.equal(url.hostname, 'registry.example');
    if (url.pathname.startsWith('/domain/')) return Response.json({ objectClassName: 'domain', ldhName: url.pathname.slice(8),
      events: [{ eventAction: 'registration', eventDate: '2026-01-01T00:00:00Z' }], privateField: 'private-extra',
      entities: [{ roles: ['registrar'], vcardArray: ['vcard', [['fn', {}, 'text', 'Example registrar']]],
        entities: [{ roles: ['abuse'], vcardArray: ['vcard', [['email', {}, 'text', 'abuse@registrar.example']]] }] }] });
    if (failNetwork) return new Response(null, { status: 503 });
    return Response.json({ objectClassName: 'ip network', startAddress: '8.8.8.0', endAddress: '8.8.8.255', ipVersion: 'v4',
      name: 'Example Network', privateField: 'private-extra' });
  });
  const tracking = Array.from({ length: 200 }, (_, index) => `<img src="https://image${index}.example.com/private">`).join('');
  const actions = Array.from({ length: 200 }, (_, index) => `<a href="https://action${index}.example.net/private">open</a>`).join('');
  const message = 'From: private-name <private-user@sender-example.com>\r\nReturn-Path: <private-user@return-example.org>\r\n' +
    'DKIM-Signature: d=signing-example.net; s=test\r\nAuthentication-Results: mx.example; dkim=pass header.d=auth-example.com\r\n' +
    'Content-Type: multipart/mixed; boundary=b\r\n\r\n--b\r\nContent-Type: text/html\r\n\r\n' + tracking +
    '\r\n--b\r\nContent-Type: text/html\r\n\r\n' + actions + '\r\n--b--\r\n';
  const result = await analyzeEmail(new TextEncoder().encode(message), { directory: await loadBrandDirectory() });
  const projection = analysisForModel(result);
  assert.equal(projection.kind, 'analyzed');
  if (projection.kind !== 'analyzed') return;
  assert.equal(projection.hosts[0].role, 'action');
  // Enough action occurrences may also fill the disclosure cap. Deduplication must retain each mail role.
  for (const role of ['from', 'return-path', 'signature', 'authentication']) assert.ok(projection.hosts.some((host) => host.role === role), role);
  assert.ok(projection.checks.length <= 36);
  assert.ok(projection.registrations.length <= 6);
  assert.ok(projection.skippedChecks.some(({ count }) => count > 100));
  assert.ok(projection.registrations.some((record) => 'events' in record && record.events?.[0].eventDate === '2026-01-01T00:00:00Z'));
  assert.equal('networks' in projection, false);
  assert.equal('reportingCandidates' in projection, false);
  assert.doesNotMatch(JSON.stringify(projection), /8\.8\.8\.8|Example Network/);
  assert.doesNotMatch(JSON.stringify(projection), /private-/);
  assert.ok(JSON.stringify(projection).length < 60_000);
  const displayed = formatAnalysis(result);
  assert.match(displayed, /registration|Registrations/);
  assert.match(displayed, /2026-01-01T00:00:00Z/);
  assert.match(displayed, /https:\/\/registry.example\/domain\//);
  assert.doesNotMatch(displayed, /private-/);

  assert.match(displayed, /Example Network; range 8\.8\.8\.0 to 8\.8\.8\.255/);
  assert.match(displayed, /Source: https:\/\/registry\.example\/ip\/8\.8\.8\.8; retrieved/);
  failNetwork = true;
  const single = await analyzeEmail(new TextEncoder().encode(original), { directory: await loadBrandDirectory() });
  assert.equal(single.kind, 'analyzed');
  if (single.kind !== 'analyzed') return;
  assert.ok(single.reportingCandidates.some(({ provider }) => provider === 'Example registrar'));
  assert.ok(single.reportingCandidates.some(({ provider, serviceRole }) => provider === 'cloudflare' && serviceRole === 'dns'));
  const selected = analysisForModel(single);
  assert.equal(selected.kind, 'analyzed');
  if (selected.kind !== 'analyzed') return;
  assert.ok(selected.checks.some(({ id, kind, httpStatus }) => id.startsWith('ip') && kind === 'http_error' && httpStatus === 503));
  assert.equal(selected.routing.kind, 'assessment_required');
  if (selected.routing.kind === 'assessment_required') assert.ok(selected.routing.gaps.some(({ sourceId }) => sourceId.startsWith('ip')));
  assert.doesNotMatch(JSON.stringify(selected), /Example registrar|Example Network|abuse@registrar|serviceRole|reverse-proxy/);
  const rendered = formatAnalysis(single);
  assert.match(rendered, /abuse@registrar\.example/);
  assert.match(rendered, /Nameservers support a DNS relationship/);
  assert.match(rendered, /Select Phishing & Malware/);
  assert.match(rendered, /Network registrations \(records, not verified service roles\)/);
  assert.match(rendered, /Source: https:\/\/registry\.example\/domain\/example\.com; retrieved/);
});

test('authentication domains stay distinct and terminal escaping retains astral format characters', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => new Response(null, { status: 503 }));
  const text = 'Authentication-Results: mx.example; dkim=pass header.d=first.example.com; dkim=pass header.i=private-user@second.example.com\r\n\r\nBody';
  const result = await analyzeEmail(new TextEncoder().encode(text), { directory: await loadBrandDirectory() });
  assert.equal(result.kind, 'analyzed');
  if (result.kind !== 'analyzed') return;
  assert.match(formatAnalysis(result), /DKIM=pass \(header.d domain=first.example.com\)/);
  assert.match(formatAnalysis(result), /DKIM=pass \(header.i domain=second.example.com\)/);
  assert.doesNotMatch(formatAnalysis(result), /private-user/);
  result.findings.push({ kind: 'observation', code: 'test', text: 'x\u{e0041}\u{1d173}\u001b', evidenceIds: [] });
  assert.ok(formatAnalysis(result).includes('x\\u{e0041}\\u{1d173}\\u{1b}'));
});

test('input failure projection also excludes source metadata', async () => {
  const result = await analyzeEmail(new Uint8Array(), { directory: await loadBrandDirectory() });
  assert.deepEqual(analysisForModel(result), { kind: 'input_failure', reason: 'input_limit' });
});
