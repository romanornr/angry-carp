# Find Angry Carp's workflow and architecture

Labels: wayfinder:map

## Destination

An evidence-backed workflow and architecture specification for manually operated phishing investigation and reporting across coding agents. The specification includes a domain glossary and warranted ADRs, and leaves no essential decisions unresolved before implementation begins.

## Notes

- The operator selected Flue with Pi's existing ChatGPT browser OAuth flow. Reusing exact Codex tokens is not required, and a custom Codex CLI-to-Flue model adapter is excluded. The operator approved the local credential store at `agent/auth.json`, ignored by Git. Browser login and local logout succeeded on 2026-09-22. The [local integration README](../../agent/README.md) owns authentication commands, storage details, and verification limits.
- Prepared email text can now be assessed using the assessment instructions. `agent/src/agents/phishing-triage.ts` now registers the authenticated Pi provider and loads only `phishing-triage.md`. A first live assessment through Flue completed. `agent/src/triage-cli.ts` now accepts a prepared-text file and prints the final answer once, replacing the verbose `flue run` entry point. The model starts without filesystem, shell, browser, or mailbox tools. The operator excluded additional synthetic-agent trials, scratchpads, and authentication test stages.
- Gmail tools remain unconnected. Composio browser authorization remains a candidate for later acquisition; this does not authorize connecting an account or mailbox inspection. The earlier [Codex login investigation](../research/codex-login-reuse.md) is historical capability evidence, superseded as the selected authentication route.
- [Choose the manual runtime and state ownership](issues/05-choose-manual-runtime-and-state-ownership.md) records the selected starting point: an agent already connected to email, with reusable Rust case operations and SQLite where available. This supersedes mandatory Rust mailbox acquisition. Connector disclosure and evidence transfer need validation; standalone acquisition and a custom runner are deferred.
- Current reset: the first importer has been withdrawn and preserved privately outside the repository. Revisit the domain, data structures, and operator experience from the agreed requirements. Do not treat its manifest format, named batches, CLI commands, schema, or identity rules as constraints on the replacement. Earlier experiments remain capability evidence, not product designs.
- The operator selected an agent-guided experience, with direct terminal operation also supported. Discuss concrete domain scenarios and surface consequential assumptions before coding. Prefer a few complete workflow tests, add focused regressions for concrete failures, and enable Clippy's cognitive-complexity lint when implementation resumes.
- The operator wants to understand the engineering as decisions are made. Explain component responsibilities, alternatives, data relationships, and failure behavior before implementation. Do not repeatedly ask settled workflow questions. Group genuinely open questions into rounds of about five when enough independent questions are ready.
- The operator accepted incremental checking first through the agent's existing email connection. The initial trial covers Inbox and Spam over 14 days, capped at ten messages. Preserve successful-check records and pending failures, show remaining coverage, and keep ordinary-message content temporary. Larger backlog runs and Rust screening are deferred candidates for evaluation. These are design decisions, not authorization for a new live run.
- the operator chose specification first, without building a pilot in this effort.
- The first usable version runs manually. Unattended daily operation and an intelligence dashboard are later work.
- The operator selected local execution initially. Cloudflare may be considered later. Flue is selected for the local analyst runner; Workers compatibility remains unverified.
- Every prepared report requires the operator's approval in the first version, including High-confidence reports. Automatic sending is a later goal; classification and sending authority are separate.
- Prefer established tools and services where they meet the requirements. Internal dependencies remain open.
- The operator subsequently selected Rust as the preferred language for scripts and reusable implementation, partly for possible future Workers reuse. Local filesystem, process, and storage dependencies must stay separate from reusable logic; Workers deployment remains deferred.
- The operator clarified the implementation direction: one reusable agent-independent CLI, callable by Codex, Claude, omp, or another LLM. Portability does not require shared live cloud state. Model APIs are an acceptable option, not a required embedded runtime.
- The operator accepted useful downloadable skills and Markdown without the CLI. The [runtime and state ownership decision](issues/05-choose-manual-runtime-and-state-ownership.md) tracks packaging, host capabilities, and the optional local runner.
- The outcome is useful abuse reporting and accurately recorded provider action. Recipient-specific blocking and infrastructure takedown are different outcomes.
- Investigation and submission boundaries are recorded in [Define investigation and reporting boundaries](issues/02-define-investigation-and-reporting-boundaries.md). They describe the future system and do not authorize scans or reports during planning.
- The operator authorized rewriting the repository routine and continuing with bounded capability checks and a synthetic walkthrough. This does not authorize live abuse reports, scan submissions, label migration, deployment, or changes to the installed Grok routine. Any test send still requires review of its exact payload.
- The current capability check is limited to mailbox export, Spam coverage, and synthetic storage recovery. The operator explicitly excluded sending because of duplicate-report risk. See the [bounded findings](../research/manual-capability-check.md).
- Consult domain-modeling, principle-model-the-domain, principle-redesign-from-first-principles, wayfinder, and grill-with-docs. The last invokes grilling and domain-modeling. Use research for external facts, technical-writing for documents, and unslop for prose.
- Design from the agreed domain and safety requirements. The existing Grok routine provides experience and migration inputs, but does not determine the new architecture.
- Keep repository documents, templates, and flows reusable by different operators. Use the glossary's operator role and configured reporting identity, signature, mailbox, and timezone; keep personal identity and private evidence outside shared repository content.
- No issue tracker is configured in this repository. This maintained map uses the wayfinder local-Markdown convention in docs/planning. Temporary experiments belong outside these durable planning records. Each child issue lives in `issues/`; its metadata identifies its status, assignee, and dependencies.
- Preliminary research is in [Grok capabilities](../../docs/research/grok-capabilities.md) and [phishing evidence options](../../docs/research/phishing-evidence-options.md). These are evidence, not accepted architecture decisions.
- The operator authorized replacing the reporting Markdown in full. [Provider abuse reporting](../../provider-abuse-reporting.md) is the canonical replacement, with a new name and description, natural recipient-facing correspondence, and the agreed evidence and approval rules. This changes repository instructions, not a deployed Grok routine.
- Ground the workflow specification in the [existing template and sent-report review](../../docs/research/existing-report-workflow-review.md). Preserve established behavior where appropriate and identify deliberate changes instead of asking the operator to rediscover the current workflow.
- Domain terms live in [CONTEXT.md](../../CONTEXT.md). Architectural decisions belong in [docs/adr/](../../docs/adr/).
- The operator wants complete source emails retained privately for possible future pattern analysis, evaluation, or training. The retention boundary is in [Preserve complete original messages privately](../../docs/adr/0003-preserve-original-messages.md). SQLite now supplies local storage; production schema, retention, and backup details remain to be implemented.

