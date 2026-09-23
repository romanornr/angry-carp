# Evaluate Spamhaus data and submissions

Type: research
Status: open
Assignee: unassigned
Parent: ../map.md
Related: 24-implement-provider-outcomes-and-recurrence.md

## Question

Could Spamhaus add useful threat observations to email analysis, and could submitting supported phishing evidence help disrupt campaigns?

The operator requested a future evaluation on 2026-09-23. The [initial source review](../../research/spamhaus-options.md) separates data access from evidence submission. Neither is implemented or authorized by this ticket.

## Evaluate

- Which domain and IP datasets cover the resources Angry Carp observes, and what each listing means. Preserve the exact queried resource, source, retrieval time and response meaning. An absence must not become a safety claim.
- Access terms, licensing, credentials, query limits, caching and disclosure. Compare remote lookups with any permitted local data option without assuming snapshots can be redistributed.
- Supported submission routes, contributor eligibility, evidence requirements and privacy. Distinguish submitting evidence, acceptance onto a list and action by a hosting, registrar or email provider.
- Whether either capability adds useful information beyond current checks and the other proposed feeds, including benign controls and a way to measure added value.

## Done when

A sourced recommendation names a specific dataset or submission route, its meaning and access conditions, or recommends deferral. Any proposed implementation has bounded requests, explicit failed and unavailable outcomes, and a disclosure policy. No subscription, account connection, feed installation or report submission is part of this research ticket.
