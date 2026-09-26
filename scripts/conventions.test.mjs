import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const executable = fileURLToPath(new URL('node_modules/konsistent/dist/cli.js', root));
const config = fileURLToPath(new URL('konsistent.json', root));

test('structural lint accepts present files and rejects each missing guide or regression file', async t => {
  const directory = await mkdtemp(join(tmpdir(), 'angry-carp-conventions-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const cases = [
    ['lib/README.md', 'workspace-usage-guides'],
    ['cli/README.md', 'workspace-usage-guides'],
    ['agent/README.md', 'workspace-usage-guides'],
    ['lib/src/email-analysis/analysis-output.test.ts', 'boundary-regression-files'],
    ['lib/src/reporting/report-preparation.test.ts', 'boundary-regression-files'],
  ];

  for (const [file] of cases) {
    await mkdir(dirname(join(directory, file)), { recursive: true });
    await writeFile(join(directory, file), '');
  }

  function check() {
    return spawnSync(process.execPath, [executable, 'check', '--config-path', config, '--format', 'json'], {
      cwd: directory, encoding: 'utf8', timeout: 10_000,
    });
  }

  const valid = check();
  assert.equal(valid.status, 0, valid.stderr || valid.stdout);
  assert.deepEqual(JSON.parse(valid.stdout), []);

  for (const [file, convention] of cases) {
    const path = join(directory, file);
    await rm(path);
    const result = check();
    assert.equal(result.status, 1, `${file}: ${result.stderr || result.stdout}`);
    const diagnostics = JSON.parse(result.stdout);
    assert.ok(diagnostics.some(item => item.conventionName === convention), result.stdout);
    await writeFile(path, '');
  }
});
