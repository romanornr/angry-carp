import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const run = promisify(execFile);

for (const { failure, code, stdout, stderr } of [
  { failure: 'none', code: 0, stdout: 'Offline assessment.\n', stderr: '' },
  { failure: 'output', code: 1, stdout: '', stderr: 'Assessment failed. Check the input file and authentication.\n' },
  { failure: 'cleanup', code: 1, stdout: 'Offline assessment.\n', stderr: 'Provider session cleanup failed.\n' },
]) {
  test(`CLI exits naturally and reports the right outcome; failure=${failure}`, async (t) => {
    const directory = await mkdtemp(join(tmpdir(), 'angry-carp-lifecycle-'));
    t.after(() => rm(directory, { recursive: true, force: true }));
    const input = join(directory, 'prepared.txt');
    await writeFile(input, 'Synthetic offline email.');
    const command = run(process.execPath, [
      '--import', new URL('./fixtures/triage-preload.ts', import.meta.url).href,
      fileURLToPath(new URL('./triage-cli.ts', import.meta.url)), input,
    ], {
      timeout: 10_000,
      env: { ...process.env, ANGRY_CARP_TEST_FAILURE: failure },
    });
    const expectedStderr = `Assessing prepared.txt…\n${stderr}`;
    if (code !== 0) {
      await assert.rejects(command, {
        code, killed: false, stdout, stderr: expectedStderr,
      });
    } else {
      const result = await command;
      assert.equal(result.stdout, stdout);
      assert.equal(result.stderr, expectedStderr);
    }
  });
}
