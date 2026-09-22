# Angry Carp

Angry Carp investigates suspected phishing received by the operator, reports supported abuse to the providers that can act on it, and tracks their responses.

## Language

**Operator**:
The person authorized to run Angry Carp for a connected mailbox and approve its reporting actions. Their identity and preferences belong to deployment configuration, not shared workflow instructions.

**Source message**:
An email under investigation, distinct from reports sent about it and replies from providers.

**Original message**:
The complete source message as exported by the mailbox provider, retained unchanged. A parsed summary, reconstructed email, or redacted copy is not an original message.

**Evidence copy**:
A separately derived extract or redacted version of source evidence, with its origin and changes identified. It does not replace the retained original.

**Evidence**:
Preserved source material or recorded observations that support or contradict an assessment, with their origin and observation time.

**Observation**:
A fact recorded from an identified source at a stated time, such as a request in an email or content captured by a scan.

**Inference**:
A conclusion drawn from observations, with the supporting evidence and uncertainty identified. It is distinct from what a source directly shows.

**Existing scan result**:
A stored observation from an earlier visit by an external scanning service. Retrieving it is distinct from requesting another visit to the reported resource.

**External scan**:
A visit to a reported resource performed by an external scanning service after receiving a scan request. The service contacts the resource, rather than Angry Carp's agent environment.

**Scan target**:
The exact address submitted to an external scanning service. It can differ from a source message's link, so observations about it apply only to the resource actually scanned.

**Assessment**:
A judgement about suspected phishing, its confidence, and the evidence supporting it. An assessment can change when new evidence arrives.

**Email analysis**:
The collected message observations, check outcomes, derived findings and coverage limitations used to support an assessment. A complete analysis record can contain unresolved questions and does not itself establish a phishing verdict.

**Results display**:
A presentation of recorded analysis findings, check outcomes and reporting routes with their supported service roles for the operator to inspect. It is distinct from an assessment interpreting their significance and an abuse report requesting provider action.

**Reporting candidate**:
A provider and service role connected to a reported resource by identified evidence or an explicitly qualified lead. A candidate can have an available reporting channel while attribution or disclosure conditions remain unresolved.

**Resource contact**:
A provider contact associated with an observed resource. Finding that contact does not establish abuse involving the resource or make the provider a reporting candidate.

**Concern level**:
The High, Medium, or Low classification of a suspected phishing concern based on the combined evidence. It is distinct from impact severity, reporting readiness, and authorization to send.

**Confidence**:
How strongly the evidence supports a specific conclusion. Confidence in impersonation can differ from confidence about a linked file's behavior.

**Service role**:
The function a provider performs for a reported resource, such as registration, email delivery, DNS, or hosting. Evidence for one role does not establish another.

**Reporting channel**:
A provider's published route for receiving a report in a stated service role, with any conditions on its use. Knowing a channel does not establish the provider's involvement or authorize sending.

**Reporting readiness**:
Whether the evidence, provider attribution, verified channel, and disclosure review are sufficient to prepare a report for a particular recipient. It is separate from concern level and report approval.

**Case**:
The record of an investigation, its related source messages, evidence, assessments, reporting actions, and unresolved work. A case can contain repeated samples and separate actions for multiple providers.
Acquiring an ordinary email does not create a case. Acquisition alone is not an investigation.
Opening a case records an investigation; it does not approve or submit an abuse report.
_Avoid_: Email thread, label

**Suspected campaign**:
A group of related phishing messages or resources linked by evidence. The grouping does not establish that one person controls them or that all campaign activity has been observed.
_Avoid_: Same phisher, attacker identity

**Campaign link**:
A provisional, evidence-supported association of a message or resource with a suspected campaign. Its recorded reason can be reassessed without changing the original evidence or replacing the item's assessment.

**Mailbox activity**:
Messages observed in the operator's mailbox within a stated period and discovery scope. The count does not represent other recipients or global sending volume.

**Coverage gap**:
Mail within the intended checking scope that has not been successfully assessed, such as messages left by a run limit or a download failure. A coverage gap is unfinished work, not a Low assessment or evidence that the mailbox is clear.

**External sighting**:
An observation of a related resource recorded by an external source, with its provenance and time. Repeated observations are not necessarily independent, and scans requested by Angry Carp are not independent sightings.

**Reported resource**:
The specific URL, domain, object, account, or sending activity identified in an abuse report, with its observed role.

**Abuse report**:
A recipient-specific statement of supported abuse, its evidence, and the action requested from a provider or reporting service.

**Report approval**:
The operator's authorization to send a prepared abuse report. An assessment of High confidence is not report approval.

**Submission attempt**:
An attempt to deliver an abuse report to a destination. Its outcome can be successful, failed, or uncertain.

**Reporting action**:
A recipient-specific report, follow-up, or escalation concerning identified resources or sending activity. Its preparation, approval, submission attempts, and response are separate parts of the case record.

**Stalled destination**:
A reporting destination whose unanswered follow-up has passed the applicable waiting interval. This describes unfinished work, not proof of a contractual breach or continued phishing activity.

**Escalation dossier**:
A collected report history, evidence, correspondence, and chronology supporting review by another appropriate authority or provider. Its claims remain tied to the documented handling of each case.

**Acknowledgement**:
A recipient's confirmation that it received a report. It does not establish that the recipient took protective action.
_Avoid_: Resolution, takedown

**Provider action**:
A protective measure reported by a provider, with the affected resource and scope recorded as precisely as the response supports.

**Recipient protection**:
A provider-reported restriction on delivery to the operator's address. It does not establish a restriction on sending to other recipients.

**Sending-account suspension**:
A provider-reported disabling of the account responsible for identified sending activity. The claim applies to the account and scope specified by that provider.

**Resource removal**:
A provider-reported removal or disabling of an identified page, object, domain, or other reported resource. The provider's statement and any independent observations remain distinct evidence.

**Mitigation with unknown scope**:
A provider's statement that it acted without enough detail to identify the protective measure or affected resource.

**Takedown**:
Removal or disabling of an abusive resource. Blocking delivery to one recipient does not establish a takedown.
