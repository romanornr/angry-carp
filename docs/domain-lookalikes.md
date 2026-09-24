# Domain lookalike observations

`compareDomains` computes name observations through `@angry-carp/checks/lookalikes`, without network or filesystem access. It does not verify brand ownership or classify phishing.

The [email analyzer](email-analysis.md) calls it with bounded operator references, directory candidates and observed image-host references. Each comparison record retains its reference source. The low-level function still accepts two validated names and does not embed reference provenance itself. Direct callers must retain that context alongside its result.

The analyzer accepts operator references through `referenceDomains`. A directory match and an image host remain unverified candidates; neither becomes an official-domain finding. The former model-selected `compare_domains` binding is retired.

## Results

| Field | Meaning |
| --- | --- |
| `reference`, `observed` | Parsed name details or an explicit interpretation failure. |
| `escapedInput`, `formatCharacters` | Original spelling with invisible/format characters escaped, plus their UTF-16 offsets. Captured before IDNA conversion. |
| `ascii`, `unicode`, `changedByIdna` | Canonical domain forms and whether IDNA maps the input beyond case, one trailing dot, and ordinary punycode decoding. The escaped original remains available for comparison. |
| `registrableDomain`, `label` | Domain boundary and identifying label under the bundled public-suffix list, including its private section. These do not establish actual registration or common ownership. |
| `labels[].scripts` | Primary-script inventory for each Unicode label. `Common`, `Inherited`, and `Unknown` remain visible. |
| `relationship` | Exact canonical name, a subdomain of the reference at a dot boundary, or a different name. None means that a website is safe. |
| `resemblance` | Named observations for `different_domain` comparisons. An empty list means none of these methods matched. Exact names and children of the reference omit the list. |
| `confusable_label` | Equal identifying-label Unicode skeletons. This ignores suffixes and does not compare website content. |
| `label_contained` | First occurrence of the reference label inside a longer observed label. `form` is `literal` or `skeleton`; `prefix` and `suffix` belong to that form. Both forms can match. |
| `registrable_domain_embedded` | First complete reference-domain token sequence inside a longer observed Unicode hostname with a different registrable domain. `text` preserves the matched spelling and separators; `utf16Index` locates it in `observed.unicode`. |
| `confusablesUnicodeVersion` | Unicode version of the confusable mapping data used for that comparison. |

For example, `bifrostwalletapps.download` compared with `bifrostwallet.com` returns `label_contained` in both forms, with prefix `""` and suffix `"apps"`. `applebees.com` compared with `apple.com` also returns containment. That observation alone says nothing about authorization or maliciousness.

`paypal.com.attacker.net` compared with `paypal.com` returns `different_domain`, registrable domain `attacker.net`, and `registrable_domain_embedded` with text `paypal.com` at offset 0. The analyzer turns this attributed observation into a concern requiring assessment. It still queries registration for `attacker.net`, not for the embedded name.

The comparison result replaces `skeletonEqual`, `referenceLabelContained`, and `referenceSkeletonContained` with `resemblance`. Identifying labels remain under `reference.label` and `observed.label`. Full analysis exports and new assessment packets use version 2. Saved version 1 assessment packets remain renderable because their recorded evidence is independent of the comparison representation.

The tool accepts one pair of bare Unicode or punycode domain names. It rejects URL and email-address syntax and limits each input to 1,024 UTF-16 code units. Canonical names must fit DNS hostname syntax and its 253-character limit. Unknown suffixes, IP addresses, and invalid IDNs produce an unavailable comparison, not a negative match. Defanged names need their dots restored before comparison.

## Design and limits

