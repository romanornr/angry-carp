# Implement provider outcomes and recurrence tracking

Type: capability
Status: open
Priority: medium
Assignee: unassigned
Parent: ../map.md
Related: 04-define-case-and-provider-outcomes.md, 18-verify-evidence-during-report-preparation.md
Dependencies: reusable case operations and local persistence under ADR 0005 and ADR 0006 are not yet implemented

## Outcome

An operator can record an externally submitted report, attach a provider reply and inspect what happened to each reported resource. Later evidence can be associated with that history without converting a repeated mention into a confirmed recompromise. [ADR 0017](../../adr/0017-track-resource-outcomes-and-recurrence.md) records the accepted direction and trade-offs.

## Implementation scope

- Add reusable local case operations in `lib/` and corresponding standalone commands in `cli/`. Follow the existing SQLite decision. Flue conversation storage is not the case store.
- Reuse the preparation and evidence bindings from [ticket 18](18-verify-evidence-during-report-preparation.md). Preserve preparation, approval and submission as distinct facts. A manually supplied submission record describes an external action and does not create or prove software-enforced approval.
- Record the recipient, service role, affected resources, requested action, supplied evidence and dated provider statements. Preserve acknowledgements, recipient protection, account suspension, resource removal and mitigation of unknown scope using the existing glossary.
- Retain first observation, submission and reply times. Record action time only when supplied, with its source. Unknown times and uncertain delivery remain explicit.
- Associate recurrence observations with earlier resources and evidence. Keep reports for different providers independently actionable and retain unresolved work after another provider acts.
- Display the history and outstanding work without exposing full messages by default. Keep evidence private and report duplicate records without double-counting the same action.

Start with operator-supplied records and replies. Automatic sending, mailbox integration, public feed submission, candidate fetching, monitoring schedules and aggregate effectiveness dashboards are outside this ticket. Preserve the established follow-up policy rather than deriving a new timer from historical papers.

## Acceptance scenarios

1. A hosting provider confirms one page was removed. The registrar has only acknowledged receipt. The page outcome is recorded while registrar work stays unresolved.
2. A provider says it "took action" without identifying the scope. No page removal, domain suspension or account suspension is invented.
3. A later email repeats a previously reported URL. It becomes a recurrence observation, not proof of renewed availability or a new compromise.
4. A provider explicitly reports continuing abuse or a new compromise. Its statement remains attributed and does not erase the previous action record.
5. Importing the same reply twice does not create two takedowns. Separate resources on a shared provider are not automatically merged into one campaign.
6. A reply received today describes action yesterday. Both dates retain their meanings. A missing action date remains unknown.
7. Recording and displaying this history needs no AI, provider request or candidate-site visit. Resuming work retains the same facts and outstanding actions.

## Design work before implementation

Settle record identity, duplicate handling and correction behavior against these scenarios. Reuse the existing resource and reporting vocabulary. Choose the smallest persistent interface that supports the complete manual flow, without a rules engine or a second report-preparation format. The [research recommendations](../../research/phishing-takedown-disruption.md#workflow-ideas-to-evaluate) supply the rationale, not evidence that these product changes already improve takedown rates.
