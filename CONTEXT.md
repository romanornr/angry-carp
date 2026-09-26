# Angry Carp

Angry Carp supports phishing investigation and evidence-backed reporting aimed at disrupting abusive infrastructure.

This glossary covers analysis and the reporting lifecycle. A term's presence does not imply an implemented feature. The [documentation](docs/README.md) and [planning map](docs/planning/map.md) record current capabilities and outstanding work.

## Language

**Operator**:
The person authorized to investigate supplied email evidence and approve reporting actions. The evidence can come from local files or an authorized mailbox connection.

**AI host**:
The application running an AI assistant and providing its tools, such as shell access, research or mailbox connections. A host's account of an action is distinct from evidence that the action occurred.

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

**Reported authentication result**:
An authentication outcome, such as SPF, DKIM or DMARC pass or fail, claimed in supplied message headers. Parsing that claim does not establish receiver provenance or perform fresh verification.

**Source note**:
A supplied claim attributed to an external source, with its URL, stated retrieval date, supplier and applicability to the message. The claim, source authority and retrieval remain unverified unless separately established.

**Reference domain**:
A domain used as the comparison reference for an observed name, with its source identified. A directory-supplied candidate is an association recorded by that directory, not proof of ownership or authorization by the represented brand.

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

**Finding**:
A concern or informational note derived from recorded evidence, with references to that evidence. An informational finding summarizes evidence rather than recording a new observation, while a concern warrants attention without independently establishing phishing.

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

**Structured assessment**:
A conclusion expressed as concern, confidence, a hypothesis and selections of recorded evidence as supporting, contrary or contextual. The selection interprets the records without changing their contents or establishing the hypothesis as fact.

**Service role**:
The function a provider performs for a reported resource, such as registration, email delivery, DNS, or hosting. Evidence for one role does not establish another.

**Reporting channel**:
A provider's published route for receiving a report in a stated service role, with any conditions on its use. Knowing a channel does not establish the provider's involvement or authorize sending.

**Reporting readiness**:
Whether the evidence, provider attribution, verified channel, and disclosure review are sufficient to prepare a report for a particular recipient. It is separate from concern level and report approval.

**Report preparation**:
A directed effort to prepare one provider-specific report about identified resources, with a stated allegation, requested action and reviewed evidence. Starting preparation requests research and drafting, not submission.

**Reporting-time research**:
New source checks for a report preparation, covering the material allegation, provider relationship and current intake, with unresolved questions retained. A host-supplied account identifies who claims to have performed the research without independently verifying that claim.

**Ready for review**:
A report-preparation result indicating that the supplied records passed consistency and source-policy checks. It does not establish the truth of the claims, operator approval or submission.

**Case**:
An investigation record containing related source messages, evidence, assessments, provider-specific reporting actions and unresolved work, including repeated samples. Acquiring an email does not by itself open a case, and opening a case does not approve or submit an abuse report.
_Avoid_: Email thread, label

**Suspected campaign**:
A group of related phishing messages or resources linked by evidence. The grouping does not establish that one person controls them or that all campaign activity has been observed.
_Avoid_: Same phisher, attacker identity

**Campaign link**:
A provisional, evidence-supported association of a message or resource with a suspected campaign. Its recorded reason can be reassessed without changing the original evidence or replacing the item's assessment.

**Mailbox activity**:
Messages observed in the operator's mailbox within a stated period and discovery scope. The count does not represent other recipients or global sending volume.

**Coverage gap**:
A limitation in what an investigation has examined or established, such as missing messages, ambiguous content boundaries, unreadable content or incomplete lookups. Its significance depends on the limitation, not merely the existence of a gap.

**Assessment routing**:
The decision whether detected concerns or material coverage gaps require an assessment. It determines attention, not a phishing verdict or permission to report.

**No concerns detected**:
A routing result indicating that the implemented checks produced no concern and no material coverage gap remains. It does not establish that the message is legitimate or that every possible threat was checked.

**External sighting**:
An observation of a related resource recorded by an external source, with its provenance and time. Repeated observations are not necessarily independent, and scans requested by Angry Carp are not independent sightings.

**Reported resource**:
The specific URL, domain, object, account, or sending activity identified in a proposed or submitted abuse report, with its observed role.

**Abuse report**:
A recipient-specific statement of supported abuse, its evidence, and the action requested from a provider or reporting service.

**Threat-feed submission**:
A suspected resource sent to a service that classifies it independently and may block it in its feeds. It makes no allegation under the operator's identity, so it is not an abuse report.

**Service classification**:
The verdict a threat-feed service assigns to a submitted resource. It can change later; each dated change is an observation, not a decision about the case or a takedown.

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

**Recurrence observation**:
Later evidence referring to a previously observed or reported resource, linked to the earlier evidence with its source and time. It does not by itself establish continued availability, failed removal or a new compromise.
