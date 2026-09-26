# Define report evidence and approval

Type: grilling
Labels: wayfinder:grilling
Status: resolved
Assignee: operator with Codex
Parent: ../map.md
Blocked by: 03

## Question

What evidence may Angry Carp include in a report to a verified abuse desk, and what must the operator see before approving it? Distinguish provider-required evidence from the stricter scanner-submission boundary. Resolve handling of original messages, header extracts, redacted copies, recipient identifiers, sender identity, quoted history, and forwarded content without disclosing account-access secrets or unrelated private correspondence.

Every report requires approval in the first version. Define the scope of that approval across recipients, body, attachments, material edits, uncertain sends, and retries. Maintain one canonical reporting guide after these decisions; do not create competing templates.

## Comments

The operator accepted retention of complete original source emails in a private evidence store outside Git. Future uses may include pattern analysis, evaluation, or training. Preserve originals unchanged, with derived extracts, redactions, assessments, and corrections stored separately. Training is a possible later use, not a selected implementation or authorization to disclose retained mail.

The retention boundary is recorded in [Preserve complete original messages privately](../../../docs/adr/0003-preserve-original-messages.md). The storage mechanism, acquisition scope, and retention lifecycle remain design details to resolve. This decision does not imply archiving all unrelated private mail.

The operator accepted minimum necessary evidence for verified abuse desks, with unrelated personal information removed. A complete original may be included only when necessary and explicitly approved after reviewing what it exposes. Account-access secrets remain excluded. Reporting from the operator's Gmail account exposes the sending address to the recipient.

## Answer

Retain complete original source emails privately outside Git. Preserve originals unchanged and keep derived extracts, redactions, assessments, and corrections separate. Possible future pattern analysis or training does not authorize external disclosure or make current assessments verified labels. Storage and retention details belong to architecture design.

For a verified abuse desk, prepare only the evidence needed for its investigation, removing unrelated personal information. Include a complete original only when necessary and explicitly approved after disclosure review. Exclude account-access secrets even when evidence is attached or forwarded. The scanner boundary remains stricter: no email or attachment uploads.

Approval applies to the concrete prepared report: recipients, subject, body, quoted material, and actual attachments. A material change requires renewed review because it changes the report that the operator approved. An approval does not authorize other provider reports or an unseen full-original attachment. Reconcile uncertain sending outcomes before any retry; identical retries must remain within the approved report and the eventual retry policy.

The operator subsequently requested a complete rewrite, including the filename and description, to reduce the burden on the person reading a report. [Provider abuse reporting](../../../provider-abuse-reporting.md) replaces the former template as the single canonical guide. It preserves the evidence and approval decisions and uses natural correspondence without a fixed section order or minimum word count. No report has been prepared for operational submission or sent during this planning effort.

Following the operator's concern about the value and privacy cost of Netcraft forwarding, the replacement excludes it from the default reporting path. An operator may still explicitly request it for a case, subject to the same payload and disclosure review. Reporting to providers does not require a Netcraft submission or verdict. [ADR 0019](../../adr/0019-submit-urls-to-netcraft-automatically.md) later re-admits Netcraft URL submissions as automatic threat-feed submissions.
