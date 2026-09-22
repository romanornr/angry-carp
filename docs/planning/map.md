# Find Angry Carp's workflow and architecture

Labels: wayfinder:map

## Destination

An evidence-backed workflow and implementation for manually operated phishing investigation and reporting across coding agents. Record the domain and consequential decisions before each agreed increment. Local assessment works; acquisition, case operations, and submission remain future work.

## Current implementation, 2026-09-22

- The standalone [CLI](../../cli/README.md) calls the reusable analyzer for original-message parsing, local checks, bounded DNS/RDAP, findings and reporting candidates. Optional [Flue assessment](../../agent/README.md) receives selected analysis fields plus reviewed text through Pi OAuth. Only Winnowing remains a model-directed follow-up tool.
- `phishing-triage.md` stays portable. Flue-specific tool contracts live under `agent/`, as clarified in [ADR 0004](../adr/0004-distribute-workflow-independently.md).
- Private evidence remains in ignored files. Flue conversations record assessments; the SQLite case store selected in [ADR 0006](../adr/0006-use-sqlite-for-local-case-storage.md) is not implemented. No mailbox, web search, official-page retrieval, or report-sending tool is connected.
- The operator approved the [2FA Directory lookup](../brand-references.md), now implemented with a verified public snapshot and manual update guide. [DNS catalogues and threat feeds](../research/dns-reference-and-threat-lists.md) remain proposals. No MetaMask, HaGeZi, or AdGuard dataset is installed.
- Local tests verify tool behavior. No benchmark establishes parity with a model-only assessment or a human-assisted web investigation. Eclat, MinHash, CUSUM, training, and automatic matching against stored mail remain unimplemented.

## Notes

These notes retain earlier workflow choices. The current implementation above and later decisions in the linked issues supersede earlier runner and language assumptions.

- [Issue 13](issues/13-define-model-independent-email-analysis.md) records the implemented analyzer. [ADR 0012](../adr/0012-separate-cli-from-flue.md) separates the standalone CLI from Flue. Remaining behavior gaps are listed under Analyzer follow-up below.

