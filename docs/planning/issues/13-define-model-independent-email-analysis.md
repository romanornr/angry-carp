# Define model-independent email analysis

Type: grilling
Labels: wayfinder:grilling
Status: implemented
Assignee: operator with Codex
Parent: ../map.md
Blocked by: none

## Implementation decision, 2026-09-22

The operator approved implementation, exact Mailsplit 5.4.17 and email-addresses 5.0.0 pins, and selected analysis fields plus explicitly reviewed text as Flue input. [ADR 0011](../../adr/0011-analyze-email-before-assessment.md) records the decision. [Email analysis](../../email-analysis.md) describes the implemented command, contracts and limits. The discussion below records prior decisions and proposals, not outstanding package approvals. Gmail acquisition, fresh verification and a case database remain outside this increment.

Milestone verified on 2026-09-22: `npm run check:types` passes for both workspaces; `npm test` passes 73 library tests and 10 command/Flue tests. Tests use synthetic messages and mocked lookup/provider transports, not real email or model calls. The coordinator regression retains image/action findings and qualified Resend leads with four action hosts, keeps Gmail-marked quotes out of current-message lookups, and preserves failed/skipped outcomes. CLI tests cover disclosure limits, optional private export, output preservation and natural shutdown.

## Follow-up verification, 2026-09-22

The CLI package split, issues 14–17 and automatic assessment routing now pass 96 offline tests across three workspaces (86 library, two CLI, eight agent), with all typechecks clean. Claude and Grok independently reviewed routing and resource attribution. Regressions cover clean-path auth/db avoidance, forwarded-message coverage, data-URL actions, bounded recovery, retained partial DNS evidence, reviewed notes, private projection and natural shutdown. [ADR 0013](../../adr/0013-route-assessment-by-concerns-and-coverage.md) records the accepted routing and reporting-stage research policy. No live model or candidate-site request was used for this verification.

## Question

What must the first model-independent email analysis deliver, and which judgments remain separate from its evidence record?

## Starting point

The operator proposed running the applicable reusable checks from email input without model-directed tool selection. The result must preserve structured findings and reporting candidates, including facts an optional AI summary omits. Flue remains available for subsequent interpretation and future acquisition or report drafting. This does not authorize sending.

The [analysis proposal](../../research/model-independent-email-analysis.md) and [established scanner precedents](../../research/email-analysis-precedents.md) contain the research and alternatives. Claude, Grok and OMP reviewed the proposal independently. Their corrections are incorporated there. Reuse that research rather than restart it.

Keep the existing library boundary, portable assessment Markdown, private originals, and prohibition on candidate-site fetches. DNS and RDAP are network operations even when no model is involved. No new parser dependency or coordinator implementation is approved by this ticket.

## Agreed deliverable, 2026-09-22

The operator selected complete structured analysis, deterministic findings and reporting candidates. The primary result is a structured object that can be serialized as JSON. An overall phishing verdict or numerical score is not required in this increment; optional classification remains separate.

The operator accepted the distinction between a results display, an AI assessment and an abuse report. A results display formats recorded facts for inspection in a terminal or future interface. It does not require an LLM or compose correspondence for providers. Exact terminal formatting remains to be reviewed.

For the Bifrost case, the report must show the logo/action-host distinction and any supported reporting lead even if the optional model omits both. That is an acceptance requirement independent of whether a classifier labels the message High concern.

## Input and lookup decisions, 2026-09-22

The operator accepted original `.eml` input while requiring compatibility with future Gmail acquisition. Treat the complete message bytes as the library input, not a filesystem path. The local CLI reads a file; a future connector can supply bytes in memory. Saving a fetched message is a separate retention decision. Bulk acquisition must call the same per-message analysis with bounded scheduling, rather than require one combined email file or a mailbox-specific parser in the library.

Gmail's [message resource](https://developers.google.com/workspace/gmail/api/reference/rest/v1/users.messages) documents `messages.get(format=RAW)` as the entire RFC 2822 message encoded with base64url. This supports decoding directly to bytes. The parsed `payload` and plain-text summaries are different representations; do not reconstruct them and call the result an original. This verifies the Gmail REST capability, not what a particular agent connector exposes. A future connector must be checked before integration. Source checked 2026-09-22.

