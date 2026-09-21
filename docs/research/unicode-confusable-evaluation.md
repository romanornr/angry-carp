# Unicode confusable detection for Angry Carp

Evaluated 2026-09-21. Recommendation: use standard Unicode comparisons as explainable local observations, alongside other evidence. Do not use a confusable match as a phishing verdict.

## What the standard provides

UTS #39 defines comparison representations called skeletons, script checks, and direction-aware confusability. Equal skeletons indicate potentially confusable strings, including some entirely ASCII pairs. A match does not establish impersonation. The standard acknowledges over-inclusive matches and legitimate mixed-script text. Its email profile distinguishes display names, local parts, and domains. Display names can legitimately contain mixed scripts and emoji. [Unicode UTS #39](https://www.unicode.org/reports/tr39/tr39-34.html)

Skeletons are internal comparison values, not replacement addresses, display text, or stable identifiers across Unicode versions. Preserve the exact source separately and record the comparison's data version. The current standard reviewed is Unicode 18.0, revision 34. [Unicode UTS #39](https://www.unicode.org/reports/tr39/tr39-34.html)

ICU supplies pairwise comparison, skeleton generation, and configurable identifier checks. These operations serve different purposes. A single-string check is not a comparison against a claimed brand. ICU's API also provides direction-aware comparisons. Use the selected release's actual behavior and test data rather than treating a function name as a complete security contract. [ICU API](https://unicode-org.github.io/icu-docs/apidoc/released/icu4c/uspoof_8h.html), [ICU direction-aware API](https://unicode-org.github.io/icu-docs/apidoc/dev/icu4c/uspoof_8h.html)

## Offline experiment

Ran the already-installed ICU 78.3 with Unicode 17.0 data against 13 synthetic string pairs. No packages, mail, threat datasets, or network resources were required by the experiment. This is a mechanism check, not an accuracy benchmark or a claim of conformance to Unicode 18.0.

The [probe source](../../experiments/unicode-confusables/unicode-probe.cpp) compares ICU NFKC casefold, ordinary skeletons, and left-to-right bidi skeletons. It also records pairwise flags, selected identifier checks, and explicit default-ignorable and bidi-control properties. The [results](../../experiments/unicode-confusables/unicode-probe-results.json) record versions, the source hash, and escaped input strings.

| Synthetic comparison | NFKC casefold equal | Ordinary skeleton equal | LTR bidi skeleton equal | Implication |
| --- | --- | --- | --- | --- |
| `paypal` versus a spelling with Cyrillic `a` | No | Yes | Yes | Normalization alone misses this lookalike. |
| `DHL` versus Cherokee D/L and Cyrillic H lookalikes | No | Yes | Yes | Standard comparison recognizes the article's example. |
| `scope` versus its all-Cyrillic lookalike | No | Yes | Yes | A single-script candidate can still impersonate another script. |
| `m` versus `rn` | No | Yes | Yes | Pure ASCII also produces confusable pairs. |
| `DHL` versus `Invoice Team` | No | No | No | The published regex's counterexample does not match here. |
| `paypal` versus an inserted zero-width space | Yes | Yes | Yes | Preserve and explain the invisible character before comparison. |
| `DHL` versus fullwidth DHL | Yes | No | No | Normalized text and skeleton comparison offer different observations. |
| `DHL` versus `dhl` | Yes | No | No | Case-insensitive matching must be an explicit choice. |
| `paypal` versus a bidi-control insertion | Yes | Yes | No | Discarding controls before considering display direction changes the result. |

Other observations from the recorded run: the accented-name and Japanese/Latin examples passed the selected identifier checks. The whole-Cyrillic lookalike also passed those checks despite its brand comparison matching. Zero-width and bidi-control insertions returned no identifier-check flags in this configuration; explicit character-property checks exposed them. Mixed numbering systems triggered the number-system check. An identical ASCII pair also returned a confusable flag, so a nonzero pairwise result is not itself an anomaly.

Reproduce from the repository root with an installed C++ compiler and ICU development files:

```sh
c++ -std=c++17 experiments/unicode-confusables/unicode-probe.cpp -o /tmp/angry-carp-unicode-probe $(pkg-config --cflags --libs icu-i18n icu-uc)
/tmp/angry-carp-unicode-probe > /tmp/angry-carp-unicode-probe.tsv
```

The program reports library and data versions on stderr. Its TSV contains deliberate invisible and direction-control characters, so inspect escaped representations rather than rendering the raw candidate column in an operator interface. Results can differ with another ICU or Unicode version. The committed JSON is the recorded run, not a promise about later versions.

## Proposed integration

These are design recommendations based on the experiment, not implemented product behavior:

1. Decode mail with an established MIME and address parser. Keep raw evidence and parse errors. Analyze display name, sender address, and literal URL host as distinct fields.
2. Record control characters before producing comparison forms. Preserve code points and source locations so an analyst can explain an observation without trusting its visual appearance.
3. Compare bounded candidate names or tokens against identified brand references. Avoid comparing every arbitrary substring to every brand. Token selection, case handling, and segmentation need multilingual evaluation.
4. Keep exact, normalized, and visual matches separate. Use the library's script semantics rather than rejecting any name containing more than one script. Do not use a display-name restriction profile as a universal rule for people's names.
5. Parse domain and URL structure before brand comparisons. A brand-looking subdomain is different from the registrable domain. Preserve IDN spelling and its ASCII encoding. Confusable text is never the destination to resolve, scan, or report in place of the original.
6. Return observations with input references, comparison target, method, and version. A downstream assessment must consider the message's request, authenticated identities, and contrary evidence before assigning confidence.

ICU is a demonstrated reference implementation here, not a selected production dependency or a reason to choose C++. Evaluate libraries in the eventual implementation language against the same fixtures, Unicode version coverage, bidi behavior, maintenance, and deployment cost. A package that only ships a confusables table may not implement the complete standard.

The next evaluation should include Dutch and multilingual legitimate names, quoted phishing examples, authorized delivery intermediaries, unknown brands, display-name token boundaries, malformed encodings, and IDN domains. Measure false alerts and missed lookalikes separately from phishing classification. These synthetic examples establish mechanism behavior only.