- The operator selected Flue with Pi's existing ChatGPT browser OAuth flow. Reusing exact Codex tokens is not required, and a custom Codex CLI-to-Flue model adapter is excluded. The operator approved the local credential store at `agent/auth.json`, ignored by Git. Browser login and local logout succeeded on 2026-09-22. The [local integration README](../../agent/README.md) owns authentication commands, storage details, and verification limits.
- Prepared email text can now be assessed using the assessment instructions. `agent/src/agents/phishing-triage.ts` now registers the authenticated Pi provider and loads `phishing-triage.md`; reporting channels are now retrieved through the offline `lookup_reporting_channels` tool. A first live assessment through Flue completed. `agent/src/triage-cli.ts` now accepts a prepared-text file and prints the final answer once, replacing the verbose `flue run` entry point. The model starts without filesystem, shell, browser, or mailbox tools. The operator excluded additional synthetic-agent trials, scratchpads, and authentication test stages.
- Gmail tools remain unconnected. Composio browser authorization remains a candidate for later acquisition; this does not authorize connecting an account or mailbox inspection. The earlier [Codex login investigation](../research/codex-login-reuse.md) is historical capability evidence, superseded as the selected authentication route.
- [Choose the manual runtime and state ownership](issues/05-choose-manual-runtime-and-state-ownership.md) records the selected starting point: an agent already connected to email, with reusable Rust case operations and SQLite where available. This supersedes mandatory Rust mailbox acquisition. Connector disclosure and evidence transfer need validation; standalone acquisition and a custom runner are deferred.
- The first case importer was withdrawn and preserved privately outside the repository. Revisit its domain, data structures, and operator experience before replacing it. Do not treat its manifest format, named batches, CLI commands, schema, or identity rules as constraints. Earlier experiments remain capability evidence, not product designs.
- The operator selected an agent-guided experience, with direct terminal operation also supported. Discuss concrete domain scenarios and surface consequential assumptions before coding. Prefer a few complete workflow tests, add focused regressions for concrete failures, and enable Clippy's cognitive-complexity lint when implementation resumes.
- The operator wants to understand the engineering as decisions are made. Explain component responsibilities, alternatives, data relationships, and failure behavior before implementation. Do not repeatedly ask settled workflow questions. Group genuinely open questions into rounds of about five when enough independent questions are ready.
- The operator accepted incremental checking first through the agent's existing email connection. The initial trial covers Inbox and Spam over 14 days, capped at ten messages. Preserve successful-check records and pending failures, show remaining coverage, and keep ordinary-message content temporary. Larger backlog runs and Rust screening are deferred candidates for evaluation. These are design decisions, not authorization for a new live run.
- The initial planning effort was specification-only. The operator subsequently approved local assessment and tool increments.
- The first usable version runs manually. Unattended daily operation and an intelligence dashboard are later work.
- The operator selected local execution initially. Cloudflare may be considered later. Flue is selected for the local analyst runner; Workers compatibility remains unverified.
- Every prepared report requires the operator's approval in the first version, including High-confidence reports. Automatic sending is a later goal; classification and sending authority are separate.
- Prefer established tools and services where they meet the requirements. Internal dependencies remain open.
- Rust was the earlier preference for reusable case operations. The operator subsequently approved TypeScript for the implemented Flue tools. Local filesystem, process, and storage dependencies must stay separate from reusable logic; Workers deployment remains deferred.
- The operator clarified the implementation direction: one reusable agent-independent CLI, callable by Codex, Claude, omp, or another LLM. Portability does not require shared live cloud state. Model APIs are an acceptable option, not a required embedded runtime.
- The operator accepted useful downloadable skills and Markdown without the CLI. The [runtime and state ownership decision](issues/05-choose-manual-runtime-and-state-ownership.md) tracks packaging, host capabilities, and the optional local runner.
- The outcome is useful abuse reporting and accurately recorded provider action. Recipient-specific blocking and infrastructure takedown are different outcomes.
- Investigation and submission boundaries are recorded in [Define investigation and reporting boundaries](issues/02-define-investigation-and-reporting-boundaries.md). They describe the future system and do not authorize scans or reports during planning.
- The operator authorized rewriting the repository routine and continuing with bounded capability checks and a synthetic walkthrough. This does not authorize live abuse reports, scan submissions, label migration, deployment, or changes to the installed Grok routine. Any test send still requires review of its exact payload.
- The earlier capability check covered mailbox export, Spam coverage, and synthetic storage recovery. The operator explicitly excluded sending because of duplicate-report risk. See the [bounded findings](../research/manual-capability-check.md).
- Consult domain-modeling, principle-model-the-domain, principle-redesign-from-first-principles, wayfinder, and grill-with-docs. The last invokes grilling and domain-modeling. Use research for external facts, technical-writing for documents, and unslop for prose.
- Design from the agreed domain and safety requirements. The existing Grok routine provides experience and migration inputs, but does not determine the new architecture.
- Keep repository documents, templates, and flows reusable by different operators. Use the glossary's operator role and configured reporting identity, signature, mailbox, and timezone; keep personal identity and private evidence outside shared repository content.
- No issue tracker is configured in this repository. This maintained map uses the wayfinder local-Markdown convention in docs/planning. Temporary experiments belong outside these durable planning records. Each child issue lives in `issues/`; its metadata identifies its status, assignee, and dependencies.
- Preliminary research is in [Grok capabilities](../../docs/research/grok-capabilities.md) and [phishing evidence options](../../docs/research/phishing-evidence-options.md). These are evidence, not accepted architecture decisions.
- The operator authorized replacing the reporting Markdown in full. [Provider abuse reporting](../../provider-abuse-reporting.md) is the canonical replacement, with a new name and description, natural recipient-facing correspondence, and the agreed evidence and approval rules. This changes repository instructions, not a deployed Grok routine.
- Ground the workflow specification in the [existing template and sent-report review](../../docs/research/existing-report-workflow-review.md). Preserve established behavior where appropriate and identify deliberate changes instead of asking the operator to rediscover the current workflow.
- Domain terms live in [CONTEXT.md](../../CONTEXT.md). Architectural decisions belong in [docs/adr/](../../docs/adr/).
- The operator wants complete source emails retained privately for possible future pattern analysis, evaluation, or training. The retention boundary is in [Preserve complete original messages privately](../../docs/adr/0003-preserve-original-messages.md). SQLite is selected for the future case store; its schema, retention, and backup details remain to be implemented.

## Decisions so far

- [Extract reusable checks](../adr/0008-extract-reusable-checks.md): `lib/` owns the five existing capabilities and their public data. Flue bindings call the package directly. The operator explicitly excluded an HTTP service from this migration.

