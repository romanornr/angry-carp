# Chromium spoof-check comparison

Reviewed 2026-09-26 against Angry Carp `4d7b6e1` and Chromium
`fcd1720dfbc767af07055b27f303207fab09c45d`. This investigation changes no detector
behavior. The [current contract](../domain-lookalikes.md) deliberately implements
Latin-only folding. That restriction misses mixed-script accented lookalikes such
as `pаypäl.com`, where the second character is Cyrillic U+0430.

## Source inspected locally

A shallow, filtered Chromium clone is at `/tmp/angry-carp-chromium-source`, checked
out at the revision above. Its sparse checkout includes `components/url_formatter`,
`components/lookalikes`, and `base/i18n`. The implementation, headers, callers,
initialization, cleanup, and unit tests were read together. This is source inspection
and a small ICU experiment, not a Chromium build or execution of its browser tests.

The relevant upstream entry points are
[`MaybeRemoveDiacritics` and `GetSkeletons`](https://github.com/chromium/chromium/blob/fcd1720dfbc767af07055b27f303207fab09c45d/components/url_formatter/spoof_checks/skeleton_generator.cc#L160-L238),
[`SafeToDisplayAsUnicode`](https://github.com/chromium/chromium/blob/fcd1720dfbc767af07055b27f303207fab09c45d/components/url_formatter/spoof_checks/idn_spoof_checker.cc#L370-L461),
and [`GetDomainInfo`](https://github.com/chromium/chromium/blob/fcd1720dfbc767af07055b27f303207fab09c45d/components/lookalikes/core/lookalike_url_util.cc#L806-L846).
These are distinct operations. Display safety does not require a reference domain.
Resemblance matching does.

## Folding differs before the transformation

Chromium's [eligibility set and transformation](https://github.com/chromium/chromium/blob/fcd1720dfbc767af07055b27f303207fab09c45d/components/url_formatter/spoof_checks/skeleton_generator.cc#L52-L73)
accept Latin, Greek, Cyrillic, ASCII digits, dot, underscore, hyphen, and combining
characters U+0300 through U+0339. It checks the original hostname after stripping
one trailing dot. Only then does it apply NFD, remove nonspacing marks, restore NFC,
and map `ł`, `ø`, and `đ` to `l`, `o`, and `d`.

Angry Carp's [helper](../../lib/src/lookalikes/compare-domains.ts) decomposes first,
accepts Latin and every nonspacing mark, and receives only the identifying label.
Its transformation matches the sequence above, but its eligibility and input scope
do not. Expanding script eligibility affects both `folded_label` and
`character_swap`, since they share the folded inputs.

Executed examples establish the difference:

| Reference / observed name | Current Angry Carp result | Upstream-rule experiment |
| --- | --- | --- |
| `paypal.com` / `päypal.com` | `folded_label` | Folded label skeleton is `paypal`. |
| `paypal.com` / `pаypal.com` | `confusable_label` | Label skeleton is `paypal`. |
| `paypal.com` / `pаypäl.com` | No resemblance | Folded label skeleton is `paypal`. |
| `παραδειγμα.com` / `παράδειγμα.com` | No resemblance | Greek accents are removed. |
| `paypal.com` / `payp\u1AB0al.com` | `folded_label` | Original input is outside Chromium's eligibility set. |
| `paypal.com` / `payp\u033Aal.com` | `folded_label` | Original input is outside Chromium's eligibility set. |

The first four rows were checked with the exact ICU set and transliteration rule
from Chromium, using system ICU 78.3. The last two also passed Node IDNA conversion
and the real local comparator. A JavaScript transcription of the upstream set
excluded their marks. These are mechanism checks, not a measured phishing error
rate or a proof that JavaScript and ICU agree for every Unicode character.

The standalone experiment is retained at
`/tmp/angry-carp-chromium-folding/check.cc`, with its executable beside it. It also
checks ICU's highly restrictive level: `pаypäl` fails that level, while Japanese
`ひらカナー` does not. The experiment uses system ICU, not Chromium's bundled ICU.

Chromium explains its combining-mark range in terms of an earlier allowed-character
check. Its [checker initialization and allowed set](https://github.com/chromium/chromium/blob/fcd1720dfbc767af07055b27f303207fab09c45d/components/url_formatter/spoof_checks/idn_spoof_checker.cc#L193-L214)
provide checks Angry Carp lacks. However, this is not a universal precondition on
all skeleton callers: `GetDomainInfo` explicitly uses unsafe Unicode decoding to
compute skeletons even when display checks object. Copying only the folding set
would therefore remove some local matches without adding a replacement finding.

## The complete skeleton generator is a larger algorithm

Chromium's [header](https://github.com/chromium/chromium/blob/fcd1720dfbc767af07055b27f303207fab09c45d/components/url_formatter/spoof_checks/skeleton_generator.h#L20-L103)
defines a set of output skeletons and a map from UTF-16 characters to sets of
alternatives. It does not return one transformed string. The implementation:

1. Removes eligible diacritics.
2. Generates alternatives for `þ`, `œ`, `ł`, and `ı`.
3. Also generates alternatives from the original input when folding would lose an
   ambiguous character, currently `ł`.
4. Applies its additional many-to-one confusable mappings.
5. Calls ICU skeleton generation, with an additional `ӏ`-to-`l` alternative.
6. Deduplicates successful outputs in a sorted set.

The [alternative generator](https://github.com/chromium/chromium/blob/fcd1720dfbc767af07055b27f303207fab09c45d/components/url_formatter/spoof_checks/skeleton_generator.cc#L270-L342)
uses breadth-first traversal over vectors of string fragments. Original characters
are queued before alternatives. Its limits are 32 UTF-16 code units, five ambiguous
characters, and 128 results per invocation. A debug assertion limits each mapping
to three alternatives. A second invocation for the original input can contribute
additional results before deduplication.

At this revision, exceeding the hostname or ambiguous-character limit produces an
empty alternative set. `GetSkeletons` iterates that set without an ordinary-skeleton
fallback. A literal port would import this behavior too. That is not automatically
an improvement over Angry Carp's existing single-skeleton comparison.

The [tests](https://github.com/chromium/chromium/blob/fcd1720dfbc767af07055b27f303207fab09c45d/components/url_formatter/spoof_checks/idn_spoof_checker_unittest.cc#L1443-L1584)
assert exact output sets, capped traversal order, empty results, multiple ambiguous
characters, and non-Latin folding exclusions. Tests for top-domain lookup also
ensure that a real top domain and its subdomains do not count as lookalikes.

## Ownership, concurrency, and failures

[`GetIDNSpoofChecker`](https://github.com/chromium/chromium/blob/fcd1720dfbc767af07055b27f303207fab09c45d/components/url_formatter/url_formatter.cc#L280-L283)
holds a process-lifetime `NoDestructor` instance. The checker owns its skeleton
generator. The generator borrows the ICU checker, owns its transliterators, and
freezes its eligibility set after initialization. Queues, variants, and output
sets are local to each call. No explicit mutex appears in the inspected generator.

The mutable regex matcher used by contextual display checks is
[thread-local and deleted at thread termination](https://github.com/chromium/chromium/blob/fcd1720dfbc767af07055b27f303207fab09c45d/components/url_formatter/spoof_checks/idn_spoof_checker.cc#L106-L114).
This state exists because the matcher is reset for each label. It does not justify
adding locks or lifecycle state to a pure TypeScript folding helper.

Failure behavior depends on the operation. ICU failure during display checking
returns an unsafe-display result. Skeleton generation inserts only successful ICU
results. Missing generator initialization returns an empty skeleton set, while its
folding wrapper returns the original input. Transliterator construction uses
[debug assertions](https://github.com/chromium/chromium/blob/fcd1720dfbc767af07055b27f303207fab09c45d/base/i18n/transliterator.cc)
for the fixed rules. A TypeScript adaptation should state its failure contract
explicitly instead of treating all these outcomes as interchangeable.

## What fits Angry Carp

The recommended first increment is Latin/Greek/Cyrillic folding with regression
tests, while retaining the existing combining-mark coverage. This deliberately
adapts Chromium's transformation and script coverage. It does not claim identical
eligibility or a port of the complete skeleton generator. Test the added matches,
retained mark cases, IDNA normalization, swap interactions, and each reference
source before adopting it. The current Greek negative test and Latin-specific
documentation must change with the implementation.

A reference-independent script observation needs its own design. Chromium already
uses ICU's `USPOOF_HIGHLY_RESTRICTIVE` level. Counting the primary scripts recorded
by Angry Carp does not implement it. Logical Japanese, Korean, and Chinese script
combinations and Script_Extensions matter. The installed Unicode dependency's
text-moderation `analyze` function is not a drop-in ICU restriction-level checker.

The [analyzer](../../lib/src/email-analysis/analyze-email.ts) creates pairwise
comparisons only after selecting references and caps their number. A standalone
host check must run independently of that loop to catch names without references.
Its observation, assessment concern, and support for a reporting recipient remain
separate decisions in [finding derivation](../../lib/src/email-analysis/findings.ts).
Preserve the existing operator-only concern policy for folded and swapped matches
unless that policy is deliberately reconsidered.

No better end-to-end TypeScript replacement was established by this investigation.
ICU supplies the restriction machinery Chromium uses, but adding native ICU or a
Wasm binding would be a separate dependency decision. The local contract audit is
retained at `/tmp/angry-carp-chromium-folding/local-contract-audit.md`.