The operator chose automatic DNS/RDAP lookups, with no `--online` flag. Run them for eligible targets within the agreed budgets, recording failures and skipped targets. Network failures must not silently turn into negative findings. Candidate-site visits and model calls remain separate and are not enabled by this choice.

## Check behavior decisions, 2026-09-22

The operator accepted these behaviors:

- Continue independent checks when a lookup fails. Return successful results alongside explicit failures and coverage gaps. Checks requiring a failed lookup record that missing prerequisite.
- Extract supplied SPF, DKIM and DMARC results as reported claims. Fresh verification is deferred. Neither a matching authentication-service name nor a successful claim establishes receiver provenance by itself.
- Record attachment filenames, declared content types and decoded sizes. Attachment hashes were not selected. Malware scanning is not part of this increment. If decoding is limited or fails, record the unavailable size rather than inventing a value.
- When no official reference is supplied, return bounded directory candidates and supported comparisons with their source. Preserve ambiguity and missing matches; neither proves legitimacy. A directory candidate does not become an operator-verified reference.

## Input failures and results display, 2026-09-22

- Reject oversized or unparseable input explicitly. Do not silently truncate it and present a complete analysis. When an individual part fails and usable parts can be recovered, retain them with explicit missing coverage.
- The operator wants a caller to be able to use the portable phishing-triage instructions for LLM review when deterministic analysis is incomplete or fails. Keep that assessment separate from the failed checks. The trusted caller retains access to the source; failure does not itself send raw content to a model or relax the existing disclosure boundary.
- Separate forwarded-message and quoted-reply evidence from the current message wherever the parser can identify that boundary. Preserve uncertain boundaries rather than attributing all quoted content to the current sender.
- The terminal displays findings, reporting candidates and failed/skipped checks. Do not print the full email, raw headers or attachment contents.

The operator accepted returning the structured result in memory, with JSON serialization and private file export only when requested by the caller. The CLI displays results without creating an analysis file by default. A Flue integration receives the selected disclosure projection. This avoids a new mandatory storage layer; it does not change existing Flue conversation storage or original-message retention policies.

## Current discussion

The result contract, MIME-parser choice, lookup target policy and provider-reference selection remain to be specified. Gmail integration and mailbox bulk processing are future callers, not additions to this increment.

The [MIME interface review](../../research/mime-parser-contract.md) found that Postal-mime and MailParser return assembled bodies rather than the independently recoverable parts our proposal assumed. The operator then authorized Mailsplit artifact review and isolated behavioral testing. Seven runtime artifacts passed the recorded integrity/signature checks, and eight synthetic tests demonstrated its public part relationships, caller-managed decode failures and cancellation. Tolerant parsing does not expose every malformed input. Mailsplit is recommended for the Node adapter but has not been selected or added to project dependencies; Workers execution remains unverified. Preserve the agreed recovery and provenance requirements instead of silently weakening them to fit a convenience parser.

The operator prefers rounds of up to five independent questions rather than serial one-question exchanges. Do not repeat settled decisions or ask a dependent question before its prerequisite is answered.

The behavior questions above are settled. Next, prepare concrete input/output types and the caller migration for review, grounded in the existing APIs and parser research. Do not ask the operator to choose implementation details that can be resolved from those contracts.

The operator authorized moving to that preview after the Mailsplit review. The [implementation preview](../../research/model-independent-email-analysis.md#implementation-preview-2026-09-22) now records proposed caller code, result branches, file ownership, selection rules and migration constraints. It also records a remaining header-parser gap: Mailsplit preserves fields but does not supply address or Authentication-Results parsing. Header reuse and concrete resource limits need resolution; migration must preserve the reviewed-body disclosure boundary. No coordinator code or new project dependency was added by the preview.

## Decisions that depend on the deliverable

- Agree the result contract and acceptance cases before selecting parser behavior.
- Set input provenance, network eligibility and disclosure policies. An Authentication-Results header is not independently verified authentication.
- Review concrete types, files and caller migration together. Retire duplicated routine selection only when the replacement covers its callers.

Record answers here as the discussion proceeds. Record a consequential accepted architecture choice in an ADR once the trade-off is settled, not as an accepted decision in advance.
