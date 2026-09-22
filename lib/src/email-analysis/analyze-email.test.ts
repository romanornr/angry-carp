import assert from 'node:assert/strict';
import { test } from 'node:test';
import { loadBrandDirectory } from '../brands/load-directory.ts';
import { analyzeEmail } from './analyze-email.ts';

const directory = await loadBrandDirectory();
const bytes = new TextEncoder().encode(`From: Bifrost Wallet <sender@songbirdsoftware.ltd>\r
Return-Path: <private@send.songbirdsoftware.ltd>\r
Received: from a9.smtp-out.amazonses.com (a9.smtp-out.amazonses.com [54.240.9.67]) by mx.example; Tue, 22 Sep 2026 10:00:00 +0000\r
Authentication-Results: mx.example; dkim=pass header.i=@songbirdsoftware.ltd header.s=resend; spf=pass smtp.mailfrom=private@send.songbirdsoftware.ltd\r
Content-Type: text/html; charset=utf-8\r
\r
<img src="https://bifrostwallet.com/private-logo?token=secret" alt="Bifrost Wallet"><a href="https://bifrostwalletapps.download/private?token=secret">Download</a>\r
<blockquote><a href="https://quoted.attacker.com/">quoted warning</a></blockquote>
<div class="history gmail_quote"><a href="https://gmail-quoted.attacker.com/">quoted link</a><img src="https://gmail-quoted.attacker.com/logo" alt="Quoted Brand"></div>`);

function fixtureFetch(calls: string[]) {
  return async (input: string | URL | Request) => {
    const url = new URL(String(input));
    calls.push(url.href);
    if (url.hostname === 'cloudflare-dns.com') {
      const name = url.searchParams.get('name');
      const type = url.searchParams.get('type');
      const types: Record<string, number> = { A: 1, AAAA: 28, NS: 2, MX: 15, TXT: 16 };
      const answers: { name: string | null; type: number; TTL: number; data: string }[] = [];
      if (type === 'NS') answers.push({ name, type: 2, TTL: 60, data: 'dan.ns.cloudflare.com.' });
      if (type === 'A') answers.push({ name, type: 1, TTL: 60, data: '188.114.96.0' });
      if (name === 'send.songbirdsoftware.ltd') {
        if (type === 'MX') answers.push({ name, type: 15, TTL: 60, data: '10 feedback-smtp.us-east-1.amazonses.com.' });
        if (type === 'TXT') answers.push({ name, type: 16, TTL: 60, data: '"v=spf1 include:amazonses.com ~all"' });
      }
      return Response.json({ Status: 0, TC: false, Question: [{ name, type: types[type ?? ''] }], Answer: answers });
    }
    if (url.hostname === 'data.iana.org') {
      if (url.pathname.endsWith('dns.json')) return Response.json({ services: [[['com', 'ltd', 'download'], ['https://registry.example/']]] });
      return Response.json({ services: [[['188.114.96.0/24'], ['https://registry.example/']]] });
    }
    assert.equal(url.hostname, 'registry.example', 'candidate sites must never be fetched');
    if (url.pathname.startsWith('/domain/')) return Response.json({ objectClassName: 'domain', ldhName: url.pathname.slice(8),
      entities: [{ roles: ['registrar'], vcardArray: ['vcard', [['fn', {}, 'text', 'Example registrar']]],
        entities: [{ roles: ['abuse'], vcardArray: ['vcard', [['email', {}, 'text', 'abuse@registrar.example']]] }] }] });
    return Response.json({ objectClassName: 'ip network', startAddress: '188.114.96.0', endAddress: '188.114.96.255', ipVersion: 'v4', name: 'CLOUDFLARENET' });
  };
}

