# Email report templates and standards

Checked 2026-09-21. This supplements the [provider comparison](reporting-requirements-comparison.md). A reporting address, an intake form, a narrative checklist, and a standardized email format are different artifacts. The first comparison underemphasized sources that can guide the actual report body.

## IETF email feedback standards

**RFC 5965, ARF**, defines a real multipart email report and provides examples in Appendix B. It combines human-readable explanation, machine-readable feedback, and the original email or complete headers. Section 2 also constrains the subject line to the original subject with only a normal forwarding-prefix change when it differs. A custom provider letter is not automatically ARF-compliant. The specification concerns email-abuse feedback, not a universal website-removal notice. [RFC 5965](https://www.rfc-editor.org/rfc/rfc5965.html).

**RFC 6650**, which updates RFC 5965, gives operational guidance. Section 5.4 says unsolicited ARF reports should include the necessary information in the plain-text human section because recipients may lack an ARF parser. Section 5.5 says published abuse mailboxes should not reject reports solely for being non-ARF, subject to local policy exceptions. This is evidence for readable, self-contained reports, not a guarantee of any provider's behavior. [RFC 6650](https://www.rfc-editor.org/rfc/rfc6650.html#section-5.4).

**RFC 6590** addresses redaction of potentially sensitive information in mail-abuse reports. Its mechanisms do not establish that arbitrary bodies, URLs, or attachments have been anonymized. Angry Carp's broader disclosure checks remain necessary. [RFC 6590](https://www.rfc-editor.org/info/rfc6590/).

## A phishing-specific report schema

**RFC 5901** defines phishing extensions to IODEF, including lure evidence, impersonated brand, collection site, related incidents, and takedown information. Appendix C contains a sample phishing report. It is an XML exchange format, not a prose letter, and does not establish recipient adoption. [RFC 5901](https://www.rfc-editor.org/info/rfc5901/).

Its base is IODEF version 1, RFC 5070. RFC 7970 later defines version 2 and obsoletes RFC 5070. Any implementation would need a compatibility and recipient-support check rather than assuming the old extension fits a newer schema unchanged. [IODEF version 2](https://www.rfc-editor.org/rfc/rfc7970.html).

## A copyable agency incident template

CERT-EU's **2011 security white paper 2011-002** includes an actual fill-in incident notification template. Its groups cover disclosure restrictions, contact information, incident details and timing, affected systems, actions taken, requested help, and follow-up status. This is a historical incident-response example intended for its constituency, not a current generic phishing-provider submission requirement. [Template, page 2](https://cert.europa.eu/publications/security-guidance/CERT-EU-SWP_11_002_v2_1/pdf), [current CERT-EU contact scope](https://cert.europa.eu/contact-us).

The separate [agency template check](agency-template-check.md) covers current FBI, CIA, NSA, and CISA sources. No claim of exhaustive absence follows from failing to find a public template.

## Industry phishing guidance

**Effective DNS Abuse Reports**, hosted under RRSG's March 2025 documents and carrying both registrar and registry stakeholder-group branding, supplies an email layout, evidence checklist, and examples. All five pages were read and visually inspected on 2026-09-21. These are guide requirements, not universal contractual duties. This directly relevant template was missed in the initial comparison. [RRSG/RySG guide](https://rrsg.org/wp-content/uploads/2025/03/Effective-DNS-Abuse-Reports-2025.pdf).

The operator accepted the [canonical guide's](../../provider-abuse-reporting.md#initial-registrar-reports) adaptation: defanged subjects for new reports, original subjects for ongoing cases, and a registrar-specific default layout. Full original values stay private; approved form fields and exports use their required syntax. Screenshots, identity fields, and evidence copies remain subject to the agreed investigation and disclosure boundaries. This decision does not approve all three prose examples in the [writing trial](report-writing-trial.md).

Defanging with `[.]` is an established reporting convention. The current **Safe and Reversible Sharing of Malicious URLs and Indicators** document remains an individual Internet-Draft, intended as Informational, in the RFC Editor queue as checked on 2026-09-21. It is not an Internet Standard or an issued RFC. Its current revision prefers bracketed schemes such as `[https]` and recognizes legacy `hxxps` for decoding. It does not make Angry Carp's existing convention a universal RFC requirement. [Draft status and text](https://datatracker.ietf.org/doc/draft-grimminck-safe-ioc-sharing/).

M3AAWG's **2018 Best Current Practices for Reporting Phishing URLs** recommends reporting the actual embedded destination, retaining the original lure URL when redirects exist, and recognizing the risk of visiting candidate sites. It acknowledges privacy limits on sending whole emails. Its central recommendation is APWG reporting, not a model hosting-provider letter. That recommendation does not override the operator's disclosure rules or establish a guaranteed takedown. [M3AAWG guidance](https://www.m3aawg.org/sites/default/files/doc_files/m3aawg-reporting-phishing-urls-2018-12.pdf).

## Implication for Angry Carp

The sources support building on established reporting practice. They do not support assigning every recipient the same template or requiring all artifacts a web form happens to request.

The human report should identify the resource, explain the observed deception and evidence source, supply relevant timing and provider attribution, and request an investigation within the provider's role. Essential facts must be readable without opening attachments. Supporting artifacts depend on the recipient and disclosure approval. This is our proposed adaptation of the sources, not an official agency letter.

ARF or IODEF can be evaluated as optional exports when a recipient benefits from them. No implementation or sending permission follows from this research. Our current report guide remains the single drafting instruction source.