- [Separate assessment from reporting](../adr/0007-separate-assessment-from-reporting.md): the portable four-section assessment remains available. [ADR 0011](../adr/0011-analyze-email-before-assessment.md) moves routine lookups and channel selection into the analyzer. [Selection and reporting limits](../email-analysis.md) describe current behavior.

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
- [Evaluate Unicode and phishing detection research](issues/09-evaluate-phishing-detection-research.md): research informed the implemented domain and passage comparisons. Flue is selected; a comparative detection benchmark remains open.

## Not yet specified

The acquisition/case distinction and ordinary-mail retention boundary are recorded. The next engineering discussion must connect mailbox acquisition, disclosure-safe AI input, source identity, and durable case operations without inheriting the withdrawn importer's choices. The exact automatic case-opening trigger remains unconfirmed; opening a case itself never authorizes sending.

The [manual workflow draft](../../docs/manual-workflow.md) now covers acquisition, assessments, provider coordination, evidence preservation before reporting, approval, interrupted submissions, replies, and handoff from an existing routine. [ADR 0005](../../docs/adr/0005-keep-report-authority-in-case-operations.md) records authority in reusable case operations. The [independent review response](../../docs/research/independent-review-response.md) separates incorporated findings from open storage, client, and runner proposals. These artifacts do not close the runtime or interface tickets.

- How to turn the [research evaluation proposal](../../docs/research/phishing-detection-design.md#evaluation-protocol-to-specify-next) into an agreed benchmark, including historical evidence access, labeling, sample sizes, and acceptance criteria.
- Whether to add a threat-list snapshot alongside the implemented 2FA Directory lookup. Preserve source, date, exact match scope, and relation type; catalogue association must not suppress threat evidence. These additional sources still require agreement.
- Validation of the proposed operator experience for reviewing ambiguous cases, correcting mistakes, and resuming interrupted work.
- The smallest specification and validation artifacts needed once the architecture is chosen.

## Out of scope

- Deploying the system or implementing beyond the operator's agreed increment.
- Unattended operation and an intelligence dashboard in the first usable version. Preserve useful case facts without designing these later systems now.
- Automatic report sending in the first usable version. The initial workflow prepares reports for the operator's approval.
- Training a model or publishing a dataset in this effort. Preserve original evidence so future work can assess those options separately.
- Identifying a real-world attacker from shared domains, infrastructure, or email similarities alone.
- Offensive action against suspected infrastructure. Provider reporting is the intervention.

## Deterministic analysis implementation, 2026-09-22

[Issue 13](issues/13-define-model-independent-email-analysis.md) now has a shared analyzer and standalone command, with optional private JSON and Flue interpretation over reviewed text. [ADR 0011](../adr/0011-analyze-email-before-assessment.md) records the ownership and disclosure decisions. Original-message acquisition and case lifecycle work remain separate.

## Analyzer follow-up

The first real-email comparison confirmed collection and exposed the following gaps. The package migration was followed by the implemented fixes below, verified with synthetic messages and offline transports. No automatic reporting is authorized.

| Issue | Status | Delivered scope |
| --- | --- | --- |
| [14: Preserve link-role uncertainty](issues/14-preserve-link-role-uncertainty.md) | Implemented | Unknown-purpose text links remain distinct; shared priority preserves MIME provenance. |
| [15: Justify reporting candidates](issues/15-justify-reporting-candidates-by-resource.md) | Implemented | Resource-specific subjects justify recipients; contacts alone do not. |
| [16: Display timing and authentication context](issues/16-display-registration-and-authentication-context.md) | Implemented | Stored registration dates, distinct claim domains and complete Unicode escaping. |
| [17: Independent brand-claim evidence](issues/17-supply-independent-brand-claim-evidence.md) | Implemented | Supplied reviewed source notes; no automatic source retrieval. |

[ADR 0013](../adr/0013-route-assessment-by-concerns-and-coverage.md) records automatic AI routing and bounded recovery. [Issue 18](issues/18-verify-evidence-during-report-preparation.md) defers the executable research/drafting runtime; mandatory reporting-time AI verification is already in the portable reporting workflow. Registration dates remain in the in-memory result and model projection; optional JSON export does not become mandatory storage.

The subsequent live retest retained High concern and included the image/action mismatch and qualified Resend lead. It completed with no model-directed tool calls. [Issue 19](issues/19-preserve-evidence-limits-in-ai-assessments.md) records remaining AI wording errors about provider roles and unexamined content. One RDAP lookup failed and remained visible in coverage; the run does not establish a defect in that lookup. The private comparison remains under ignored `evidence/emails/`. This single case does not establish detection accuracy across other mail.
