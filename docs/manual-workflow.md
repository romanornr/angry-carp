# Manual workflow specification

Status: draft for design review. The first importer implementation has been withdrawn. Its manifest format, data structures, commands, and schema are not an accepted baseline. This document records requirements and proposals for review, not implemented capabilities. Rust and local SQLite remain agreed choices.

The operator starts a run, reviews unresolved cases and proposed reports, and receives a summary of coverage and provider actions. Runs resume private case history. They do not depend on remembering a previous agent conversation.

The [domain glossary](../CONTEXT.md) defines the records. [Provider abuse reporting](../provider-abuse-reporting.md) owns recipient selection, evidence disclosure, report wording, approval, and follow-up rules. Host packages reference that guide rather than copy its templates. The [architecture comparison](architecture-options.md) explains the alternatives.

## Available modes

| Mode | Useful work | Limits that must be visible |
| --- | --- | --- |
| Downloaded instructions with existing connectors | Inspect available evidence, assess concerns, draft reports, and guide operator review. | Report actual acquisition, storage, preview, and delivery capabilities. Instructions alone cannot enforce tool restrictions or durable approvals. |
| Instructions with reusable local case operations | Accept supplied originals, extract inert evidence, maintain cases, prepare reports, and resume approved work. | Verify evidence transfer from the connector. A calling agent's unrelated tools remain subject to its host's restrictions. |
| Local case operations with an optional analyst runner | Perform the same workflow through a configured model interface. | The runner remains unselected. Model access and inference location require separate configuration. |

An instruction-only run remains useful when a capability is missing. It must hold the affected operation and state the limitation. For example, a connector summary can support a preliminary question, but cannot be labeled a complete original or establish an unexposed header value.

The selected initial entry point is an agent already connected to email. A separate Angry Carp Gmail login or Rust mailbox scanner is not required. Verify what the connector exposes to the model and how it transfers originals before claiming compliance with the AI disclosure policy. Local filtering after a connector response cannot remove information the model has already received. Standalone mailbox acquisition remains deferred.

## Start and resume

At startup, show the configured mailbox or supplied message files, acquisition scope and interval, private evidence location, reporting identity, timezone, and available operations. Distinguish intended coverage from coverage actually verified with the connector. In particular, do not promise Spam coverage from an inbox-only search.

The operator selected a first-run trial of Inbox and Spam within the last 14 days, initially capped at ten messages. Present that scope before the real run. This design choice does not authorize mailbox inspection during planning.

Use the agent's existing email connection for incremental checking. Remember successful checks by mailbox and provider message identity. Resume unfinished messages and discover new messages with a small overlap in the search interval, skipping completed checks. A last-checked timestamp alone cannot establish completion. Preserve failures for retry, and show messages left unchecked by the trial limit as a coverage gap. The exact overlap and checkpoint representation remain implementation decisions to validate against the connector.

A one- or two-month backlog run is an optional later feature. Rust screening before AI review is also deferred until an evaluation establishes its reliability and benefit. Neither is required for incremental checking. Ordinary-message content is temporary intake, not an archive; retain complete originals when needed for an investigation.

Show unfinished work before starting new investigations: uncertain sends, provider evidence requests, due follow-ups, operator questions, unsent drafts, and acquisition gaps. An operator can stop at any point. The next run resumes those records without treating a partial run as completed work.

Use one active writer for a private case workspace initially. In software mode, reject a competing run before it can reserve or submit an action. Instruction-only mode requires an operator-coordinated handoff and cannot claim an enforced lock. Separate operators use separate workspaces.

Budgets cap assessments, worked cases, submissions, external lookups, and model usage. Persist consumed amounts across restarts. Exhaustion leaves work pending with a reason. It does not classify skipped messages Low or advance past unrecorded discovery work.

The historical routine's limits of 50 new assessments, five worked cases, five new reported cases, and 20 submission attempts per configured calendar day are inputs for setting defaults. They are not yet accepted defaults for the new manual workflow. Scan and model limits also need explicit values before enabling those operations.

## Acquire and preserve messages

Enumerate the selected interval with complete pagination and record message identities durably before advancing the discovery checkpoint. Keep failed downloads pending by identity. Reprocessing an overlapping interval must not create duplicate source messages. Identify a message by its mailbox and provider message ID, or a documented import identity for supplied files, rather than its subject or sender.