Reviewed 2026-09-22. The implementation pins [`@moderation-api/unicode-spoofing` 0.4.0](https://github.com/moderation-api/unicode-spoofing) and [`tldts` 7.4.14](https://github.com/remusao/tldts). Both use MIT licenses; `tldts-core` is a transitive dependency. Pinning and the lockfile keep data updates deliberate.

The Unicode package supplies `skeleton` and `primaryScript`; its `spoofed` flag and moderation policies are unused. Skeletons use Unicode 17 data. The current [UTS #39 revision 34](https://www.unicode.org/reports/tr39/tr39-34.html) describes Unicode 18, so this is not a claim of current, complete UTS #39 conformance. Script properties depend on the JavaScript runtime and the package's supported-script list. The inventory does not compute Script_Extensions, augmented script sets, restriction levels, or bidirectional display equivalence. `Unknown` means the classifier cannot name that script.

`tldts` locates the identifying label correctly for suffixes such as `co.uk` and private suffixes such as `github.io`. It avoids a last-two-label assumption and a separately maintained suffix table. A suffix-list update can change those boundaries. Node's IDNA conversion supplies ASCII and Unicode forms; original invisible characters are recorded because conversion can remove them.

Literal containment and skeleton containment are separate. The latter catches combinations such as a confusable brand spelling followed by `apps`; neither performs word segmentation or applies a short-name threshold. Short references can match unrelated names, such as `ing.com` inside `booking.com`.

Embedding splits both names on dots and hyphens and compares contiguous runs of token skeletons. The target is the reference's complete registrable domain, including public or private suffix labels. Both `paypal.com.attacker.net` and `paypal-com.attacker.net` match. A bare `paypal` label in `paypal.zendesk.com` does not. Hyphenated references use the same tokenization on both sides. Repeated separators retain empty tokens, so `paypal--com.attacker.net` does not match `paypal.com`. Only the first match is recorded, with offsets into the canonical Unicode hostname rather than the original or punycode input.

Matching the entire observed hostname is not embedding: `t.mobile.com` against `t-mobile.com` remains outside this rule. Names sharing a registrable domain also do not produce embedding observations. Relationship classification still compares full hostnames, so siblings such as `images.paypal.com` and `www.paypal.com` retain the existing `different_domain` relationship and `confusable_label` observation. Changing that attention policy requires a separate decision.

The design references are Chromium's [`SearchForEmbeddings`](https://github.com/chromium/chromium/blob/fcd1720dfbc767af07055b27f303207fab09c45d/components/lookalikes/core/lookalike_url_util.cc#L1125-L1234) and its dot/hyphen [`kTargetEmbeddingSeparators`](https://github.com/chromium/chromium/blob/fcd1720dfbc767af07055b27f303207fab09c45d/components/lookalikes/core/lookalike_url_util.cc#L71). Our single-reference token-run match is independently implemented. It does not port Chromium's sweep over popular or engaged sites, exemptions, or warning policy. Full embedded domains in legitimate CDN or storage names can still require assessment. Registration boundaries and reference provenance remain independent of resemblance.

There is no edit-distance check, additional diacritic folding, embedded bare-brand scan, or automatic reference discovery in this comparator. `coinbsae.com`, `päypal.com`, and `paypal.attacker.net` remain outside these methods for a `coinbase.com` or `paypal.com` reference as appropriate. Missing references remain informational in assessment routing. No match means only that these particular comparisons found no match.

The [domain-impersonation research](research/domain-impersonation.md) preserves the upstream comparisons, corrected experiment, and remaining evaluation tickets. Its broader prototype rules are not the shipping implementation.

The core imports `node:url` for IDNA conversion. [Cloudflare Workers documents these functions](https://developers.cloudflare.com/workers/runtime-apis/nodejs/url/) with Node compatibility. The dependencies bundle without additional Node built-ins; actual Workers execution remains untested. No deployment or credential-storage changes are included.

## Verification

From the repository root:

```sh
node --test lib/src/lookalikes/compare-domains.test.ts
npm run check:types
```

The tests use the real libraries and synthetic names. They cover Cyrillic and ASCII lookalikes, whole-script matches, public/private suffixes, exact/subdomain boundaries, embedded domains, hyphenated references, tenant controls, invisible characters, valid multilingual names, unknown scripts, and malformed input. Analyzer tests verify that embedding reaches assessment with completed synthetic DNS/RDAP lookups, attributed findings, and the original registration target. They verify the mechanism, not real-world phishing detection accuracy. Earlier [Unicode experiments](research/unicode-confusable-evaluation.md) and [detection research](research/phishing-detection-methods.md) explain the broader evaluation needs.
