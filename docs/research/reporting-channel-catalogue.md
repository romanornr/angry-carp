# Reporting-channel catalogue research

Checked 2026-09-22. This extends the [earlier format research](email-report-templates-and-standards.md) and [provider comparison](reporting-requirements-comparison.md). Those investigations already separated report contents from intake channels. This note covers the lookup and maintenance design, not new submission protocols.

## Applicable standards

| Source | Verified meaning | Implementation consequence |
| --- | --- | --- |
| [RFC 2142, sections 1, 2 and 4](https://www.rfc-editor.org/rfc/rfc2142.html), Standards Track | Defines conventional role mailbox names and associated organizational obligations. It does not identify which organization operates a reported resource or supply provider form requirements. | Use recorded provider instructions or attributed contacts. The catalogue never constructs `abuse@` addresses. That is a project policy, not a claim that the RFC forbids using conventional names. |
| [RFC 9083, section 10.2.4](https://www.rfc-editor.org/rfc/rfc9083.html#section-10.2.4), Standards Track | RDAP roles describe an entity's relationship to registration data. Its `proxy` role is representation of another entity, such as a registrant. | Keep `serviceRole` separate. Use `reverse-proxy` for web traffic handling; do not map RDAP `proxy` to it. |
| [ICANN February 2024 RDAP Response Profile, section 2.4.5](https://www.icann.org/en/system/files/files/rdap-response-profile-21feb24-en.pdf) | Requires the abuse-contact entity inside the registrar entity, including telephone and email. The [profile page](https://www.icann.org/gtld-rdap-profile) records implementation for gTLD registries and registrars from 21 August 2025. | Preserve the registrar relationship when using RDAP contacts. A top-level contact is not automatically the registrar's desk. This does not establish ccTLD coverage or hosting attribution. |
| [RFC 9116, sections 1.1 and 5.1](https://www.rfc-editor.org/rfc/rfc9116.html#section-1.1), Informational | `security.txt` primarily supports vulnerability disclosure. Incident-response use has additional risks, including a compromised site publishing an attacker-controlled contact. | Do not automatically treat `Contact` as an abuse intake. This increment implements no `security.txt` discovery. The RFC discusses exceptional incident-response use; it does not categorically prohibit it. |

[ARF and IODEF](email-report-templates-and-standards.md#ietf-email-feedback-standards) describe report exchange formats, not recipient adoption or a universal reporting-channel catalogue. No cited standard specifies this TypeScript shape, a prompt layout, or the decision to use a Flue tool.

## Existing implementations

Abusix's public [querycontacts implementation](https://github.com/abusix/querycontacts) looks up network abuse contacts for an IP address. Its [Guardian Intel query documentation](https://docs.abusix.com/docs/guardian-intel/api-reference/lookup/get-query) includes an abuse email and a last-verification field. These show useful contact-discovery and freshness mechanisms. They do not establish the service-specific forms, category instructions, or evidence requirements of the six maintained records. No Abusix service was queried or installed.

Claude also investigated abuse.net as a contact directory. This session's web retrieval returned unrelated redirected content, so its availability and current schema were not independently established. Neither that failed retrieval nor this bounded review proves that no suitable directory exists. A new external dependency is unnecessary for the current operator-reviewed routes.

## Review synthesis and implementation choices

Claude and Grok independently recommended TypeScript data plus generated Markdown, with conditional registrar routes and source dates preserved. They disagreed on keeping the table in the prompt. Claude measured the existing file at 2,392 bytes and inferred a tool would cost more; no tokenizer or end-to-end run established that claim. Grok favoured retrieving relevant records without claiming a token saving. The operator chose smaller initial reference context and deterministic selection, with batched queries to limit separate tool calls. Ten pairs is a response budget, not a research-derived optimum.

Their code sketches needed adjustment. Claude's first-provider-record lookup would miss Cloudflare's second role. The implementation filters by provider and role across all records. Both sketches risked treating an instructions page as a form endpoint; distinct `instructions` and `form` variants preserve that difference. Required condition text survives both the lookup result and Markdown generation. These conditions are reported, not evaluated by code.

At six records, a linear scan keeps the matching logic visible without an index. No performance advantage over alternative data structures is claimed. Compile-time types check maintained records; boundary schemas check external queries. Tests check route separation, misses, mutation isolation, batch bounds, and generated-document equality. This is deterministic reference selection, not deterministic case attribution or a send-time recipient validator.

The [ADR](../adr/0009-maintain-reporting-channels-as-data.md) records the decision. The [update guide](../updating-reporting-channels.md) is the maintenance procedure. Provider-source review dates remain distinct from this standards review date.