test('one analysis retains image/action findings, qualified recipients and every lookup outcome', async (t) => {
  const calls: string[] = [];
  t.mock.method(globalThis, 'fetch', fixtureFetch(calls));
  const extraActions = new TextEncoder().encode('<a href="https://first.example.com/">one</a><a href="https://second.example.com/">two</a><a href="https://third.example.com/">three</a>');
  const result = await analyzeEmail(Buffer.concat([bytes, extraActions]), { directory, referenceDomains: ['bifrostwallet.com'] });
  assert.equal(result.kind, 'analyzed');
  if (result.kind !== 'analyzed') return;
  assert.ok(result.findings.some(({ code }) => code === 'image_action_domain_difference'));
  assert.ok(result.comparisons.some(({ referenceSource, result }) => referenceSource === 'operator' && result.kind === 'compared' && result.referenceLabelContained));
  assert.deepEqual([...new Set(result.reportingCandidates.map(({ provider }) => provider))], ['Example registrar', 'cloudflare', 'amazon-ses', 'resend']);
  assert.equal(result.reportingCandidates.find(({ provider }) => provider === 'cloudflare')?.serviceRole, 'dns');
  assert.match(result.reportingCandidates.find(({ provider }) => provider === 'resend')?.limitation ?? '', /not proof/);
  assert.equal(result.ipRdap.length, 1);
  assert.equal(result.ipRdap[0].result.kind, 'found');
  assert.equal(calls.some((url) => url.includes('quoted.attacker.com')), false);
  assert.equal(result.observations.hosts.filter(({ host, context }) => host === 'gmail-quoted.attacker.com' && context === 'marked_quote').length, 2);
  const quotedName = result.observations.names.find(({ value }) => value === 'Quoted Brand');
  assert.equal(quotedName?.context, 'marked_quote');
  assert.equal(result.directory.some(({ sourceIds }) => quotedName && sourceIds.includes(quotedName.sourceId)), false);
  assert.equal(new Set(calls.filter((url) => url.includes('dns-query'))).size, result.dns.filter(({ result }) => result.kind === 'answered').length);
  assert.ok(calls.length <= result.limits.httpRequests);
  assert.equal(result.textReuse.kind, 'skipped');
  assert.equal(result.message.verification, 'not_performed');
});

test('partial lookup failures preserve local findings and do not manufacture a Resend lead', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => { throw new Error('private response detail'); });
  const result = await analyzeEmail(bytes, { directory });
  assert.equal(result.kind, 'analyzed');
  if (result.kind !== 'analyzed') return;
  assert.ok(result.findings.some(({ code }) => code === 'image_action_domain_difference'));
  assert.equal(result.reportingCandidates.some(({ provider }) => provider === 'resend'), false);
  assert.ok(result.dns.every(({ result }) => result.kind === 'unavailable' || result.kind === 'skipped'));
  assert.doesNotMatch(JSON.stringify(result), /private response detail/);
});

test('cancellation reaches an in-flight request and prevents later dispatch', async (t) => {
  const controller = new AbortController();
  let calls = 0;
  t.mock.method(globalThis, 'fetch', async (_input: unknown, init: RequestInit) => {
    calls++;
    controller.abort();
    init.signal?.throwIfAborted();
    return Response.json({});
  });
  const result = await analyzeEmail(bytes, { directory, signal: controller.signal });
  assert.equal(result.kind, 'analyzed');
  assert.equal(calls, 1);
  if (result.kind !== 'analyzed') return;
  assert.ok(result.dns.some(({ result }) => result.kind === 'unavailable' && result.reason === 'cancelled'));
  assert.ok(result.rdap.every(({ result }) => result.kind === 'skipped'));
});

test('invalid authentication identities cannot select a truncated DNS target', async (t) => {
  const calls: string[] = [];
  t.mock.method(globalThis, 'fetch', fixtureFetch(calls));
  const invalid = new TextEncoder().encode('Authentication-Results: mx.example; spf=pass smtp.mailfrom="example.com/private"\r\n' +
    'DKIM-Signature: d=example.com/private; s=test\r\nContent-Type: text/plain\r\n\r\nNo links.');
  const result = await analyzeEmail(invalid, { directory });
  assert.equal(result.kind, 'analyzed');
  assert.equal(calls.length, 0);
  if (result.kind === 'analyzed') assert.ok(result.coverage.some(({ reason }) => reason === 'invalid_authentication_identity'));
});

