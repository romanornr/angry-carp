# Domain lookalike observations

`compareDomains` computes name observations through `@angry-carp/checks/lookalikes`, without network or filesystem access. It does not verify brand ownership or classify phishing.

The [email analyzer](email-analysis.md) calls it with bounded operator references, directory candidates and observed image-host references. Each comparison record retains its reference source. The low-level function still accepts two validated names and does not embed reference provenance itself. Direct callers must retain that context alongside its result.

The analyzer accepts operator references through `referenceDomains`, exposed by both analysis commands as repeatable `--reference-domain`. Use only targets the operator explicitly supplied, never names inferred from the message. A directory match and an image host remain unverified candidates; neither becomes an official-domain finding. The former model-selected `compare_domains` binding is retired.

## Results

| Field | Meaning |
| --- | --- |
| `reference`, `observed` | Parsed name details or an explicit interpretation failure. |
| `escapedInput`, `formatCharacters` | Original spelling with invisible/format characters escaped, plus their UTF-16 offsets. Captured before IDNA conversion. |
| `ascii`, `unicode`, `changedByIdna` | Canonical domain forms and whether IDNA maps the input beyond case, one trailing dot, and ordinary punycode decoding. The escaped original remains available for comparison. |
| `registrableDomain`, `label` | Domain boundary and identifying label under the bundled public-suffix list, including its private section. These do not establish actual registration or common ownership. |
| `labels[].scripts` | Primary-script inventory for each Unicode label. `Common`, `Inherited`, and `Unknown` remain visible. |
| `labels[].scriptMixing` | `single_script`, `allowed_mixture`, `mixed_script`, or `unavailable`, using the script-combination portion of ICU's highly restrictive policy. |
| `scriptUnicodeVersion` | Runtime Unicode-property version, or `null` if the runtime does not expose it. Separate from the skeleton mapping version. |
| `relationship` | Exact canonical name, a subdomain of the reference at a dot boundary, or a different name. None means that a website is safe. |
| `resemblance` | Named observations for `different_domain` comparisons. An empty list means none of these methods matched. Exact names and children of the reference omit the list. |
| `folded_label` | Equal label skeletons after Latin/Greek/Cyrillic diacritic folding, when the original skeletons differ. |
| `character_swap` | Exactly one adjacent character swap in `folded` labels or their `skeleton` forms. The folded reference label must have at least five code points. |
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

