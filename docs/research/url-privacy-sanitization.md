# Removing recipient data from phishing URLs

Researched 2026-09-26 for [the whole-URL privacy check](../planning/netcraft/issues/04-specify-whole-url-privacy-check.md). Read-only; projects are pinned to the commits read. For this check a false positive costs a shorter URL and a false negative leaks personal data, so it should lean towards cutting.

## Findings

- **Tracking-parameter lists do not detect phishing tokens.** [ClearURLs rules](https://github.com/ClearURLs/Rules/blob/11086f40512774dcadef54079f1ba023bfacf940/data.min.json) (LGPL-3.0), Firefox's `query-stripping` list, [AdGuard filters](https://github.com/AdguardTeam/AdguardFilters/tree/ca50c4d76167c817919ab81cdadf8dceb656441e) (GPL-3.0), [Brave's lists](https://github.com/brave/adblock-lists/tree/de05097915c8971292b8598e72aca14644da23c2/brave-lists) (MPL-2.0) and Neat URL remove named query parameters, which dropping the whole query already covers. Their useful idea is redirect unwrapping (ClearURLs `redirections`, Brave `debounce.json`): dropping the query of `google.com/url?q=<phish>` would otherwise discard the target.
- **Entropy scoring fails at URL lengths.** A string of length n cannot exceed log2(n) bits. base64 of `jane.doe@example.com` scores 4.11, below [detect-secrets](https://github.com/Yelp/detect-secrets/blob/5e141933554a0b74e7341841f318be21e895339c/detect_secrets/plugins/high_entropy_strings.py#L82-L96)' 4.5 threshold. An Evilginx lure such as `xICcxSqs` scores 2.75, below `index.html` at 3.32. [gitleaks](https://github.com/gitleaks/gitleaks/blob/b58d3f102cf3a2c84cb7f923d05c25c9b1aed84b/detect/utils.go#L117-L134) and TruffleHog tune for fewer false positives, the wrong direction here.
- **Email-security rules search for the recipient's own address in encoded forms.** [Sublime Security rules](https://github.com/sublime-security/sublime-rules/blob/1f95e6d8e2f3153707b451812502741acbb4fe9b/detection-rules/link_url_with_recipient_targeting_and_special_characters.yml#L40-L48) (MIT) match recipient addresses in link paths, decode base64 runs and hex fragments, and fall back to the recipient domain when dots are dropped. YARA's [base64 modifier](https://yara.readthedocs.io/en/stable/writingrules.html) encodes the needle at three byte offsets and trims context-dependent edges, as [Lee Holmes describes](https://www.leeholmes.com/searching-for-content-in-base-64-strings/); a local check found the address at every alignment in both alphabets.
- **Hashed addresses follow normalisation conventions.** [UID2](https://unifiedid.com/docs/getting-started/gs-normalization-encoding) and [Google Customer Match](https://support.google.com/google-ads/answer/7474263) trim and lowercase, remove Gmail dots, then hash with SHA-256. Use of md5 or sha1 in kit URLs is unsourced.
- **Some identity cannot be decoded.** Evilginx encrypts `email` and `name` into one randomly named query parameter ([evilginx2@4c0988a1 `http_proxy.go` L1455-L1462](https://github.com/kgretzky/evilginx2/blob/4c0988a1d9db4d172a185e979a38bfd0efdb5830/core/http_proxy.go#L1455-L1462)); only dropping the query protects it. Its default lure path is eight letters with no digits ([`utils.go` L23-L32](https://github.com/kgretzky/evilginx2/blob/4c0988a1d9db4d172a185e979a38bfd0efdb5830/core/utils.go#L23-L32)).
- **Shortening will often yield "no threats".** Token-gated kits redirect requests without a valid token to harmless pages ([Kondracki et al., CCS 2021](https://catching-transparent-phish.github.io/catching_transparent_phish.pdf) §3.2), and per-recipient subdomains evade blocklists ([Oest et al., eCrime 2018](https://adamdoupe.com/publications/ecrime2018_phishers_mind_oest.pdf) §IV). No study measures the effect of stripping tokens on blocklisting.
- **Prefix matching may preserve coverage.** [Safe Browsing canonicalisation](https://developers.google.com/safe-browsing/v4/urls-hashing) looks up host suffixes and path prefixes, so a shortened URL is one of the original's lookup expressions. Whether Netcraft's feeds match by prefix, exactly or by domain is unknown.
- **Scanners leave redaction to submitters.** [urlscan.io](https://urlscan.io/docs/api/) asks submitters to remove PII from URLs or restrict visibility, VirusTotal asks for no personal information, and [SpamCop](https://www.spamcop.net/fom-serve/cache/283.html) permits munging one's own address in links. Munging keeps the URL shape but changes evidence and cannot handle hashed or encrypted tokens.

## Proposed algorithm

Not adopted; the privacy-check ticket decides.

1. Unwrap known redirectors such as Safe Links and `google.com/url?q=`.
2. Parse with the WHATWG `URL`, percent-decode until stable, lowercase the host and convert IDNs to punycode.
3. Build identifiers from the message's `To`, `Delivered-To`, display names and local-parts: each address as written and normalised, percent-encoded, hex, base64 in both alphabets at three offsets, and md5, sha1 and sha256 digests in hex and base64. Add name and local-part tokens of at least three characters, matched case-insensitively.
4. Drop the query and fragment unconditionally.
5. Remove hostname labels left of the registrable domain that match an identifier or look like a token, using the Public Suffix List with private domains, for example [tldts](https://github.com/remusao/tldts) (MIT).
6. Cut the path before the first segment that contains an identifier, including after one whole-segment base64 or hex decode, or that looks like a token: at least eight characters with mixed character classes, hex of at least 16, a UUID, or at least six digits.
7. Fall back to `https://host/` when nothing remains.
8. Run the identifier search over the final URL and do not submit if anything still matches.
9. Store the exact submitted URL with a reason code for each cut. Record a later "no threats" as a probable cloaking outcome, not a false report.

## Unknowns

- Netcraft's matching semantics, and whether it unwraps redirects itself.
- Whether a "no threats" result on a host root suppresses later reports of that host.
- The false-positive rate of the token heuristic on real phishing paths; measure it on sample URLs before freezing.
- Thresholds for short or common names.
