import * as v from 'valibot';

const bodySchema = v.pipe(v.string(), v.maxLength(16_000), v.brand('MessageBody'));
export const passageComparisonSchema = v.object({ firstBody: bodySchema, secondBody: bodySchema });

const algorithm = Object.freeze({
  name: 'winnowing',
  version: 1,
  normalization: 'nfc-lowercase-whitespace-tokens',
  positionUnit: 'utf16',
  gramTokens: 5,
  windowGrams: 4,
  minimumPassageTokens: 8,
});
const maxCandidatePairs = 10_000;
const maxMatches = 10;
const maxExcerptLength = 400;

type Token = { value: string; start: number; end: number };
type Match = { firstStart: number; secondStart: number; length: number };
type LimitReason = 'candidate_limit' | 'match_limit';
type Comparison = {
  algorithm: typeof algorithm;
  tokenCounts: { first: number; second: number };
  matches: {
    tokenCount: number;
    first: ReturnType<typeof sourceSpan>;
    second: ReturnType<typeof sourceSpan>;
  }[];
} & ({ kind: 'complete' } | { kind: 'limited'; reason: LimitReason });

/**
 * Winnowing (Schleimer et al., SIGMOD 2003): https://sschleimer.warwick.ac.uk/Maths/winnowing.pdf
 * Uses five-token grams and four-gram windows, then verifies and extends hash matches.
 * Positions address the supplied strings, not original MIME bytes. Limited results are partial.
 */
export function findSharedPassages(input: v.InferOutput<typeof passageComparisonSchema>): Comparison {
  const first = tokenize(input.firstBody);
  const second = tokenize(input.secondBody);
  const secondByHash = new Map<number, number[]>();
  for (const fingerprint of fingerprints(second)) {
    const positions = secondByHash.get(fingerprint.hash) ?? [];
    positions.push(fingerprint.start);
    secondByHash.set(fingerprint.hash, positions);
  }

  const matches: Match[] = [];
  let candidatePairs = 0;
  let limitReason: LimitReason | null = null;

  candidates: for (const fingerprint of fingerprints(first)) {
    for (const secondStart of secondByHash.get(fingerprint.hash) ?? []) {
      if (candidatePairs === maxCandidatePairs) {
        limitReason = 'candidate_limit';
        break candidates;
      }
      candidatePairs++;
      const firstStart = fingerprint.start;
      if (matches.some((match) =>
        firstStart >= match.firstStart && firstStart + algorithm.gramTokens <= match.firstStart + match.length &&
        firstStart - match.firstStart === secondStart - match.secondStart)) continue;

      // Hashes select candidates only; token equality decides whether text matches.
      let equal = true;
      for (let offset = 0; offset < algorithm.gramTokens; offset++) {
        if (first[firstStart + offset].value !== second[secondStart + offset].value) {
          equal = false;
          break;
        }
      }
      if (!equal) continue;

      const match = extendMatch(first, second, firstStart, secondStart);
      if (match.length < algorithm.minimumPassageTokens) continue;
      if (matches.length === maxMatches) {
        limitReason = 'match_limit';
        break candidates;
      }
      matches.push(match);
    }
  }

  const result = {
    algorithm,
    tokenCounts: { first: first.length, second: second.length },
    matches: matches.map((match) => ({
      tokenCount: match.length,
      first: sourceSpan(input.firstBody, first, match.firstStart, match.length),
      second: sourceSpan(input.secondBody, second, match.secondStart, match.length),
    })),
  };
  if (limitReason) return { ...result, kind: 'limited', reason: limitReason };
  return { ...result, kind: 'complete' };
}

function tokenize(body: string): Token[] {
  return Array.from(body.matchAll(/\S+/gu), (match) => ({
    value: match[0].normalize('NFC').toLowerCase(),
    start: match.index,
    end: match.index + match[0].length,
  }));
}

function fingerprints(tokens: Token[]) {
  const hashes: number[] = [];
  for (let start = 0; start + algorithm.gramTokens <= tokens.length; start++) {
    const gram = tokens.slice(start, start + algorithm.gramTokens).map((token) => token.value).join(' ');
    // FNV-1a over UTF-16 units gives a stable ordering; collisions are checked by the caller.
    let hash = 2166136261;
    for (let index = 0; index < gram.length; index++) {
      hash = Math.imul(hash ^ gram.charCodeAt(index), 16777619) >>> 0;
    }
    hashes.push(hash);
  }

  const selected: { hash: number; start: number }[] = [];
  let previous = -1;
  for (let start = 0; start + algorithm.windowGrams <= hashes.length; start++) {
    let minimum = start;
    for (let index = start + 1; index < start + algorithm.windowGrams; index++) {
      // The rightmost minimum on ties makes selection independent of preceding text.
      if (hashes[index] <= hashes[minimum]) minimum = index;
    }
    if (minimum !== previous) selected.push({ hash: hashes[minimum], start: minimum });
    previous = minimum;
  }
  return selected;
}

function extendMatch(first: Token[], second: Token[], firstStart: number, secondStart: number): Match {
  let length = algorithm.gramTokens;
  while (firstStart > 0 && secondStart > 0 && first[firstStart - 1].value === second[secondStart - 1].value) {
    firstStart--;
    secondStart--;
    length++;
  }
  while (firstStart + length < first.length && secondStart + length < second.length &&
    first[firstStart + length].value === second[secondStart + length].value) length++;
  return { firstStart, secondStart, length };
}

function sourceSpan(body: string, tokens: Token[], startToken: number, length: number) {
  const start = tokens[startToken].start;
  const end = tokens[startToken + length - 1].end;
  let excerptEnd = Math.min(end, start + maxExcerptLength);
  if (excerptEnd < end && (body.codePointAt(excerptEnd - 1) ?? 0) > 0xffff) excerptEnd--;
  return {
    start,
    end,
    excerpt: body.slice(start, excerptEnd),
    excerptTruncated: excerptEnd < end,
  };
}
