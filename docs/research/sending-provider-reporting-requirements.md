# Sending-provider reporting requirements

Checked 2026-09-21. Research only; no reports submitted. Postmark appeared in the sent-mail history identified by the parent investigation. Mailchimp, Twilio SendGrid, Mailgun and Brevo are comparison providers, not established participants in that history. No private message contents or identities are reproduced here.

Context7 resolved Mailchimp, Postmark and Twilio SendGrid documentation first. Queries returned no relevant submission instructions for Mailchimp/Postmark and unrelated API material for SendGrid. Official abuse/help pages therefore supply the reporting procedures below. Mailgun and Brevo findings concern their public abuse/help pages, not API configuration.

## Mailchimp

Use the [Mailchimp Abuse Desk form](https://mailchimp.com/contact/abuse/) or `abuse@mailchimp.com`. The form requires **Email headers or URLs/links** and **Additional information**; name and email are optional. Email complaints require full headers, or reporters can forward the email to the abuse address instead of completing the form. Web-page complaints require the page URL. Explain why the content is abusive. Submission affirms a good-faith belief that the report is accurate and complete. An optional contact address is described as used for the investigation. The instructions say “forward”; they do not prescribe `.eml` attachment delivery. [Official procedure and form](https://mailchimp.com/contact/abuse/).

The [spam reporting guide](https://mailchimp.com/help/i-received-spam-from-mailchimp/) specifically asks reporters to find the embedded campaign ID, or CID, in full headers so Mailchimp can identify the user and campaign. Preserve that identifier. Missing attribution evidence should reduce confidence; a displayed Mailchimp name alone is insufficient.

Mailchimp explains that [tracking URLs contain unique information](https://mailchimp.com/help/troubleshooting-click-tracking/) and that clicks on forwarded campaigns can be attributed to the original recipient. Preserve exact links privately for investigation; do not publish recipient-specific URLs or fetch them merely to complete a report.

Its [campaign complaint view](https://mailchimp.com/help/view-abuse-complaints/) lets customers see which addresses registered complaints. This describes campaign complaint visibility, not a promise that every direct Abuse Desk report is forwarded. No specific direct-report anonymization guarantee was found in the reviewed Abuse Desk procedure.

## Postmark

Postmark's [service abuse-information page](https://ab.mtasv.net/) explicitly instructs recipients of unsolicited mail to forward the email to `abuse@postmarkapp.com` for investigation. This independently discovered information page contains no candidate-message tracking token. Postmark's own [DMARC FAQ](https://postmarkapp.com/support/article/1088-dmarc-reporting-tool-faq) identifies `pm.mtasv.net` as its bounce-processing domain, and its [SPF documentation](https://postmarkapp.com/support/article/what-is-spf-and-why-is-it-important) identifies `spf.mtasv.net` as listing its mail servers. These establish the provider's use of the domain before relying on the abuse-information page.

The official [Messages API raw-message example](https://postmarkapp.com/developer/api/messages-api) corroborates `X-Complaints-To: abuse@postmarkapp.com`, alongside useful identifiers `X-PM-Message-Id` and `X-PM-RCPT`. Postmark also says some [identifying message headers are mandatory](https://postmarkapp.com/support/article/can-i-whitelabel-messages-without-a-dedicated-ip-3) so receiving providers can contact its anti-abuse team, even when customers use branded domains.

The verified instruction is to forward the email. No dedicated public abuse form, prescribed report prose, explicit full-header checklist, `.eml` rule, attachment limits, or required tracking-URL format was found in this bounded review. Preserving original headers, Postmark message identifiers and exact offending links is a draft recommendation beyond that forwarding instruction. The [general support form](https://postmarkapp.com/contact) is a support fallback, not an identified phishing-report template.

Postmark's [spam complaint webhook](https://postmarkapp.com/developer/webhooks/spam-complaint-webhook) documents recipient email, message ID, subject and an abuse-report dump in events delivered to customers. Its [security guidance](https://postmarkapp.com/support/article/is-postmark-secure-and-redundant) says spam complaints remain in stream suppression lists indefinitely. These concern feedback and suppression records; they do not establish how a direct abuse mailbox report is forwarded or retained.

Product/API vulnerabilities use the separate [responsible disclosure process](https://postmarkapp.com/support/article/779-responsible-disclosure-policy). A malicious or compromised customer sending account does not by itself prove a Postmark software vulnerability.

## Twilio SendGrid

Send customer-originated abuse to `abuse@sendgrid.com`. The [official customer-spam procedure](https://support.sendgrid.com/hc/en-us/articles/8830363760411-How-to-Report-Spam-Sent-by-a-SendGrid-Customer) asks for full email headers and supplies an illustrative header block. It is an evidence example, not prescribed complaint prose. Separate [SendGrid-impersonation guidance](https://support.sendgrid.com/hc/en-us/articles/43318383489563-How-to-Identify-Report-and-Secure-Your-Account-Against-Phishing-Emails) also says to forward the suspicious email to that address. Neither reviewed page requires forwarding as an `.eml` attachment or specifies attachment size limits or a tracking-link field.

[Forward Spam Reports](https://support.sendgrid.com/hc/en-us/articles/9489871931803-Mail-Settings-Guide-within-a-SendGrid-Account) can deliver complaint data to an address configured by the sending customer. That setting can also forward mail addressed to abuse/postmaster roles on the customer's authenticated return-path domain. Such an address is distinct from SendGrid's central abuse mailbox. The documentation does not establish that reports sent to `abuse@sendgrid.com` are automatically forwarded in full. Direct-report anonymity remains unverified.

Twilio's [vulnerability disclosure form](https://www.twilio.com/en-us/security/vulnerability-disclosure-program) concerns weaknesses in Twilio-owned or operated assets. Use the abuse channel for malicious customer traffic; do not relabel it as an API vulnerability without evidence.

## Mailgun

Use `abuse@mailgun.com` for spam or suspected customer violations. Mailgun's [security page](https://www.mailgun.com/security/) explicitly requests full email headers. Its [customer-spam page](https://www.mailgun.com/receiving-spam-from-mailgun/) confirms the same route.

For messages impersonating Mailgun, [Mailgun Renewal Team guidance](https://www.mailgun.com/mailgun-renewal-team/) says to forward the message with copied email headers added. This does not require a particular original-message attachment format. No dedicated complaint form, required tracking-link field, attachment limits or prescribed email wording was found in the reviewed procedures.

The security page's statement about not sharing with unauthorized third parties is not a specific promise that abuse reports cannot reach the reported customer. Direct-report forwarding and anonymity were not established. [Mailgun's acceptable-use policy](https://www.mailgun.com/legal/aup/) separately permits disclosure of customer/user/traffic information to authorities in specified circumstances; it should not be described as a reporter anonymity policy.

## Brevo

Use `abuse@brevo.com`. The [anti-spam help page](https://help.brevo.com/hc/en-us/articles/209405205-What-is-the-anti-spam-policy-of-Brevo) covers both unsubscribing and reporting abuse; it says Brevo will remove the recipient address, investigate the sending account and take appropriate measures. Its [technical-domain notice](https://m.brevo.com/) confirms the address and explains that Brevo operates tracking links and image hosting. The linked reporting form currently resolves to [Brevo contact](https://www.brevo.com/contact/); its fields could not be verified in the retrieved page.

No full-header requirement, original-message forwarding/attachment rule, attachment limit, exact tracking-link field, prescribed complaint prose, or specific onward-disclosure guarantee was found in the reviewed reporting pages. Brevo's [header help](https://help.brevo.com/hc/en-us/articles/213582045-How-do-I-find-email-headers) explains that headers contain origin and recipient details, but it is general support guidance, not a phishing submission checklist. Sending full headers and exact offending links is a draft recommendation, not an established form requirement.

## Implications for AngryCarp

- Keep an original message privately and build a separate approved evidence package. Full headers, message/campaign identifiers and exact links can identify recipients. Show every disclosure before sending.
- Attribute the sending provider from message evidence. Record a tracking provider separately from the sender, landing-page host, registrar and impersonated brand. None of these roles alone establishes the others.
- Preserve the exact observed tracking URL and any independently observed destination as separate evidence. None of the reviewed instructions permits inventing a destination by stripping tracking parameters. No general requirement to visit tracking links was found.
- State the specific phishing behavior and requested investigation. Record compromise as suspected unless evidence establishes it. A routine unsubscribe/list complaint, phishing abuse report and product-vulnerability report are different claims, even where one provider accepts multiple categories at the same address.
- Keep every initial report pending explicit approval. Do not interpret a provider's forwarding instructions as authorization to transmit private originals. Label locally written reports as drafts based on official requirements, not official email templates.