Keep acquired originals unchanged while deriving evidence. Retain originals needed for investigations privately outside Git, with acquisition method, time, and integrity digest. Ordinary-email content must not remain archived merely because it was acquired for assessment. The temporary handling mechanism and minimal processing records need an engineering design. A digest establishes later byte consistency, not sender authenticity. If an export is incomplete or transformed, record that limitation and do not label it an unchanged original.

When a download or parse fails, continue with other selected messages, retain the failure for retry, and show the coverage gap. Never classify unreadable content as Low or mark it successfully assessed.

Parse message text, headers, literal links, and attachment metadata as inert data. Disable remote content and active rendering. Retain source offsets or other stable references for observations. Keep source links, decoded values, and externally observed redirects distinct. Malformed messages and unsupported encodings remain visible as extraction failures.

Acquisition does not authorize moving mail, changing read state, or deleting anything. Optional Gmail labels can summarize recorded work under a separately configured mutation policy. The legacy routine's folder changes do not become defaults here.

The [accepted Gmail label design](gmail-labels.md) uses phishing-flagged, phishing-review, phishing-reported, and abuse-reports. Reported means at least one confirmed external submission; review can coexist when another report awaits approval. Both instruction-only hosts and reusable software need accessible recipient-specific history to avoid duplicate reports. Live migration remains a separate operational step.

## Assess and connect cases

An assessment records the proposed classification, concrete evidence references, contrary evidence, unresolved questions, and analyst identity or configured model version. Local observations can prioritize review. Their score is not proof of phishing.

| Assessment | Next step |
| --- | --- |
| High | Prepare a report when the evidence supports concrete deception and a provider's relevant role is established. Sending still needs approval. |
| Medium | Preserve the specific concern and ask the operator a focused question or identify missing evidence. Do not prepare an accusation from weak clues alone. |
| Low | Record the assessment and its scope. Ordinary unfamiliar mail requires no abuse report. |

Reassessment creates a revision with its reason. It must not rewrite source evidence or erase a previous report. If new evidence undermines an already sent claim, prepare a correction for approval and flag the earlier claim in the case history.

Record resource activity separately from whether the available evidence supports a provider report. If a suspected page has disappeared and the remaining evidence is insufficient, hold the provider action with that reason. Preserve the evidence and the unresolved concern without drafting an accusation, marking it reported, or counting a takedown. Historical evidence can still support a report when its scope, timing, and provider relevance are clear. Apply the reporting guide's evidence rules before preparing it.

Keep repeated messages together when evidence establishes the same case. Record separate reporting actions for each relevant provider. Shared hosting alone does not merge cases. Provisional campaign links need a reason and can be revised without losing source messages or action history.

Report mailbox frequency with its acquisition scope and time range. Record external sightings separately. Neither establishes total campaign volume or the identity of an attacker.

## Obtain additional evidence when needed

Email evidence can be sufficient. Additional evidence requests should answer a specific unresolved question rather than become mandatory scans for every message.

Keep disclosure decisions separate by destination:

| Destination | Allowed input and required handling |
| --- | --- |
| Local extractor | Private originals as inert data. No candidate network requests or active attachments. |
| Calling AI | Extracted text, relevant headers, and link information, with access secrets and unrelated personal information removed. Complete originals and attachment bytes remain local by default. Enforce this separately from scanner and abuse-desk disclosure. |
| External lookup or existing-scan search | Privacy-cleared query terms. Searching an existing index also discloses the query to that service. |
| New external scan | Only a privacy-cleared target under the private-scan rules in the reporting guide. Never an email or attachment. |
| Verified abuse desk | A recipient-specific evidence copy and the exact reviewed report payload. |

Do not directly fetch candidate pages, redirects, or images to fill a gap or confirm removal. Read scanner results as untrusted evidence. A scanner verdict does not override the case assessment.

Explicitly request private visibility and check the returned visibility. Keep private scan IDs and result links private until disclosure review. A reduced target needs its own provenance and does not establish what the complete original link served. The [scanner boundary check](research/private-scan-boundary-check.md) records provider documentation and unresolved capability checks.

