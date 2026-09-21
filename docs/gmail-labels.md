# Gmail labels and report memory

Status: accepted design, 2026-09-21. The operator selected four descriptive labels and recipient-specific case notes. No Gmail labels or deployed routines have been changed.

## Why the current labels are hard to use

The [historical routine](research/legacy-grok-routine.md#discovery-and-migration) defines eight labels. They combine several independent facts:

| Existing label | What it actually means |
| --- | --- |
| `phishing-flagged` | Investigation is queued. |
| `phishing-pending` | At least one reporting action is unfinished. |
| `phishing-review` | The operator must decide something. |
| `phishing-reported` | At least one submission succeeded, even if others remain unfinished. |
| `phishing-stale` | Initial reporting was omitted under the historical age policy. |
| `phishing-cleared` | The message was explicitly judged not phishing. |
| `abuse-reports` | Verified correspondence belongs to a report. |
| `abuse-action-needed` | A desk reply needs the operator's attention. |

A source message can be both pending and reported. Review overlaps with action-needed, but applies to a different type of message. Cleared records a classification while stale records a reporting policy decision. The names look like stages in one process, yet they do not form a single sequence.

The routine already keeps these details in durable case records. Repeating them as sidebar labels creates another set of states to maintain. The screenshot also shows unrelated labels, including `auto-cleaned`, Espresso, and GitHub/Bots. They are not part of this redesign; the phishing routine explicitly prohibits using `auto-cleaned`.

The operator supplied an earlier ChatGPT review describing a bug where Medium and stale messages received `phishing-reported` without a successful submission. That behavior is absent from the current repository reference: Medium uses `phishing-review`, stale uses `phishing-stale`, and reported requires a successful submission. This file review does not establish the version deployed in Grok.

The review's proposed distinctions remain necessary in case records: awaiting a decision, incomplete reporting, confirmed submission, and deliberately omitted reporting. Reducing Gmail labels must not collapse those states. Deduplication uses the specific resource, destination, and confirmed submission record. Neither the presence nor absence of a Gmail label proves that a report was sent. Cases with partial delivery remain unfinished even when Gmail shows only phishing-reported because the next task belongs to the system.

## Alternatives considered

The [Choose mailbox labels and report memory](../docs/planning/issues/10-choose-mailbox-labels-and-report-memory.md) decision records this comparison. Label names remain descriptive rather than project-branded.

| Option | Visible labels | Trade-off |
| --- | --- | --- |
| Minimal sidebar | Phishing reports; Needs review | Smallest view, but hides the flagged/reported distinction the operator needs in Gmail. Withdrawn as the recommendation. |
| Compact workflow | `phishing-flagged`; `phishing-review`; `phishing-reported`; `abuse-reports` | Preserves visible source-mail progress and keeps provider correspondence together. Recipient-specific progress stays in an accessible case note or record. Selected by the operator. |
| Provider-specific labels | Flagged/review plus Reported/Vercel, Reported/AWS, and other destinations | Shows destinations in Gmail but multiplies labels. Still cannot identify which resource was reported or reconcile a timed-out send. |

## Accepted labels

The selected compact set has these meanings:

- `phishing-flagged`: a suspected message awaits investigation or its first reporting action. It does not establish High confidence.
- `phishing-review`: the operator owes a decision, approval, or manual action. This can accompany a flagged or reported source message, or a desk reply.
- `phishing-reported`: at least one confirmed external submission exists for the source message's case. The operator selected this meaning. It does not mean all destinations were handled or the infrastructure was removed.
- `abuse-reports`: sent reports and verified desk correspondence, distinct from the suspicious source message.

Replace flagged with reported after the first confirmed send. Review remains while the operator has another action. Reporting work that does not require the operator remains in the case queue even when the source message shows reported. Do not exclude reported cases from unfinished-work processing.

The alternative meaning of reported as completion of the whole initial report plan was considered and not selected. It would hide a successful first report until later actions finished.

The [software-practice comparison](research/label-and-submission-practices.md) supports separating case state from individual external actions. It does not establish standard Gmail label names or a product guarantee of per-provider abuse-report deduplication.

Ordinary screened Low mail receives no phishing label. For an explicitly cleared case, remove the source's flagged/review markers after reconciling remaining tasks, retain the assessment privately, and prepare a correction if an earlier report made a material unsupported claim. A historical reported marker records a submission, not the truth of its accusation. No label represents a takedown.

## How the next Grok run avoids duplicates

The original purpose of the labels is valid: let the routine recognize prior work. Use labels to find queues and prior cases, then consult the recipient-specific record before sending. A single reported label cannot distinguish Vercel already sent from AWS still pending.

A Markdown-only installation does not require the CLI, but it does require accessible history for reliable repeated reporting. The existing routine already proposes private case notes or recipient-free Gmail drafts when a persistent store is unavailable. That is a capability to verify for the actual host, not something supplied automatically by downloading Markdown.

A minimal private note must retain the source-message references, reported resource, verified destination, report version and approval reference, attempt outcome, sent-message or ticket reference when available, and next action. These are records of actual operations, not a second report template. The chosen storage must also retain originals under the existing evidence policy.

For example, one case can record:

| Destination and resource | Recorded result | Next run |
| --- | --- | --- |
| Vercel, URL-01 | Confirmed submitted, with time and sent-message reference | Do not repeat the unchanged initial report. Process a reply or later approved update when appropriate. |
| AWS, URL-02 | Prepared, awaiting approval | Present the existing draft for approval rather than creating another report. |

Read these records before new candidate discovery and before any outgoing action. Cross-check uncertain or imported history against Sent and ticket evidence. Do not infer success from a prepared draft, a label, or the absence of an error. Do not infer failure from the absence of a label or a single empty Sent search.

If delivery may have succeeded but the label update failed, reconcile the recorded attempt instead of resending. If a label says reported but the record is missing, recover the history before deciding. If the host cannot preserve or recover enough history, hold repeat submissions and tell the operator what is missing. Labels alone cannot provide reliable automatic duplicate prevention.

## Required behavior

| Situation | Required behavior |
| --- | --- |
| New suspicious mail | Make it discoverable as flagged without assuming maliciousness. |
| Vercel sent, AWS awaiting approval | Show the operator's work and remember the Vercel submission separately. |
| Send timed out | Preserve the uncertain attempt and reconcile before another send. |
| Provider acknowledged | Record receipt without counting mitigation or sending another initial report. |
| New material evidence after reporting | Reopen the relevant action for an approved update; do not duplicate unchanged reports. |
| No report because evidence is insufficient or the case was deferred | Preserve the reason without marking it reported. |
| Case later cleared | Preserve the changed assessment and any needed correction without erasing history. |

## Migration remains separate

Design acceptance does not migrate Gmail or change the deployed Grok routine. Before that operational step, reconcile its state, drafts, Sent mail, and desk replies. A label alone is not enough to recover missing history.

Retain the four selected names. Merge outstanding abuse-action-needed work into phishing-review. Recover unfinished phishing-pending actions into the case queue and apply review only where the operator has a task. Preserve stale and cleared decisions in case notes before retiring their labels. Never convert those labels into reported without confirmed submission evidence.

Update or stop the old routine before retiring labels it creates or searches. Confirm that unresolved cases remain discoverable and that reported cases with unfinished destinations still enter their work queue. Keep the existing folder, read-state, and retention policies separate from the label decision.
