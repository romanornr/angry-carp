import assert from 'node:assert/strict';
import { test } from 'node:test';
import * as v from 'valibot';
import { findSharedPassages, passageComparisonSchema } from './winnowing.ts';

function compare(firstBody: string, secondBody: string) {
  return findSharedPassages(v.parse(passageComparisonSchema, { firstBody, secondBody }));
}

test('locates a reused passage after different introductions', () => {
  const result = compare('Hello.\none two three four five six seven eight', 'Notice: one two three four five six seven eight');
  assert.equal(result.kind, 'complete');
  assert.deepEqual(result.matches, [{
    tokenCount: 8,
    first: { start: 7, end: 46, excerpt: 'one two three four five six seven eight', excerptTruncated: false },
    second: { start: 8, end: 47, excerpt: 'one two three four five six seven eight', excerptTruncated: false },
  }]);
});

test('finds both unchanged passages around inserted junk', () => {
  const first = 'one two three four five six seven eight';
  const second = 'red orange yellow green blue indigo violet silver';
  const result = compare(`${first} ${second}`, `${first} RANDOM INSERTED JUNK ${second}`);
  assert.equal(result.kind, 'complete');
  assert.deepEqual(result.matches.map((match) => [match.tokenCount, match.first.excerpt, match.second.excerpt]), [
    [8, first, first], [8, second, second],
  ]);
});

test('normalizes case, canonical accents and whitespace while preserving input positions', () => {
  const first = '📨 CAFÉ one two three four five six seven';
  const second = 'cafe\u0301\tone\n two three four five six seven';
  const result = compare(first, second);
  assert.equal(result.kind, 'complete');
  assert.equal(result.matches.length, 1);
  const match = result.matches[0];
  assert.equal(match.tokenCount, 8);
  assert.equal(match.first.start, 3);
  assert.equal(match.second.start, 0);
  assert.equal(first.slice(match.first.start, match.first.end), 'CAFÉ one two three four five six seven');
  assert.equal(second.slice(match.second.start, match.second.end), 'cafe\u0301\tone\n two three four five six seven');
});

test('keeps confusables, invisible characters and punctuation distinct', () => {
  const text = 'paypal one two three four five six seven';
  assert.equal(compare(text, text).matches[0].tokenCount, 8);
  for (const changed of ['p\u0430ypal', 'pay\u200bpal', 'paypal,']) {
    assert.deepEqual(compare(text, `${changed} one two three four five six seven`).matches, []);
  }
});

test('reports shared footers without a spam or campaign verdict', () => {
  const footer = 'You received this message because you subscribed previously';
  const result = compare(`Your receipt is attached.\n${footer}`, `Your weekly newsletter.\n${footer}`);
  assert.equal(result.kind, 'complete');
  assert.deepEqual(result.matches.map((match) => [match.tokenCount, match.first.excerpt]), [[8, footer]]);
  assert.deepEqual(Object.keys(result).sort(), ['algorithm', 'kind', 'matches', 'tokenCounts']);
});

test('reports no passages for unrelated, empty, and below-threshold input', () => {
  assert.equal(compare('one two three four five six seven eight', 'one two three four five six seven eight').matches.length, 1);
  for (const [first, second] of [
    ['', ''], ['  \n', 'one two three four five six seven eight'],
    ['one two three four five six seven', 'one two three four five six seven'],
    ['one two three four five six seven eight', 'red orange yellow green blue indigo violet silver'],
  ]) {
    const result = compare(first, second);
    assert.equal(result.kind, 'complete');
    assert.deepEqual(result.matches, []);
  }
});

test('retains the eight-token match at different window alignments, including tied hashes', () => {
  for (const passage of ['one two three four five six seven eight', 'echo echo echo echo echo echo echo echo']) {
    for (let firstPrefix = 0; firstPrefix < 8; firstPrefix++) {
      for (let secondPrefix = 0; secondPrefix < 8; secondPrefix++) {
        const result = compare(`${'before '.repeat(firstPrefix)}${passage} after`, `${'other '.repeat(secondPrefix)}${passage} end`);
        assert.equal(result.kind, 'complete');
        assert.deepEqual(result.matches.map((match) => match.first.excerpt), [passage]);
      }
    }
  }
});

test('merges fingerprints from one long passage and bounds the excerpt independently of its span', () => {
  const body = Array.from({ length: 100 }, (_, index) => `token${index}`).join(' ');
  const result = compare(body, body);
  assert.equal(result.kind, 'complete');
  assert.equal(result.matches.length, 1);
  assert.equal(result.matches[0].tokenCount, 100);
  assert.equal(result.matches[0].first.start, 0);
  assert.equal(result.matches[0].first.end, 789);
  assert.equal(result.matches[0].first.excerpt.length, 400);
  assert.equal(result.matches[0].first.excerptTruncated, true);
});

test('returns a marked partial result when repeated text exceeds the match budget', () => {
  const body = 'echo '.repeat(100);
  const result = compare(body, body);
  assert.equal(result.kind, 'limited');
  if (result.kind !== 'limited') assert.fail('Expected a partial result');
  assert.equal(result.reason, 'match_limit');
  assert.equal(result.matches.length, 10);
  assert.equal(result.matches[0].tokenCount, 100);
  assert.deepEqual(result, compare(body, body));
});

test('validates both body boundaries without accepting paths as a file-reading operation', () => {
  for (const field of ['firstBody', 'secondBody']) {
    assert.equal(v.safeParse(passageComparisonSchema, { firstBody: '', secondBody: '', [field]: 'x'.repeat(16_001) }).success, false);
    assert.equal(v.safeParse(passageComparisonSchema, { firstBody: '', secondBody: '', [field]: 42 }).success, false);
  }
  assert.equal(compare('x'.repeat(16_000), '').kind, 'complete');
  const path = compare('../auth.json', '../auth.json');
  assert.deepEqual(path.tokenCounts, { first: 1, second: 1 });
  assert.deepEqual(path.matches, []);
});

test('marks comparisons partial when many below-threshold matches exhaust the candidate budget', () => {
  const first = Array.from({ length: 240 }, (_, index) => `one two three four five six seven A${index}`).join(' ');
  const second = Array.from({ length: 240 }, (_, index) => `one two three four five six seven B${index}`).join(' ');
  const result = compare(first, second);
  assert.equal(result.kind, 'limited');
  if (result.kind !== 'limited') assert.fail('Expected a bounded comparison');
  assert.equal(result.reason, 'candidate_limit');
  assert.deepEqual(result.matches, []);
});

test('verifies text after a fingerprint hash collision', () => {
  // The first five-token grams both hash to 409787200 and are selected minima.
  const first = '1nahe6z one two three four five six seven';
  const second = '1yp9lxb one two three four five six seven';
  assert.equal(compare(first, first).matches[0].tokenCount, 8);
  const result = compare(first, second);
  assert.equal(result.kind, 'complete');
  assert.deepEqual(result.matches, []);
});

test('keeps an astral character whole when clipping the excerpt', () => {
  const body = 'one two three four five si ' + '😀'.repeat(200) + ' seven eight';
  const result = compare(body, body);
  assert.equal(result.kind, 'complete');
  const span = result.matches[0].first;
  assert.equal(result.matches[0].tokenCount, 9);
  assert.equal(span.excerpt, 'one two three four five si ' + '😀'.repeat(186));
  assert.equal(span.excerpt.isWellFormed(), true);
  assert.equal(span.excerpt.length, 399);
  assert.equal(span.excerptTruncated, true);
  assert.equal(span.end, body.length);
});
