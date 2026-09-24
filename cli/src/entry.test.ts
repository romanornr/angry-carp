import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const run = promisify(execFile);
const entry = fileURLToPath(new URL('../dist/main.js', import.meta.url));
const denyNetwork = 'data:text/javascript,' + encodeURIComponent(`
  import assert from 'node:assert/strict';
  let attempts = 0;
  globalThis.fetch = () => { attempts++; throw new Error('Network forbidden.'); };
  process.on('exit', () => assert.equal(attempts, 0));
`);

test('JSON entry discloses selected evidence and offline assessment reuses the saved packet', async (t) => {
  const folder = await mkdtemp(join(tmpdir(), 'angry-carp-entry-'));
  t.after(() => rm(folder, { recursive: true, force: true }));
  const input = join(folder, 'original.eml');
  const packetPath = join(folder, 'packet.json');
  const full = join(folder, 'full.json');
  const selection = join(folder, 'selection.json');
  await writeFile(input, 'From: private-name <private-user@sender.example.com>\r\nContent-Type: text/html\r\n\r\n' +
    '<img src="https://image.example.org/private-image"><a href="https://action.example.com/private-query">private-body</a>');
  const args = ['--import', new URL('./fixtures/analysis-preload.ts', import.meta.url).href, entry,
    'analyze', input, '--format', 'json', '--output', packetPath, '--json', full];
  const result = await run(process.execPath, args, { cwd: folder, timeout: 10_000 });
  const packet = JSON.parse(result.stdout);
  assert.equal(packet.version, 2);
  assert.equal(packet.analysis.routing.kind, 'assessment_required');
  assert.deepEqual(Object.keys(packet).sort(), ['analysis', 'assessmentEvidence', 'version']);
  assert.doesNotMatch(result.stdout, /private-|reportingCandidates|networkRegistrations|reviewed_text/);
  assert.match(await readFile(full, 'utf8'), /private-body/);
  assert.equal(await readFile(packetPath, 'utf8'), result.stdout);
  assert.equal((await stat(packetPath)).mode & 0o777, 0o600);
  const record = packet.assessmentEvidence.find((row: { text: string }) => row.text.includes('Image host'));
  assert.ok(record);
  await writeFile(selection, JSON.stringify({ concern: 'medium', confidence: 'low', hypothesis: 'no_specific_deception',
    evidence: [{ id: record.id, role: 'context' }] }));
  const render = () => run(process.execPath, ['--import', denyNetwork, entry, 'assess', packetPath, selection], { cwd: folder });
  const rendered = await render();
  assert.match(rendered.stdout, /Concern: medium; confidence: low/);
  assert.ok(rendered.stdout.includes(record.text));
  assert.equal(rendered.stderr, '');
  assert.deepEqual(await render(), rendered);
  await writeFile(packetPath, JSON.stringify({ ...packet, version: 1 }));
  assert.deepEqual(await render(), rendered);
  await writeFile(packetPath, JSON.stringify({ ...packet, version: 3 }));
  await assert.rejects(render());
  await writeFile(packetPath, result.stdout);
  await writeFile(selection, JSON.stringify({ concern: 'high', confidence: 'high', hypothesis: 'impersonation',
    evidence: [{ id: 'invented', role: 'supports' }] }));
  await assert.rejects(render(), (error: unknown) => {
    assert.ok(error instanceof Error && 'stdout' in error && 'code' in error);
    assert.equal(error.code, 1);
    assert.equal(error.stdout, '');
    return true;
  });
  await assert.rejects(run(process.execPath, ['--import', denyNetwork, ...args.slice(2)]), (error: unknown) => {
    assert.ok(error instanceof Error && 'stdout' in error && 'code' in error);
    assert.equal(error.code, 2);
    assert.equal(error.stdout, '');
    return true;
  });
  assert.equal(await readFile(packetPath, 'utf8'), result.stdout);
});

