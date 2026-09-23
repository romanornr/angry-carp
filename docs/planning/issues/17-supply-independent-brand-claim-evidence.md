# Supply independent evidence for claimed brand products

Type: capability
Status: implemented
Priority: medium
Assignee: unassigned
Parent: ../map.md
Blocked by: none for supplied-note scope

## Resolution, 2026-09-22

The operator selected supplied notes now and research only during report preparation. Implemented bounded, schema-validated `sourceNotes` in the library and `--source-notes` in both commands. Notes retain supplier, authority claim, relation, exact subject hosts, retrieval/display dates and message-date applicability separately from email bytes. No source URL is fetched. Full reviewed claim/URL fields can enter the model projection. Unknown/conflicting notes stay explicit; no semantic verification is claimed. [Issue 18](18-verify-evidence-during-report-preparation.md) now implements a separate host-assisted preparation workflow; the portable reporting guide requires research at that stage.

The sections below retain the original gap and acceptance criteria.

## Observed gap

In the 2026-09-22 comparison, an independently checked official support statement contradicted the claimed product announcement. The deterministic analyzer cannot retrieve or interpret that statement. The offline directory returned no matching reference, which is not evidence about legitimacy or product availability.

## Proposed direction

Start from the existing reviewed-source-note route. A future structured source observation should preserve the exact source URL, retrieval time, displayed date, quoted claim and acquisition provenance separately from the email. Applicability to the message date is a distinct question. A current page is not a historical snapshot.

Automatic retrieval is a separate approval and design decision. Verify how an official source is selected, which outbound destinations and redirects are permitted, what text is disclosed, and how stale, conflicting or missing sources are represented. Avoid embedding brand facts in general rules or treating a directory association as proof of ownership. Reuse prior [brand research](../../research/offline-brand-lookup.md) and [analysis research](../../research/model-independent-email-analysis.md).

## Acceptance checks for a future increment

- A supplied source note remains distinct from sender-controlled email content and cannot create a fresh-fetch claim.
- Unknown brand, ambiguous source, conflicting statement and historical-date uncertainty remain explicit.
- The same observation can be consumed by a non-Flue caller; the portable instructions remain independent of TypeScript.
- An official-source lookup never follows the email's candidate URL or loads images/installers.

No browsing tool, classifier or source store is implemented by the package migration.
