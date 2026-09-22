# Reporting channels

Checked 2026-09-22 UTC. Use a row when case evidence connects the provider to the resource in that role. These are reviewed channel references, not fresh checks of the case or permission to send. An older check date is a recheck note, not a blanket reporting hold.

| Provider and role | Channel | Evidence to prepare | Published instructions |
| --- | --- | --- | --- |
| Amazon SES, email delivery | `email-abuse@amazon.com` | Delivery headers, message identifiers and receipt time, deceptive content. | [AWS](https://repost.aws/knowledge-center/report-aws-abuse) |
| Resend, sending platform | `support@resend.com` | Headers linking the message to the platform, message identifiers, deceptive content. | [Resend violation reporting](https://resend.com/legal/terms-of-service) |
| Cloudflare, proxy/DNS or Workers/Pages hosting | [Phishing & Malware form](https://abuse.cloudflare.com/). | Exact URL, evidence of deception, and the supported service relationship. Identify email evidence and unvisited pages accurately. | [Submission routes](https://developers.cloudflare.com/fundamentals/reference/report-abuse/submit-report/), [service roles](https://www.cloudflare.com/trust-hub/abuse-approach/) |
| Cloudflare, registrar | Registrar category in the form; `registrar-abuse@cloudflare.com` when RDAP identifies Cloudflare as registrar. | Domain registration attribution and domain-abuse evidence. | [Registrar reporting](https://www.cloudflare.com/trust-hub/reporting-abuse/) |
| Trustname, registrar | `abuse@trustname.com` when returned as the registrar abuse contact by RDAP; its helpdesk form is an alternative and may be requested in a reply. | Domain, exact abusive URL, email or other abuse evidence. If using the form, follow its category support-code instructions. | [Trustname instructions](https://trustname.com/article/202000025104) |
| Hostinger, registrar or hosting provider | `abuse@hostinger.com` or its abuse form. | Exact resource, evidence, relevant time, reporter contact. Request action within the role established by the case. | [Hostinger policy](https://www.hostinger.com/legal/abuse-policy) |

Prepare only the evidence needed by that recipient; complete-email forwarding is not the default. For other registrars, use the registrar's RDAP abuse contact. For other services, identify the official-channel gap instead of inventing a contact.