test('a reported DKIM failure does not suppress a qualified Resend investigation lead', async (t) => {
  t.mock.method(globalThis, 'fetch', fixtureFetch([]));
  const input = new TextEncoder().encode(new TextDecoder().decode(bytes).replace('dkim=pass', 'dkim=fail'));
  const result = await analyzeEmail(input, { directory });
  assert.equal(result.kind, 'analyzed');
  if (result.kind !== 'analyzed') return;
  assert.ok(result.findings.some(({ text }) => text.startsWith('DKIM=fail')));
  assert.equal(result.reportingCandidates.find(({ provider }) => provider === 'resend')?.basis, 'reported_lead');
});

test('HTML actions precede ambiguous text links without changing occurrence order or mail reservations', async (t) => {
  t.mock.method(globalThis, 'fetch', fixtureFetch([]));
  const message = 'From: sender@songbirdsoftware.ltd\r\nReturn-Path: <sender@send.songbirdsoftware.ltd>\r\n' +
    'Content-Type: multipart/alternative; boundary=b\r\n\r\n--b\r\nContent-Type: text/plain\r\n\r\n' +
    'https://bifrostwallet.com/logo.png\nhttps://bifrostwalletapps.download/setup\r\n' +
    '--b\r\nContent-Type: text/html\r\n\r\n<img src="https://bifrostwallet.com/logo.png">' +
    '<a href="https://bifrostwalletapps.download/setup">Download</a>' +
    '<a href="https://bifrostwallet.com/logo.png">Also an action</a>\r\n--b--\r\n';
  const result = await analyzeEmail(new TextEncoder().encode(message), { directory });
  assert.equal(result.kind, 'analyzed');
  if (result.kind !== 'analyzed') return;
  assert.deepEqual(result.observations.hosts.slice(0, 5).map(({ role }) => role),
    ['text-reference', 'text-reference', 'image', 'action', 'action']);
  assert.equal(result.dns[0].query.name, 'bifrostwalletapps.download');
  assert.equal(result.rdap[0].domain, 'bifrostwalletapps.download');
  assert.deepEqual(result.dns.filter(({ query }) => query.name === 'send.songbirdsoftware.ltd').map(({ query, result }) =>
    [query.type, result.kind]), [['MX', 'answered'], ['TXT', 'answered']]);
});

test('plaintext-only links still receive bounded web-host lookups', async (t) => {
  const calls: string[] = [];
  t.mock.method(globalThis, 'fetch', fixtureFetch(calls));
  const result = await analyzeEmail(new TextEncoder().encode('Content-Type: text/plain\r\n\r\nhttps://download.example.com/setup'), { directory });
  assert.equal(result.kind, 'analyzed');
  if (result.kind !== 'analyzed') return;
  assert.equal(result.observations.hosts[0].role, 'text-reference');
  assert.deepEqual(result.dns.map(({ query }) => query.type), ['A', 'AAAA', 'NS']);
  assert.equal(result.rdap[0].result.kind, 'found');
  assert.ok(calls.length <= result.limits.httpRequests);
});

test('completed ordinary checks do not turn authentication passes or registrar contacts into concerns', async (t) => {
  t.mock.method(globalThis, 'fetch', fixtureFetch([]));
  const text = 'From: sender@example.com\r\nAuthentication-Results: mx.example; dkim=pass header.d=example.com\r\n\r\nMeeting at noon.';
  const result = await analyzeEmail(new TextEncoder().encode(text), { directory });
  assert.equal(result.kind, 'analyzed');
  if (result.kind !== 'analyzed') return;
  assert.deepEqual(result.routing, { kind: 'no_concerns_detected' });
  assert.equal(result.reportingCandidates.length, 0);
  assert.equal(result.retries.length, 0);
  assert.equal(result.rdap[0].result.kind, 'found');
});

