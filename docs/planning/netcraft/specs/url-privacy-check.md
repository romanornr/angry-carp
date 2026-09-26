# Specification: URL privacy check

Status: frozen for the first build; the builder flags concerns instead of changing it
Decision: [Specify the whole-URL privacy check](../issues/04-specify-whole-url-privacy-check.md), under [ADR 0019](../../../adr/0019-submit-urls-to-netcraft-automatically.md)
Research: [Removing recipient data from phishing URLs](../../../research/url-privacy-sanitization.md)

## Purpose

A pure `lib/` function that turns one phishing URL into a URL that may be disclosed to Netcraft, or withholds it. It removes data identifying the recipient. It is used only for Netcraft threat-feed submission; provider abuse reports keep exact URLs. It performs no network access, no logging and no Netcraft-specific work, so a later scanner integration can reuse it.

Out of scope for this box: redirect unwrapping ([issue 29](../../issues/29-unwrap-redirect-links.md); the caller passes an already unwrapped URL), deriving recipients from a message, the Netcraft client, submission records and any CLI command.

## Interface

Module `lib/src/url-privacy/reduce-url-for-disclosure.ts`, exported as `@angry-carp/checks/url-privacy`.

```ts
export type RecipientIdentity = {
  address: string;          // as found in To or Delivered-To
  displayName?: string;     // from the address header, if any
};

export type UrlCut =
  | { kind: 'userinfo_removed' }
  | { kind: 'query_removed' }
  | { kind: 'fragment_removed' }
  | { kind: 'subdomain_removed'; cause: 'identifier' | 'random' }
  | { kind: 'path_cut'; cause: 'identifier' | 'random'; segmentIndex: number };

export type ReducedUrl =
  | { kind: 'disclosable'; url: string; cuts: readonly UrlCut[] }
  | { kind: 'withheld'; reason: 'invalid_url' | 'unsupported_scheme' | 'identifier_remains' };

export function reduceUrlForDisclosure(url: string, recipients: readonly RecipientIdentity[]): ReducedUrl;
```

Neither result may contain any removed value or identifier; results may be logged or stored.

## Identifiers

Built from `recipients`, compared case-insensitively on percent-decoded text:

- each address as given, lowercased, and its percent-encoded form;
- the local part as a username;
- the full display name, when it has at least two words, matched with its words joined by nothing or by any of `.`, `-`, `_`, `+` or a space. A first name alone is not an identifier.

Ignore identifiers shorter than `MIN_IDENTIFIER_LENGTH` (3). Base64, hex and hashed forms are not searched; the cutting rules remove them.

## Algorithm

1. Parse with the WHATWG `URL`. Withhold `invalid_url` if it throws, `unsupported_scheme` unless the scheme is `http:` or `https:`.
2. Remove userinfo, the query and the fragment unconditionally, recording a cut for each that was present.
3. Split the hostname into the registrable domain and the subdomain labels, using the Public Suffix List including private domains, so tenants such as `name.pages.dev` stay whole. IP literals and hosts without a registrable domain keep their hostname unchanged. If any subdomain label contains an identifier or is random-looking, remove all subdomain labels.
4. Walk the path segments, percent-decoding each repeatedly until stable for matching only. Cut the path before the first segment that contains an identifier or is random-looking; the result ends in `/`.
5. Serialise with the WHATWG `URL`, keeping the scheme, host and port.
6. Final gate: if any identifier still appears in the percent-decoded result, withhold `identifier_remains`.

**Random-looking** (named constants, to be calibrated on sample URLs after the build): a decoded segment or label of at least `RANDOM_MIN_LENGTH` (8) characters drawn from `[A-Za-z0-9_\-=+/.~]` that contains both a letter and a digit, or at least `CASE_CHANGE_MIN` (2) lowercase-to-uppercase transitions; or hex of at least 16 characters; or a UUID; or a run of at least 6 digits. `index.html` and `wp-content` are not random-looking; `xICcxSqs`, base64 of an address and hex of an address are.

## Dependencies

Use a maintained Public Suffix List library such as `tldts` (MIT), pinned to an exact version like the existing dependencies, with its private-domain option. Verify the current version and licence before adding it. No other new dependency.

## Tests

`node:test`, table-driven, beside the module. At least:

- plain, percent-encoded and double-encoded address in the path; address in the query and in the fragment;
- base64 (standard and URL-safe) and hex of the address as a path segment;
- an Evilginx-style lure path (`/xICcxSqs`) and a UUID segment;
- name subdomain (`jane-doe.phish.example`), random subdomain, and a private-suffix tenant (`jane-doe.pages.dev`);
- userinfo containing an address, a port, an IP-literal host and an IDN host;
- nothing left after cutting (`https://host/`), and an identifier in the registrable domain (withheld);
- `index.html` and `wp-content` preserved; `mailto:` withheld;
- a property check that no result string contains any identifier.

## Comments and references

Follow the repository's comment style and [TypeScript style guide](../../../typescript-style.md). Cite each adopted technique above the line it governs with a pinned permalink, after reading the cited source:

- query dropping for encrypted identity: [evilginx2 `http_proxy.go` L1455-L1462](https://github.com/kgretzky/evilginx2/blob/4c0988a1d9db4d172a185e979a38bfd0efdb5830/core/http_proxy.go#L1455-L1462) and its letters-only lure generator [`utils.go` L23-L32](https://github.com/kgretzky/evilginx2/blob/4c0988a1d9db4d172a185e979a38bfd0efdb5830/core/utils.go#L23-L32);
- recipient identifiers in link URLs: [Sublime Security rule L40-L48](https://github.com/sublime-security/sublime-rules/blob/1f95e6d8e2f3153707b451812502741acbb4fe9b/detection-rules/link_url_with_recipient_targeting_and_special_characters.yml#L40-L48);
- why entropy is not used: [detect-secrets L82-L96](https://github.com/Yelp/detect-secrets/blob/5e141933554a0b74e7341841f318be21e895339c/detect_secrets/plugins/high_entropy_strings.py#L82-L96);
- repeated percent-decoding and path prefixes: [Safe Browsing URL canonicalisation](https://developers.google.com/safe-browsing/v4/urls-hashing).
