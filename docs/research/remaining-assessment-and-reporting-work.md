# Domain relationships and reporting-time research

Research date: 2026-09-23. Baseline: `3d7d063`. Proposal only; neither ticket is implemented by this note.

Implementation update: ticket 22 is implemented with two paired synthetic evaluations. The operator selected existing-host research for ticket 18. [ADR 0015](../adr/0015-attribute-host-report-research.md) and the [command guide](../report-preparation.md) describe the implementation; the proposals below preserve the research history.

## Recommendation

Finish [ticket 22](../planning/issues/22-preserve-domain-relationship-uncertainty.md) as an instruction correction with a bounded evaluation. Design [ticket 18](../planning/issues/18-verify-evidence-during-report-preparation.md) alongside it, but implement that reporting stage separately. They have different callers and acceptance checks. Combining them would delay the wording correction without simplifying the runtime.

Reuse the [existing standards research](email-report-templates-and-standards.md), [channel research](reporting-channel-catalogue.md), and [provider reporting guide](../../provider-abuse-reporting.md). [ADR 0013](../adr/0013-route-assessment-by-concerns-and-coverage.md) already requires targeted AI-assisted research when report preparation is requested. Routine screening still performs no web research.

## Ticket 22: names do not establish relationships

DKIM distinguishes the signer from the purported author. A signer can be an author, relay or agent. Successful authentication therefore does not establish every relationship among the message's domains. [RFC 6376, introduction](https://www.rfc-editor.org/rfc/rfc6376.html#section-1)