test('transient lookup retries reuse successes; persistent failures and 429 require assessment', async (t) => {
  const text = new TextEncoder().encode('From: sender@example.com\r\n\r\nMeeting at noon.');
  for (const status of [503, 429]) {
    const counts = new Map<string, number>();
    const healthy = fixtureFetch([]);
    const mock = t.mock.method(globalThis, 'fetch', async (input: string | URL | Request) => {
      const url = String(input);
      counts.set(url, (counts.get(url) ?? 0) + 1);
      if (url.includes('type=MX')) return new Response(null, { status });
      return healthy(input);
    });
    const result = await analyzeEmail(text, { directory });
    assert.equal(result.kind, 'analyzed');
    if (result.kind !== 'analyzed') return;
    assert.equal(result.routing.kind, 'assessment_required');
    assert.equal([...counts].find(([url]) => url.includes('type=MX'))?.[1], status === 429 ? 1 : 2);
    assert.equal([...counts].find(([url]) => url.includes('type=TXT'))?.[1], 1);
    mock.mock.restore();
  }
  const healthy = fixtureFetch([]);
  let mxAttempts = 0;
  t.mock.method(globalThis, 'fetch', async (input: string | URL | Request) => {
    if (String(input).includes('type=MX') && ++mxAttempts === 1) return new Response(null, { status: 503 });
    return healthy(input);
  });
  const recovered = await analyzeEmail(text, { directory });
  assert.equal(recovered.kind, 'analyzed');
  if (recovered.kind !== 'analyzed') return;
  assert.deepEqual(recovered.routing, { kind: 'no_concerns_detected' });
  assert.equal(recovered.retries.length, 1);
  assert.equal(recovered.retries[0].previousResult.kind, 'http_error');
});

test('borrowed images retain contacts without promotion; supplied resource evidence can justify an image investigation', async (t) => {
  const calls: string[] = [];
  t.mock.method(globalThis, 'fetch', fixtureFetch(calls));
  const result = await analyzeEmail(bytes, { directory });
  assert.equal(result.kind, 'analyzed');
  if (result.kind !== 'analyzed') return;
  const registrations = result.reportingCandidates.filter(({ serviceRole }) => serviceRole === 'registrar');
  assert.deepEqual(registrations.map(({ resource }) => resource.kind === 'domain' && resource.name).sort(),
    ['bifrostwalletapps.download']);
  assert.equal(result.rdap.find(({ domain }) => domain === 'bifrostwallet.com')?.result.kind, 'found');
  for (const candidate of registrations) {
    assert.equal(candidate.resource.kind, 'domain');
    if (candidate.resource.kind === 'domain') assert.ok(candidate.resource.subjectIds.length);
  }
  const sourceNotes = [{ url: 'https://support.example.com/advisory', retrievedAt: '2026-09-22T00:00:00Z', displayedDate: null,
    claim: 'Synthetic advisory identifies abuse at this image host.', providedBy: 'operator', sourceAuthority: 'claimed_official',
    relation: 'supports_concern', subjectHosts: ['bifrostwallet.com', 'send.songbirdsoftware.ltd'], messageDateApplicability: 'unknown' }];
  const supported = await analyzeEmail(bytes, { directory, sourceNotes });
  assert.equal(supported.kind, 'analyzed');
  if (supported.kind !== 'analyzed') return;
  assert.ok(supported.reportingCandidates.some(({ resource, evidenceIds }) =>
    resource.kind === 'domain' && resource.name === 'bifrostwallet.com' && evidenceIds.includes('note0')));
  assert.ok(supported.reportingCandidates.some(({ resource, evidenceIds }) =>
    resource.kind === 'domain' && resource.name === 'songbirdsoftware.ltd' && evidenceIds.includes('note0')));
  assert.equal(supported.sourceNotes[0].acquisition, 'caller_supplied_note');
  assert.equal(supported.sourceNotes[0].verification, 'not_performed');
  assert.equal(calls.some((url) => url.includes('support.example.com')), false);
  const invalid = await analyzeEmail(bytes, { directory, sourceNotes: [{ ...sourceNotes[0], retrievedAt: 'yesterday' }] });
  assert.equal(invalid.kind, 'input_failure');
});

test('a plaintext-only lookalike yields a resource-specific registrar candidate', async (t) => {
  t.mock.method(globalThis, 'fetch', fixtureFetch([]));
  const input = new TextEncoder().encode('From: sender@example.com\r\n\r\nDownload https://bifrostwalletapps.download/setup');
  const result = await analyzeEmail(input, { directory, referenceDomains: ['bifrostwallet.com'] });
  assert.equal(result.kind, 'analyzed');
  if (result.kind !== 'analyzed') return;
  assert.ok(result.reportingCandidates.some(({ resource }) => resource.kind === 'domain' && resource.name === 'bifrostwalletapps.download'));
});

