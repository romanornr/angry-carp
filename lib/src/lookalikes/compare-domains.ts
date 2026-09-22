import { domainToASCII, domainToUnicode } from 'node:url';
import { primaryScript, skeleton, UNICODE_VERSION } from '@moderation-api/unicode-spoofing';
import { parse } from 'tldts';
import * as v from 'valibot';

const inputDomainSchema = v.pipe(
  v.string(),
  v.minLength(1),
  v.maxLength(1024),
  v.regex(/^[^/\\:@?#%\s]+$/u, 'Supply a domain name, not a URL or email address.'),
  v.brand('DomainNameInput'),
);

export const domainComparisonSchema = v.object({
  referenceDomain: inputDomainSchema,
  observedDomain: inputDomainSchema,
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
    labels: { text: string; scripts: ReturnType<typeof primaryScript>[] }[];
  }
);

type ParsedDomain = Extract<DomainInspection, { kind: 'parsed' }>;
type Relationship = 'same_domain' | 'subdomain_of_reference' | 'different_domain';
type DomainComparison = { confusablesUnicodeVersion: string } & (
  | { kind: 'unavailable'; reference: DomainInspection; observed: DomainInspection }
  | {
    kind: 'compared';
    reference: ParsedDomain;
    observed: ParsedDomain;
    relationship: Relationship;
    referenceLabel: string;
    observedLabel: string;
    skeletonEqual: boolean;
    referenceLabelContained: ReturnType<typeof findExtraText>;
    referenceSkeletonContained: ReturnType<typeof findExtraText>;
  }
);

/** Compares names locally. The caller supplies the reference; this does not verify brand ownership. */
export function compareDomains(input: v.InferOutput<typeof domainComparisonSchema>): DomainComparison {
  const reference = inspectDomain(input.referenceDomain);
  const observed = inspectDomain(input.observedDomain);
  if (reference.kind === 'invalid' || observed.kind === 'invalid') {
    return { reference, observed, confusablesUnicodeVersion: UNICODE_VERSION, kind: 'unavailable' };
  }

  let relationship: Relationship = 'different_domain';
  if (observed.ascii === reference.ascii) relationship = 'same_domain';
  else if (observed.ascii.endsWith(`.${reference.ascii}`)) relationship = 'subdomain_of_reference';

  const referenceLabel = reference.label;
  const observedLabel = observed.label;
  const referenceSkeleton = skeleton(referenceLabel);
  const observedSkeleton = skeleton(observedLabel);

  return {
    reference,
    observed,
    confusablesUnicodeVersion: UNICODE_VERSION,
    kind: 'compared',
    relationship,
    referenceLabel,
    observedLabel,
    skeletonEqual: referenceSkeleton === observedSkeleton,
    referenceLabelContained: findExtraText({ reference: referenceLabel, observed: observedLabel }),
    referenceSkeletonContained: findExtraText({ reference: referenceSkeleton, observed: observedSkeleton }),
  };
}

function inspectDomain(input: string): DomainInspection {
  // IDNA can remove invisible characters; capture them before converting the name.
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
    // Convert the full domain: a standalone numeric label is parsed as an IPv4 address by node:url.
    label: domainToUnicode(parts.domain).split('.')[0],
    // Primary scripts are an inventory, not the UTS #39 resolved script set or a risk flag.
    labels: unicode.split('.').map((text) => ({
      text,
      scripts: [...new Set(Array.from(text, primaryScript))].sort(),
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
