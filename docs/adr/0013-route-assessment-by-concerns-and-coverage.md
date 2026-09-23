---
status: accepted
---

Implementation update, 2026-09-23: [ADR 0015](0015-attribute-host-report-research.md) implements host-assisted report preparation. The research below now runs in the operator's existing AI host; the standalone command checks attributed records. Native Flue research and submission remain unimplemented.

# Route AI assessment by concerns and coverage

The operator chose automatic AI assessment when deterministic checks detect a concern or leave material gaps after bounded recovery. Completed applicable checks with no detected concerns return structured results without inference. Reporting contacts and authentication pass claims alone do not trigger assessment. This replaces the unconditional model call in the Flue command; it is an attention policy, not a calibrated phishing classifier or a safety guarantee.

Keep this decision in the shared analyzer so non-Flue consumers receive the same routing. The standalone CLI reports it but never calls a model. Flue applies it before loading authentication or conversation storage. Reviewed text remains required for disclosure when assessment is needed; the original is never substituted automatically. Explicit cancellation stops work. Deterministic input/parse limitations remain visible and cannot be repaired by repeating the same parser.

Each lookup family has a recovery budget equal to its initial selection count. Recovery covers transient failures and important budget-skipped work, with at most two attempts per check. This replaces the original single recovery batch: a deferred check's first request could fail while unused budget remained, with no opportunity to retry. Successful checks are reused. The total HTTP ceiling remains 48 under the existing 45-second deadline. HTTP 429 and deterministic rejections do not get immediate retries. The previous result of each recovery attempt remains in the private record. A fallback model receives the remaining gaps rather than a claim that recovery succeeded. General request scheduling or caching across a mailbox remains deferred.

Source notes are explicitly supplied and reviewed, with their URLs, dates, claim, supplier and applicability recorded separately from the message. They never become a runtime-fetch claim or add a network target. Exact subject hosts can support a reporting lead, including an image resource; a directory hit or passive image alone cannot. Source claims and contradictions remain unverified evidence for assessment.

AI-assisted research is mandatory when the operator proceeds to report preparation, to double-check material evidence, provider responsibility and current intake. Routine analysis and assessment do not browse. The portable [reporting instructions](../../provider-abuse-reporting.md) carry that rule; a research/drafting runtime remains [deferred](../planning/issues/18-verify-evidence-during-report-preparation.md). No reporting or sending command is introduced here. The trade-off is foregoing additional web evidence during routine screening to avoid unnecessary inference and disclosure.

See [the analysis contract](../email-analysis.md) for executable policy, limits and source-note fields. CLI option parsing reuses Node's [parseArgs](https://nodejs.org/docs/latest-v24.x/api/util.html#utilparseargsconfig), without another command framework.
