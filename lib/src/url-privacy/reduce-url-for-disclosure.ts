/**
 * Reduces an already unwrapped phishing URL before disclosure to a threat-feed service.
 * This pure check owns URL privacy policy, without fetching, logging, or submitting anything.
 * Provider abuse reports retain their original URLs and do not use this reduction.
 *
 * Steps:
 * 1. Parse an HTTP(S) URL and remove userinfo, query, and fragment.
 * 2. Remove identifying or token-like subdomains without crossing a private suffix boundary.
 * 3. Cut the path before its first identifying or token-like segment.
 * 4. Withhold the result if a recipient identifier survives anywhere in the serialized URL.
 *
 * Decoding is for matching only. Retained path segments keep their original escapes.
 * Token detection is a heuristic, not a guarantee that all encoded identities are removed.
 * See docs/planning/netcraft/specs/url-privacy-check.md for the frozen first-build policy.
 */
import { parse } from 'tldts';
import { recursiveUnescape } from './recursive-unescape.ts';

export type RecipientIdentity = { address: string; displayName?: string };

export type UrlCut =
  | { kind: 'userinfo_removed' }
  | { kind: 'query_removed' }
  | { kind: 'fragment_removed' }
  | { kind: 'subdomain_removed'; cause: 'identifier' | 'random' }
  | { kind: 'path_cut'; cause: 'identifier' | 'random'; segmentIndex: number };

export type ReducedUrl =
  | { kind: 'disclosable'; url: string; cuts: readonly UrlCut[] }
  | { kind: 'withheld'; reason: 'invalid_url' | 'unsupported_scheme' | 'identifier_remains' };

const MIN_IDENTIFIER_LENGTH = 3;
const RANDOM_MIN_LENGTH = 8;
const CASE_CHANGE_MIN = 2;
const HEX_MIN_LENGTH = 16;
const DIGIT_RUN_MIN = 6;
const hexToken = new RegExp(`^[a-f0-9]{${HEX_MIN_LENGTH},}$`, 'i');
const digitRun = new RegExp(`[0-9]{${DIGIT_RUN_MIN},}`);

/**
 * Recipients come from the caller's parsed message; redirect unwrapping must already be complete.
 * Cuts contain no removed values. Path indices are zero-based after the leading slash,
 * counting empty segments between repeated slashes.
 */
export function reduceUrlForDisclosure(input: string, recipients: readonly RecipientIdentity[]): ReducedUrl {
  let url: URL;

  try {
    url = new URL(input);
  } catch {
    return { kind: 'withheld', reason: 'invalid_url' };
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return { kind: 'withheld', reason: 'unsupported_scheme' };
  }

  const cuts: UrlCut[] = [];

  if (url.username || url.password) {
    url.username = '';
    url.password = '';
    cuts.push({ kind: 'userinfo_removed' });
  }

  // Evilginx's extractParams decrypts arbitrary query values into session parameters.
  // Drop the whole query because recognizing parameter names or plaintext cannot cover this.
  // https://github.com/kgretzky/evilginx2/blob/4c0988a1d9db4d172a185e979a38bfd0efdb5830/core/http_proxy.go#L1371-L1401
  // href also exposes empty query/fragment delimiters, which search/hash omit.
  const queryStart = url.href.indexOf('?');
  const fragmentStart = url.href.indexOf('#');
  if (queryStart >= 0 && (fragmentStart < 0 || queryStart < fragmentStart)) cuts.push({ kind: 'query_removed' });
  if (fragmentStart >= 0) cuts.push({ kind: 'fragment_removed' });
  url.search = '';
  url.hash = '';

  const identifiers = recipientIdentifiers(recipients);
  // Use tldts's PSL lookup, including PRIVATE rules, so removing subdomains preserves tenants.
  // Its parse API returns a fresh result rather than the shared object used by its shortcuts.
  // https://github.com/remusao/tldts/blob/637f6f397789e2c7b4deda669fccae278f3124c1/packages/tldts/index.ts#L11-L19
  // https://github.com/remusao/tldts/blob/637f6f397789e2c7b4deda669fccae278f3124c1/packages/tldts/src/suffix-trie.ts#L182-L208
  const { domain, subdomain } = parse(url.hostname, { allowPrivateDomains: true });

  if (domain && subdomain) {
    for (const label of subdomain.split('.')) {
      const cause = cutCause(label, identifiers);
      if (cause === null) continue;
      if (url.hostname.endsWith('.')) url.hostname = `${domain}.`;
      else url.hostname = domain;
      cuts.push({ kind: 'subdomain_removed', cause });
      break;
    }
  }

  const segments = url.pathname.slice(1).split('/');

  for (const [segmentIndex, segment] of segments.entries()) {
    const cause = cutCause(segment, identifiers);
    if (cause === null) continue;
    // Safe Browsing uses slash-terminated path prefixes as lookup expressions.
    // We retain one such prefix; this does not assert equivalent matching in Netcraft.
    // https://github.com/google/safebrowsing/blob/bbf0d20d26b32d99fd21664677fe31ee9f0f66e3/urls.go#L469-L502
    url.pathname = [''].concat(segments.slice(0, segmentIndex), '').join('/');
    cuts.push({ kind: 'path_cut', cause, segmentIndex });
    break;
  }

  if (containsIdentifier(recursiveUnescape(url.href), identifiers)) {
    return { kind: 'withheld', reason: 'identifier_remains' };
  }

  return { kind: 'disclosable', url: url.href, cuts };
}

