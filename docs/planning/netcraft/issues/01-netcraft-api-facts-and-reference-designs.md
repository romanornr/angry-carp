# Netcraft Report API facts and reference designs

Type: research
Status: resolved
Assignee: claude
Parent: ../map.md

## Question

What does Netcraft's official Report API v3 accept and return, and how do established integrations structure submission, status tracking, errors and storage?

## Answer

Recorded in [Netcraft Report API and reference designs](../../../research/netcraft-report-api.md), researched 2026-09-26.

- The official OpenAPI document is `https://report.netcraft.com/api/v3/api.json`, pinned by sha256. It settles the disagreements between third-party clients: `report/mail`, `reason` at both levels, no API key.
- A `/api/v3/test` sandbox mirrors every endpoint without destructive effects.
- Verdicts can escalate days later, submissions archive after 30 days, and pages are visible to anyone with the UUID.
- There is no idempotency key and no public listing of one's own submissions, so a timed-out submission cannot be recovered through the public API.
- No surveyed client is well engineered throughout. Palo Alto's XSOAR integration is the most established reference for endpoint surface; ask-arthur supplies observed API behaviour and error classification. No surveyed project records uncertain submissions, validates responses or tests against recorded HTTP responses.
- `url_takedown_state` and `incident_report_url` are recorded as observations; this effort does not request takedowns.
