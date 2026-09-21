# Report writing trial

Status: proposed examples, awaiting operator feedback. Prepared 2026-09-21.

The operator subsequently accepted defanging in new report subjects and use of the registrar reporting guidance. The proposed new subjects below reflect that decision. Historical subjects and existing-thread subjects remain unchanged. The prose trial still awaits reader feedback.

Question: can a provider analyst identify the resource, understand the evidence, and act on the request without reconstructing the investigation?

These are retrospective writing exercises, not new reports for submission. The selected reports concern AWS hosting, Postmark sending activity, and a NiceNIC registrar follow-up. Source messages and replies were read through Gmail. No candidate site was visited, no external scan was requested, and no mail was changed or sent.

Personal identities, message identifiers, ticket numbers, and candidate domains are replaced below. Hosts under `example.invalid`, identifiers beginning `sample-`, and bracketed placeholders are illustrative. The before versions preserve the relevant wording and structure but omit signatures, long headers, and quoted thread history. They are labeled adaptations rather than original evidence. The after versions are proposed replacements at the historical point of each report, not claims that the activity remains current.

## 1. Hosting report to AWS

### Before: sanitized adaptation

```text
Subject: Phishing page on S3: sample-bucket.s3.example.invalid

This S3 object serves a credential phishing page. The page imitates X
(Twitter).

URL: [Google redirect wrapper containing the S3 URL]
Bucket: sample-bucket
First seen: 2026-09-10 22:55 UTC

The link is delivered by bulk phishing email from a compromised university
account (sender@university.example.invalid). The email body is one image
styled as an X "Content Issue on Your Account" notice. The image links
to the URL above.

Message-ID: <sample-hosting-message@mail.example.invalid>

The full raw headers, MIME structure, and click target of the original
message are attached (phishing-evidence.txt). The complete .eml is
available on request.

Please remove the object and review the bucket owner's account.
```

### After: proposed wording

```text
Subject: Suspected X impersonation - sample-bucket[.]s3[.]example[.]invalid

Hello AWS Trust & Safety,

Please investigate the S3 object below. It is linked from an email
presented as an X account-enforcement notice, sent from a university
email address.

Resource: hxxps://sample-bucket[.]s3[.]example[.]invalid/review.html
Email received: 10 September 2026, 22:55:56 UTC
Email subject: Account Content Review

The email presents a "Content Issue on Your Account" notice. Its linked
image directs the recipient to this S3 object. I am reporting that use
of the link; I have not inspected the destination page.

Please investigate the object and disable it if you confirm phishing.
Let me know which additional evidence you need to identify or assess it.

Links are defanged: replace [.] with . and hxxps/hxxp with https/http.

Regards,
[Configured reporting signature]
```

### What the comparison establishes

The original was already short. Its main problems were unsupported claims about the page and account compromise, a rewritten resource URL, and an unverified promise of a complete original. Cutting words alone would not fix it. The revision scopes the request to the object and separates the email from the unvisited page.

Evidence reviewed for this trial includes the actual sent report, its text evidence attachment, the original source message's headers and HTML link, and an AWS request for full headers. The attachment preserves an unwrapped S3 URL, which matches the link in the source message. The receipt time comes from the receiving server's header, rather than the sender's Date field. The original report describes the embedded image's enforcement notice. Image extraction did not produce a viewable image in this trial, so that description is not independently reverified here.

**Readiness:** wording trial only. Reverify the embedded image's content before relying on its quoted notice in an operational report. Prepare the required disclosure copy of headers if answering AWS's actual evidence request. The example does not promise an attachment that has not been prepared. Neither an object name nor a different sender domain alone establishes phishing.

The later AWS thread contains both a header request and a mitigation statement. Those remain separate case facts. They do not prove that this proposed wording would have produced a better outcome.

## 2. Sending-service report to Postmark

### Before: sanitized adaptation

