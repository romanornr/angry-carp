// Compare the shipping predicate with the frozen pre-change predicate, using the existing dnstwist corpus.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import * as v from 'valibot';
import { compareDomains, domainComparisonSchema } from '../../lib/src/lookalikes/compare-domains.ts';
import { compareDomains as baseline } from './generated/baseline-9364211/lib/src/lookalikes/compare-domains.ts';

const baselineBytes = readFileSync(new URL('./generated/baseline-9364211/lib/src/lookalikes/compare-domains.ts', import.meta.url));
assert.equal(createHash('sha256').update(baselineBytes).digest('hex'), '53812b877bca471ea697aa9838b01bab7cc1379c10649591702d1a90fd14dab7');
const corpus = JSON.parse(readFileSync(new URL('./generated/dnstwist-permutations.json', import.meta.url), 'utf8'));
const counts = { inputs: 0, baselineMatches: 0, currentMatches: 0, lostMatches: 0, newKinds: {}, transpositions: { inputs: 0, matched: 0 } };
for (const [referenceDomain, variants] of Object.entries(corpus)) {
  for (const [generator, observedDomain] of variants) {
    counts.inputs++;
    const input = v.parse(domainComparisonSchema, { referenceDomain, observedDomain });
    const previous = baseline(input);
    const current = compareDomains(input);
    const matchedBefore = previous.kind === 'compared' && previous.relationship === 'different_domain' && previous.resemblance.length > 0;
    const matchedNow = current.kind === 'compared' && current.relationship === 'different_domain' && current.resemblance.length > 0;
    if (matchedBefore) counts.baselineMatches++;
    if (matchedNow) counts.currentMatches++;
    if (matchedBefore && !matchedNow) counts.lostMatches++;
    if (current.kind === 'compared' && current.relationship === 'different_domain') {
      for (const { kind } of current.resemblance) {
        if (kind === 'character_swap' || kind === 'folded_label') counts.newKinds[kind] = (counts.newKinds[kind] ?? 0) + 1;
      }
    }
    if (generator === 'transposition') {
      counts.transpositions.inputs++;
      if (matchedNow) counts.transpositions.matched++;
    }
  }
}
assert.equal(counts.lostMatches, 0, 'Existing matches must be preserved');
console.log(JSON.stringify(counts, null, 2));
