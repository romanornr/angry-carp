// Mechanism evaluation for docs/research/domain-impersonation.md. Synthetic and public inputs only; no network access.
// Usage from the repository root: node experiments/domain-lookalikes/evaluate.mjs > experiments/domain-lookalikes/generated/results.json
import { readFileSync } from 'node:fs';
import { domainToASCII, domainToUnicode } from 'node:url';
import { parse } from 'tldts';
import { skeleton, UNICODE_VERSION } from '@moderation-api/unicode-spoofing';
import * as v from 'valibot';
import { createHash } from 'node:crypto';
// Baseline comparator copied with `git show 6b00947:lib/src/lookalikes/compare-domains.ts`, never the working tree.
import { compareDomains, domainComparisonSchema } from './generated/baseline/compare-domains-6b00947.ts';

const here = new URL('./generated/', import.meta.url);
const BASELINE_SHA256 = '9a531f9ba4da786f0d0b9aae66a0993a524a60d215cb483b0ca4929eece9e06d';
const baselineHash = createHash('sha256').update(readFileSync(new URL('baseline/compare-domains-6b00947.ts', here))).digest('hex');
if (baselineHash !== BASELINE_SHA256) throw new Error(`Baseline comparator hash ${baselineHash} does not match ${BASELINE_SHA256}.`);
const permutations = JSON.parse(readFileSync(new URL('dnstwist-permutations.json', here), 'utf8'));
const directory = JSON.parse(readFileSync(new URL('../../../lib/reference-data/2fa-directory/v3.json', here), 'utf8'));

// Chromium-style fold: only for labels made of Latin, Greek, Cyrillic, digits, hyphens and nonspacing marks.
const LGC = /^[\p{Script=Latin}\p{Script=Greek}\p{Script=Cyrillic}\p{Mn}0-9-]*$/u;
function fold(text) {
  const nfd = text.normalize('NFD');
  if (!LGC.test(nfd)) return text;
  return nfd.replace(/\p{Mn}/gu, '').normalize('NFC').replace(/ł/gu, 'l').replace(/ø/gu, 'o').replace(/đ/gu, 'd');
}
const form = (text) => skeleton(fold(text));
const length = (text) => [...text].length;

function info(host) {
  const ascii = domainToASCII(host).replace(/\.$/u, '');
  if (!ascii) return null;
  const parts = parse(ascii, { allowPrivateDomains: true, extractHostname: false });
  if (parts.isIp || !parts.domain || !parts.domainWithoutSuffix) return null;
  return { ascii, unicode: domainToUnicode(ascii), registrable: parts.domain, label: domainToUnicode(parts.domain).split('.')[0] };
}
const related = (reference, observed) => observed.registrable === reference.registrable || observed.ascii.endsWith(`.${reference.registrable}`);

// Operation of the observed string relative to the reference: at most one OSA edit.
function oneEdit(reference, observed) {
  if (reference === observed) return null;
  const r = [...reference], o = [...observed];
  if (Math.abs(r.length - o.length) > 1) return null;
  let at = 0;
  while (at < r.length && at < o.length && r[at] === o[at]) at++;
  const rest = (a, b) => r.slice(a).join('') === o.slice(b).join('');
  if (r.length === o.length) {
    if (rest(at + 1, at + 1)) return { op: 'substitution', at };
    if (r[at] === o[at + 1] && r[at + 1] === o[at] && rest(at + 2, at + 2)) return { op: 'transposition', at };
    return null;
  }
  if (o.length > r.length) return rest(at, at + 1) ? { op: 'insertion', at } : null;
  return rest(at + 1, at) ? { op: 'omission', at } : null;
}

// guard 'contract': folded reference label >= 5 code points, checked once before either form.
// guard 'per_form': the first draft's bug, which measured length on each compared form (skeletons can be longer).
// guard 'none': no guards.
// forms 'skeleton_only' reproduces the draft's single-form comparison for the transposition figure.
function editOf(referenceLabel, observedLabel, guard, forms = 'both') {
  if (guard === 'contract' && length(fold(referenceLabel)) < 5) return null;
  const pairs = [[fold(referenceLabel), fold(observedLabel)], [form(referenceLabel), form(observedLabel)]];
  for (const [r, o] of forms === 'both' ? pairs : pairs.slice(1)) {
    const edit = oneEdit(r, o);
    if (!edit) continue;
    if (guard !== 'none') {
      if (guard === 'per_form' && length(r) < 5) continue;
      if (r.replace(/\d+$/u, '') === o.replace(/\d+$/u, '')) continue;
      if (edit.op !== 'transposition' && edit.at === 0) continue;
    }
    return edit.op;
  }
  return null;
}

