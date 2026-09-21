# Official abuse-report requirements

Checked 2026-09-21 against official provider, agency, standards, and legal sources. This research concerns submission requirements, not whether a particular report will produce a takedown. No candidate sites were visited and no reports were submitted.

## What the sources establish

The [additional source review](additional-reporting-and-simulation-sources.md) covers the operator's NCSC, Kaspersky, AWS, usecure, and Gophish-template links. It distinguishes reporting channels from simulation material for detector evaluation.

The sources below specify channels, identifiers, evidence, and sometimes declarations. They do not establish that a particular greeting, paragraph count, or house style improves outcomes. A professional report must first meet its recipient's requirements. The proposed Angry Carp prose remains an editorial choice, not an official provider template.

Published requirements do not establish good abuse handling. Evaluate provider behavior separately using private case records and independent public findings.

- [GoDaddy, Vercel, Microsoft, and Namecheap](provider-reporting-requirements.md) covers their service-specific routes and evidence requirements.
- [CIA, FBI/IC3, and NSA](agency-reporting-requirements.md) distinguishes crime reporting and intelligence contacts from provider abuse handling.
- [Google/Gmail, Proton, Apple/iCloud, and Yahoo](mailbox-provider-reporting-requirements.md) covers mailbox reports, account abuse, and relevant separate brand or hosting routes.
- [Mailchimp, Postmark, SendGrid, Mailgun, and Brevo](sending-provider-reporting-requirements.md) covers sending-platform complaints.
- [NiceNIC's public abuse record](nicenic-abuse-record.md) separates independent abuse measurements from claims that remain unverified.
- [Email templates and reporting standards](email-report-templates-and-standards.md) distinguishes copyable examples, machine formats, narrative guidance, and recipient requirements.
- Cloudflare, AWS, formal notices, and court evidence are covered below.

## Provider coverage

The comparison covers hosting, registrar, mailbox, and sending services. Inclusion is not a claim about the prevalence of abuse or about any particular mailbox. Private reporting history is not published here.

## Cloudflare

Cloudflare's public abuse form is its primary route. Its reporting page says ordinary complaints sent by email generally receive a direction to use the form. Registrar complaints have a separately documented email route. Current developer documentation also describes dashboard and API submission for entitled customers with appropriate roles; this does not establish universal API access. [Reporting abuse](https://www.cloudflare.com/trust-hub/reporting-abuse/), [submission channels](https://developers.cloudflare.com/fundamentals/reference/report-abuse/submit-report/).

For phishing, its published minimum is the affected domain and the specific phishing-page link. It describes a warning-page response after verification. The actual response depends on whether Cloudflare supplies hosting, registrar, or pass-through services. [Complaint types](https://developers.cloudflare.com/fundamentals/reference/report-abuse/complaint-types/), [service distinctions](https://developers.cloudflare.com/fundamentals/reference/report-abuse/submit-report/).

The published phishing API schema includes reporter name and email, URLs, a justification with access details where necessary, and host/owner notification choices. Some identity and URL fields carry third-party-release warnings. The public form did not expose its fields in the text reader, so this research does not equate its current controls with the API schema. Review the actual channel's disclosure choices before submission. [Phishing request schema](https://developers.cloudflare.com/api/resources/abuse_reports/methods/create/).

There is a structured reporting process, not a published model email in these sources. Preserve the exact resource and explain the observed deception. Requests for access details do not authorize Angry Carp to visit a candidate site, supply account-access secrets, or invent a reproduction procedure.

## AWS

AWS documents its abuse form and `trustandsafety@support.aws.com` for automated reports or when the form cannot be used. SES spam or malicious email has a specific route, `email-abuse@amazon.com`. Content reports need the URL and an explanation; network-activity reports need the relevant IP, timestamp with timezone, and log samples. [AWS reporting instructions](https://repost.aws/knowledge-center/report-aws-abuse).

Its FAQ asks for specific content URLs and reasons for an acceptable-use violation. If alleging illegality, explain why and identify the law at issue. Critical investigative attachments may be emailed to Trust & Safety. The FAQ also provides a CSV field convention for reports involving multiple IPs. Those are evidence requirements, not a prescribed phishing-email narrative. [AWS abuse reporting FAQ](https://www.repost.aws/articles/ARDaJQbZSdSdKpFjrFMNmgzQ/abuse-reporting-faqs).

There is conflicting attachment guidance: Amazon Registrar's policy says attachments will not be opened, including in its paragraph on other AWS abuse. Do not treat the FAQ as universal assurance that attachments are processed. Include sufficient privacy-cleared evidence in the supported submission fields and resolve channel-specific conflicts before relying on an attachment. Its recommendation to contact a domain owner does not override Angry Carp's prohibition on contacting suspected attackers. [Amazon Registrar policy](https://aws.amazon.com/route53/amazon-registrar-policies/).

AWS tells implicated customers that an abuse notice includes the received report and may include supplied log extracts. Do not treat a report as private correspondence guaranteed to remain inside the abuse desk. [AWS abuse notice FAQ](https://www.repost.aws/articles/ARi420OrIGR0y_9pOOker1QQ/abuse-notice-faqs).

An email impersonating Amazon has a separate brand-reporting route. Do not confuse that with reporting a third party's phishing content hosted on AWS. [Suspicious Amazon emails](https://aws.amazon.com/security/report-suspicious-emails/).

## Additional destinations from correspondence

### Hostinger

Hostinger accepts its abuse form or `abuse@hostinger.com`. Its policy requests a precise resource, explanation, supporting evidence appropriate to the incident, and reporter name/contact details where required. Examples include headers and message content, screenshots, logs, and timestamps. Submission affirms accuracy, completeness, authority to provide the information, and good faith. Its policy asks reporters to limit personal data to what is reasonably necessary. This is an evidence checklist, not a prescribed email narrative. [Abuse handling policy](https://www.hostinger.com/legal/abuse-policy).

Its security-vulnerability form is explicitly not the route for phishing hosted by customers. [Security and abuse routing](https://www.hostinger.com/support/8001450-how-to-report-a-security-issue-at-hostinger/).

### NiceNIC

NiceNIC's reporting page lists the abusive domain and URLs, impersonated site, and relevant country/device/browser context for phishing. Email-related evidence includes full headers and message content. The same page says customer notification may include reporter contact information. An abuse report cannot be assumed to remain inside the desk. [Reporting checklist](https://nicenic.com/reportabuse.php).

Its abuse policy requests context-specific evidence such as URLs, timestamps, screenshots, headers, and contact details, while excluding unnecessary personal data and secrets. It says no particular commercial threat feed or report format is necessary. It distinguishes rights disputes from phishing and allows separate handling of demonstrated DNS abuse. This describes its published policy, not proof that its historical handling met that policy. [Abuse reporting and handling policy](https://nicenic.com/legal/abuse-reporting-and-handling-policy).

### mijn.host

Its official abuse page directs reports to `abuse@mijn.host`. It asks for a substantiated explanation, the relevant URL where possible, information that identifies or reproduces the content, and available screenshots or other evidence. It says it acknowledges receipt and provides handling updates. The checked page supplies no email template or specific onward-disclosure assurance. [Misbruik melden](https://mijn.host/misbruik-melden).

### APWG

APWG requests forwarding to `reportphishing@apwg.org`, preferably as an attachment. It explicitly says submission grants permission to retain the entire email for analysis and archiving on its eCrime eXchange. A website-reporting alternative is linked for cases where mail delivery is blocked. This is an intelligence-sharing destination, not a provider that controls the reported sending account or website. [APWG submission instructions](https://apwg.org/reportphishing).

Design implication: APWG forwarding needs an explicit purpose and disclosure review. It must not become an automatic fallback for a provider report that is difficult to submit.

## Formal legal notices and evidence

### EU Digital Services Act

For hosting services within the DSA's scope, Article 16 describes a notice with a substantiated explanation of alleged illegality, the exact electronic location, the submitter's name and email, and a good-faith statement about accuracy and completeness. The identity exception concerns specified child-sexual-abuse offences, not ordinary phishing. Article 16 is not a universal email layout or a guaranteed removal deadline. Article 17 permits notifier identity in a statement of reasons where strictly necessary, subject to that article's scope and exceptions. [DSA Articles 16–17](https://eur-lex.europa.eu/eli/reg/2022/2065/oj/eng).

Design implication: a formal notice needs a deliberate legal basis and disclosure review. Do not silently convert a minimal abuse report into one, invent a legal conclusion, or add a declaration the operator has not reviewed. A policy violation and an alleged statutory violation need different support.

### Netherlands police and courts

The Dutch police phishing complaint page describes incidents involving disclosed information, financial loss, or concern about misuse of confidential information, with online and appointment routes. It is a police intake process, not a hosting-provider letter template. [Police phishing complaint](https://www.politie.nl/aangifte-of-melding-doen/aangifte-van-phishing.html).

For civil and administrative digital proceedings, Rechtspraak instructs parties to upload separate PDF/A documents with recognizable names and consecutive exhibit numbers. Other evidence formats have their own handling. Its secure-email guidance says the applicable procedural rules determine how filing works. These instructions do not turn an abuse email into a valid filing. [Digital proceedings FAQ](https://www.rechtspraak.nl/voor-advocaten-en-juristen/reglementen-procedures-en-formulieren/veelgestelde-vragen-digitaal-procederen), [secure-email FAQ](https://www.rechtspraak.nl/veilig-mailen-met-de-rechtspraak/veelgestelde-vragen-mailen-met-de-rechtspraak).

### US federal evidence rules

Rule 901 concerns showing that evidence is what its proponent claims. Rules 902(13) and 902(14) provide qualified-person certification routes for certain electronic records and copied data, with notice requirements. They do not prescribe an abuse-report email or make an AI summary or file hash automatically admissible. Other admissibility and procedural requirements remain relevant. [Federal Rules of Evidence, Rules 901–902](https://www.uscourts.gov/sites/default/files/document/federal-rules-of-evidence.pdf).

Design implication: preserve originals and their acquisition history privately, document transformations, and distinguish source evidence from analysis. That supports later evaluation of evidence. It is not a promise of court admissibility. A filing requires the relevant jurisdiction, proceeding, and court rules.

## An actual standardized email-report format

ARF, specified in RFC 5965, defines a multipart email feedback report with human-readable explanation, machine-readable metadata, and the original message or its complete headers. Appendix B supplies sample reports. It includes privacy considerations and has an update and errata. This is a mail-feedback format, not evidence that every hosting provider accepts it or a ready-made court complaint. [RFC 5965](https://www.rfc-editor.org/rfc/rfc5965.html), [status and updates](https://www.rfc-editor.org/info/rfc5965/).

Design implication: consider ARF only for a recipient that explicitly supports it, with the existing disclosure rules. Do not adopt original-message forwarding by default merely because a standard recommends forensic completeness.

## Implications for the reporting guide

These are recommendations from the comparison, not new sending permissions:

1. Keep one set of evidence and privacy rules. Add recipient-specific requirements for the channel, resource identifiers, evidence format, and onward disclosure.
2. Start a provider report with the concrete concern and requested investigation. Put the exact resource and relevant time where the recipient can find them, then give the decisive observations and supporting artifacts. Adjust the format to the provider's requirements.
3. Separate reports about an email sender, hosted content, a registered domain, and an impersonated brand. The same company may operate distinct reporting channels for each.
4. Prepare web-form fields when that is the supported route. Preserve the current manual-submission boundary.
   Requirements belong to a specific channel and date. Vercel's inspected form requires screenshots; that alone does not establish requirements for every other reporting channel. Do not convert a form constraint into a universal reporting prerequisite.
5. Review who may receive the report after the first recipient. Removing names from the covering note does not remove them from headers, URLs, forwarded content, or attachments.
6. Keep provider abuse reports, criminal complaints, formal legal notices, and court filings as distinct tasks. They can reuse verified facts but have different disclosure and submission requirements.

## Retrieval limits

Context7 was consulted for Cloudflare and AWS. Cloudflare results helped locate relevant documentation; the AWS query returned no matching documentation. AWS re:Post direct opens returned 403 responses, so the cited AWS text was inspected through search-indexed official pages. No third-party mirror was used. Cloudflare's JavaScript form did not yield its interactive fields, so the note identifies the API schema separately rather than claiming a live-form inspection. Recheck channel requirements when preparing a real submission.

The Hostinger Context7 search returned API libraries without matching reporting instructions. Its official policy and help pages supplied the abuse requirements instead. The linked mailbox and sending-provider notes document their own retrieval limits.