DMARC alignment is a protocol relationship between identifiers. It is not a general ownership lookup for sender, image and download domains. The current specification is [RFC 9989](https://www.rfc-editor.org/rfc/rfc9989.html), which obsoletes RFC 7489. This ticket needs no DMARC implementation change.

The library's image/action finding already says the difference does not establish ownership or deception. The observed defect was in the model's interpretation. Revise the existing mismatch bullet in both `agent/phishing-assessment.md` and portable `phishing-triage.md` with this proposed clause:

> Different domain names alone establish neither common nor separate ownership or authorization; cite supporting evidence for those relationships.

Retain the surrounding instruction to weigh combined evidence. A domain comparison, directory match or hotlinked logo is not supporting evidence of ownership by itself. No forbidden-word list or new classifier is needed.

Evaluate a legitimate multi-domain example with sourced authorization and an impersonation example with a sourced product contradiction. Compare the old and revised instructions on the same inputs and model. Review relationship claims against their cited evidence, concern reasoning and unknown payload limits. Retain failed outputs. A small paired evaluation supports a wording choice; it cannot guarantee future model behavior. Additional repetitions should answer an observed ambiguity rather than meet an arbitrary run count.

## Established patterns worth borrowing

| Precedent | Verified pattern | Application here |
|---|---|---|
| [Cortex analyzer contract](https://thehive-project.github.io/Cortex-Analyzers/dev_guides/how-to-create-an-analyzer/#output) | Execution success is distinct from the report's contents; full results and a summary are separate. | A completed research job can find contradictory or insufficient evidence. Completion must not mean allegation confirmed. |
| [Cortex `Analyzer.report`](https://github.com/TheHive-Project/cortexutils/blob/master/cortexutils/analyzer.py) and [`Responder.report`](https://github.com/TheHive-Project/cortexutils/blob/master/cortexutils/responder.py) | Source code returns structured reports and operation lists. | Keep evidence, rendering and requested actions explicit. These classes are precedents, not an approval boundary: both can carry operations. |
| [in-toto Statement v1](https://github.com/in-toto/attestation/blob/main/spec/v1/statement.md) | A statement identifies its immutable subject by digest. | Bind a research record to the actual preparation inputs. A digest identifies bytes; it does not prove a claim, retrieval time or approval. |

Cortex source and in-toto specification were inspected at their moving branches on the research date; no code was copied or installed. Cortex's permissive error text and swallowed summary exceptions are not patterns to copy. Our existing sanitized failures and explicit incomplete outcomes remain appropriate.

ARF and related reporting RFCs describe report formats and operational practices. They do not prescribe our TypeScript names, a three-check research record, a search vendor or a human-approval implementation. Those remain project choices. No JCS, attestation framework, new queue or rules engine is justified for this increment.

## Ticket 18: separate execution, evidence and readiness

The current Flue agent registers only `find_shared_passages`. A host agent's search tools are not automatically available inside Flue. The current library catalogue selects published channels; it does not check a live channel or execute report preparation.

The smallest practical route is to use the operator's existing AI host for targeted research first. It can follow the portable reporting guide and return attributed observations. This is already possible without adding a Flue web tool. However, importing a record marked `completed` cannot prove that research ran. A standalone validator would implement part of ticket 18, not satisfy its full executable workflow.

Preserve existing `SourceNote` semantics: supplier claims, `caller_supplied_note`, `verification: 'not_performed'`. A separate preparation record may reference those notes without upgrading their authority. Native execution would additionally need an actual research capability and runtime-owned retrieval records. Whether that capability needs a new dependency or credential depends on the selected integration; neither is assumed here.

Suggested names and ownership for the implementation preview:

| Proposed name | Responsibility |
|---|---|
| `ReportPreparation` | One provider, resource, requested action and exact reviewed evidence inputs. Reuse `provider`, `serviceRole` and resource kinds from reporting candidates. |
| `ReportResearch` | Research execution or explicitly supplied account, with provenance and checks for allegation, provider relationship and current channel. |
| `evaluateReportReadiness` | Pure library decision returning readiness for operator review or explicit hold reasons. It does not perform research or approve sending. |
| `prepareReport` | Future effectful command/orchestrator that obtains research and produces a draft. Its host belongs in `cli/` or `agent/` according to the chosen executor. |
| `lib/src/reporting/report-research.ts` | Proposed owner of the reusable record and validation, beside the existing catalogue. No general workflow framework. |

Use named fields for the three required check subjects, with discriminated results, rather than an array that permits duplicates and missing subjects. Sources can remain a bounded array referenced by IDs; no search index is needed. Preserve `retrievedAt`, `evidenceIds` and `serviceRole` where their existing meanings apply. The catalogue's `checkedAt` is not evidence of a fresh reporting-time check.

A check must support the proposed wording and action. For example, a qualified request that Resend investigate a documented lead need not prove Resend handled the email. Requiring every relationship to be `confirmed` would contradict the accepted reporting policy. Contradictions must remain visible and unsupported allegations must be removed or held.

`EmailAnalysis.source.sha256` identifies original message bytes. It must not be called `analysisSha256`: notes and lookup results can change while that digest stays identical. Bind the actual analysis, research request and resulting draft separately. Hashing exact retained bytes avoids inventing JSON canonicalization. The outgoing payload includes recipients and disclosures, not just body text. Any payload change invalidates its approval; material claim or target changes also require checking research applicability. A cosmetic edit need not repeat web research, but still needs approval of the changed payload.

## Implementation decisions still needed

Choose the research executor and permitted destinations before building its runtime. Candidate destinations remain prohibited; official sources can still redirect or contain untrusted instructions. Define public query terms, redirect handling, failure outcomes and disclosure limits at that boundary.

Record one preparation per provider, as the reporting guide already requires. Keep records private and repo-local if persisted. A storage file path and retention policy remain to be selected; the planned case database is not implemented. No arbitrary same-day freshness rule is proposed. Research must occur for each requested preparation, with its applicability assessed against the actual draft.

Acceptance must include a failed-research hold, a qualified investigation request, changed-input and changed-payload handling, no send operation, and proof that routine analysis never invokes research. Schema tests alone cannot establish that a host actually performed research.

## Independent opinions and limits

Claude and Grok independently recommended separate increments and existing-host research before a native Flue search integration. Their temporary reports are `/tmp/angry-carp-next-tickets-claude.md` and `/tmp/angry-carp-next-tickets-grok.md`; this note preserves the actionable conclusions without requiring those files.

The synthesis corrects their initial proposals: domain comparisons do not prove ownership; a new record type cannot authenticate research; the original-message digest is not an analysis digest; qualified reporting leads need not become proven custody; and RFC 7489 is superseded. Both accepted the relevant corrections. My own suggested catalogue field name was wrong: the implementation uses `checkedAt`, which should be retained. No implementation, assessment model call, candidate-site request or report submission was performed during this research.

## Reopened failures, 2026-09-23

The premise tested for issue 22 was that an instruction-only correction would reliably prevent unsupported relationship claims in free-form assessments. The rerunnable private census is `evidence/diagnostics/ticket22-census.mjs`. It locates the disputed wording by producer, not by a pass/fail word blacklist. The reviewed input, runtime findings and local instructions contained no "unrelated" occurrence. The latest full model output contained one unsupported occurrence. Earlier synthetic baselines failed once in four responses; the revised instructions failed zero times in four. These small, differently scoped samples do not establish a causal rate.

Claude proposed that a negative rule competed with the instruction to explain combined evidence. This remains a hypothesis. We replaced the existing rule with positive evidence-linked naming and kept the input and model fixed for a paired replay. We declined a proposed `registrationDomains` rename: `compareDomains.relationship` describes full canonical hostname relations, not registration boundaries. No new classifier, keyword filter, model pass or brand-ownership assumption was added.

The RDAP diagnosis is stronger. A wrapper around the actual analyzer's fetch recorded HTTP 200 for one Verisign query and `ECONNRESET` after 13 ms for the image-domain registry query. Discovery had succeeded. The failed query was initially budget-skipped, so its first request consumed the single recovery batch. No retry was possible despite unused request capacity. Direct control requests sometimes succeeded; either domain could reset, and requesting connection closure did not eliminate the symptom. The cause of the peer reset remains unknown. The analyzer's missed recovery opportunity is independently reproduced by an offline regression test.

[Node's reused-socket documentation](https://nodejs.org/docs/latest-v24.x/api/http.html#requestreusedsocket) describes one possible source of `ECONNRESET`, but this fetch trace does not establish socket reuse. [RFC 9110 section 9.2.2](https://www.rfc-editor.org/rfc/rfc9110.html#section-9.2.2) permits retrying idempotent requests after communication failure and advises against automatically retrying a failed automatic retry. Recovery now counts attempts per check within the existing family budget. Each check gets at most two attempts, the HTTP ceiling stays 48, and the deadline stays 45 seconds. Plan-ordered rounds preserve target selection independently of completion order. The code links the RFC where it enforces the retry cap; no upstream retry implementation was copied.

The regression test failed before the change and passes afterward. Its cases cover a deferred reset followed by success, persistent resets, HTTP 429, invalid JSON, and cancellation before the IP family. The latter prevents later network dispatch. Existing partial-DNS tests continue to verify that recovery cannot erase earlier observations. `connection_reset` is a fixed diagnostic label; raw exceptions remain private.

Claude reviewed the implementation and the comment policy. We expanded the bootstrap's short reuse/cancellation contract and removed redundant assertions and an intermediate object from report preparation. We retained the existing rule that JSDoc explains behavior absent from the types, rather than repeating parameter and return types above every function.

## Structured assessment and retry precedents

Claude's follow-up inspected [Undici RetryHandler](https://github.com/nodejs/undici/blob/main/lib/handler/retry-handler.js) and [p-retry](https://github.com/sindresorhus/p-retry/blob/main/index.js). Their retry state belongs to a request or operation. The analyzer also allocates a shared budget across a preselected plan. Adding either client would not remove that responsibility. The recovery loop therefore reuses `runBounded` and the recorded previous result. Only a budget-skipped first attempt can be requeued after a failure; a real previous outcome identifies a retry and prevents another attempt. No separate attempted set is needed.

Two positive instruction rewrites still failed full-pipeline assessments. The user approved [ADR 0016](../adr/0016-render-recorded-assessment-evidence.md): the model selects a structured conclusion and existing evidence IDs, and the runtime renders recorded facts. Flue's documented `useDataWriter` and terminating tool provide this in the current operation. `harness.prompt` would add a separate operation and was rejected. A finish-hook retry is also omitted; missing structured output is an explicit failure rather than another inference request.

[Cortex's analyzer](https://github.com/TheHive-Project/cortexutils/blob/master/cortexutils/analyzer.py), read on 2026-09-23, returns structured taxonomy fields and separates summary from full output. This is a precedent for separating judgment from presentation, not evidence for our concern labels or their accuracy. Its unknown-level fallback is not adopted. The new schema rejects invalid values. Native lifecycle tests verify that the data survives termination and that accompanying invented prose never appears in CLI output.

The final structured Bifrost run completed in 20.085 seconds with all domain RDAP queries found. Its High/moderate impersonation selection displayed the previously supplied product statement through `--source-notes`; no fresh official-page retrieval occurred. The [issue record](../planning/issues/22-preserve-domain-relationship-uncertainty.md) retains both failed prompt experiments and successful structured-output gates. This verifies recovery opportunity and output ownership, not a permanently reliable registry or a calibrated model verdict. Claude closed the bounded implementation review. Grok's pane remained unavailable at its usage limit.
