import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdtemp, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const run = promisify(execFile);
const original = 'From: private-name <private-user@sender.example.com>\r\n' +
  'DKIM-Signature: d=private-invalid/path?secret; s=test\r\n' +
  'Content-Type: text/html; charset=utf-8\r\n\r\n' +
  '<img src="https://image.example.org/private-logo" alt="private-alt">' +
  '<a href="https://private-user@action.example.com/private-path?private-query">private-body</a>';

test('CLI displays findings without content, writes only on request, and refuses overwrite', async (t) => {
  const folder = await mkdtemp(join(tmpdir(), 'angry-carp-analysis-'));
  t.after(() => rm(folder, { recursive: true, force: true }));
  const input = join(folder, 'original.eml');
  const output = join(folder, 'private.json');
  await writeFile(input, original);
  const args = ['--import', new URL('./fixtures/analysis-preload.ts', import.meta.url).href,
    fileURLToPath(new URL('../dist/analyze.js', import.meta.url)), input];
  const displayed = await run(process.execPath, args, { timeout: 10_000 });
  assert.match(displayed.stdout, /Image host image\.example\.org and action host action\.example\.com/);
  assert.doesNotMatch(displayed.stdout + displayed.stderr, /private-/);
  assert.deepEqual(await readdir(folder), ['original.eml']);
  await run(process.execPath, [...args, '--json', output], { timeout: 10_000 });
  const saved = await readFile(output, 'utf8');
  assert.match(saved, /private-body/);
  assert.equal((await stat(output)).mode & 0o777, 0o600);
  await assert.rejects(run(process.execPath, [...args, '--json', output]), (error: unknown) => {
    assert.ok(error instanceof Error && 'code' in error && 'stdout' in error);
    assert.equal(error.code, 1);
    assert.match(String(error.stdout), /Deterministic email analysis/);
    return true;
  });
  assert.equal(await readFile(output, 'utf8'), saved);
  const notesPath = join(folder, 'reviewed-notes.json');
  await writeFile(notesPath, JSON.stringify([{ url: 'https://support.example.org/advisory', retrievedAt: '2026-09-22T00:00:00Z',
    displayedDate: null, claim: 'Reviewed source claim.', providedBy: 'operator', sourceAuthority: 'unknown', relation: 'context',
    subjectHosts: [], messageDateApplicability: 'unknown' }]));
  const withNotes = join(folder, 'notes-analysis.json');
  await run(process.execPath, [...args, '--source-notes', notesPath, '--json', withNotes], { timeout: 10_000 });
  const noted = JSON.parse(await readFile(withNotes, 'utf8'));
  assert.equal(noted.sourceNotes[0].claim, 'Reviewed source claim.');
  assert.equal(noted.sourceNotes[0].acquisition, 'caller_supplied_note');
  assert.equal(noted.sourceNotes[0].verification, 'not_performed');
});
