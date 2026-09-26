/**
 * Compares a hostname with one supplied reference and describes how the names resemble each other.
 * The embedding, adjacent-swap, and diacritic-folding checks were informed by Chromium.
 * Each helper links the relevant upstream code and explains its local differences.
 *
 * Steps:
 * 1. Record invisible input characters before IDNA conversion can remove them.
 * 2. Convert the names and use tldts to find identifying labels, including private suffixes.
 * 3. Distinguish exact-host and child-host relationships from other names.
 * 4. Compare labels and embedded domains using unicode-spoofing's confusable skeletons.
 *
 * Implementation choices:
 * - Each comparison uses one supplied reference, without Chromium's site lists or warning policy.
 * - deriveFindings decides which matches warrant assessment based on how the reference was selected.
 *
 * See docs/domain-lookalikes.md for the design, dependencies, and evaluation.
 */
import { versions } from 'node:process';
import { domainToASCII, domainToUnicode } from 'node:url';
import { primaryScript, skeleton, UNICODE_VERSION } from '@moderation-api/unicode-spoofing';
import { parse } from 'tldts';
import * as v from 'valibot';
import { classifyScriptMixing } from './script-mixing.ts';

export const domainNameSchema = v.pipe(
  v.string(),
  v.minLength(1),
  v.maxLength(1024),
  v.regex(/^[^/\\:@?#%\s]+$/u, 'Supply a domain name, not a URL or email address.'),
  v.brand('DomainNameInput'),
);

export const domainComparisonSchema = v.object({
  referenceDomain: domainNameSchema,
  observedDomain: domainNameSchema,
});

type DomainInspection = ReturnType<typeof inspectInput> & (
  | { kind: 'invalid'; reason: 'invalid_domain' | 'unknown_suffix' }
  | {
    kind: 'parsed';
    ascii: string;
    unicode: string;
    changedByIdna: boolean;
    registrableDomain: string;
    label: string;
    scriptUnicodeVersion: string | null;
    labels: { text: string; scripts: ReturnType<typeof primaryScript>[]; scriptMixing: ReturnType<typeof classifyScriptMixing> }[];
  }
);

type ParsedDomain = Extract<DomainInspection, { kind: 'parsed' }>;
type Relationship = 'same_domain' | 'subdomain_of_reference' | 'different_domain';
type Resemblance =
  | { kind: 'confusable_label' }
  | { kind: 'folded_label' }
  | { kind: 'character_swap'; form: 'folded' | 'skeleton' }
  | { kind: 'label_contained'; form: 'literal' | 'skeleton'; prefix: string; suffix: string }
  | { kind: 'registrable_domain_embedded'; text: string; utf16Index: number };

type DomainComparison = { confusablesUnicodeVersion: string } & (
  | { kind: 'unavailable'; reference: DomainInspection; observed: DomainInspection }
  | {
    kind: 'compared';
    reference: ParsedDomain;
    observed: ParsedDomain;
  } & (
    | { relationship: 'same_domain' | 'subdomain_of_reference' }
    | { relationship: 'different_domain'; resemblance: Resemblance[] }
  )
);

/** Compares names locally against a caller-supplied reference without verifying brand ownership. */
export function compareDomains(input: v.InferOutput<typeof domainComparisonSchema>): DomainComparison {
  const reference = inspectDomain(input.referenceDomain);
  const observed = inspectDomain(input.observedDomain);
  if (reference.kind === 'invalid' || observed.kind === 'invalid') {
    return { reference, observed, confusablesUnicodeVersion: UNICODE_VERSION, kind: 'unavailable' };
  }

  let relationship: Relationship = 'different_domain';
  if (observed.ascii === reference.ascii) relationship = 'same_domain';
  else if (observed.ascii.endsWith(`.${reference.ascii}`)) relationship = 'subdomain_of_reference';

  const comparison = { reference, observed, confusablesUnicodeVersion: UNICODE_VERSION };
  if (relationship !== 'different_domain') return { ...comparison, kind: 'compared', relationship };

  const resemblance: Resemblance[] = [];
  const referenceSkeleton = skeleton(reference.label);
  const observedSkeleton = skeleton(observed.label);
  if (referenceSkeleton === observedSkeleton) resemblance.push({ kind: 'confusable_label' });
  const literal = findExtraText({ reference: reference.label, observed: observed.label });
  const confusable = findExtraText({ reference: referenceSkeleton, observed: observedSkeleton });
  if (literal) resemblance.push({ kind: 'label_contained', form: 'literal', ...literal });
  if (confusable) resemblance.push({ kind: 'label_contained', form: 'skeleton', ...confusable });
  // A reference can be a host, so these methods exclude siblings under the same registrable domain.
  if (reference.registrableDomain !== observed.registrableDomain) {
    const foldedReference = maybeRemoveDiacritics(reference.label);
    const foldedObserved = maybeRemoveDiacritics(observed.label);
    const foldedReferenceSkeleton = skeleton(foldedReference);
    const foldedObservedSkeleton = skeleton(foldedObserved);
    if (referenceSkeleton !== observedSkeleton && foldedReferenceSkeleton === foldedObservedSkeleton) resemblance.push({ kind: 'folded_label' });
    if (Array.from(foldedReference).length >= 5) {
      if (hasOneCharacterSwap({ reference: foldedReference, observed: foldedObserved })) {
        resemblance.push({ kind: 'character_swap', form: 'folded' });
      } else if (hasOneCharacterSwap({ reference: foldedReferenceSkeleton, observed: foldedObservedSkeleton })) {
        resemblance.push({ kind: 'character_swap', form: 'skeleton' });
      }
    }
    const embedded = embeddedDomain({ reference: reference.registrableDomain, observed: observed.unicode });
    if (embedded) resemblance.push({ kind: 'registrable_domain_embedded', ...embedded });
  }

  return { ...comparison, kind: 'compared', relationship, resemblance };
}

// Chromium's Latin/Greek/Cyrillic folding, retaining our NFD-first eligibility and all nonspacing marks.
// Its narrower mark range assumes character checks we do not implement:
// https://github.com/chromium/chromium/blob/fcd1720dfbc767af07055b27f303207fab09c45d/components/url_formatter/spoof_checks/skeleton_generator.cc#L52-L73
function maybeRemoveDiacritics(label: string) {
  const decomposed = label.normalize('NFD');
  if (!/^[\p{Script=Latin}\p{Script=Greek}\p{Script=Cyrillic}\p{Mn}0-9-]+$/u.test(decomposed)) return label;
  return decomposed.replace(/\p{Mn}/gu, '').normalize('NFC').replace(/ł/gu, 'l').replace(/ø/gu, 'o').replace(/đ/gu, 'd');
}

// Chromium's HasOneCharacterSwap heuristic, independently implemented over code points:
// https://github.com/chromium/chromium/blob/fcd1720dfbc767af07055b27f303207fab09c45d/components/lookalikes/core/lookalike_url_util.cc#L1338-L1371
function hasOneCharacterSwap({ reference, observed }: { reference: string; observed: string }) {
  const left = Array.from(reference);
  const right = Array.from(observed);
  if (left.length !== right.length) return false;
  const at = left.findIndex((character, index) => character !== right[index]);
  if (at < 0) return false;
  return left[at] === right[at + 1] && left[at + 1] === right[at]
    && left.slice(at + 2).every((character, offset) => character === right[at + 2 + offset]);
}

function embeddedDomain({ reference, observed }: { reference: string; observed: string }) {
  // Match the whole reference domain because bare brand labels also occur in tenant hosts such as paypal.zendesk.com.
  // The embedding concept comes from Chromium's SearchForEmbeddings:
  // https://github.com/chromium/chromium/blob/fcd1720dfbc767af07055b27f303207fab09c45d/components/lookalikes/core/lookalike_url_util.cc#L1125-L1234
  const target = domainToUnicode(reference).split(/[.-]/u).map(skeleton);
  const tokens = observed.split(/[.-]/u);
  const skeletons = tokens.map(skeleton);
  let utf16Index = 0;
  for (let start = 0; start + target.length <= tokens.length; start++) {
    if (target.every((token, offset) => token === skeletons[start + offset])) {
      const length = tokens.slice(start, start + target.length).join('.').length;
      if (length === observed.length) return null;
      return { text: observed.slice(utf16Index, utf16Index + length), utf16Index };
    }
    utf16Index += tokens[start].length + 1;
  }
  return null;
}

/** Inspects a validated bare domain independently of comparison references. */
export function inspectDomain(input: v.InferOutput<typeof domainNameSchema>): DomainInspection {
  // Capture invisible characters before IDNA conversion can remove them.
  const original = inspectInput(input);
  const ascii = domainToASCII(input).replace(/\.$/, '');
  if (ascii.length > 253 || !/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9-]+$/.test(ascii)) {
    return { ...original, kind: 'invalid', reason: 'invalid_domain' };
  }
  const parts = parse(ascii, { allowPrivateDomains: true, extractHostname: false });
  if (parts.isIp) return { ...original, kind: 'invalid', reason: 'invalid_domain' };
  if (!parts.domain || !parts.domainWithoutSuffix || (!parts.isIcann && !parts.isPrivate)) {
    return { ...original, kind: 'invalid', reason: 'unknown_suffix' };
  }

  const unicode = domainToUnicode(ascii);
  const given = input.toLowerCase().replace(/\.$/, '');
  return {
    ...original,
    kind: 'parsed',
    ascii,
    unicode,
    changedByIdna: given !== ascii && given !== unicode,
    registrableDomain: parts.domain,
    // Convert the full domain because node:url can interpret a standalone numeric label as an IPv4 address.
    label: domainToUnicode(parts.domain).split('.')[0],
    scriptUnicodeVersion: versions.unicode ?? null,
    // Primary scripts are an inventory, not the UTS #39 resolved script set or a risk flag.
    labels: unicode.split('.').map((text) => ({
      text,
      scripts: [...new Set(Array.from(text, primaryScript))].sort(),
      scriptMixing: classifyScriptMixing(text),
    })),
  };
}

function findExtraText({ reference, observed }: { reference: string; observed: string }) {
  const index = observed.indexOf(reference);
  if (index < 0 || observed === reference) return null;
  return { prefix: observed.slice(0, index), suffix: observed.slice(index + reference.length) };
}

function inspectInput(input: string) {
  const formatCharacters: { utf16Index: number; escaped: string }[] = [];
  const escapedInput = input.replace(/[\p{Default_Ignorable_Code_Point}\p{Cf}\p{Cc}]/gu, (character: string, index: number) => {
    const escaped = character.split('').map((unit) => `\\u${unit.charCodeAt(0).toString(16).padStart(4, '0')}`).join('');
    formatCharacters.push({ utf16Index: index, escaped });
    return escaped;
  });
  return { escapedInput, formatCharacters };
}