const splitTokens = (unicodeName) => unicodeName.split(/[.-]/u).filter(Boolean).map(form);
// tokenization 'consistent': both sides split on dots and hyphens. 'dot_only': the first draft split the reference on dots only.
function embedded(reference, observed, tokenization = 'consistent') {
  const tokens = splitTokens(observed.unicode);
  const referenceUnicode = domainToUnicode(reference.registrable);
  const target = tokenization === 'consistent' ? splitTokens(referenceUnicode) : referenceUnicode.split('.').map(form);
  for (let i = 0; i + target.length <= tokens.length; i++) {
    if (target.every((token, k) => tokens[i + k] === token)) return true;
  }
  return false;
}

function labelKind(reference, observed) {
  const r = form(reference.label), o = form(observed.label);
  if (r === o) return 'confusable_label';
  if (observed.label.includes(reference.label) || o.includes(r)) return 'label_contained';
  return null;
}

function resemblance(referenceHost, observedHost, { guard = 'contract', tokenization = 'consistent', edits = 'all', forms = 'both' } = {}) {
  const reference = info(referenceHost), observed = info(observedHost);
  if (!reference || !observed) return null;
  if (related(reference, observed)) return [];
  const kinds = [];
  const label = labelKind(reference, observed);
  if (label) kinds.push(label);
  else {
    const op = editOf(reference.label, observed.label, guard, forms);
    if (op && (edits === 'all' || op === 'transposition')) kinds.push(`one_edit:${op}`);
  }
  if (embedded(reference, observed, tokenization)) kinds.push('registrable_domain_embedded');
  return kinds;
}

// Rejected ticket 01 rule: the reference label equals any label left of the observed registrable domain.
function labelInSubdomain(referenceHost, observedHost) {
  const reference = info(referenceHost), observed = info(observedHost);
  if (!reference || !observed || related(reference, observed)) return false;
  const subdomain = observed.unicode.slice(0, -domainToUnicode(observed.registrable).length).split('.').filter(Boolean);
  return subdomain.some((label) => form(label) === form(reference.label));
}

function currentComparator(referenceDomain, observedDomain) {
  const input = v.safeParse(domainComparisonSchema, { referenceDomain, observedDomain });
  if (!input.success) return { kind: 'invalid_input' };
  return compareDomains(input.output);
}
const currentFires = (result) => result.kind === 'compared' && result.relationship === 'different_domain'
  && Boolean(result.skeletonEqual || result.referenceLabelContained || result.referenceSkeletonContained);

const increment = (object, key) => { object[key] = (object[key] ?? 0) + 1; };
const results = {
  environment: { node: process.version, unicodeData: UNICODE_VERSION, icu: process.versions.icu },
};

// 1. Positive mechanism coverage.
const coverage = {};
const homoglyphMisses = {};
for (const [reference, list] of Object.entries(permutations)) {
  for (const [fuzzer, observed] of list) {
    const row = coverage[fuzzer] ??= { names: 0, current: 0, proposedWithoutOneEdit: 0, proposedTranspositionOnly: 0, transpositionOnlySkeletonForm: 0, proposed: 0, perFormGuard: 0 };
    row.names++;
    const current = currentComparator(reference, observed);
    if (currentFires(current)) row.current++;
    else if (fuzzer === 'homoglyph' && current.kind === 'compared') {
      const nfd = current.observed.label.normalize('NFD');
      increment(homoglyphMisses, !/[^\x00-\x7f]/u.test(current.observed.label) ? 'ascii_only'
        : /\p{Mn}/u.test(nfd) && fold(current.observed.label) !== current.observed.label ? 'has_foldable_diacritic' : 'other_non_ascii');
    }
    const kinds = resemblance(reference, observed) ?? [];
    if (kinds.length) row.proposed++;
    if (kinds.some((kind) => !kind.startsWith('one_edit'))) row.proposedWithoutOneEdit++;
    if ((resemblance(reference, observed, { edits: 'transposition' }) ?? []).length) row.proposedTranspositionOnly++;
    if ((resemblance(reference, observed, { guard: 'per_form' }) ?? []).length) row.perFormGuard++;
    if ((resemblance(reference, observed, { edits: 'transposition', forms: 'skeleton_only' }) ?? []).length) row.transpositionOnlySkeletonForm++;
  }
}
results.dnstwistCoverage = coverage;
results.currentHomoglyphMisses = homoglyphMisses;

