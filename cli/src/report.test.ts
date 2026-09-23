import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const run = promisify(execFile);
const command = fileURLToPath(new URL('../dist/report.js', import.meta.url));
const denyNetwork = 'data:text/javascript,' + encodeURIComponent(`
  import assert from 'node:assert/strict';
  let attempts = 0;
  globalThis.fetch = async () => { attempts++; throw new Error('Network forbidden.'); };
  process.on('exit', () => assert.equal(attempts, 0));
`);
const sha256 = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex');

test('host-assisted CLI prepares, holds failures, checks bindings and never fetches or sends', async (t) => {
  const folder = await mkdtemp(join(tmpdir(), 'angry-carp-report-'));
  t.after(() => rm(folder, { recursive: true, force: true }));
  const analysis = join(folder, 'analysis.json');
  const request = join(folder, 'request.json');
  const preparation = join(folder, 'preparation.json');
  const research = join(folder, 'research.json');
  const draft = join(folder, 'draft.json');
  const review = join(folder, 'review.json');
  const cli = (...args: string[]) => run(process.execPath, ['--import', denyNetwork, command, ...args], { timeout: 10_000 });
  await writeFile(analysis, JSON.stringify({ kind: 'analyzed', observations: { hosts: [] }, message: 'private-original' }));
  await writeFile(request, JSON.stringify({ target: { provider: 'example', serviceRole: 'hosting' },
    destination: { kind: 'form', url: 'https://provider.example/abuse' },
    resource: { kind: 'domain', name: 'lure.example' }, allegation: 'private-allegation', requestedAction: 'Investigate abuse',
    reviewedEvidence: 'private-reviewed-evidence', permittedSourceHosts: ['provider.example'], candidateHosts: ['lure.example'] }));
  const started = await cli('start', request, '--analysis', analysis, '--output', preparation);
  assert.match(started.stdout, /Research has not run/);
  assert.doesNotMatch(started.stdout + started.stderr, /private-/);
  assert.equal((await stat(preparation)).mode & 0o777, 0o600);
  const prepared = await readFile(preparation);
  assert.doesNotMatch(prepared.toString(), /private-original/);
  assert.match(started.stdout, new RegExp(sha256(prepared)));
  await assert.rejects(cli('start', request, '--analysis', analysis, '--output', preparation));
  assert.deepEqual(await readFile(preparation), prepared);
  await writeFile(draft, JSON.stringify({ destination: { kind: 'form', url: 'https://provider.example/abuse' },
    subject: 'private-subject', body: 'private-report-body' }));
  const at = new Date().toISOString();
  const supported = { kind: 'supported', explanation: 'Supports the requested action.', sourceIds: ['s1'] };
  const record = { provenance: 'host_supplied', host: 'offline test', preparationSha256: sha256(prepared),
    draftSha256: sha256(await readFile(draft)), startedAt: at, finishedAt: at,
    sources: [{ id: 's1', url: 'https://provider.example/policy', retrievedAt: at, claim: 'Synthetic policy', sourceAuthority: 'claimed_official' }],
    checks: { allegation: supported, providerRelationship: supported, reportingChannel: { ...supported, kind: 'failed' } } };
  await writeFile(research, JSON.stringify(record));
  const args = ['check', preparation, research, draft, '--analysis', analysis];
  await assert.rejects(cli(...args), (error: unknown) => {
    assert.ok(error instanceof Error && 'code' in error && 'stdout' in error);
    assert.equal(error.code, 3);
    assert.equal(error.stdout, 'Report held: reportingChannel:failed.\n');
    return true;
  });
  record.checks.reportingChannel.kind = 'supported';
  await writeFile(research, JSON.stringify(record));
  const checked = await cli(...args, '--output', review);
  assert.match(checked.stdout, /Ready for operator review, based on host-supplied research/);
  assert.match(checked.stdout, /Nothing is approved or sent/);
  assert.doesNotMatch(checked.stdout + checked.stderr, /private-/);
  assert.equal((await stat(review)).mode & 0o777, 0o600);
  const receipt = JSON.parse(await readFile(review, 'utf8'));
  assert.equal(receipt.kind, 'ready_for_review');
  assert.equal(receipt.draftSha256, sha256(await readFile(draft)));
  assert.equal(receipt.provenance, 'host_supplied');
  await writeFile(draft, (await readFile(draft, 'utf8')) + ' ');
  await assert.rejects(cli(...args), (error: unknown) => {
    assert.ok(error instanceof Error && 'stdout' in error);
    assert.equal(error.stdout, 'Report held: draft_changed.\n');
    return true;
  });
});
