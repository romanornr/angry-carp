# Provider reporting requirements

Checked 2026-09-21. Official sources only. Vercel and Microsoft conditional forms were inspected in the browser without entering contact details, evidence, or submitting reports. Context7 resolved `/vercel/vercel` and `/microsoftdocs/azure-docs`; neither returned matching abuse-report documentation, so the official forms and help pages below supplied the requirements.

## GoDaddy

Use the [phishing form](https://legalportal.godaddy.com/abuse/phishing). It asks for reporter email, impersonated company or brand, URL/site/domain, mobile-device context, viewing country, an issue description, and a good-faith accuracy declaration. Brand and reported URL have visible required markers. Multiple URLs may be separated by lines or commas. The description guidance allows a phishing email with full headers, the legitimate organization's website, and an explanation of the activity. This is an official submission form, not prescribed email prose.

The [abuse reporting guide](https://www.godaddy.com/help/reporting-abuse-27154) requests the full URL path and says its phishing category expects a live site with a login area. It expressly reserves the right to use the complaint to substantiate abuse to its customer. It promises neither an outcome nor outcome updates. The API support address is for access and technical assistance, not general abuse submissions.

For email complaints, [GoDaddy's follow-up guidance](https://www.godaddy.com/en-in/help/website-abuse-claims-next-steps-42781) requests full headers, message body, and an explanation showing the abuse. Include relevant access conditions, such as geographic restrictions. A domain registered there does not establish that GoDaddy hosts its website; record the observed provider role separately from the complaint.

## Vercel

Vercel's [abuse form](https://vercel.com/abuse) is a documented route for sites deployed on Vercel. The following requirements describe that form, not prerequisites established for email intake. Selecting **Phishing or Malware** reveals these fields:

- Required full name and email, each limited to 80 characters; reported URL, limited to 3,000 characters.
- Optional impersonated site's URL, limited to 3,000 characters.
- Personal-impact yes/no selection and an impact-evidence upload.
- Required screenshot evidence and reproduction steps, limited to 4,000 characters. Explain which content demonstrates phishing.
- Both upload controls display GIF/JPG/JPEG/PNG support, five attachments maximum, and 2 MB combined attachment size. They warn against attaching sensitive information.

Two independent forwarding controls appear, both unchecked during inspection: forward the report to the website owner, and include the reporter's name/contact information with that report. Submission acknowledges the privacy notice and affirms a good-faith belief that allegations are accurate and complete. This is a structured intake form, not an email template; no preferred email wording was found. [Source: live form](https://vercel.com/abuse).

Private correspondence is retained outside this repository. Verify the current email channel separately from form requirements. An acknowledgement alone does not establish investigation or removal.

The acknowledgements requested follow-ups in the original reporting thread and discouraged duplicate reports. One attempted reply to the no-reply mailbox received an unmonitored-inbox response. Follow-up routing must therefore use the verified case instructions rather than the acknowledgement's display title. Vercel's public [transparency report](https://vercel.com/legal/transparency) also records email as an intake channel, although its aggregate figures do not establish phishing-specific acceptance requirements.

Do not treat unchecked forwarding options as a universal confidentiality guarantee. Vercel's [privacy notice](https://vercel.com/legal/privacy-notice) describes disclosure to service providers and legal/public authorities under specified circumstances. Its [support guide](https://vercel.com/kb/guide/how-to-get-vercel-support) separates hosted-content abuse from vulnerabilities in Vercel's own systems, reported to `responsible.disclosure@vercel.com`, and open-source vulnerabilities, reported to `responsible.disclosure.oss@vercel.com`.

## Microsoft

Choose the channel by the Microsoft service's role:

| Role | Official route |
| --- | --- |
| Abuse originating from Microsoft-hosted sites/services, including Azure | [MSRC URL phishing form](https://msrc.microsoft.com/report/abuse?ThreatType=URL&IncidentType=Phishing) |
| Spam, impersonation, or phishing originating from Outlook/Hotmail/Live/MSN addresses | `abuse@microsoft.com`, linked from the [MSRC routing page](https://msrc.microsoft.com/report/) |
| Suspected phishing email for detection/analysis | Outlook's Report phishing action; other clients can attach the original message to a new email to `phish@office365.microsoft.com`. Microsoft says ordinary forwarding loses needed header evidence. [Phishing guidance](https://support.microsoft.com/en-us/security/protect-yourself-from-phishing) |
| Unsafe website for browser protection, regardless of its host | [SmartScreen unsafe-site form](https://www.microsoft.com/en-us/wdsi/support/report-unsafe-site-guest) |
| Vulnerability affecting Microsoft products/services | Separate [vulnerability report](https://msrc.microsoft.com/report/vulnerability), distinguished on the [routing page](https://msrc.microsoft.com/report/) |

The MSRC phishing form displays name, email, organization, phone, contact additional information, incident date/time/time zone, source and destination URLs, report notes, and an attachment control. Limits shown are 15,000 characters for contact additional information and 2,000 for report notes. It permits up to ten URLs of the same incident type. Requiredness should be checked in the live form; not all displayed fields are necessarily required.

Its **Anonymize report** control concerns contact information. Without it, Microsoft may share the entire report, including identity/contact fields, with its customer or relevant third parties. Even with it, the disclosure permits sharing incident details, including reported IP addresses. Microsoft may notify its Azure customer and ask them to resolve the issue. [Source: live phishing form](https://msrc.microsoft.com/report/abuse?ThreatType=URL&IncidentType=Phishing).

The [SmartScreen form](https://www.microsoft.com/en-us/wdsi/support/report-unsafe-site-guest) accepts URLs directly or a `.txt` file with one URL per line, up to 100 URLs and under 1 MB. It asks for phishing or malware/other threats, the site's language, and a CAPTCHA. This is a detection report, not proof of a hosting takedown. A Microsoft-themed login page alone does not establish Microsoft hosting.

## Namecheap

Use `abuse@namecheap.com` for domains registered with Namecheap and `abuse@namecheaphosting.com` for sites hosted there. The [official reporting guide](https://www.namecheap.com/support/knowledgebase/article.aspx/9196/5/how-and-where-can-i-file-abuse-complaints/) lists phishing evidence: abusive domain and exact URLs, impersonated legitimate website, viewing country, device/user-agent and browser. Email-abuse evidence includes From, To, full headers and content.

The same guide permits CSV, DOC/DOCX, EML, JPEG/JPG, PDF, PNG, TXT and XLS/XLSX attachments, subject to scanning. Despite listing EML, it explicitly says not to send original malicious emails or malware samples. Use safe evidence such as plain-text headers, screenshots, defanged URLs/domains, or existing sandbox/VirusTotal report links. No preferred email prose was found; the evidence checklist is the official submission specification.

[Namecheap's email-abuse explanation](https://www.namecheap.com/support/knowledgebase/article.aspx/10184/5/how-does-namecheap-investigate-suspected-email-abusespam/) says full headers help establish whether its mail/hosting services sent the message. Registrar attribution alone does not establish email origin.

The [trusted-provider phishing API terms](https://www.namecheap.com/legal/phishing-reports-api/phishing-reports-api-tou/) require verified phishing/fraud links, a screenshot, and an agreed report format. Access requires qualification through `abuseescalation@namecheap.com`; it is not an anonymous public endpoint. Those API terms permit sharing submissions with law enforcement, affiliates and other third parties without notification. Do not automatically apply that API-specific clause to ordinary email reports. The [general privacy policy](https://www.namecheap.com/legal/general/privacy-policy/) separately permits disclosures for abuse-related investigation, rights protection and legal purposes. No ordinary-email guarantee against forwarding to the customer was found in the reviewed reporting guidance.

## Implications for AngryCarp drafts

These are design recommendations derived from the evidence above, not additional provider requirements:

- Record provider role and its supporting evidence, exact resource location, observation time, impersonated site, and a factual explanation. Include viewing conditions when they affect reproducibility. Separate observed conduct from suspicion.
- Preserve an original email privately. Create a separate provider-specific evidence package; Microsoft may require the original attachment while Namecheap explicitly directs reporters to safe extracts. Never claim a redacted derivative is an unchanged original.
- Keep each report pending explicit approval. Preview recipient/channel, every field and attachment, redactions, forwarding/contact choices, and known disclosures. Editing that package should invalidate its approval.
- Keep screenshots and reproduction notes limited to what establishes abuse. Do not claim to represent the impersonated brand without authority. Never add private identities or unrelated mailbox contents merely to make a report appear stronger.
- Treat these forms/checklists as submission procedures. Do not label locally drafted email wording an official provider template. Recheck live requirements before submission; this note is dated research, not a promise that forms remain unchanged.
