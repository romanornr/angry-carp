import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const run = promisify(execFile);

for (const { failure, code, stderr } of [
  { failure: 'none', code: 0, stderr: '' },
  { failure: 'projection', code: 0, stderr: '' },
  { failure: 'output', code: 1, stderr: 'Assessment failed. Check the input, authentication and optional output path. Existing output files are not replaced.\n' },
  { failure: 'cleanup', code: 1, stderr: 'Provider session cleanup failed.\n' },
  { failure: 'unstructured', code: 1, stderr: 'AI assessment unavailable: missing or invalid structured result.\n' },
  { failure: 'unknown-reference', code: 1, stderr: 'AI assessment unavailable: missing or invalid structured result.\n' },
  { failure: 'clean', code: 0, stderr: '' },
  { failure: 'input-failure', code: 1, stderr: '' },
]) {
  test(`CLI exits naturally and reports the right outcome; failure=${failure}`, async (t) => {
    const directory = await mkdtemp(join(tmpdir(), 'angry-carp-lifecycle-'));
    t.after(() => rm(directory, { recursive: true, force: true }));
    const input = join(directory, 'prepared.txt');
    await writeFile(input, 'Synthetic offline email.');
    const original = join(directory, 'original.eml');
    let body = 'Synthetic email body.';
    const extraArgs: string[] = ['--reviewed-text', input];
    if (failure === 'clean') extraArgs.length = 0;
    if (failure === 'projection') {
      body = '<a href="https://private-user@action.example.com/private-path?private-query">' +
        'private-text<img src="https://image.example.org/private-image" alt="private-alt"></a>';
    }
    let sender = 'private-user@sender.example';
    if (failure === 'clean') sender = 'private-user@example.com';
    await writeFile(original, `From: ${sender}\r\nContent-Type: text/html; charset=utf-8\r\n\r\n` + body);
    if (failure === 'input-failure') await writeFile(original, '');
    const command = run(process.execPath, [
      '--import', new URL('./fixtures/triage-preload.ts', import.meta.url).href,
      fileURLToPath(new URL('./triage-cli.ts', import.meta.url)), original, ...extraArgs,
    ], {
      timeout: 10_000,
      env: { ...process.env, ANGRY_CARP_TEST_FAILURE: failure },
    });
    let expectedStderr = `Analyzing email…\nAssessing analyzed email…\n${stderr}`;
    if (failure === 'clean') expectedStderr = 'Analyzing email…\n';
    if (code !== 0) {
      await assert.rejects(command, (error: unknown) => {
        assert.ok(error instanceof Error && 'code' in error && 'killed' in error && 'stdout' in error && 'stderr' in error);
        assert.equal(error.code, code);
        assert.equal(error.killed, false);
        assert.equal(error.stderr, expectedStderr);
        if (['output', 'unstructured', 'unknown-reference'].includes(failure)) {
          assert.match(String(error.stdout), /^Deterministic email analysis/);
          assert.doesNotMatch(String(error.stdout), /\nAI assessment\n/);
        }
        else assert.match(String(error.stdout), /AI assessment\nConcern: high; confidence: moderate\./);
        assert.doesNotMatch(String(error.stdout), /Invented unrelated/);
        return true;
      });
    } else {
      const result = await command;
      if (failure === 'clean') {
        assert.match(result.stdout, /No concerns detected within completed applicable checks/);
        assert.doesNotMatch(result.stdout, /AI assessment\n/);
      } else assert.match(result.stdout, /AI assessment\nConcern: high; confidence: moderate\./);
      assert.doesNotMatch(result.stdout, /Invented unrelated/);
      assert.equal(result.stderr, expectedStderr);
    }
  });
}
