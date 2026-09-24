# Domain-impersonation mechanisms and remaining gaps

Reviewed 2026-09-24 against repository baseline `6b00947`. The [current contract](../domain-lookalikes.md) implements the result migration and full-domain embedding. Edit matching, extra diacritic folding, and new reference discovery remain proposals. [Reproducible experiments](../../experiments/domain-lookalikes/README.md) retain the generator and evaluation code; generated artifacts stay outside Git.

## What the investigation established

The baseline comparator detects Unicode skeleton equality and label containment. It misses `coinbsae.com` against `coinbase.com`, `paypal.com.attacker.net` against `paypal.com`, and accented forms such as `päypal.com`. Completed synthetic lookups do not compensate: comparator silence can result in `no_concerns_detected`, which skips AI assessment. This verifies current behavior, not a measured phishing false-negative rate or proof of a historical design mistake.

The first increment replaces five redundant or algorithm-specific fields with named observations, migrates consumers, and adds full reference-domain embedding. It preserves registration boundaries, provenance, lookup budgets, and routing policy. Same-registration siblings cannot gain embedding observations. Existing sibling-label concerns remain a [separate policy question](../planning/issues/28-evaluate-sibling-reference-policy.md).

New analysis exports and assessment packets use version 2. Saved version 1 evidence remains renderable without recomputation. The final implementation passed 125 tests, typechecking, and lint. A differential run over the 19,626 generated variants retained all 865 baseline concern matches. That corpus does not generate full-domain embedding in unrelated hosts; dedicated regressions cover it.

## Reuse and source precedents

| Source | Useful precedent | Limits on transfer |
| --- | --- | --- |
| [Chromium `SearchForEmbeddings`](https://github.com/chromium/chromium/blob/fcd1720dfbc767af07055b27f303207fab09c45d/components/lookalikes/core/lookalike_url_util.cc#L1125-L1234) and [`kTargetEmbeddingSeparators`](https://github.com/chromium/chromium/blob/fcd1720dfbc767af07055b27f303207fab09c45d/components/lookalikes/core/lookalike_url_util.cc#L71) | Full-domain target matching with dot/hyphen token boundaries. | Chromium uses popular or engaged sites and exemptions. Our single-reference match is independently implemented, not a port. Bare brand labels also fit legitimate tenant hosts. |
| [Chromium edit and character-swap heuristics](https://github.com/chromium/chromium/blob/fcd1720dfbc767af07055b27f303207fab09c45d/components/lookalikes/core/lookalike_url_util.cc) | Small bounded predicates, separate evidence kinds, and guards against noisy matches. | Global edit-distance matches can record metrics without warning. Applying them to all email reference sources as assessment triggers would be a new local policy. |
| [Chromium skeleton generation](https://github.com/chromium/chromium/blob/fcd1720dfbc767af07055b27f303207fab09c45d/components/url_formatter/spoof_checks/skeleton_generator.cc) | Additional diacritic removal for selected scripts. | This is product policy beyond UTS #39. Removing marks indiscriminately changes meaningful letters in other scripts. Legitimate accented names need controls. |
| [dnstwist at `34139537`](https://github.com/elceef/dnstwist/blob/341395377f40761fe4152f43fd18eea757b6069a/dnstwist.py) | Candidate-generation vocabulary and an offline synthetic corpus. | A Python permutation generator does not replace our pairwise Node comparator. Its subdomain fuzzer inserts a dot inside a brand; it does not enumerate embedded domains in arbitrary attacker names. |
| [UTS #39 revision 34](https://www.unicode.org/reports/tr39/tr39-34.html) | Skeleton comparison and Unicode-version provenance. | It does not define edit distance, target embedding, or a phishing verdict. Our dependency uses pinned Unicode 17 data. |

Keep `tldts`, Node IDNA conversion, and the existing Unicode library. No suitable maintained end-to-end Node replacement was found in this search; that is a search result, not proof that none exists. Neither a new dependency nor lifecycle state was needed for the first increment.

## Corrected mechanism measurements

The six references were Coinbase, PayPal, Ledger, MetaMask, Microsoft, and Binance. dnstwist generated 19,626 variants. All 37 transpositions matched the proposed folded-label-plus-skeleton swap check; skeleton-only checks matched 33 because mappings such as `m` to `rn` change character positions.

The directory experiment compared 6,393,312 ordered pairs of 2,529 distinct registrable domains:

| Rule | Lexical collisions |
| --- | ---: |
| Baseline literal containment | 2,489 |
| Baseline skeleton equality | 184 |
| Baseline skeleton containment only | 57 |
| Additional unguarded single-edit matches | 689 |
| Additional guarded single-edit matches | 71 |
| Additional guarded transposition-only matches | 4 |

The proposed guard measures the folded reference label once, requiring at least five code points. It excludes trailing-digit-only differences and first-character-only changes other than swaps. An earlier script measured each comparison form instead and incorrectly admitted four-letter names such as `meta`, whose skeleton is `rneta`; its count of 79 was corrected to 71. The intended rule did not change.

Embedding evaluation covered 3,364 directory hosts, including additional domains and 44 hyphenated reference registrables. The prototype produced 79 embedding hits, all already covered by another proposed rule. Both names must use consistent dot/hyphen tokenization; the initial draft incorrectly split references only on dots.

These are lexical collisions between listed names, not proven false associations or bounds on mailbox workload. Entries can share brands, and pair counts do not weight messages. The broader single-edit rule trades coverage for additional collisions; it does not dominate transposition-only matching. No numerical acceptance threshold is established. The historical prototype also folds diacritics and drops empty tokens, unlike the narrower shipping embedding rule.

## Papers informing the evaluation

- [Moore and Edelman, FC 2010](https://ifca.ai/pub/fc10/27_89.pdf) excluded short target names when studying typo domains. This supports evaluating domain length, not adopting a universal threshold.
- [Szurdi et al., USENIX Security 2014](https://www.usenix.org/system/files/conference/usenixsecurity14/sec14-paper-szurdi.pdf) describes false positives in lexical-only classification, particularly outside popular domains.
- [Du et al., SecureComm 2019, author manuscript](https://faculty.sites.uci.edu/zhouli/files/2019/07/securecomm19.pdf) studies embedding the complete targeted domain in subdomains. A bare brand label is a different, more ambiguous rule.
- [Reynolds et al., CHI 2020, author manuscript](https://zanema.com/papers/chi20_urlconfusion.pdf) studies users' difficulty interpreting misleading URLs, including expected domains in subdomains. It does not validate this application's assessment policy.

The Chromium and dnstwist source revisions were inspected directly. Context7 supplied tldts, dnstwist, and Node documentation; the installed Unicode package was inspected because Context7 did not index it. Damerau's 1964 full text and the publisher versions of Du and Reynolds were blocked. Author manuscripts supported the latter two references; no secondhand prevalence figure is used here.

## Remaining decisions

- [Evaluate typo and accent observations](../planning/issues/26-evaluate-typo-and-accent-observations.md), with benign controls and results by reference source.
- [Evaluate absent-reference handling](../planning/issues/27-evaluate-reference-coverage.md). Exact skeleton indexing is a bounded candidate, but the 2FA Directory is not Chromium's popularity-ranked list.
- [Evaluate sibling-reference policy](../planning/issues/28-evaluate-sibling-reference-policy.md) without assuming shared registration proves ownership.

Use the accepted evaluation direction in [issue 09](../planning/issues/09-evaluate-phishing-detection-research.md). Measure missed cases, additional assessments, and unsupported conclusions on authorized ordinary and deceptive mail before choosing new default rules. Synthetic mechanism coverage alone is insufficient.