```text
Subject: Re: Compromised customer sending X phishing:
clicks.example.invalid / pharmacy.example.invalid

Following up on the prior report concerning clicks[.]example[.]invalid /
compromised Postmark customers sending X (Twitter) phishing.

NEW EVIDENCE
A new phishing sample was received 2026-09-15 15:26:26 UTC from a
different compromised customer identity:

Sender: X <artscentre@civic[.]example[.]invalid>
Return-Path: pm_bounces@pm-bounces[.]civic[.]example[.]invalid
Postmark MTA: mta212a-ord[.]mtasv[.]net [104[.]245[.]209[.]212]
Message-ID (defanged): <sample-sending-message@mtasv[.]net>
CTA host: clicks[.]example[.]invalid
Subject: Content issue for [recipient handle]

This is a separate customer stream from x@pharmacy[.]example[.]invalid.
The lure again impersonates X enforcement.

REQUESTED ACTION
Please investigate the Postmark customer / server associated with
civic[.]example[.]invalid and suspend confirmed abusive sending.

SUPPORTING EVIDENCE
Exact URL-01 and authentication notes are in the attached evidence.txt.
Landing page not visited.

ATTACHMENTS
evidence.txt — extracted URLs and notes
```

### After: proposed wording

Keep the verified original thread subject in actual correspondence. The subject below illustrates a revised initial subject, not an instruction to rename an existing case.

```text
Subject: X impersonation via Postmark - civic[.]example[.]invalid

Hello Postmark Abuse Team,

I am adding another message to this case. It claims to be an X
account-enforcement notice but was sent through Postmark using an arts
centre's sending address.

Sender: X <artscentre@civic[.]example[.]invalid>
Email received: 15 September 2026, 15:26:31 UTC
Message-ID (defanged): <sample-sending-message@mtasv[.]net>

The message alleges a community-guidelines violation and says that
restrictions may apply until review. Its "Take Action" link points to
clicks[.]example[.]invalid. The footer states, "This email was sent from
X." The same message also contains an unrelated arts-centre order receipt.

The receiving headers identify Postmark's mta212a-ord[.]mtasv[.]net as
the sending server. Please investigate the account responsible for this
message and stop any confirmed abusive sending. The cause of the misuse
is not established by the email alone.

Please clarify whether any action applies to the sending account or
only prevents further delivery to my address.

Links are defanged: replace [.] with . and hxxps/hxxp with https/http.

Regards,
[Configured reporting signature]
```

### What the comparison establishes

The original reports compromise and a separate customer stream as facts, but the message does not establish either internal account state. It lists identifiers while leaving the reader to infer the deceptive behavior. The revision gives the relevant behavior and a Message-ID the sending service can investigate. The tracking hostname identifies a clue, not the complete link or a verified landing page. A sending-account investigation can start with its own message identifier without disclosing the opaque tracking token.

This trial read the original message, the sent report, its evidence attachment, and Postmark's reply. The source headers identify receipt at 15:26:31 UTC; the original report used the sender's Date value of 15:26:26 UTC. The source HTML supports the enforcement language, X claim, and unrelated receipt. The receipt includes unrelated personal billing and contact information. Its contents do not belong in this report. The opaque action URL also remains out of the public example and needs separate disclosure review if a provider requests it.

**Readiness:** this has the strongest source support of the three writing examples. A real report still needs its exact, approved sender and Message-ID restored privately and its channel checked. No supporting attachment is promised by this version. If requested, prepare selected headers and the relevant body excerpt as a clearly labeled disclosure copy. The public example is not operational evidence.

Postmark's actual reply promised that the mailer could no longer contact the reporter. It did not establish account-wide suspension. The outcome question asks for that distinction without demanding internal customer information or claiming a takedown.

## 3. Registrar follow-up to NiceNIC

### Before: sanitized adaptation

```text
Subject: Re: Phishing domain: card-service.example.invalid
(card-brand impersonation) [existing ticket]

This is DNS Abuse under RAA 3.18.2, not an IP dispute, with the evidence.

I'll escalate to ICANN Compliance if no action is taken.
```

The quoted reply treated the complaint as trademark or copyright handling and said the registrar review was complete absent new information. The preceding report relied on recent registration, a document-signing request, different sender and action domains, and no previous relationship. Those clues do not meet the agreed High-confidence threshold by themselves.

### After: proposed wording

