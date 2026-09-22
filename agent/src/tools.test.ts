import assert from 'node:assert/strict';
import { test } from 'node:test';
import * as v from 'valibot';
import { brandQuerySchema } from '@angry-carp/checks/brands';
import { loadBrandDirectory } from '@angry-carp/checks/brands/local';
import { findSharedPassagesTool } from './tools/text-reuse.ts';

test('the public local-loader resolves its snapshot without loading the agent', async () => {
  const directory = await loadBrandDirectory();
  const result = directory.lookup(v.parse(brandQuerySchema, { kind: 'hostname', value: 'nordaccount.com' }));
  assert.deepEqual(result.matches.map((entry) => entry.name), ['NordLocker', 'NordPass', 'NordVPN']);
});

test('the remaining follow-up tool registers and compares supplied text without auth or files', async () => {
  assert.equal(findSharedPassagesTool.name, 'find_shared_passages');
  const noLog = () => assert.fail('Text comparison must not log.');
  const input = 'one two three four five six seven eight nine ten';
  const result = await findSharedPassagesTool.run({
    toolCallId: 'offline-passages', log: { info: noLog, warn: noLog, error: noLog },
    data: v.parse(findSharedPassagesTool.input, { firstBody: input, secondBody: input }),
  });
  assert.partialDeepStrictEqual(result, { output: { kind: 'complete', tokenCounts: { first: 10, second: 10 },
    matches: [{ tokenCount: 10, first: { start: 0, end: input.length, excerpt: input }, second: { start: 0, end: input.length, excerpt: input } }] } });
});
