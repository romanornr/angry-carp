# Try the shared CLI workflow

Type: prototype
Labels: wayfinder:prototype
Status: claimed
Assignee: operator with planning agent
Parent: ../map.md
Blocked by: 02, 03, 04, 06

## Question

Does a small, reusable CLI give any calling LLM enough consistent operations to inspect evidence, record assessments, prepare reports, and submit approved versions without writing replacement scripts? Make the proposed command interaction concrete before choosing storage, language, or a model API integration.

Use synthetic data and in-memory state only. The prototype must not access Gmail, submit scans, send mail, or execute shell commands. Keep the difference between agent work and operator approval visible. The prototype does not demonstrate real host isolation or approval enforcement.

## Prototype

Branch: `prototype/cli-workflow`

Commit: `9700dd2`

Artifact: `prototypes/cli-workflow.prototype.html` on that branch.

The self-contained HTML file displays proposed terminal commands, human-readable or JSON responses, and case state. It provides free-play operations and three guided scenarios: email evidence to a report, a revision after approval, and an uncertain send. It is a workflow demonstration, not a proposed product dashboard.

The JavaScript syntax check passed. Exercising the three scenarios produced the intended prototype states: no send without approval, renewed review after edits, no duplicate send after success, and reconciliation after an uncertain result. No live integrations were used.

The proposed interface is summarized in [CLI workflow sketch](../../../docs/cli-workflow-sketch.md). The prototype has not resolved the full interface decision.

## Operator feedback

The operator found the nested command sequence confusing and specifically rejected the ergonomics of `case assess`. The revised sketch proposes flat commands and separates the operator's queue, case view, and review from the agent's record-keeping operations. It removes the requirement for the operator to prepare JSON files. This replacement is a proposal awaiting a walkthrough, not an accepted interface. The earlier prototype still shows the old command sequence.

On 2026-09-21 the operator selected reviewing provider reports one at a time rather than displaying all drafts for a case together. Each review covers that provider's exact payload and evidence. Other provider actions retain their own status and approval requirements. The specification and reporting guide record this choice; the existing prototype has not yet been updated to demonstrate it.

The next walkthrough must show one approved report, another awaiting review, and a later run resuming the remaining action without resending the first. Apply the accepted four-label design from [Choose mailbox labels and report memory](10-choose-mailbox-labels-and-report-memory.md).
