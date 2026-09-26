# Upstream code notices

These notices accompany specific upstream adaptations in `@angry-carp/checks`.
The package includes this directory in its distribution.

## Google Safe Browsing

`src/url-privacy/recursive-unescape.ts` adapts `unescape`, `recursiveUnescape`,
and hexadecimal decoding from Google's Go Safe Browsing implementation.
The source retains `Copyright 2016 Google Inc. All Rights Reserved.` and the
Apache notice. Its comment describes the TypeScript adaptation's changes.

- [Pinned upstream source](https://github.com/google/safebrowsing/blob/bbf0d20d26b32d99fd21664677fe31ee9f0f66e3/urls.go)
- [Apache License 2.0](google-safebrowsing-Apache-2.0.txt)

## Chromium

`maybeRemoveDiacritics` in `src/lookalikes/compare-domains.ts` adapts Chromium's
diacritic transformation and Latin/Greek/Cyrillic eligibility check.
The upstream source bears `Copyright 2020 The Chromium Authors`.
The helper retains that attribution and describes its broader mark eligibility
and NFD-first check. Chromium's BSD-style license is separate from the Apache
license above.

- [Pinned upstream source](https://github.com/chromium/chromium/blob/fcd1720dfbc767af07055b27f303207fab09c45d/components/url_formatter/spoof_checks/skeleton_generator.cc)
- [BSD license and upstream copyright notice](chromium-BSD-3-Clause.txt)
- [Pinned upstream license](https://github.com/chromium/chromium/blob/fcd1720dfbc767af07055b27f303207fab09c45d/LICENSE)

The adjacent-swap and domain-embedding checks cite Chromium as an algorithmic
precedent. The script-mixing check cites Chromium's policy and ICU's algorithm.
Those implementations use local data structures and control flow; they are not
copies of Chromium's full spoof checker or browser policy.
