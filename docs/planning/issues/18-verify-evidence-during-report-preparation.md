# Verify evidence when preparing a provider report

Type: capability
Status: implemented, host-assisted scope
Priority: medium
Parent: ../map.md
Blocked by: none

## Accepted scope

On 2026-09-23 the operator selected an existing Codex, Claude or Grok host, with attributed research records. Targeted AI-assisted research remains mandatory for every requested report preparation. The host executes that research; Angry Carp validates and binds its supplied records. A completion claim is not proof of execution, and the program does not pretend otherwise. Native Flue search is outside this accepted increment.

[ADR 0015](../../adr/0015-attribute-host-report-research.md) records the decision. The [command guide](../../report-preparation.md) documents the two-step workflow and schemas. [Research](../../research/remaining-assessment-and-reporting-work.md) records standards, software precedents and independent design opinions.

## Implementation

- `report start` validates a reviewed provider/resource/action/destination request and binds the existing private analysis by exact file digest. It writes a new private preparation. The original and full analysis are not copied into the host-facing request.
- The host checks the allegation, provider relationship needed for the action, and current channel, using permitted sources after preparation starts. Each named check is supported, unresolved, contradicted or failed, with source references and an explanation. A qualified investigation request does not require proven provider custody.
- `report check` binds preparation, analysis and draft bytes; validates record shape, source references and declared chronology; and holds incomplete research, changed inputs or recipients, disallowed sources and candidate destinations. Private action and plain-text reference hosts, including forwarded content, also constrain candidates without being disclosed automatically.
- A successful result is `ready_for_review`, with `host_supplied` provenance and digests. It never establishes truth, retrieval execution, semantic consistency of the draft, disclosure approval or sending authority. The operator reviews the actual source trace and exact payload.

Source notes from screening remain starting evidence with their original provenance. Catalogue dates do not satisfy reporting-time research. There is no arbitrary maximum research age or authority-label shortcut; final applicability requires human review. Changed destination or preparation requires a fresh preparation. Material draft changes need applicable research; every changed outgoing payload needs new approval before a future submission.

## Acceptance evidence

Offline library and CLI tests exercise a synthetic start/research/draft/check flow, failed and unresolved holds, exact byte and recipient changes, source IDs/times/hosts, qualified investigation wording, malformed and bounded input, exclusive private output, and zero network attempts in the command. Routine analysis and Flue assessment never import this reporting workflow. No model, candidate-site visit or provider submission is part of these tests.

Claude independently reviewed the implementation. Grok's earlier independent design informed it, but Grok's weekly limit prevents an implementation review. Retained limitations are deliberate: no native research executor, case store, approval mechanism, attachment payload or sending command. These are separate from this completed host-assisted preparation increment.
