---
status: accepted
---

# Track provider outcomes and recurrence per resource

Angry Carp aims to disrupt phishing operations through provider action. Preserve a separate history for each reporting action and its affected resources, rather than one case-wide "reported" or "taken down" flag. This extends the [existing outcome decisions](../planning/issues/04-define-case-and-provider-outcomes.md). Implementation is tracked in [ticket 24](../planning/issues/24-implement-provider-outcomes-and-recurrence.md).

Prepare each justified provider request independently. A ready hosting report need not wait for an unrelated registrar response. Keep the existing research and approval requirements. The requested remedy must fit the evidence and resource: removing phishing content from a compromised legitimate site differs from suspending an abusive registration. Investigation of an underlying compromise can be requested without claiming that its cause is known.

Preserve provider acknowledgements, scoped action statements and independent observations separately. Link later recurrence observations to earlier evidence without overwriting it. A repeated URL in a new message does not establish that the resource is live, that removal failed or that a new intrusion occurred. Sharing a provider does not establish a campaign link.

Retain distinct times for first observation, submission, reply and any action time actually supplied. Do not substitute a reply time for a removal time. Duplicate confirmations must not inflate removal counts, and unresolved outcomes remain visible. This costs more record keeping than a single completion flag, but makes follow-up and outcome claims defensible.

The [takedown research](../research/phishing-takedown-disruption.md) and [recompromise review](../research/phishing-recompromise-and-disclosure.md) motivate this design. Their historical associations do not establish current response deadlines, offender fear or Angry Carp's effectiveness. The existing follow-up intervals remain unchanged. Public intelligence sharing remains a separate destination and disclosure decision.

Reusable case operations own these records under [ADR 0005](0005-keep-report-authority-in-case-operations.md), with the local storage direction in [ADR 0006](0006-use-sqlite-for-local-case-storage.md). This decision adds no automatic sending, mailbox access, candidate-site monitoring or new Flue responsibility. Supplied evidence and manually recorded outcomes can support the first implementation.