test('no-concerns and input failures stay distinct, with guidance available outside the checkout', async (t) => {
  const folder = await mkdtemp(join(tmpdir(), 'angry-carp-clean-'));
  t.after(() => rm(folder, { recursive: true, force: true }));
  const input = join(folder, 'original.eml');
  const invoke = (...args: string[]) => run(process.execPath, ['--import', denyNetwork, entry, ...args], { cwd: folder });
  await writeFile(input, 'Subject: Test\r\n\r\nHello');
  const clean = JSON.parse((await invoke('analyze', input, '--format', 'json')).stdout);
  assert.equal(clean.analysis.routing.kind, 'no_concerns_detected');
  await assert.rejects(invoke('analyze', input, '--format', 'json', '--output', join(folder, 'missing', 'packet.json')), (error: unknown) => {
    assert.ok(error instanceof Error && 'stdout' in error && 'code' in error);
    assert.equal(error.code, 4);
    assert.equal(JSON.parse(String(error.stdout)).analysis.routing.kind, 'no_concerns_detected');
    return true;
  });
  const packetPath = join(folder, 'packet.json');
  const selection = join(folder, 'selection.json');
  await writeFile(packetPath, JSON.stringify(clean));
  await writeFile(selection, '{}');
  await assert.rejects(invoke('assess', packetPath, selection));
  await writeFile(input, 'Content-Type: text/html\r\n\r\n<a href="data:text/html,private-body">open</a>');
  const incomplete = JSON.parse((await invoke('analyze', input, '--format', 'json')).stdout);
  assert.equal(incomplete.analysis.routing.kind, 'assessment_required');
  assert.equal(incomplete.analysis.routing.reason, 'incomplete_checks');
  assert.ok(incomplete.assessmentEvidence.some(({ id }: { id: string }) => id === 'coverage'));
  await writeFile(packetPath, JSON.stringify(incomplete));
  await writeFile(selection, JSON.stringify({ concern: 'low', confidence: 'low', hypothesis: 'no_specific_deception',
    evidence: [{ id: 'coverage', role: 'context' }] }));
  const rendered = await invoke('assess', packetPath, selection);
  assert.match(rendered.stdout, /unresolved_reference:data:anchor/);
  assert.doesNotMatch(rendered.stdout, /private-body/);
  incomplete.assessmentEvidence = Array.from({ length: 148 }, (_, index) => ({ id: `record${index}`, text: `Recorded observation ${index}.` }));
  await writeFile(packetPath, JSON.stringify(incomplete));
  await writeFile(selection, JSON.stringify({ concern: 'low', confidence: 'low', hypothesis: 'no_specific_deception',
    evidence: [{ id: 'record147', role: 'context' }] }));
  assert.match((await invoke('assess', packetPath, selection)).stdout, /Recorded observation 147\./);
  await writeFile(input, '');
  await assert.rejects(invoke('analyze', input, '--format', 'json'), (error: unknown) => {
    assert.ok(error instanceof Error && 'stdout' in error && 'code' in error);
    assert.equal(error.code, 1);
    assert.deepEqual(JSON.parse(String(error.stdout)), { version: 2,
      analysis: { kind: 'input_failure', reason: 'input_limit' }, assessmentEvidence: [] });
    return true;
  });
  for (const args of [['--help'], ['analyze', '--help'], ['instructions'], ['instructions', 'assessment'],
    ['instructions', 'reporting'], ['instructions', 'skill']]) {
    const result = await invoke(...args);
    assert.ok(result.stdout.length > 100);
    assert.equal(result.stderr, '');
  }
  const guide = await invoke('instructions', 'assessment');
  assert.equal(guide.stdout, await readFile(new URL(import.meta.resolve('@angry-carp/checks/assessment-instructions')), 'utf8'));
  assert.doesNotMatch((await invoke('instructions', 'reporting')).stdout, /\]\((?:\.\.\/|docs\/|[a-z-]+\.md)/);
  await assert.rejects(invoke('instructions', '../package.json'));
  await assert.rejects(invoke('analyze', input, '--format', 'yaml'), (error: unknown) => {
    assert.ok(error instanceof Error && 'code' in error);
    assert.equal(error.code, 2);
    return true;
  });
});

test('repeatable operator references expose typo concerns through the CLI', async (t) => {
  const folder = await mkdtemp(join(tmpdir(), 'angry-carp-references-'));
  t.after(() => rm(folder, { recursive: true, force: true }));
  const input = join(folder, 'original.eml');
  await writeFile(input, 'From: Sender <sender@example.com>\r\nContent-Type: text/plain; charset=utf-8\r\n\r\nhttps://coinbsae.com/ https://päypal.com/');
  const invoke = (...references: string[]) => run(process.execPath,
    ['--import', new URL('./fixtures/analysis-preload.ts', import.meta.url).href, entry, 'analyze', input, '--format', 'json', ...references], { cwd: folder });
  const baseline = JSON.parse((await invoke()).stdout);
  assert.equal(baseline.analysis.routing.reason, 'incomplete_checks');
  assert.deepEqual(baseline.analysis.findings, []);
  const selected = JSON.parse((await invoke('--reference-domain', 'coinbase.com', '--reference-domain', 'paypal.com')).stdout);
  assert.equal(selected.analysis.routing.reason, 'concerns_detected');
  assert.deepEqual(selected.analysis.findings.map(({ kind, code }: { kind: string; code: string }) => ({ kind, code })),
    [{ kind: 'concern', code: 'domain_resemblance' }, { kind: 'concern', code: 'domain_resemblance' }]);
  assert.match(selected.analysis.findings[0].text, /adjacent character swap.*Reference source: operator/);
  assert.match(selected.analysis.findings[1].text, /Latin diacritic folding.*Reference source: operator/);
});
