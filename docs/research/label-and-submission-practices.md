# Labels and submission records in existing software

Checked 2026-09-21 by an independent research agent using Context7 and official documentation. This bounded comparison covers two products. It does not establish a universal standard for Gmail labels or validate the deployed Grok routine.

| Product | Documented behavior | Limit of the comparison |
| --- | --- | --- |
| [Microsoft Defender submissions](https://learn.microsoft.com/en-us/defender-office-365/submissions-admin) | A user-reported message can remain unsubmitted to Microsoft. An administrator's submission creates its own record with identity, time, status, and results. The administrator's verdict is a separate field. | Submitting to Microsoft for analysis is different from sending an infrastructure abuse report to Vercel or AWS. |
| [TheHive alerts](https://docs.strangebee.com/thehive/user-guides/analyst-corner/alerts/about-alerts/) | Alerts can become or join cases, or close as duplicates or false positives. Alert import uniqueness uses type, source, and source reference. | This is duplicate intake detection, not proof of duplicate prevention for outgoing reports. |
| [TheHive statuses](https://docs.strangebee.com/thehive/administration/status/about-statuses/) and [responder execution](https://docs.strangebee.com/thehive/user-guides/analyst-corner/cases/run-responders-on-a-case/) | Case workflow status is separate from the execution status of recorded responder actions. | The documentation does not establish a ready-made per-provider abuse-report workflow for Angry Carp. |

## Design inference

A visible reported marker can be useful without being the whole state record. Keep investigation, individual submissions, and their outcomes separate. The operator selected reported to mean at least one confirmed external submission, allowing another destination to remain pending.

For a Markdown-only Grok routine, labels find cases and work queues. Accessible private notes plus outgoing-message or ticket evidence identify what actually happened for each resource and destination. Before another report, the routine consults that history. A single reported label cannot tell it that Vercel succeeded while AWS still awaits approval.

Adding a reported label for every provider would expose more destinations, but still omit resource identity and uncertain attempts. It therefore cannot replace the underlying record. The operator subsequently accepted the compact four-label design in the [label decision](../gmail-labels.md).
