# Preserve page evidence after mitigation

Checked 2026-09-21 after the operator raised the risk that one provider removes infrastructure before another can investigate. This is a design comparison. No page capture, archive submission, or candidate request was made.

## Available approaches

| Approach | Verified behavior | Fit with current rules |
| --- | --- | --- |
| [Wayback Machine Save Page Now](https://archivesupport.zendesk.com/hc/en-us/articles/360001513491-Save-Pages-in-the-Wayback-Machine) | Accepts a URL and creates a shareable archived page that can remain available after the original changes or disappears. Some captures fail. The documented workflow puts pages into the public Wayback archive; it does not establish private capture. | A possible future explicitly approved public-disclosure option. It does not meet the current private-only automatic submission policy. |
| [Private urlscan results](https://urlscan.io/docs/api/) | Can provide result data, a screenshot, and a DOM snapshot when captured. Private visibility is distinct from unlisted visibility. Sharing the scan ID can expose the result. Artifacts may be missing or results deleted. | The existing investigation option, subject to privacy checks and verified account capability. Preserve necessary artifacts privately instead of relying only on the result link. It is not guaranteed to provide a complete web archive. |
| [Perma.cc](https://perma.cc/docs) | Its service visits the supplied URL and preserves a record. Its [organization settings](https://perma.cc/docs/registrars) document private-on-creation configuration; records otherwise default to public. | Worth evaluating if fuller web preservation becomes necessary. Account access, privacy at creation, acceptable use for malicious content, artifact export, and sharing controls are unverified for this project. Do not enable automatic candidate submissions on this research alone. |
| Private local evidence package | Proposed Angry Carp storage of acquired email evidence, cleared screenshots, source identifiers, capture metadata, and relevant inert scan artifacts. | The retained evidence for a case. It does not require Angry Carp to fetch the candidate itself and remains available if a third-party link disappears. |

Context7 did not return a relevant Perma.cc documentation collection; official Perma documentation supplied the facts above. The [private-scan boundary check](private-scan-boundary-check.md) covers urlscan integration details.

## Recommended sequence

1. Establish the resource relationships from available evidence and identify the providers with a useful action to take.
2. Preserve the original email privately. If a page capture is needed, obtain it through an allowed external source before the first report, where feasible.
3. Record the exact submitted target, any reduction from the original link, capture time, source, artifact integrity digests, and acquisition limitations. Store the captured artifacts privately as inert evidence.
4. Prepare a separate disclosure copy for each recipient. Include a short note about other relevant reports using their actual status. A shared case does not require a shared recipient list.
5. If mitigation happens first, supply the historical evidence and the provider's confirmed action with its time. Keep the remaining request specific to that recipient's responsibility.

This sequence is a workflow recommendation, not a universal provider requirement. It cannot guarantee that a scanner will observe the same page the recipient would have seen. Cloaking, location, required interaction, and capture failure can limit evidence. Do not visit the candidate directly to fix those limitations.

## Publication and replay boundaries

An archive service can perform the visit remotely, but the submitted URL still reaches that service and the target. Publishing the capture is an additional disclosure of both the URL and captured content. A privacy-cleared URL does not guarantee that the returned page contains no personal information.

Current automatic permissions cover private, privacy-cleared submissions. Public archiving remains outside that policy. A future exception would need explicit approval of the disclosure and a suitable workflow; changing a public record to private afterwards is not private capture from the start.

An archived page is still untrusted web content. Inspect static screenshots and inert source or metadata. Do not use browser replay that might execute scripts, follow links, or fetch missing resources from the live candidate. Do not assume a cached link removes the direct-fetch risk.

A capture and its digest support provenance and integrity. They do not by themselves prove identity, malicious intent, or legal admissibility. Keep claims tied to what the artifact actually shows.