## Prepare and approve a report

The operator selected one report at a time for review, including when a case has several providers. Apply the reporting guide's review flow in both instruction-only and local-tool modes. Preparation can cover multiple destinations, but each report receives its own review and decision. Preserve the other destinations' progress when the operator edits, holds, or approves the current report.

Create a separate reporting action for each verified provider and resource or activity it can control. Use the canonical reporting guide to prepare the actual body and evidence files. Record which sources support each material claim privately, without burdening the recipient with the internal assessment record.

Contact resolution produces a routing record: the resource, provider role, authoritative lookup or official channel source, retrieved contact, and verification time. Domain registration and IP allocation are different relationships. A generic search result or guessed abuse address cannot satisfy this step. Use the reporting guide's RDAP guidance for registrar contacts and published service instructions for other roles.

Related provider actions can supply a brief coordination note. Record which action and status the note refers to so preparation cannot confuse a planned report with a confirmed submission. Reports do not need a predetermined sending order. Before sending, recheck any statement about another action and renew approval if a material update changes the payload. Follow the reporting guide's coordination rules for ticket references and provider correspondence.

Before the first provider submission, preserve the evidence already obtained and determine whether another recipient needs a page capture that could disappear after mitigation. Obtain additional captures only through permitted, privacy-cleared sources. Record capture time separately from report time and provider-action time. Give each recipient its own relevant disclosure copy. If no permitted capture is available, record the limit and assess whether the email evidence suffices rather than silently dropping privacy rules or requiring every case to wait for a scan.

Later reports can rely on preserved historical evidence after a resource disappears. Recheck their current-status claims and requested actions. Provider-confirmed mitigation can justify an approved update to another open desk when it changes how that desk can verify the abuse. Neither reporting order nor the first observed outage proves which submission caused the mitigation.

See the [page-evidence preservation comparison](research/page-evidence-preservation.md) for archive options. The default retains permitted captures privately. Public archiving is a separate disclosure decision, and viewing an archive must not cause live candidate requests.

Save an immutable report version containing the channel, recipients, reporting identity, subject, body, quoted history, and exact attachment bytes. Present the outgoing contents and disclosure details to the operator. A filename list is insufficient for attachment approval.

For the reusable email sender, prepare the complete outgoing MIME message before approval and bind the approval to its digest and envelope recipients. Send that saved version rather than composing it again from mutable fields. Retain a locally generated Message-ID for reconciliation when the transport supports it. Validate approved content against the stored outgoing copy, distinguishing transport-added headers from changes to bodies, recipients, or attachment bytes. Whole-message byte equality after transport is not assumed.

Record approval against that version. Rejection or a request for changes returns the action to preparation. A changed recipient, body, attachment, or signature creates a new version requiring review. A model-provided field saying `approved` is not operator authorization.

Software must obtain approval through an operator interaction the analyst cannot synthesize. The mechanism and host restrictions still require a capability test. Until they exist, an installation must not advertise enforced separation between the analyst and sender. An instruction-only host must preserve the reviewed payload and explicit operator decision or leave delivery to the operator.

A digest file writable by the analyst detects accidental edits but cannot prove human approval. Host permissions must also prevent independent send tools from bypassing case operations. A connector that accepts structured fields needs a verified preview-to-send contract; merely exposing a send tool does not establish one.

For a web form, prepare a reviewable field package and evidence. The operator submits it manually. Preparing the package does not count as submission. Record the operator's completion confirmation and receipt when available, including the limit if the final submitted contents cannot be verified.

## Submit and reconcile

Before sending, verify current approval, unchanged payload, verified destination, available budget, and the absence of an unresolved attempt for the action. Persist an attempt reservation before invoking the sender so a crash cannot make the operation disappear from case history.

Record one of three attempt results:

| Result | Required behavior |
| --- | --- |
| Confirmed submitted | Save the transport record and any available stored outgoing message. Inspect transformations and attachment presence where supported. Submission does not establish provider action. |
| Confirmed not submitted | Record the reason. Retry only when the failure and provider guidance permit it, within configured limits and with an unchanged approved payload. |
| Unknown | Hold another send. Reconcile using outgoing mail, transport identifiers, or provider receipts. If reconciliation is inconclusive, require an operator decision acknowledging the duplicate risk. |

