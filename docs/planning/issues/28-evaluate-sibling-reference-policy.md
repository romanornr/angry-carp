# Evaluate same-registration reference relationships

Type: policy evaluation
Status: open
Assignee: unassigned
Parent: ../map.md
Related: 22-preserve-domain-relationship-uncertainty.md

## Problem and evidence

An email with an image at `images.paypal.com` and an action at `www.paypal.com` can require assessment through `confusable_label`. The full hostnames differ, so neither exact-name nor child-of-reference classification applies. Their identifying labels still match. This behavior predates the embedding increment.

The embedding increment preserves that existing concern but excludes the new embedding observation when both registrable domains are equal. A [comparator regression](../../../lib/src/lookalikes/compare-domains.test.ts) covers sibling and parent hosts.

## Decision

Evaluate whether shared registration should suppress label-resemblance concerns, and for which reference sources. Include genuine brand mail and unrelated tenants on shared services whose boundaries are absent from the private suffix list. Shared registration does not prove ownership or authorization.

## Done when

An explicit relationship policy passes both ordinary-mail and cross-tenant controls through the analyzer. Preserve the narrower embedding exclusion and evidence provenance. Do not globally clear same-registration hosts without evaluation. The [research record](../../research/domain-impersonation.md) separates this older policy question from the fixed embedding regression.