```text
Subject: Re: Phishing domain: card-service.example.invalid
(card-brand impersonation) [existing ticket]

Hello NiceNIC Abuse & Compliance Team,

Please clarify whether your review assessed the reported email activity.
Your reply discusses trademark and copyright remedies, but does not
address the message described in my report.

The message uses the card brand's name, says its service agreement has
changed, and asks the recipient to "Download and Sign Agreement." It was
sent from cards@card-service[.]example[.]invalid and links to
hxxps://agreement[.]example[.]invalid/card-service/.

The domain registered with NiceNIC is card-service[.]example[.]invalid.
The linked domain is separate. Please explain whether you assessed the
reported use of the sending domain and which additional evidence would
be needed to investigate suspected phishing.

Links are defanged: replace [.] with . and hxxps/hxxp with https/http.

Regards,
[Configured reporting signature]
```

### What the comparison establishes

The revision makes the unresolved question answerable. It identifies the registrar's domain, distinguishes the other provider's resource, and points out what the reply did not address. It does not convert a disagreement into a proved contractual breach or demand cancellation based on the stated clues alone.

The trial read the actual follow-up, the quoted registrar response and preceding report, and a forwarded copy of the source email. The forwarded body supports the agreement request. It does not by itself prove the sender lacked authorization to act for the brand. The source original was not independently recovered for this example.

**Readiness:** hold as Medium pending the unresolved concern, rather than sending a new accusation. The focused operator question is whether the agreement was expected from an existing card-service relationship. That answer provides context, not automatic proof either way. Independent evidence of impersonation could also resolve the concern. The revised follow-up demonstrates wording only; it is not a recommendation to reopen a stalled destination or bypass the agreed follow-up limit.

Poor registrar handling and insufficient evidence can coexist. Neither should be hidden to strengthen the other. A later ICANN dossier would need the actual chronology, actionable evidence supplied, and the response that failed to address it.

## Reader review

| Check | AWS revision | Postmark revision | NiceNIC revision |
| --- | --- | --- | --- |
| What should the desk investigate? | One S3 object linked from the email. | Sending activity identifiable by Message-ID. | Whether the stated email activity was assessed. |
| What supports the concern? | Source link and reported image content, with the image-review gap recorded. | Source headers, enforcement claims, and inconsistent receipt content. | Reported agreement request and a reply addressing rights disputes. |
| What claim was removed? | Observed credential collection, bulk scale, and proved mailbox compromise. | Proved compromise and separate internal customer-stream identity. | Established DNS-abuse breach and an immediate escalation threat. |
| What stays private? | Original message, full headers, unrelated forwarded material. | Recipient identity, unrelated receipt data, and opaque URL token. | Private correspondence and operator context. |
| Is the report ready to send? | No: historical trial with an image-review gap. | No: sanitized historical trial requiring private payload preparation. | No: underlying High-confidence justification remains insufficient. |

These are editorial comparisons, not measured improvements in provider outcomes. The Postmark example is slightly longer because it supplies the behavior the original largely omitted. Readability and useful evidence take priority over a shorter word count.

## Sources and proposed changes

The [standards review](email-report-templates-and-standards.md) and [provider comparison](reporting-requirements-comparison.md) distinguish plain-text guidance from ARF packaging and channel-specific requirements. The examples adapt the human-readable reporting principles. They are not ARF messages, CERT-EU forms, CISA submissions, or legal notices.

The trial suggests retaining the canonical guide's factual tone and flexible structure, while sharpening these points after reader feedback:

1. Put the decisive behavior beside the identifier the recipient can investigate.
2. Give each essential fact in the body even when an evidence file also exists.
3. Use the current thread and reply instructions for a follow-up. Address the unresolved point without repeating the whole initial report.
4. When the evidence fails the reporting threshold, hold the accusation. A prose rewrite cannot supply missing evidence.

The [canonical reporting guide](../../provider-abuse-reporting.md) now includes the separately accepted subject-formatting and registrar-guidance changes. The three prose rewrites have not been adopted as canonical examples. Reader feedback should determine which examples to retain and what to change before incorporating them into that guide.
