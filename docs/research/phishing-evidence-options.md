# Phishing evidence options

Research date: 2026-09-21. This preliminary research supports the design interview before creation of the decision map. It records facts and possible design implications, not agreed policy.

Research used Context7 to resolve and query urlscan documentation, followed by official provider sources. It did not access Gmail, search for actual threat indicators, submit scans, visit candidate phishing URLs, or send reports.

## Existing observations and new scans

urlscan separates searches of historical results from submissions that start a new scan. Search results contain scan metadata and references to stored results. A submission starts a browser visit and records network activity, page content, cookies, and a screenshot. [urlscan API documentation](https://urlscan.io/docs/api/), [how urlscan works](https://urlscan.io/about/).

Visibility controls who can discover the result. Public scans appear in public search. Unlisted scans remain accessible to vetted security researchers and urlscan Pro customers. Private scans appear in the submitter's search and can be shared through the scan ID. A private scan still visits the target. [urlscan visibility documentation](https://urlscan.io/docs/api/).

The design implication is that looking up existing evidence and commissioning a visit need separate permissions. Neither public nor unlisted submission is suitable for an assumption that evidence stays confidential. Removing identifiers from a URL also changes the submitted evidence and may change what the remote site returns. The latter point is an inference, not a tested property of any sample.

Account quotas, retention, and acceptable disclosure of victim-specific URLs remain open questions. Search queries themselves disclose their contents to the search provider, even when no scan is submitted.

## What historical scans establish

urlscan exposes scan times, submitted URLs, final URLs, contacted domains and IP addresses, and response hashes. Some additional content fields require paid plans. These fields support comparisons across stored observations. [urlscan search field definitions](https://urlscan.io/docs/search/).

The following are limits inferred from what those observations measure. Scan history does not establish the number of recipients, the total volume of a campaign, or current availability. The earliest result found is an earliest observed scan, not proof of when an operation began. Several observations can contain the same resource without belonging to the same attacker. Shared hosting, copied phishing kits, and common assets offer alternative explanations.

A possible design would record related observations with their matching evidence and time bounds. It would keep an actor-attribution claim separate from an artifact match. The meaning of "same phisher" still needs a decision.

## Provider evidence requirements

Cloudflare asks for the specific resource URL because assets on one website can use different providers. Its response depends on whether it provides CDN, registrar, or hosting services. Current documentation lists a public abuse form and an Abuse Reports API for entitled customers with specified roles. the operator's entitlement is unknown. [Specific resource URLs](https://developers.cloudflare.com/fundamentals/reference/report-abuse/provide-specific-urls/), [submission channels](https://developers.cloudflare.com/fundamentals/reference/report-abuse/submit-report/).

Cloudflare's collection instructions include an example that visits a page to inspect an asset URL. This research did not establish a universal requirement to visit every reported page or provide screenshots for every phishing report. The public form's full validation rules were not tested.

AWS distinguishes messages sent through its infrastructure from messages that link to AWS-hosted content. Its reporting guidance requests full headers for mail abuse and names `email-abuse@amazon.com` for SES abuse. Receiver-added headers provide stronger provenance than earlier, potentially forged headers. [AWS header and reporting guidance](https://repost.aws/articles/ARtutzAqg4Rw-vD4METZE71g/how-do-i-use-email-headers-to-identify-the-sender-of-a-spam-email).

SendGrid documents `abuse@sendgrid.com` as a reporting route and asks for full headers to help process the sample. Its guidance does not require a landing-page investigation to start an email abuse report or promise that a report produces suspension. [SendGrid reporting instructions](https://support.sendgrid.com/hc/en-us/articles/8830363760411-How-to-Report-Spam-Sent-by-a-SendGrid-Customer).

These differences suggest that evidence requirements belong to the provider and the alleged abuse. A single global rule that every report needs a website screenshot would exclude documented email-reporting paths. Provider-specific requirements still need a broader review before automation.

## What email evidence establishes

Full headers can support attribution to sending infrastructure. Authentication results do not establish that the message is harmless. Phishing can use trusted sending infrastructure. [AWS header guidance](https://repost.aws/articles/ARtutzAqg4Rw-vD4METZE71g/how-do-i-use-email-headers-to-identify-the-sender-of-a-spam-email), [Cloudflare's phishing explanation](https://www.cloudflare.com/learning/security/phishing-attack/).

The proposed distinction is between an observed request in a message and an unobserved claim about a website. For example, "the message requests a seed phrase" may be directly supported by its text. "The linked website steals seed phrases" needs other evidence. Email evidence can support a report without proving the landing page's behavior or current status.

This research does not set a confidence threshold or decide when the agent may report automatically. It also does not establish whether a particular historical message was phishing.

## Unicode lookalikes in sender names

Follow-up: the [Unicode evaluation](unicode-confusable-evaluation.md) now records an offline ICU experiment. The [detection research synthesis](phishing-detection-design.md) compares this signal with email, URL, and visual methods.

Added 2026-09-21 from an operator-supplied reference. LEXO describes detecting DHL impersonation through visually similar Unicode characters in the sender display name, combined with a sender-domain check. This is a useful example of an explainable signal that local code could extract before an AI assessment. The article's spam score is not an Angry Carp confidence level. [LEXO article](https://www.lexo.ch/blog/2025/04/advanced-email-fraud-detection-using-regex-patterns-to-catch-sophisticated-dhl-phishing-attempts-with-unicode-homoglyphs/)

Do not adopt the published regex unchanged. Its letter groups contain empty alternatives such as consecutive `|` characters, allowing the supposed brand letters to match nothing. A local Perl check of the final published rule matched the synthetic header value `Invoice Team <billing@example.invalid>`, despite its containing no DHL reference. The same check matched ordinary and Unicode-lookalike DHL display names. This verifies a counterexample in the regex itself, not a complete SpamAssassin integration test. The article does not provide a measured evaluation supporting its low-false-positive claim.

Unicode UTS #39 supplies standard mechanisms and data for confusable and mixed-script detection. Evaluate an implementation based on those mechanisms instead of maintaining a hand-written alphabet for each brand. Their scope concerns identifiers; applying them to display-name brand comparisons needs evaluation with legitimate multilingual names and text. [Unicode security mechanisms](https://www.unicode.org/reports/tr39/)

For a future extractor, preserve the original header and separately record the decoded display name, parsed sender address, suspicious code points, comparison result, and rule or data version. A comparison representation must not replace the original evidence or a domain used for an actual request. Review legitimate multilingual mail, forwarded quotations, authorized third-party senders, and synthetic lookalikes before assigning a signal weight.

A lookalike or unfamiliar sender domain alone must not produce a High assessment or an accusation. Present the observation to the analyst alongside message intent, trusted authentication evidence, and contradictory evidence. Absence of a match is not proof that mail is safe. These are proposed extraction and evaluation requirements, not an implemented detector or a choice of runtime.

## Questions for the interview

1. Does the prohibition on visiting phishing URLs include asking an external scanner to visit them?
2. Can an initial report proceed from sufficient email evidence while withholding unsupported website claims?
3. Does "same phisher" mean related artifacts or a claim about a common operator?
4. Which information may leave the private evidence store through lookups, scans, and abuse reports?
5. What counts as a successful outcome: a recipient block, a sender suspension, a resource removal, or independently confirmed disruption?
