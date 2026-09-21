# Choose mailbox labels and report memory

Type: grilling
Labels: wayfinder:grilling
Status: resolved
Assignee: operator with Codex
Parent: ../map.md
Blocked by: none

## Question

Which small set of Gmail labels makes flagged messages, confirmed reporting, and operator work visible while letting a Markdown-only Grok routine resume without duplicate reports? What recipient-specific evidence must remain available when the host has no Angry Carp CLI?

Compare the proposed two-label view, a compact flagged/review/reported view with provider correspondence, and provider-specific labels. Exercise partial sending, uncertain sending, the next day's run, new evidence, and a cleared false positive. Check actual software practice without presenting product-specific labels as a standard.

## Context

The operator rejected project branding in label names and questioned the two-label proposal because it hides flagged versus reported source messages. The original motivation was to let the Grok routine know a report was already sent on a later run. [Gmail label design](../../../docs/gmail-labels.md) records the accepted design, not an executed migration. No live label change is authorized.

## Decisions during discussion

The operator selected `phishing-reported` to mean at least one confirmed external report. In the example where Vercel was sent and AWS awaits approval, reported and review can coexist. The operator subsequently accepted the four-label set and accessible case notes for individual provider progress.

[Software-practice research](../../../docs/research/label-and-submission-practices.md) compares Defender submission records and TheHive action history. The comparison informed the accepted separation between visible labels and provider-specific action records.

## Resolution

Accepted 2026-09-21: use phishing-flagged, phishing-review, phishing-reported, and abuse-reports. Reported means at least one confirmed external submission, with review retained for an outstanding operator action. Labels locate prior work; resource-and-destination history prevents duplicate submissions. A partial case remains in the work queue even after the first report.

The [label design](../../../docs/gmail-labels.md) records transitions, edge cases, and migration requirements. This closes the label decision only. Verifying a particular host's durable notes, recovery, and label capabilities remains part of [Choose the manual runtime and state ownership](05-choose-manual-runtime-and-state-ownership.md). No live migration or new storage mechanism is implied.
