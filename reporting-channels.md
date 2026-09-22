# Reporting channels

<!-- Generated from lib/src/reporting/channels.ts. Run npm run reporting:generate; edit the catalogue, not this file. -->

Use a reference when case evidence connects the provider to the resource in the stated role. These are reviewed channel references, not fresh checks of a case or permission to send. Conditions must be checked against case evidence. An older check date is a recheck note, not a blanket reporting hold.

## Amazon SES: email-delivery

Checked 2026-09-22 UTC.

- Email: `email-abuse@amazon.com`. Case evidence connects the message to Amazon SES email delivery.

Evidence to prepare: Delivery headers, message identifiers and receipt time, deceptive content.

Published instructions: [AWS reporting instructions](https://repost.aws/knowledge-center/report-aws-abuse).

## Resend: sending-platform

Checked 2026-09-22 UTC.

- Email: `support@resend.com`. Its terms designate this support mailbox for violation reports. Our workflow permits preparing an investigation request on an evidence-backed possible connection. Lead with the supported abuse finding and ask Resend to check message identifiers and act on any associated abusive account. State the attribution limitation in the supporting evidence; proof of platform involvement is not required to prepare this request.

Evidence to prepare: Receiver headers, message identifiers and deceptive content, with the observations supporting the connection. A resend DKIM selector used in supplied receiver authentication results, together with DNS matching the documented Resend setup, is a reporting lead. The selector is sender-chosen and SES MX/SPF records are shared; these do not prove Resend handled the message or held the signing key.

Published instructions: [Resend violation reporting](https://resend.com/legal/terms-of-service), [Resend DNS configuration](https://resend.com/docs/knowledge-base/what-if-my-domain-is-not-verifying).

## Cloudflare: reverse-proxy, dns, hosting

Checked 2026-09-22 UTC.

- [Form](https://abuse.cloudflare.com/). Select Phishing & Malware when evidence connects the resource to Cloudflare. State the supported role; DNS or reverse-proxy evidence alone does not establish Workers/Pages hosting.

Evidence to prepare: Exact URL, evidence of deception, and the supported service relationship. Identify email evidence and unvisited pages accurately.

Published instructions: [Submission routes](https://developers.cloudflare.com/fundamentals/reference/report-abuse/submit-report/), [Service roles](https://www.cloudflare.com/trust-hub/abuse-approach/).

## Cloudflare: registrar

Checked 2026-09-22 UTC.

- [Form](https://abuse.cloudflare.com/). Select Registrar when case RDAP identifies Cloudflare as the registrar.
- Email: `registrar-abuse@cloudflare.com`. Use only when case RDAP identifies Cloudflare as the registrar.

Evidence to prepare: Domain registration attribution and domain-abuse evidence.

Published instructions: [Registrar reporting](https://www.cloudflare.com/trust-hub/reporting-abuse/).

## Trustname: registrar

Checked 2026-09-22 UTC.

- Email: `abuse@trustname.com`. Use when this address is returned as the registrar abuse contact by case RDAP.
- [Web instructions](https://trustname.com/article/202000025104). The helpdesk form is an alternative and may be requested in a reply. Follow its category support-code instructions. This link is the instructions page, not the form endpoint.

Evidence to prepare: Domain, exact abusive URL, email or other abuse evidence.

Published instructions: [Trustname instructions](https://trustname.com/article/202000025104).

## Hostinger: registrar, hosting

Checked 2026-09-22 UTC.

- Email: `abuse@hostinger.com`. Request action within the registrar or hosting role established by case evidence.
- [Web instructions](https://www.hostinger.com/legal/abuse-policy). Use the Report Abuse page linked by this policy as an alternative. Request action within the established role. This is separate from vulnerability disclosure.

Evidence to prepare: Exact resource, evidence, relevant time, reporter contact.

Published instructions: [Hostinger policy](https://www.hostinger.com/legal/abuse-policy).

Prepare only the evidence needed by that recipient; complete-email forwarding is not the default. For other registrars, use the registrar abuse contact from case RDAP, retaining its registrar relationship and source. For other services, identify the official-channel gap instead of inventing a contact.