// Sublime matches the recipient's own address in URL paths, including decoded base64.
// Here the policy adds usernames and full names; encoded tokens use the separate cutting rule.
// https://github.com/sublime-security/sublime-rules/blob/1f95e6d8e2f3153707b451812502741acbb4fe9b/detection-rules/link_url_with_recipient_targeting_and_special_characters.yml#L40-L48
function recipientIdentifiers(recipients: readonly RecipientIdentity[]) {
  const literals = new Set<string>();
  const fullNames = new Set<string>();

  for (const recipient of recipients) {
    const address = recursiveUnescape(recipient.address).toLowerCase();
    const at = address.lastIndexOf('@');
    const username = address.slice(0, at);

    for (const identifier of [address, username]) {
      if (identifier.length >= MIN_IDENTIFIER_LENGTH) literals.add(identifier);
    }

    const words = recursiveUnescape(recipient.displayName ?? '').toLowerCase().trim().split(/\s+/u);

    if (words.length >= 2 && words.join('').length >= MIN_IDENTIFIER_LENGTH) {
      fullNames.add(words.map((word) => RegExp.escape(word)).join('[.\\-_+ ]?'));
    }
  }

  return { literals: [...literals], fullNames: [...fullNames].map((pattern) => new RegExp(pattern, 'u')) };
}

// Sublime's strings.icontains is a literal, case-insensitive substring check.
// Full-name separators are the only part of our policy that needs regular expressions.
// https://github.com/sublime-security/sublime-rules/blob/1f95e6d8e2f3153707b451812502741acbb4fe9b/detection-rules/link_url_with_recipient_targeting_and_special_characters.yml#L40-L48
function containsIdentifier(decoded: string, identifiers: ReturnType<typeof recipientIdentifiers>): boolean {
  const lower = decoded.toLowerCase();

  return identifiers.literals.some((identifier) => lower.includes(identifier))
    || identifiers.fullNames.some((pattern) => pattern.test(lower));
}

function cutCause(value: string, identifiers: ReturnType<typeof recipientIdentifiers>): 'identifier' | 'random' | null {
  const decoded = recursiveUnescape(value);
  if (containsIdentifier(decoded, identifiers)) return 'identifier';
  if (isRandomLooking(decoded)) return 'random';
  return null;
}

function isRandomLooking(value: string): boolean {
  if (hexToken.test(value) || digitRun.test(value) || /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(value)) return true;
  if (value.length < RANDOM_MIN_LENGTH || !/^[A-Za-z0-9_\-=+/.~]+$/.test(value)) return false;
  if (/[a-z]/i.test(value) && /[0-9]/.test(value)) return true;
  // Evilginx's GenRandomString uses letters alone, so digit mixing misses its lure paths.
  // https://github.com/kgretzky/evilginx2/blob/4c0988a1d9db4d172a185e979a38bfd0efdb5830/core/utils.go#L23-L32
  // The case-transition threshold is project policy. detect-secrets uses Shannon entropy,
  // whose length-dependent ceiling makes it unsuitable for these short tokens.
  // https://github.com/Yelp/detect-secrets/blob/5e141933554a0b74e7341841f318be21e895339c/detect_secrets/plugins/high_entropy_strings.py#L82-L96
  return (value.match(/[a-z][A-Z]/g)?.length ?? 0) >= CASE_CHANGE_MIN;
}
