# Evidence limits in generated assessments

Investigated on 2026-09-22 against commit `4d09eaa` and the subsequent bounded correction. Claude and Grok were asked for independent research. This note separates observed behavior from explanations of why the model produced it.

Current decision: [ADR 0014](../adr/0014-keep-provider-routing-outside-ai-assessment.md) narrows the model's task and input. The initial prompt-only correction below failed a controlled replay and was superseded by that separation.

## What failed

The live assessment described a provider relationship as DNS/proxy even though the deterministic candidate specified DNS and the address lookup returned network registration. It also reassured the reader about the possible effect of unexamined HTML. The available evidence still supported High concern. Neither error required another candidate-site request to diagnose.

The model received `serviceRole`, `limitation`, coverage and lookup provenance. Those fields were not lost. However, the network-registration function's explanatory JSDoc was not part of its input, and the portable output instructions asked it to include only gaps that could change the conclusion or next action. Those are plausible contributors to over-inference, not a demonstrated account of the model's internal cause.

## Source meanings

- [RFC 9083, section 5.4](https://www.rfc-editor.org/rfc/rfc9083.html#section-5.4) defines IP network registration records. A retained network name, type and address range do not establish the service operating at an address.
- [Cloudflare proxy status](https://developers.cloudflare.com/dns/proxy-status/) explains that proxied records return Cloudflare addresses. That supports a possible explanation for an observed address; it does not make every Cloudflare-registered address proof of observed proxy behavior. Cloudflare's [Custom Domains documentation](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/) also describes a Worker acting as the origin.
- Unexamined content supplies no observation about its contents. An assessment can explain why the available evidence supports a conclusion while leaving that gap unknown. This is an evidence-handling choice, not a new RFC requirement.

Cloudflare documentation was consulted through Context7 and its official site. The RFC was read from the RFC Editor. These were documentation lookups, not fresh verification of the email's product claim or report preparation.

## Smallest correction

Reword the existing portable Checks and gaps instruction so unexamined content stays unknown and the conclusion rests on available evidence. Add one Flue-specific instruction to preserve the projection's provider roles and limitations, identify IP RDAP as network registration, and label broader attribution as inference with supporting evidence.

Claude initially proposed annotations on every network result and several additional instruction edits. After discussion, Claude accepted that this duplicates the same meaning without demonstrating a better result. The chosen correction adds no lookup, projection field, dependency, judge or second model pass. It permits supported inference rather than forbidding it.

The offline lifecycle tests can verify that assessment still runs and disposes correctly. They cannot establish that a model obeys the revised evidence rule. A live retest evaluates the observed wording; one successful answer remains a case result, not a general guarantee. [Issue 19](../planning/issues/19-preserve-evidence-limits-in-ai-assessments.md) records the outcome.

## Separate lookup-classification bug

Claude identified a reproducible error in `requestJson`: malformed JSON in a successful HTTP response reached the transport-error catch. The analyzer reported `request_failed` and retried it as transient. Its documented policy treats invalid responses as incomplete checks without an immediate retry.

A synthetic analyzer test reproduced the wrong classification before the fix. A catch scoped to JSON parsing now returns `invalid_response`. The test checks the returned gap, a single request, continued assessment routing and exclusion of response text. Stream and transport failures still follow their existing handling.

This does not explain the historical RDAP failure. One direct request to that registry endpoint subsequently returned HTTP 200 and a valid domain record in about 0.3 seconds. The historical error lacks the diagnostics needed to distinguish transport, body-read and parse failures. [Issue 20](../planning/issues/20-classify-malformed-lookup-json.md) records the reproduced defect without attributing the earlier failure to it.

## Reporting remains separate

[Issue 18](../planning/issues/18-verify-evidence-during-report-preparation.md) still covers an executable reporting-time research workflow. Correcting assessment wording does not supply current source verification or authorize a report. Routine analysis does not gain browsing from this change.

## Established designs and the implemented boundary

Rspamd's [processing architecture](https://github.com/rspamd/docs.rspamd.com/blob/master/docs/developers/architecture.md) and [scan-result interface](https://github.com/rspamd/docs.rspamd.com/blob/master/docs/getting-started/understanding-rspamd.md) separate message analysis from the MTA that handles its structured result. We reuse that separation of responsibilities, not Rspamd's score thresholds, server architecture or rules engine. These are implementation precedents, not proof that our detector has comparable accuracy.

Anthropic's [Building effective agents](https://www.anthropic.com/engineering/building-effective-agents) distinguishes predefined workflows from model-directed tasks and recommends simple compositions when they suffice. Our application of that advice is to keep known provider-role and route selection in code, with one model assessment for the open-ended interpretation of deception evidence. We add no agent framework, second judge or output-repair loop. No RFC prescribes this task boundary or guarantees factual prose.

The data structure remains the existing typed analysis record. `analysisForModel` constructs a smaller view without `reportingCandidates` or `networks`; the full record is unchanged. Domain events, evidence references and explicit lookup failures remain. `formatAnalysis` renders roles, route conditions and sources, plus network records labelled as registrations rather than service identification. Observed IP literals in an email remain observations; the omission is of looked-up network records, not a general IP-address filter.

Claude and Grok agreed on the data subtraction and deterministic rendering. Claude initially preferred keeping the portable workflow with a conditional clause. Grok supported a dedicated local assessment document. After reviewing the narrower task, Claude also accepted the local document and identified retained requirements for operator-reference provenance and concern calibration. We chose that document rather than parse Markdown headings or load the reporting duty and attempt to cancel it with more prose. Both instruction documents retain the same concern meanings; maintaining that overlap is an explicit cost in ADR 0014.

## Replay and remaining limits

The first prompt-only replay reused the already-disclosed record with five successful network lookups. It still said "proxy addresses", so it did not close issue 19. A separate live rerun had lookup failures and therefore could not test that successful-network branch.

The scoped replay removed exactly the two attribution fields from the earlier disclosed input and loaded `agent/phishing-assessment.md`. Reviewed text and retained evidence values were unchanged; no DNS/RDAP or source retrieval ran. It retained High concern, image/action reasoning and registration chronology, described unsupported content as unexamined, and did not reconstruct proxy/hosting roles or report recipients. It exited naturally in 35.676 seconds. The record is private under ignored `evidence/emails/`.

This verifies one output with the combined input/task change. It does not isolate the contribution of either change or establish a general hallucination rate. Offline tests verify the actual production projection and rendering, including preservation of failed IP checks. Provider information explicitly supplied in reviewed text or notes can still reach the model; the projection is not a semantic redaction system.

Later isolated lookup calls failed at IANA discovery before a registry request. A direct request to `data.iana.org` produced Node's `ENOTFOUND` cause. That is a reproducible environment/dependency failure at that time, not proof that the earlier historical failure had the same cause. [Issue 21](../planning/issues/21-handle-rdap-discovery-unavailability.md) records the remaining availability work.

## Full-command retest and follow-up tickets

The normal Flue command ran again at 2026-09-22T22:24Z with the same original-message and reviewed-text hashes. It performed current DNS/RDAP checks and one AI assessment, exited normally in 31.453 seconds, and made no model-directed tool calls. Inspection of that conversation's submitted analysis confirmed that network record bodies and reporting candidates were absent. Their deterministic terminal sections remained present.

The answer retained High concern, the image/action mismatch, registration dates and the supplied official-source contradiction. It did not reconstruct proxy/hosting roles or recipients. The FAQ was not freshly retrieved. Different lookup outcomes and model variation prevent interpreting elapsed time as a controlled performance result.

One domain RDAP check failed with `request_failed`, while three domain and five IP lookups succeeded. The saved display and projection discard the failed endpoint even though the complete in-memory result retains it. They cannot establish the failing stage. One instrumented call through `lookupRdap` at 22:30:40.712Z subsequently recorded IANA HTTP 200, registry HTTP 200 and `found`. Its fetch wrapper allowed only the IANA and registry hosts. It inspected no email or credentials and made no model or candidate-site request.

The current lookup functions fetch discovery on every invocation. [RFC 9224 section 8](https://www.rfc-editor.org/rfc/rfc9224.html#section-8), checked on 2026-09-22, recommends caching with HTTP freshness signaling. This supports examining reuse; it does not diagnose the failed run. Issue 21 now covers showing the existing endpoint, bounded transport categories, and discovery reuse with explicit cancellation and freshness ownership. A short run does not override HTTP cache directives. Failed or expired loads can require more than one retrieval per bootstrap URL.

The answer also called a different sender domain "unrelated" without relationship evidence. [Issue 22](../planning/issues/22-preserve-domain-relationship-uncertainty.md) tracks that smaller inference error separately from the implemented provider-role boundary. It does not invalidate the product-contradiction evidence or justify another lookup by itself.

Claude independently recommended reusing the existing endpoint for failure diagnostics, bounded error categories and run-owned discovery reuse. Claude also recommended a separate low-priority relationship ticket rather than reopening issue 19. The exact error union and cache API remain proposals. We did not adopt the claims that a short run needs no freshness policy or that success-only caching guarantees at most three retrievals.

Grok independently reached the same ticket split and recommended a narrower initial classification for `ENOTFOUND` and `EAI_AGAIN`, leaving other transport failures unknown. Grok also recommended displaying the retained endpoint and reusing discovery within a run. Both proposals must preserve HTTP freshness directives and shared-request cancellation ownership; run scope alone does not establish either property. A domain comparison does not establish common or separate ownership, even when it carries a source label. Independent source evidence must support any broader relationship claim.

No implementation changed during this follow-up. Report-preparation research remains deferred under issue 18; fresh authentication and unsupported HTML remain disclosed scope limits.
