# Standards and reporting guidance

This page connects the existing research to current behavior and design decisions. The detailed source analysis remains in the linked research notes. Those notes record when sources were checked; provider instructions need verification when preparing an actual report.

## Reference map

| Topic | Existing analysis | Primary sources |
| --- | --- | --- |
| Email feedback formats and readable reports | [IETF email feedback standards](research/email-report-templates-and-standards.md#ietf-email-feedback-standards) | [RFC 5965](https://www.rfc-editor.org/rfc/rfc5965.html), [RFC 6650](https://www.rfc-editor.org/rfc/rfc6650.html#section-5.4) |
| Incident exchange and confidence | [Phishing-specific report schema](research/email-report-templates-and-standards.md#a-phishing-specific-report-schema) | [RFC 7970](https://www.rfc-editor.org/rfc/rfc7970.html#section-3.12), [RFC 5901](https://www.rfc-editor.org/info/rfc5901/) |
| Registration lookups and header provenance | [Registration and authentication references](research/email-report-templates-and-standards.md#registration-and-authentication-references) | [RDAP queries](https://www.rfc-editor.org/rfc/rfc9082.html), [responses](https://www.rfc-editor.org/rfc/rfc9083.html), [service discovery](https://datatracker.ietf.org/doc/html/rfc9224), [Authentication-Results](https://www.rfc-editor.org/rfc/rfc8601.html) |
| RDAP-first gTLD lookups | [Registration guidance](research/email-report-templates-and-standards.md#registration-and-authentication-references) | [ICANN transition announcement](https://www.icann.org/en/announcements/details/icann-update-launching-rdap-sunsetting-whois-27-01-2025-en), [RDAP user guidance](https://www.icann.org/en/contracted-parties/registry-operators/registration-data-access-protocol/information-for-rdap-users-31-08-2018-en), [ICANN Lookup](https://lookup.icann.org/en) |
| DNS records and resolver transport | [DNS lookup behavior](../agent/README.md#dns-lookups) | [RFC 1035](https://www.rfc-editor.org/rfc/rfc1035.html), [RFC 8484](https://www.rfc-editor.org/rfc/rfc8484.html), [Cloudflare JSON API](https://developers.cloudflare.com/1.1.1.1/encryption/dns-over-https/make-api-requests/dns-json/), [resolver privacy](https://developers.cloudflare.com/1.1.1.1/faq/) |
| Provider evidence and submission requirements | [Provider comparison](research/reporting-requirements-comparison.md) | [AWS reporting FAQs](https://repost.aws/articles/ARDaJQbZSdSdKpFjrFMNmgzQ/abuse-reporting-faqs), [Vercel reporting channel](https://vercel.com/kb/guide/how-to-get-vercel-support) |

## Current product choices

The four assessment sections and High/Medium/Low concern levels are project choices, not a prescribed RFC format. [ADR 0007](adr/0007-separate-assessment-from-reporting.md) records why assessment and reporting are separate. The [user guide](../agent/README.md#read-the-assessment) explains the output.

The existing [Wayfinder reporting decision](planning/issues/06-define-report-evidence-and-approval.md) keeps one canonical reporting guide and adapts report wording to the recipient. The assessment headings do not impose a new provider-email template. Channel-specific requirements, such as the [previously inspected Vercel form](research/provider-reporting-requirements.md#vercel), remain distinct from ordinary email-intake requirements and need rechecking before submission.

ARF and IODEF exports are not implemented. The local agent has an [RDAP tool](../agent/README.md#domain-registration-lookups) using RFC 9224 service discovery, RFC 9082 domain queries, and selected RFC 9083 response fields. It supports a bounded subset, with no redirects, referrals, or WHOIS fallback. Registrar abuse contacts retain their entity relationship, consistent with the [ICANN gTLD RDAP profile](https://www.icann.org/gtld-rdap-profile). An operator-supplied lookup remains supplied evidence, and reading standards does not count as checking a case's domains.

The DNS tool uses Cloudflare's documented JSON API. DNS record and response-code meanings come from the DNS protocol, but this JSON representation has no formal RFC. RFC 8484 specifies DNS over HTTPS using wire-format messages; this implementation does not claim that wire-format interface. JSON keeps the current record subset small and avoids a new DNS parser dependency.

The [channel reference](../reporting-channels.md) records the published submission routes reviewed on 2026-09-22, including Cloudflare's form and entitlement-limited API. Provider roles and report readiness remain recipient-specific. It is the only reporting reference loaded beside the triage instructions; submission automation is not implemented.

Provider reports state supported abuse directly, identify the resource and evidence, and request action within the provider's role. Material qualifications remain where omitting them would mislead. Our [reporting instructions](../provider-abuse-reporting.md) govern drafting and disclosure review. No standard cited here authorizes a disclosure or submission, and none guarantees provider action.

This reference and the research it links are not loaded into the assessment prompt.
