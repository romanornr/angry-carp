# Diagnose RDAP failures and reuse discovery data

Type: reliability
Status: open
Priority: medium
Assignee: unassigned
Parent: ../map.md
Blocked by: none

## Observed failure, 2026-09-22

Isolated calls to the existing domain and IP RDAP functions returned `unavailable/request_failed` at `https://data.iana.org/rdap/dns.json` and `https://data.iana.org/rdap/ipv4.json`. A direct fetch of the DNS bootstrap endpoint exposed the allowlisted error code `ENOTFOUND`. The registry lookup had not started. Another registry endpoint was independently reachable.

This establishes a discovery-host name-resolution failure in those probes. It does not establish IANA's global availability, the underlying resolver cause, or the cause of the earlier live-run failures. The malformed-JSON classification in issue 20 is a separate, fixed defect.

## Full-pipeline retest and follow-up

The 2026-09-22T22:24Z full retest completed normally in 31.453 seconds. Three domain registrations and five IP network records succeeded; the brand-image domain returned `unavailable/request_failed`. The saved terminal output and model projection omit the failed request's endpoint, so they cannot distinguish discovery failure from registry failure. The complete in-memory RDAP result already retains `sourceUrl`; do not introduce another stage representation before evaluating that existing field.

A single isolated call through the current source at 2026-09-22T22:30:40.712Z then succeeded. A bounded fetch wrapper recorded HTTP 200 from IANA discovery followed by HTTP 200 from the registry. No model, candidate site, image or installer was contacted. This does not reproduce or diagnose the earlier failure. Private case output remains under ignored `evidence/emails/`; the ticket needs no original-message content.

## Established guidance and proposed implementation

[RFC 9224 section 8](https://www.rfc-editor.org/rfc/rfc9224.html#section-8), checked on 2026-09-22, recommends caching bootstrap registries according to HTTP freshness signaling instead of retrieving them for every query. Both current RDAP lookup functions retrieve discovery on each invocation. This is a demonstrated improvement opportunity, not proof that repeated discovery caused this failure.

Start with the existing request and lookup owners:

1. Make the failed stage visible in bounded diagnostic output using the retained endpoint. Classify only recognized transport failures into safe categories where the runtime supplies them, with an unknown fallback. Never expose raw exception messages, request headers or response bodies. Do not make full analysis JSON retention mandatory.
2. Reuse validated discovery data within an analysis run, keyed by bootstrap URL, subject to HTTP cache directives. Preserve longest-suffix and longest-prefix selection. Measure the resulting requests; do not claim fewer requests repairs a registry outage or failed initial discovery.
3. Define ownership before sharing in-flight requests. One caller's timeout must not cancel another caller's work. The run deadline must still settle its owned requests. Failed retrievals must not poison later attempts, and reuse must preserve provenance and the request budget.

Persistent cache storage, stale fallback, alternate endpoints and extra retry layers are not selected. Add them only if the diagnosis demonstrates a need and their freshness, cancellation and rate-limit policies are agreed.

## Acceptance checks

- Distinguish discovery transport failure, registry transport failure, malformed JSON, HTTP 429 and cancellation with bounded synthetic responses. Verify that private sentinel error text never reaches terminal or model output.
- Repeated domain lookups share eligible discovery data while querying their respective registry records. Expired or non-cacheable discovery data follows the selected HTTP policy.
- Failed discovery can recover without a process restart; cancellation settles owned work and does not corrupt another caller's result.
- Actual HTTP requests remain within the analyzer's reported ceiling. Do not retry successful results or HTTP 429 under the current policy.
- Failures remain explicit coverage gaps. No stale record is presented as fresh, and a failed lookup never becomes `not_found`.
- A bounded public-registry retest needs no model call or candidate-site visit. A successful retest proves recovery at that time, not general availability.

Distinguish local resolver failure from upstream unavailability without changing system DNS, bypassing TLS or substituting a registry. Keep explicit failure and coverage routing while investigating. See the [research record](../../research/assessment-evidence-limits.md#full-command-retest-and-follow-up-tickets) for the bounded follow-up and independent recommendations.