// 2. Directory lexical collisions: every ordered pair of distinct registrable domains among primary domains.
const byRegistrable = new Map();
for (const [, row] of directory) {
  const parsed = info(row.domain.toLowerCase());
  if (parsed && !byRegistrable.has(parsed.registrable)) byRegistrable.set(parsed.registrable, parsed);
}
const registrables = [...byRegistrable.values()].sort((a, b) => (a.registrable < b.registrable ? -1 : 1));
for (const entry of registrables) { entry.form = form(entry.label); entry.fold = fold(entry.label); }
const pairs = { registrables: registrables.length, orderedPairs: registrables.length * (registrables.length - 1),
  current: {}, oneEditNone: {}, oneEditPerForm: {}, oneEditContract: {}, transpositionOnlyContract: 0, foldOnlyLabelKinds: 0,
  examples: { oneEditContract: [], oneEditPerFormOnly: [], transpositionOnlyContract: [] } };
const mimicFlagged = [];
for (const reference of registrables) {
  for (const observed of registrables) {
    if (reference === observed) continue;
    // Current comparator logic on precomputed labels; cross-checked against compareDomains below.
    let current = null;
    const rs = skeleton(reference.label), os = skeleton(observed.label);
    if (rs === os) current = 'skeleton_equal';
    else if (observed.label.includes(reference.label)) current = 'label_contained';
    else if (os.includes(rs)) current = 'skeleton_contained';
    if (current) { increment(pairs.current, current); mimicFlagged.push([reference.registrable, observed.registrable]); continue; }
    if (reference.form === observed.form || observed.form.includes(reference.form)) { pairs.foldOnlyLabelKinds++; continue; }
    const none = editOf(reference.label, observed.label, 'none');
    if (!none) continue;
    increment(pairs.oneEditNone, none);
    const perForm = editOf(reference.label, observed.label, 'per_form');
    const contract = editOf(reference.label, observed.label, 'contract');
    if (perForm) increment(pairs.oneEditPerForm, perForm);
    if (perForm && !contract) pairs.examples.oneEditPerFormOnly.push(`${observed.registrable} ~ ${reference.registrable}: ${perForm}`);
    if (!contract) continue;
    increment(pairs.oneEditContract, contract);
    pairs.examples.oneEditContract.push(`${observed.registrable} ~ ${reference.registrable}: ${contract}`);
    if (contract === 'transposition') { pairs.transpositionOnlyContract++; pairs.examples.transpositionOnlyContract.push(`${observed.registrable} ~ ${reference.registrable}`); }
  }
}
for (const key of ['oneEditNone', 'oneEditPerForm', 'oneEditContract']) pairs[`${key}Total`] = Object.values(pairs[key]).reduce((a, b) => a + b, 0);
pairs.currentTotal = Object.values(pairs.current).reduce((a, b) => a + b, 0);
pairs.examples.oneEditContract = pairs.examples.oneEditContract.slice(0, 30);
results.directoryPairs = pairs;

// Cross-check the precomputed current logic against the real comparator on every flagged pair and a fixed stride sample.
let checked = 0, disagreements = 0, index = 0;
const flaggedKeys = new Set(mimicFlagged.map(([r, o]) => `${r}/${o}`));
for (const [r, o] of mimicFlagged) { checked++; if (!currentFires(currentComparator(r, o))) disagreements++; }
for (const reference of registrables) for (const observed of registrables) {
  if (reference === observed || index++ % 997 !== 0 || flaggedKeys.has(`${reference.registrable}/${observed.registrable}`)) continue;
  checked++; if (currentFires(currentComparator(reference.registrable, observed.registrable))) disagreements++;
}
results.currentLogicCrossCheck = { checked, disagreements };