test('forwarded and quoted targets remain separate but cannot route around assessment', async (t) => {
  const calls: string[] = [];
  t.mock.method(globalThis, 'fetch', fixtureFetch(calls));
  for (const content of [
    'Content-Type: text/plain\r\n\r\n> Visit https://paypa1-alerts.com/login',
    'Content-Type: multipart/mixed; boundary=b\r\n\r\n--b\r\nContent-Type: message/rfc822\r\n\r\n' +
      'From: sender@paypa1-alerts.com\r\nContent-Type: text/plain\r\n\r\nVisit https://paypa1-alerts.com/login\r\n--b--\r\n',
  ]) {
    const result = await analyzeEmail(new TextEncoder().encode('From: forwarder@example.com\r\n' + content), { directory });
    assert.equal(result.kind, 'analyzed');
    if (result.kind !== 'analyzed') return;
    assert.equal(result.routing.kind, 'assessment_required');
    assert.ok(result.observations.hosts.some(({ context }) => context !== 'unmarked'));
    assert.equal(result.findings.filter(({ kind }) => kind === 'concern').length, 0);
  }
  assert.equal(calls.some((url) => url.includes('paypa1-alerts.com')), false);
});

test('data action links are material while inline image data is an expected omission', async (t) => {
  t.mock.method(globalThis, 'fetch', fixtureFetch([]));
  for (const [body, expected] of [
    ['<a href="data:text/html;base64,SGVsbG8=">Open</a>', 'assessment_required'],
    ['<img src="data:image/png;base64,SGVsbG8=">', 'no_concerns_detected'],
  ]) {
    const result = await analyzeEmail(new TextEncoder().encode('From: sender@example.com\r\nContent-Type: text/html\r\n\r\n' + body), { directory });
    assert.equal(result.kind, 'analyzed');
    if (result.kind === 'analyzed') assert.equal(result.routing.kind, expected);
  }
});

test('a failed retry preserves partial DNS evidence and its qualified investigation lead', async (t) => {
  for (const failure of ['http_error', 'SERVFAIL']) {
    const healthy = fixtureFetch([]);
    let attempts = 0;
    const mock = t.mock.method(globalThis, 'fetch', async (input: string | URL | Request) => {
      const url = String(input);
      if (url.includes('name=send.songbirdsoftware.ltd') && url.includes('type=TXT')) {
        if (++attempts === 2) {
          if (failure === 'http_error') return new Response(null, { status: 503 });
          return Response.json({ Status: 2, TC: false, Question: [{ name: 'send.songbirdsoftware.ltd', type: 16 }], Answer: [] });
        }
        return Response.json({ Status: 0, TC: true, Question: [{ name: 'send.songbirdsoftware.ltd', type: 16 }],
          Answer: [{ name: 'send.songbirdsoftware.ltd', type: 16, TTL: 60, data: '"v=spf1 include:amazonses.com -all"' }] });
      }
      return healthy(input);
    });
    const result = await analyzeEmail(bytes, { directory });
    assert.equal(result.kind, 'analyzed');
    if (result.kind !== 'analyzed') return;
    const txt = result.dns.find(({ query }) => query.name === 'send.songbirdsoftware.ltd' && query.type === 'TXT');
    assert.equal(txt?.result.kind, 'answered');
    const retry = result.retries.find(({ checkId }) => checkId === txt?.id)?.retryResult;
    if (failure === 'http_error') assert.equal(retry?.kind, 'http_error');
    else {
      assert.equal(retry?.kind, 'answered');
      if (retry?.kind === 'answered') assert.equal(retry.rcode, 'SERVFAIL');
    }
    assert.ok(result.reportingCandidates.some(({ provider }) => provider === 'resend'));
    assert.equal(result.routing.kind, 'assessment_required');
    mock.mock.restore();
  }
});
