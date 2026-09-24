# Evaluate typo and accent observations

Type: research and policy evaluation
Status: partially implemented; broader policies remain open
Assignee: unassigned
Parent: ../map.md
Related: 09-evaluate-phishing-detection-research.md

## Question

Should single edits, adjacent transpositions, or additional diacritic folding create domain-resemblance concerns, and for which reference sources?

`coinbsae.com` against `coinbase.com` and `päypal.com` against `paypal.com` now produce observations, and concerns when the operator supplies the reference. The [source review and corrected experiment](../../research/domain-impersonation.md) compare existing software and candidate rules. The [current contract](../../domain-lookalikes.md) adds only adjacent swaps and Latin-folded equality. General edits and broader source policies remain deferred.

## Evaluate

- Compare transposition-only and bounded single-edit checks on folded labels and skeletons. Account for skeleton expansions such as `m` to `rn`.
- Measure any length guard on the intended label, not whichever comparison form happens to pass it. The corrected directory experiment yields 71 new guarded single-edit collisions versus 4 transposition-only collisions; these are not mailbox false-positive rates.
- Include short brands, first-character changes, trailing digits, hyphens, and legitimate accented names. Do not remove meaningful marks across all scripts.
- Break down additional assessments and missed cases by operator, directory, and message-image references. A Chromium warning policy is not evidence for the same policy in email assessment.
- Include existing short-label containment noise, such as `ing.com` matching `booking.com`, when measuring total workload.

## Done when

A reproducible comparison supports a specific rule and its limits, or recommends deferral. State the expected evidence, normalization, guards, and assessment consequence. Keep similarity distinct from a phishing verdict. Use the existing observation contract without introducing another detector API, a rule engine, or stateful lifecycle. Private-mail evaluation requires separately authorized samples and disclosure conditions.

## Delivered increment

The comparator records both new kinds without a new API or dependency. `findings.ts` owns the operator-only concern policy. Directory and image matches remain observations and do not qualify reporting recipients. The [public-mail benchmark](../../../experiments/domain-lookalikes/MAIL-BENCHMARK.md) ran 3,231 messages before and after, with no new matches in either reference configuration. Synthetic controls prove the intended mechanisms; these corpora provide no evidence of improved phishing accuracy.
