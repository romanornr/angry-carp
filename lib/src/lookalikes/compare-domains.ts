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
type Resemblance =
  | { kind: 'confusable_label' }
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
  // References can be hosts, so a sibling under the same registrable domain is not an embedding.
  if (reference.registrableDomain !== observed.registrableDomain) {
    const embedded = embeddedDomain({ reference: reference.registrableDomain, observed: observed.unicode });
    if (embedded) resemblance.push({ kind: 'registrable_domain_embedded', ...embedded });
  }

  return { ...comparison, kind: 'compared', relationship, resemblance };
}

function embeddedDomain({ reference, observed }: { reference: string; observed: string }) {
  // Match the whole reference domain: bare brand labels also appear in tenant hosts such as paypal.zendesk.com.
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
