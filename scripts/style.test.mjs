import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const executable = fileURLToPath(new URL('node_modules/oxlint/bin/oxlint', root));
const config = fileURLToPath(new URL('.oxlintrc.json', root));

test('spacing lint rejects missing structural boundaries and fixes only blank lines', async t => {
  const directory = await mkdtemp(join(tmpdir(), 'angry-carp-style-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const cases = [
    ['functions', 'export function first() { return 1; }\nexport function second() { return 2; }'],
    ['default function', 'export const value = 1;\nexport default function second() { return value; }'],
    ['multiline type', 'export type Name = string;\nexport type Entry = {\n  name: Name;\n};\nexport type Entries = Entry[];'],
    ['setup and loop', 'export function sum(values: number[]) {\n  let total = 0;\n  // Accumulate values.\n  for (const value of values) total += value;\n\n  return total;\n}'],
    ['loop and next operation', 'export function consume(values: number[]) {\n  for (const value of values) console.log(value);\n  console.log("done");\n}'],
    ['setup and try', 'export function parse(value: string) {\n  const trimmed = value.trim();\n  try { return JSON.parse(trimmed); } catch { return null; }\n}'],
    ['processing and return', 'export function result() {\n  console.log("done");\n  return 1;\n}'],
    ['multiline conditional and new setup', 'export function prepare(value: string) {\n  if (value) {\n    console.log(value);\n  }\n  const result = value.trim();\n\n  return result;\n}'],
    ['excess blank lines', 'export function first() { return 1; }\n\n\nexport function second() { return 2; }'],
  ];

  for (const [name, source] of cases) {
    const path = join(directory, 'fixture.ts');
    await writeFile(path, `${source}\n`);
    const check = spawnSync(executable, ['--config', config, '--format', 'json', path], { encoding: 'utf8', timeout: 10_000 });
    assert.equal(check.status, 1, `${name}: ${check.stderr || check.stdout}`);
    const diagnostics = JSON.parse(check.stdout).diagnostics;
    assert.ok(diagnostics.some(({ code }) => code.startsWith('@stylistic(')), name);
    assert.ok(diagnostics.every(({ code }) => code.startsWith('@stylistic(')), check.stdout);

    const fix = spawnSync(executable, ['--config', config, '--fix', path], { encoding: 'utf8', timeout: 10_000 });
    assert.equal(fix.status, 0, `${name}: ${fix.stderr || fix.stdout}`);
    const fixed = await readFile(path, 'utf8');
    assert.deepEqual(fixed.split('\n').filter(line => line.trim()), source.split('\n').filter(line => line.trim()), name);
    if (name === 'setup and loop') assert.match(fixed, /let total = 0;\n\n  \/\/ Accumulate values\.\n  for/);

    const repeated = spawnSync(executable, ['--config', config, '--fix', path], { encoding: 'utf8', timeout: 10_000 });
    assert.equal(repeated.status, 0, repeated.stderr || repeated.stdout);
    assert.equal(await readFile(path, 'utf8'), fixed, 'Repeated fixes must not add more spacing');
  }
});

test('spacing lint leaves long cohesive expressions, guards, and related declarations unchanged', async t => {
  const directory = await mkdtemp(join(tmpdir(), 'angry-carp-style-long-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const path = join(directory, 'fixture.ts');
  const longText = 'a deliberately long value that must never force wrapping '.repeat(12);
  const source = `export type Input = { name: string; value: string };
export type Output = { label: string; result: string };
export const data = { name: '${longText}', value: '${longText}' };
export const mapped = [data].map(({ name, value }) => ({ label: name, result: value }));
export const render = (input: Input): Output => ({ label: input.name, result: input.value });
export const literal = \`first


last\`;

export function inspect(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (trimmed === 'skip') return '';
  const normalized = trimmed.toLowerCase();
  const suffix = '!';

  return normalized + suffix;
}

export function optional(value: string) {
  if (value) {
    console.log(value);
  }
  console.log('same operation');
}
`;
  await writeFile(path, source);
  const check = spawnSync(executable, ['--config', config, '--format', 'json', path], { encoding: 'utf8', timeout: 10_000 });
  assert.equal(check.status, 0, check.stderr || check.stdout);
  assert.deepEqual(JSON.parse(check.stdout).diagnostics, []);
  const fix = spawnSync(executable, ['--config', config, '--fix', path], { encoding: 'utf8', timeout: 10_000 });
  assert.equal(fix.status, 0, fix.stderr || fix.stdout);
  assert.equal(await readFile(path, 'utf8'), source, 'No reflow or changes to template-literal content');
});
