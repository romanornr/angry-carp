# Mailbox provider reporting requirements

Checked 2026-09-21. This note covers Google and Gmail, Proton, Apple and iCloud, and Yahoo. It distinguishes reports about an abusive sending account, feedback about mail received in a mailbox, and reports about impersonation or hosted websites. No mailbox was accessed and no report was submitted.

## Google and Gmail

### Abuse sent by a Gmail account

The official [Gmail account-abuse form](https://support.google.com/mail/contact/abuse) requires a contact email, one reported account, the entire original email header, and the entire body. It also offers a subject field, additional context, and an indication that the message impersonates Google. Multiple accounts require separate reports. Google emphasizes original headers for investigation, asks users not to submit duplicates, and normally responds only if it needs more information. The form discloses that account and system information goes to Google under its linked privacy policy. It specifies pasted text, not an attached-message requirement. Account investigation does not promise account closure or removal of a linked website.

### Phishing received in Gmail

Gmail's message menu has **Report phishing** and **Report not phishing**. This applies to suspicious messages in the mailbox regardless of the claimed sender. Google's guidance explicitly says that manually moving mail to Spam gives Google a copy of the email and attachments for analysis. [Gmail phishing guidance](https://support.google.com/mail/answer/8253?hl=en)

Spam reports help Gmail identify similar messages. This is filter feedback, distinct from submitting the account-abuse form. [Gmail spam reporting](https://support.google.com/mail/answer/1366858?hl=en)

### Impersonation and websites

The account-abuse form includes Google impersonation within its account-reporting scope. For a page that imitates another page to steal personal information, Google's official guidance links to the [Safe Browsing phishing form](https://safebrowsing.google.com/safebrowsing/report_phish/). This is a website-reporting channel, not evidence that Gmail sent the lure. The live form returned only a JavaScript shell during this review, so current fields, URL formatting rules, and submission-specific sharing terms remain unverified. [Google reporting guidance](https://developers.google.com/search/help/report-quality-issues)

The same guidance separately warns that Search spam-report text can go to the site owner if Google issues a manual action, and prohibits personally identifying information in that submission. That warning appears under Search spam reports. It must not be silently attributed to the separate Safe Browsing form. [Google reporting guidance](https://developers.google.com/search/help/report-quality-issues)

### Google Cloud hosted abuse

Google's [Cloud abuse form](https://support.google.com/code/contact/cloud_platform_report?hl=en) explicitly covers Cloud Storage and other Cloud services. Required fields include reporter email, service selection, and abuse details. It requests abusive URLs or IP addresses and, if available, full HTTP request headers. Optional log uploads should have sensitive information removed. These are HTTP headers, distinct from email headers. It favors a separate submission for each IP address. Its displayed response text says requests are typically handled within a week and follow-up occurs when more information is needed; no submission was made to test that behavior. For a Cloud Storage lure, this is the hosted-content route, separate from Gmail account abuse or Safe Browsing. The form also discloses account and system information collection.

## Proton

### Abuse involving a Proton account

The [Proton abuse form](https://proton.me/support/report-abuse) requires the reported account address, reporter contact email, reason, and description. It accepts multiple reported addresses and optional `.eml`, `.txt`, `.pdf`, `.jpg`, or `.png` evidence. It includes a good-faith accuracy confirmation. The Anti-abuse Team investigates and disables accounts found to violate its terms. The page does not make full headers mandatory or prescribe an email-forwarding format.

Proton explicitly says Zendesk handles these form reports. It offers `abuse@proton.me` for private communication using Proton Mail, asking for the reported username or address, contact address, and description. That statement does not establish end-to-end encryption for email sent from every external mail provider. [Proton abuse form](https://proton.me/support/report-abuse)

### Phishing received in Proton Mail and Proton impersonation

The web and mobile apps offer **Report phishing**. The confirmation dialog asks permission to analyze the message and headers and sends the message to Proton's security team to improve filters. The guidance also covers messages pretending to be Proton. No separate public website-only impersonation form was found in these checked support pages. [Proton phishing reporting](https://proton.me/support/report-phishing)

Filtering and enforcement can overlap. Proton says it also reviews abuse reports submitted through the phishing feature. That is still not a promise to close every reported account or remove an external site. [Proton account-abuse handling](https://proton.me/support/account-disabled)

## Apple and iCloud

### Received abuse and Apple impersonation

Apple directs harassment, impersonation, and other abuse received in an `icloud.com`, `me.com`, or `mac.com` inbox to `abuse@icloud.com`. It separately directs emails pretending to be Apple to `reportphishing@apple.com`. For messages forwarded from Mail on a Mac, Apple specifies **Forward As Attachment** to include header information. It requests a screenshot for Apple-themed suspicious SMS. This is an actual forwarding instruction, not a prose complaint template. No website-only field schema or exact-URL requirement appears in this guidance. [Apple scam-reporting guidance](https://support.apple.com/en-us/102568)

Apple's iCloud terms also identify `abuse@icloud.com` for content encountered through the service that violates the agreement. They prohibit impersonation and unauthorized spam. However, the checked pages do not provide a distinct public form with required fields specifically for an external recipient reporting mail sent by an iCloud account. The terms permit access, preservation, and disclosure of account information and content to authorities or third parties for specified legal, enforcement, security, fraud, and safety purposes. These are general service terms, not a report-specific confidentiality promise. [iCloud terms](https://www.apple.com/legal/internet-services/icloud/)

### Mailbox feedback

Marking a message as Junk in iCloud Mail helps improve filtering and reduce future spam. Apple documents this for its apps and iCloud webmail. It does not equate the action with sender-account investigation or website takedown. The checked reporting articles do not explain report-specific onward sharing. [iCloud junk reporting](https://support.apple.com/en-ie/102376)

## Yahoo

### Abuse sent by Yahoo or AOL accounts

Yahoo's [Sender Hub FAQ](https://senders.yahooinc.com/faqs/) directs abuse involving Yahoo customers to its Report Abuse form. It explicitly requests the full message text and full headers; without headers, Yahoo says it cannot determine the actual source. The [Sender Hub contact page](https://senders.yahooinc.com/contact/#report-abuse) provides **Report Abuse** for AOL and Yahoo domains. The form itself loads dynamically, so required identity fields, attachment formats, and conditional validation were not verified.

Yahoo Help also directs users to report accounts sending spam or committing impersonation, harassment, or other terms violations. No fixed abuse email address or required prose template was established by the checked pages. [Yahoo abuse guidance](https://help.yahoo.com/kb/sln26401.html)

### Received phishing and onward sharing

Yahoo's phishing guidance directs users to mark suspicious messages as Spam to improve filters. Its warning banner can also offer reporting controls. It distinguishes this from reporting abuse by a Yahoo or AOL sending account. No separate website-only Yahoo-brand impersonation channel was established by that page. [Yahoo phishing guidance](https://help.yahoo.com/kb/SLN31009.html)

Yahoo documents an onward-sharing case for mailbox spam feedback. If the sending domain has enrolled its DKIM key in the Complaint Feedback Loop, Yahoo sends an abuse report to the enrolled address when a recipient marks that mail as Spam. The purpose is to let the sender suppress that recipient from future campaigns. This is not a claim that every complaint reaches its sender or that the separate account-abuse form uses the same sharing process. [Yahoo Complaint Feedback Loop](https://senders.yahooinc.com/complaint-feedback-loop/)

## Implications for Angry Carp

These are design conclusions, not additional provider requirements.

- Classify the recipient's role before drafting. A displayed sender address, impersonated brand, recipient mailbox, and linked hosting provider identify different reporting possibilities.
- Keep original messages locally. Forwarding an original, attaching an `.eml`, pasting headers, moving mail to Spam, and submitting a URL are distinct disclosures and actions.
- Require user approval for each report. Show the exact recipient, reporting purpose, message text, identity fields, headers, attachments, and known sharing behavior. Originals are never automatically forwarded. Mailbox mutations must stay within the operator's separate workflow authorization.
- If a provider requests full evidence and the user declines disclosure, record that the draft is incomplete for that channel. Do not quietly represent redacted evidence as complete.
- Preserve exact observed URLs in local evidence. Review recipient identifiers, tokens, and other private data before proposing external disclosure. Do not invent an exact-URL requirement where the source does not state one.
- Track filter feedback, accepted abuse reports, account enforcement, browser warnings, and hosted-content removal separately. Acceptance is not proof of remediation.

## Research limits

All citations identify official provider sources checked on the date above. Yahoo Help excerpts came from the search index because direct extraction returned HTTP 429. Yahoo Sender Hub HTML was readable by direct retrieval when web extraction failed. The Safe Browsing form exposed no current field text. No form validation, upload, confirmation, account login, or submission was tested. No general guarantee that reports remain confidential was found in the checked reporting pages. General privacy policies were not exhaustively reviewed.

Context7 resolved Google Cloud documentation libraries, but its query found no matching abuse-report documentation. The Google Cloud paragraph therefore uses the current official public form. This review makes no claim about the prevalence of any provider in phishing campaigns and does not define a reporting API.
