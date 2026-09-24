import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { MAX_HTML_BYTES } from '@angry-carp/checks/email-links';

const run = promisify(execFile);

test('offline command writes private evidence once; acquisition rejects excessive or non-UTF-8 input', async (t) => {
  const directory = await mkdtemp(join(tmpdir(), 'angry-carp-links-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const input = join(directory, 'body.html');
  const output = join(directory, 'links.json');
  await writeFile(input, '<img src="https://image.example/private-path">');
  const args = [fileURLToPath(new URL('../dist/main.js', import.meta.url)), 'extract-links', input, output];
  const result = await run(process.execPath, args);
  assert.equal(result.stdout, '');
  assert.equal(result.stderr, 'Wrote private link evidence and its model summary. No network requests made.\n');
  const original = await readFile(output, 'utf8');
  assert.match(original, /private-path/);
  assert.equal((await stat(output)).mode & 0o777, 0o600);
  await assert.rejects(run(process.execPath, args), { code: 1, stdout: '',
    stderr: 'Link extraction failed. Check the UTF-8 HTML input, size limit and unused output path.\n' });
  assert.equal(await readFile(output, 'utf8'), original);
  await writeFile(input, Buffer.alloc(MAX_HTML_BYTES + 1));
  await assert.rejects(run(process.execPath, args), { code: 1, stdout: '' });
  await writeFile(input, Buffer.from([0xff]));
  await assert.rejects(run(process.execPath, args), { code: 1, stdout: '' });
  await assert.rejects(run(process.execPath, [args[0], 'extract-links', directory, output]), { code: 1, stdout: '' });
});
