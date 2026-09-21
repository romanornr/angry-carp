# Additional reporting and simulation sources

Checked 2026-09-21. The operator supplied all six sources. Read public pages and repository source views only. No candidate links, template previews, deployments, or submissions were used.

## What each source contributes

| Source | Finding | Use for Angry Carp |
| --- | --- | --- |
| [NCSC suspicious-website form](https://www.ncsc.gov.uk/section/about-this-website/report-scam-website) | Asks for a URL, how it was received, and optional context about the claimed company and requested action. The URL and context fields each have a 1,000-character limit. It explicitly says not to click the link. It describes restricted information access and possible sharing with law-enforcement partners. | A possible manual protective reporting channel. Prepare minimal URL and context fields with disclosure review. Its visible form does not require screenshots or a full email. No need to visit a candidate site to satisfy those fields. |
| [Kaspersky website-reporting article](https://www.kaspersky.com/resource-center/preemptive-safety/how-to-report-a-website) | General guidance on collecting URLs, descriptions, timestamps, evidence, and correspondence, with links to reporting channels. It is not an abuse-desk email template. | Useful for discovering sources. Verify each destination's requirements with that destination before routing. Its guidance across copyright, fraud, and other complaints should not become one phishing procedure. |
| [AWS suspicious-email page](https://aws.amazon.com/security/report-suspicious-emails/) | Covers messages claiming to be Amazon and lists `stop-spoofing@amazon.com` as a forwarding route. It provides no prose report template. | Treat as Amazon brand-impersonation intake. Do not use it as evidence that this address handles arbitrary phishing hosted on AWS. Forwarding still needs exact-payload approval and disclosure review. |
| [usecure simulation-template article](https://usecure.io/blog/10-of-the-best-phishing-templates-for-calculating-employee-risk) | Published June 17, 2022. Describes employee simulations such as account alerts, invoices, parcel notifications, and meeting invitations. | Suggests scenario variety for future detector evaluation. It supplies neither an outgoing abuse-report template nor a validated benchmark for Angry Carp. |
| [securitygeneration/templates](https://github.com/securitygeneration/templates) | A fork of the Gophish template collection with branded HTML email lures and instructions for simulation use. | Possible reference for inert parsing fixtures and scenario ideas. These are messages an investigator might inspect, not letters to send to providers. |
| [HailBytes/gophish-training-templates](https://github.com/HailBytes/gophish-training-templates) | Email and landing-page templates for authorized employee awareness simulations. The repository includes an MPL-2.0 license file. | Possible source of selected offline fixtures after source and reuse review. Its employee click and reporting metrics do not measure detector false accusations or provider takedowns. |

## Changes to the reporting approach

Keep a concise shared report-writing guide with channel-specific evidence requirements. These sources do not establish a universal email layout or require a particular heading sequence.

The NCSC form gives another concrete example of useful reporting without agent visits or full-email forwarding. Its information-sharing statement still matters to disclosure review. Do not infer anonymity or a guaranteed takedown from the visible fields. The optional context can explain what the email asks the recipient to do while accurately stating that the linked page was not inspected.

Kaspersky's article associates hosting information with registrar lookup information. Angry Carp must verify those roles separately. This limits the article's value for routing, but its evidence checklist remains useful. Do not carry over its suggestion to contact a site owner into a suspected-attacker case.

The AWS distinction is already captured in the [reporting comparison](reporting-requirements-comparison.md). Keep brand reporting and infrastructure reporting as separate recipient roles.

## Limits of simulation material

The following are proposed evaluation precautions, not findings that these collections meet a benchmark standard:

- Read HTML as source. Do not render the pages, load their images, follow links, or deploy a simulation to inspect them.
- Create safe fixtures with synthetic identities and inert destinations. Preserve the source reference and record modifications so a generated fixture is not mistaken for a captured original email.
- Include ordinary legitimate examples with similar wording. A parcel notice or password-reset subject alone must not force a phishing accusation.
- Label authorized simulations separately from confirmed malicious campaigns. Recognizing a deceptive-looking message is different from having grounds to report its infrastructure.
- Keep related template variants in the same evaluation partition. Near-duplicate variants on both sides of a comparison can exaggerate performance.
- Use public templates to test mechanics and scenario coverage. Evaluate real-world accuracy separately on appropriately reviewed messages. Public examples may already be familiar to a model.

No template has been copied into the repository. HailBytes supplies a [license file](https://github.com/HailBytes/gophish-training-templates/blob/main/LICENSE). The securitygeneration repository's [disclaimer](https://github.com/securitygeneration/templates/blob/master/Disclaimer) asserts educational purpose; it does not establish a clear reusable license for our purposes. Keep it as a reference unless reuse terms are resolved.

The [detector evaluation proposal](phishing-detection-design.md) remains the basis for measuring false accusations, missed phishing, review workload, and unsupported report claims. These sources add candidate scenarios without choosing a detector, training a model, or selecting a runtime.