// 3. Embedding over every directory host (primary and additional domains) against every registrable reference.
const hosts = [...new Set(directory.flatMap(([, row]) => [row.domain, ...(row['additional-domains'] ?? [])].map((host) => host.toLowerCase())))].sort();
const referenceTokens = new Map();
for (const reference of registrables) {
  const target = splitTokens(domainToUnicode(reference.registrable));
  const bucket = referenceTokens.get(target[0]) ?? [];
  bucket.push([reference, target]);
  referenceTokens.set(target[0], bucket);
}
const embedding = { hosts: hosts.length, hits: 0, onlyEmbedding: [], hyphenatedReferences: registrables.filter((r) => r.registrable.includes('-')).length };
for (const host of hosts) {
  const observed = info(host);
  if (!observed) continue;
  const tokens = splitTokens(observed.unicode);
  for (let i = 0; i < tokens.length; i++) {
    for (const [reference, target] of referenceTokens.get(tokens[i]) ?? []) {
      if (related(reference, observed) || !target.every((token, k) => tokens[i + k] === token)) continue;
      embedding.hits++;
      if (!labelKind(reference, observed) && !editOf(reference.label, observed.label, 'contract')) embedding.onlyEmbedding.push(`${host} ~ ${reference.registrable}`);
    }
  }
}
results.directoryEmbedding = embedding;

// 4. Named cases, including hyphenated references and subdomain shapes.
const cases = [
  ['coinbase.com', 'coinbsae.com'], ['microsoft.com', 'imcrosoft.com'], ['paypal.com', 'päypal.com'], ['coinbase.com', 'çoinbase.com'],
  ['paypal.com', 'qaypal.com'], ['paypal.com', 'pay-pal.com'], ['meta.com', 'mega.io'], ['bitgo.com', 'bitso.com'],
  ['paypal.com', 'paypal.com.attacker.net'], ['paypal.com', 'paypal-com.attacker.net'], ['paypal.com', 'secure.paypal.com.attacker.net'],
  ['paypal.com', 'paypal.com-login.net'], ['paypal.com', 'pаypal.com.attacker.net'], ['paypal.com', 'paypal.attacker.net'],
  ['paypal.com', 'paypal.zendesk.com'], ['paypal.com', 'paypal.okta.com'], ['paypal.com', 'paypal.my.salesforce.com'],
  ['paypal.com', 'paypal.wd1.myworkdayjobs.com'], ['paypal.com', 'paypal.service-now.com'], ['paypal.com', 'paypal.atlassian.net'],
  ['paypal.com', 'paypal.sharepoint.com'], ['paypal.com', 'login.paypal.attacker.net'], ['paypal.com', 'paypal.com.au'], ['apple.com', 'apple.com.cn'],
  ['paypal.com', 'paypal.github.io'], ['paypal.com', 'paypal.com.s3.amazonaws.com'], ['paypal.com', 'www.paypal.com.edgekey.net'],
  ['paypal.com', 'paypal.co.uk'], ['paypal.com', 'mail.paypal.com'], ['ing.com', 'ing.com.attacker.net'], ['ing.com', 'mailing.example.net'],
  ['ing.com', 'booking.com'],
  ['t-mobile.com', 't-mobile.com.attacker.net'], ['t-mobile.com', 't-mobile-com.attacker.net'], ['t-mobile.com', 't.mobile.com.attacker.net'],
  ['t-mobile.com', 'tmobile.com.attacker.net'], ['t-mobile.com', 'mobile.com.attacker.net'], ['t-mobile.com', 'my-t-mobile.com'],
  ['t-mobile.com', 'at-mobile.com'],
];
results.cases = cases.map(([reference, observed]) => {
  const current = currentComparator(reference, observed);
  return { reference, observed, current: currentFires(current), proposed: resemblance(reference, observed), labelInSubdomain: labelInSubdomain(reference, observed),
    dotOnlyReferenceTokens: resemblance(reference, observed, { tokenization: 'dot_only' }) };
});

console.log(JSON.stringify(results, null, 1));
