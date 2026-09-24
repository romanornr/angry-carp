# Evaluate missing comparison references

Type: product and evaluation decision
Status: open
Assignee: unassigned
Parent: ../map.md
Related: 09-evaluate-phishing-detection-research.md

## Problem and evidence

`paypa1.com` is detected with an explicit `paypal.com` reference. With a generic sender and no reference, the same link produces zero comparisons and `no_concerns_detected`. Run `node experiments/domain-lookalikes/reproduce-routing.mjs` from the repository root to compare these cases with synthetic completed lookups.

Directory hostname lookup uses exact hostnames. Other references come from supplied operator domains, directory name candidates, and message images. Missing references create `no_comparison_reference`, which routing intentionally treats as informational under [ADR 0013](../../adr/0013-route-assessment-by-concerns-and-coverage.md).

## Decision

Compare retaining the limitation, bounded reference discovery, and treating absent references as material for selected messages. An exact skeleton index is a candidate; broad fuzzy scans are not assumed. Evaluate including directory `additionalDomains` with explicit caps. Neither approach establishes brand ownership.

Use ordinary and deceptive mail to measure assessment frequency, misses, unsupported brand assumptions, and comparison-budget exhaustion. The effect of routing all absent-reference messages to AI is currently unmeasured. [The research](../../research/domain-impersonation.md) explains why a crowdsourced service directory cannot inherit Chromium's popularity-based policy unchanged.

## Done when

Document the selected behavior for generic senders, brand display names, image references, explicit operator references, and missing references. Verify it through the full analyzer and assessment decision. Preserve a detected-with-reference control and state remaining limits. This ticket does not authorize a new classifier, account connection, or model-disclosure policy.