The Unicode package supplies `skeleton` and `primaryScript`; its `spoofed` flag and moderation policies are unused. Skeletons use Unicode 17 data. The current [UTS #39 revision 34](https://www.unicode.org/reports/tr39/tr39-34.html) describes Unicode 18, so this is not a claim of current, complete UTS #39 conformance. Script properties depend on the JavaScript runtime and the package's supported-script list. The primary-script inventory itself does not compute Script_Extensions, augmented script sets, restriction levels, or bidirectional display equivalence. The separate `scriptMixing` check described below uses Script_Extensions. `Unknown` means the classifier cannot name that script.

`tldts` locates the identifying label correctly for suffixes such as `co.uk` and private suffixes such as `github.io`. It avoids a last-two-label assumption and a separately maintained suffix table. A suffix-list update can change those boundaries. Node's IDNA conversion supplies ASCII and Unicode forms; original invisible characters are recorded because conversion can remove them.

Literal containment and skeleton containment are separate. The latter catches combinations such as a confusable brand spelling followed by `apps`; neither performs word segmentation or applies a short-name threshold. Short references can match unrelated names, such as `ing.com` inside `booking.com`.

Embedding splits both names on dots and hyphens and compares contiguous runs of token skeletons. The target is the reference's complete registrable domain, including public or private suffix labels. Both `paypal.com.attacker.net` and `paypal-com.attacker.net` match. A bare `paypal` label in `paypal.zendesk.com` does not. Hyphenated references use the same tokenization on both sides. Repeated separators retain empty tokens, so `paypal--com.attacker.net` does not match `paypal.com`. Only the first match is recorded, with offsets into the canonical Unicode hostname rather than the original or punycode input.

Matching the entire observed hostname is not embedding: `t.mobile.com` against `t-mobile.com` remains outside this rule. Names sharing a registrable domain also do not produce embedding observations. Relationship classification still compares full hostnames, so siblings such as `images.paypal.com` and `www.paypal.com` retain the existing `different_domain` relationship and `confusable_label` observation. Changing that attention policy requires a separate decision.

The design references are Chromium's [`SearchForEmbeddings`](https://github.com/chromium/chromium/blob/fcd1720dfbc767af07055b27f303207fab09c45d/components/lookalikes/core/lookalike_url_util.cc#L1125-L1234) and its dot/hyphen [`kTargetEmbeddingSeparators`](https://github.com/chromium/chromium/blob/fcd1720dfbc767af07055b27f303207fab09c45d/components/lookalikes/core/lookalike_url_util.cc#L71). Our single-reference token-run match is independently implemented. It does not port Chromium's sweep over popular or engaged sites, exemptions, or warning policy. Full embedded domains in legitimate CDN or storage names can still require assessment. Registration boundaries and reference provenance remain independent of resemblance.

`coinbsae.com` against `coinbase.com` produces `character_swap`; `päypal.com` against `paypal.com` produces `folded_label`. Both require different registrable domains. Folding applies NFD, removes nonspacing marks, restores NFC, and maps `ł`, `ø`, and `đ` to `l`, `o`, and `d`. It runs only on decomposed labels made of Latin, Greek, or Cyrillic characters, nonspacing marks, ASCII digits, and hyphens. This catches mixed-script accented names such as `pаypäl.com` against `paypal.com`. Unlike Chromium, it retains all nonspacing marks in eligibility, including U+033A and U+1AB0, so existing matches are not lost. It applies the same transformation to eligible labels. Other labels remain unchanged. Folding does not expand containment or embedding. Swap matching checks the folded spelling first, then its skeleton, because skeleton expansions such as `m` to `rn` can hide swaps. It uses code points, accepts first-character and digit swaps, and does not compute general edit distance.

The analyzer makes these two new kinds concerns only for operator references. For directory or image references they remain observations, which neither trigger assessment nor justify registrar reporting candidates alone. Existing resemblance kinds retain their concern policy. Supplying `referenceDomains` opts into this additional attention; it does not verify those domains. This is a local policy informed by Chromium and [Sublime's organization-domain rule](https://github.com/sublime-security/sublime-rules/blob/3f2b9a7f670ad1782575aca0516e91ec0ee155fc/detection-rules/lookalike_sender_domain.yml). Sublime also checks sender history and authentication, which we do not reproduce.

`inspectDomain`, exported with `domainNameSchema` through the same package entry, inspects one validated name without a reference. Comparisons and independent findings share its IDNA conversion and label boundaries.

The script check follows ICU's [augmented-set intersection and Latin-excluding intersection](https://github.com/unicode-org/icu/blob/049e0d6a420629ac7db77256987d083a563287b5/icu4c/source/i18n/uspoof_impl.cpp#L238-L372). It uses JavaScript Script_Extensions properties and Unicode 17 script names from [`unicode-property-value-aliases-ecmascript` 2.2.1](https://github.com/mathiasbynens/unicode-property-value-aliases-ecmascript/blob/8ba88a915d394c4738fdf0582a2aa7bf5c6fe47f/index.js). This MIT-licensed, data-only dependency has no runtime dependencies. Its complete script-name list avoids treating scripts missing from the existing primary-script inventory as harmless. Character membership still comes from the runtime. Unsupported characters yield `unavailable`, not a negative result.

`single_script` means the augmented script sets have a nonempty intersection. Common and Inherited Script_Extensions impose no restriction. Han with kana, Hangul, or Bopomofo resolves to a shared writing system. `allowed_mixture` permits those combinations with Latin. Other mixtures produce `mixed_script`, including Latin/Cyrillic, Latin/Greek, and Latin/Armenian. These are the script-combination checks used by Chromium's highly restrictive policy. This is not a full restriction-level result: the identifier profile, contextual character checks, mixed numerals, and browser display decisions are not implemented. The algorithm follows the inspected ICU implementation and Unicode 17 policy, without Unicode 18's additional Hntl set.

The analyzer inspects every recorded host independently of comparison references and their budget. It checks labels separately, so `café.пример.com` is not a mixed-label finding. A `mixed_script_label` finding on an unmarked non-image occurrence requests assessment. Images, quoted text, and embedded-message occurrences remain informational. The finding cites its host occurrence and reaches the model projection and rendered assessment evidence. Mixing alone neither establishes deception nor qualifies reporting recipients. Unknown script interpretation becomes a `script_mixing_unavailable` coverage note. Existing host and finding limits still apply.

There is no general edit-distance check, embedded bare-brand scan, or automatic reference discovery. `paypal.attacker.net` remains outside these methods for `paypal.com`. Missing references remain informational in assessment routing. No match means only that these particular comparisons found no match.

The [domain-impersonation research](research/domain-impersonation.md) preserves the upstream comparisons, corrected experiment, and remaining evaluation tickets. Its broader prototype rules are not the shipping implementation.

The core imports `node:url` for IDNA conversion. [Cloudflare Workers documents these functions](https://developers.cloudflare.com/workers/runtime-apis/nodejs/url/) with Node compatibility. The dependencies bundle without additional Node built-ins; actual Workers execution remains untested. No deployment or credential-storage changes are included.

## Verification

From the repository root:

```sh
node --test lib/src/lookalikes/compare-domains.test.ts
npm run check:types
```

The tests use the real libraries and synthetic names. A separate differential experiment compared 4,608 script classifications against ICU 78.3 with its allowed-character profile disabled; all agreed. This tests the script-combination algorithm, not full Chromium equivalence. They cover Cyrillic and ASCII lookalikes, whole-script matches, public/private suffixes, exact/subdomain boundaries, embedded domains, hyphenated references, tenant controls, invisible characters, valid multilingual names, unknown scripts, and malformed input. Analyzer tests verify that embedding reaches assessment with completed synthetic DNS/RDAP lookups, attributed findings, and the original registration target. They verify the mechanism, not real-world phishing detection accuracy. Earlier [Unicode experiments](research/unicode-confusable-evaluation.md) and [detection research](research/phishing-detection-methods.md) explain the broader evaluation needs.