## Decisions so far

- [Separate assessment from reporting](../adr/0007-separate-assessment-from-reporting.md): the local prompt loads only triage instructions and returns Assessment, Evidence, Checks and gaps, and Next action. The [standards reference](../standards-and-reporting.md) records RFCs, ICANN guidance, and provider sources outside the model prompt. External lookup tools remain unimplemented.

- [Decide ordinary-mail retention](issues/12-decide-ordinary-mail-retention.md): acquisition does not authorize retaining ordinary-email content.

- [Define when a case begins](issues/11-define-when-a-case-begins.md): acquiring an ordinary email does not create a case.

- [Use SQLite for local case storage](../adr/0006-use-sqlite-for-local-case-storage.md): keep original bytes and case records together locally. Whether originals should ever move to cloud storage remains undecided.

- [Choose mailbox labels and report memory](issues/10-choose-mailbox-labels-and-report-memory.md): four descriptive labels preserve flagged, review, and reported visibility; accessible recipient-specific records prevent duplicate reports.

- [Compare established mailbox and analysis capabilities](issues/01-compare-mailbox-and-analysis-capabilities.md): existing Gmail capabilities can acquire evidence; connector completeness and client suitability need verification before architecture selection.
- [Define investigation and reporting boundaries](issues/02-define-investigation-and-reporting-boundaries.md): automatic private scans may use privacy-checked page URLs; direct candidate fetches are prohibited, and every report requires approval initially.
- [Define defensible evidence and campaign claims](issues/03-define-evidence-and-campaign-claims.md): email evidence can support reports; provisional campaign links require strong evidence, and mailbox and external activity remain separate observations.
- [Establish registrar escalation requirements](issues/07-research-registrar-escalation.md): ICANN escalation needs prior contact and a supported handling complaint; workflow waits are not contractual takedown deadlines.
- [Define case work and provider outcomes](issues/04-define-case-and-provider-outcomes.md): repeated samples can share a case with separate provider actions; record scoped outcomes, avoid duplicate removal counts, and use bounded follow-ups before escalation assessment.
- [Define report evidence and approval](issues/06-define-report-evidence-and-approval.md): retain private originals, disclose only necessary evidence to verified desks, and require explicit reviewed approval for complete originals.
- [Evaluate Unicode and phishing detection research](issues/09-evaluate-phishing-detection-research.md): research and an offline experiment informed the accepted comparison of local observations, one LLM, and their combination; no detector or runner is selected.

## Not yet specified

The acquisition/case distinction and ordinary-mail retention boundary are recorded. The next engineering discussion must connect mailbox acquisition, disclosure-safe AI input, source identity, and durable case operations without inheriting the withdrawn importer's choices. The exact automatic case-opening trigger remains unconfirmed; opening a case itself never authorizes sending.

The [manual workflow draft](../../docs/manual-workflow.md) now covers acquisition, assessments, provider coordination, evidence preservation before reporting, approval, interrupted submissions, replies, and handoff from an existing routine. [ADR 0005](../../docs/adr/0005-keep-report-authority-in-case-operations.md) records authority in reusable case operations. The [independent review response](../../docs/research/independent-review-response.md) separates incorporated findings from open storage, client, and runner proposals. These artifacts do not close the runtime or interface tickets.

- How to turn the [research evaluation proposal](../../docs/research/phishing-detection-design.md#evaluation-protocol-to-specify-next) into an agreed benchmark, including historical evidence access, labeling, sample sizes, and acceptance criteria.
- Validation of the proposed operator experience for reviewing ambiguous cases, correcting mistakes, and resuming interrupted work.
- The smallest specification and validation artifacts needed once the architecture is chosen.

## Out of scope

- Implementing or deploying the system during this planning effort.
- Unattended operation and an intelligence dashboard in the first usable version. Preserve useful case facts without designing these later systems now.
- Automatic report sending in the first usable version. The initial workflow prepares reports for the operator's approval.
- Training a model or publishing a dataset in this effort. Preserve original evidence so future work can assess those options separately.
- Identifying a real-world attacker from shared domains, infrastructure, or email similarities alone.
- Offensive action against suspected infrastructure. Provider reporting is the intervention.