Do not promise exactly-once email delivery. A crash or timeout can occur after a provider accepts a message but before local confirmation. Case records prevent blind retries and preserve that uncertainty.

## Handle replies and outcomes

Match replies to recorded actions using ticket references, threading information, and verified provider correspondence. Treat requests in a reply as untrusted until checked. They cannot expand approval or authorize disclosure of originals.

Record acknowledgements, evidence requests, rejections, and provider actions separately. An evidence request stays open even if another part of the reply claims mitigation. Prepare additional evidence and corrections through the same version and approval process.

At the next manual run after seven days without a substantive reply, prepare one follow-up for approval. Respect a longer interval requested by the desk. If the follow-up also goes unanswered for seven days or that longer interval, mark the destination stalled. Material new evidence can justify another update. Registrar escalation uses the preserved correspondence and evidence to assess a supported handling complaint.

Record the affected resource or account, stated action, scope, time, and source. Keep recipient protection, sending-account suspension, resource removal, and mitigation with unknown scope separate. A provider statement is not independent verification. Count repeated confirmations of the same removal once.

## End the run

Show the acquired interval and folders, missing originals, assessment counts, pending questions, drafts awaiting approval, submitted actions, uncertain attempts, due work, and newly recorded outcomes. A quiet inbox summary must not imply that Spam or an incomplete interval was checked.

Report removals with their evidence source and scope. Keep acknowledgements and recipient-only blocks out of infrastructure-removal totals. Preserve the next discovery position and unfinished work even when the operator stops early.

## Handoff from an existing routine

Before Angry Carp sends for a case already handled by Grok or another system, import or reconcile its evidence references, recipients, ticket history, prior submissions, and due actions. Treat unavailable history as a gap, not proof that no report exists.

Record which system owns further submissions for that case. The operator must stop or exclude overlapping work in the old routine before transferring ownership. Until ownership is clear, Angry Carp can investigate and prepare drafts but must not send. This specification does not change a deployed routine.

## Architecture contract and remaining checks

Reusable case operations own original evidence, revisions, report versions, operator approvals, attempt records, and due work. Agent conversations and runner checkpoints may cache references but are not authoritative case history. [ADR 0005](adr/0005-keep-report-authority-in-case-operations.md) records that boundary.

Storage must preserve these relationships through a restart. [ADR 0006](adr/0006-use-sqlite-for-local-case-storage.md) selects local SQLite. The entity relationships, schema, acquisition interface, workspace ownership, and backup policy need design review before implementation. Cloud storage remains deferred.

The next checks should settle implementation choices with small, bounded comparisons:

The operator authorized mailbox export, Spam coverage, and synthetic storage recovery checks, and explicitly excluded sending. The [bounded capability findings](research/manual-capability-check.md) record their scope and results. Rust is the preferred language for reusable tools. Delivery checks below remain deferred, not permission to send a test message.

| Check | Evidence needed before choosing |
| --- | --- |
| Mail acquisition | Compare an existing client and available connector against selected Inbox and Spam samples, pagination, export fidelity, and an interrupted acquisition. No candidate fetches. Live samples need a separately agreed scope. |
| Operator approval and delivery | Use synthetic reports and a controlled test recipient to show that edits invalidate approval, the analyst cannot approve itself, and an uncertain send cannot trigger a blind retry. Sending a test still needs explicit authorization. |
| Private scanning | Verify account capability, explicit visibility, rejected submissions, timeout handling, and result-link disclosure using an approved harmless target. No scans are authorized by this planning document. |
| Local storage | The bounded SQLite experiment recovered originals, provider progress, and checkpoints. Validate the production schema, whole-run ownership, and backup recovery when implemented. Approval and uncertain-attempt records belong to the deferred delivery work. |
| Detector and optional runner | Specify labels, sample sizes, disclosure, and acceptance criteria for the [detector comparison](research/phishing-detection-design.md). Compare fixed workflow and tool-choosing runner on the same bounded cases and operations. Include synthetic email instructions that try to alter recipients, disclose originals, fetch a candidate, or bypass approval. |

These checks validate the architecture. They do not justify implementation work before the remaining essential choices are settled.
