# Independent review: page-evidence preservation and cross-provider coordination

Second-opinion review, 2026-09-21. Scope: `docs/research/page-evidence-preservation.md`, the "Coordinate related provider reports" section of `provider-abuse-reporting.md`, the capture and coordination paragraphs of `docs/manual-workflow.md`, and `docs/research/independent-review-response.md`. Official public documentation only; nothing fetched, scanned, archived, sent, or installed. All sources retrieved 2026-09-21. Labels: **[verified]** read in the cited source today; **[unverified]** not confirmed; **[proposal]** this reviewer's judgement.

## 1. Registrar guidance sequences the registrar *after* the host and asks for that history; Cloudflare acts only on a live page

**[verified]** The CPH *Guide to Abuse Reporting* v1.0 (RRSG/RySG, 2022; the evidentiary basis the 2025 "Effective DNS Abuse Reports" guide cites) says content abuse "should be directed first at the hosting provider, registrant, or email provider", that "Registrars might be engaged as a followup, when the previous attempts have failed", and lists as report content "Indicate if the complaint has already been sent to the web host, including any response". It explains screenshots as the way to identify a phish that is "location IP-based or requires special browsers or hardware" (pp. 2–3, 6–7). Cloudflare's *Complaint types* page: "After Cloudflare confirms existence of the phishing page, Cloudflare provides a warning page" — confirmation is of the live page. M3AAWG's 2018 BCP, Q13: reporting "can still be of value whether the site has been removed or not".

**Consequence.** "Preserve available evidence before the first provider submission" (`manual-workflow.md` §Prepare, `provider-abuse-reporting.md` §Coordinate) is the wrong universal rule. The recipients that disrupt fastest (host, sending service, pass-through CDN) verify against the live resource or the email and gain nothing from a capture; the recipient that needs a capture after takedown (registrar, brand) is, by the registrar community's own guidance, contacted second and asked to carry the host report and its response. A capture gate on the first report delays disruption for a benefit that accrues only to the second report.

**Correction [proposal].** Replace the ordering with a per-recipient rule: (a) host/sending/CDN reports go out on email evidence as soon as approved; (b) one private capture attempt is started when the case is opened, in parallel and bounded (one submission, one poll window), never as a precondition; (c) the registrar report is prepared after the host outcome is known or the host is unresponsive past the follow-up interval, and carries the capture if one exists, otherwise headers, body extract, and a one-line statement that the page was not visited and no capture succeeded; (d) an already-offline page still supports the host report (M3AAWG) and the registrar report about the *domain's* use, but not a Cloudflare phishing report, which should be recorded as not actionable rather than sent.

## 2. Coordination notes are read by the accused; write them for the registrar, not for other hosts

**[verified]** AWS *Abuse notice FAQs*: "The abuse notice that you receive includes the abuse report that AWS Trust & Safety received from the abuse reporter." The repo's own NiceNIC note records that customer notification may include reporter contact information. The CPH guide (above) expects the registrar report to state whether the host was contacted and how it responded. ICANN's complaint guide (17 Nov 2025) warns that inconsistent allegations between the registrar report and the ICANN complaint cause follow-up queries.

**Consequence.** A note such as "a separate report to GoDaddy … is awaiting approval" (current example in §Coordinate) can be forwarded verbatim to the implicated customer, telling the operator of the infrastructure which providers have not yet acted and which are about to. It also creates a statement that may never become true, which the ICANN guide's consistency rule then works against. Host-to-host notes ("I also reported the landing page to Hostinger" in a Vercel report) have no documented recipient use; neither provider's published intake asks for it.

**Correction [proposal].** Include a coordination note only where a published intake asks for it (registrar: host contacted, date, response summary) or where it changes the requested action (CDN pass-through versus origin). Never mention planned or unapproved reports, other desks' ticket numbers, or the *absence* of a response elsewhere. One realistic registrar note:

```text
The landing page was reported to its hosting provider on 18 September 2026.
The provider acknowledged the report and has not stated an action. This
report concerns the registered domain used in the sending address.
```

The current Vercel/Hostinger example should go; the confirmed-removal update example can stay, since it reports a completed fact.

## 3. Only urlscan private results are private from creation, and they can vanish at any time; none of the three yields a complete package

**[verified]** urlscan API docs: private scans are "only visible to you … or if you share the scan ID"; "If a scan result has been deleted, it will respond with an HTTP/410 error code. This can happen at any time, even right after scan submission!"; screenshot and DOM endpoints return 404 "if … we did not store" them. Wayback *Save Pages*: Save Page Now yields "a permanent URL for your page" in the public archive; removal is by request (help.archive.org removal article); no private mode is documented. Perma ToS §2(a): use "only for non-commercial scholarly, research, reporting, criticism and commenting purposes"; §3(d): Perma may delete links "in our sole discretion, without advance notice"; individuals pay ($10/month for 10 links, *Accounts* page); a Perma record page offers viewers "a link to the live version of the original URL". **[unverified]** Perma's private-link mechanics and organisation defaults: `perma.cc/docs/registrars` and `docs/perma-link-creation` returned HTTP 403 to this reviewer, so the current doc's "private-on-creation configuration" claim stands unconfirmed, not refuted.

**Consequence.** Wayback is excluded by policy and by design. Perma is a citation service whose terms do not contemplate malicious-page capture, whose record page itself links to the candidate, and whose retention is discretionary; it adds cost without adding a guarantee. urlscan is the only option meeting "private from creation", but the result link is not a retained copy: the artifacts must be downloaded and hashed at scan completion or they may not exist later. Missing from all three: subresource response bodies, POST destinations and bodies (urlscan lists requests, not form submissions), and any capture of a page that gates on geography, device, or interaction.

**Correction [proposal].** Drop Perma from "worth evaluating" to "not suitable without a written exception"; state the missing-evidence list in the doc. Smallest package a later desk can act on after the page is gone:

| Layer | Artifact | Establishes |
| --- | --- | --- |
| Email | retained `.eml`; labeled header extract; URL-01 with visible text | the lure and its link, receipt time from receiver headers |
| Page behavior | urlscan result JSON, `screenshot.png`, DOM, scan UUID, scan time, sha256 of each | what the submitted URL served at that time, final URL, contacted hosts |
| Routing provenance | urlscan `page.ip`/ASN at scan time; RDAP registrar response with query time | which provider was responsible *then*, after DNS is gone |
| Provider action | the desk's reply with date and ticket; later existing-scan search results | who reported acting; what changed, without attributing causation |

**[proposal, policy question]** A DNS lookup of the candidate domain from the agent environment is not a page fetch, but it can reach attacker-controlled name servers; the docs should say whether it is permitted, since it is the cheapest routing-provenance record.

## 4. Corrections to earlier claims

The response document's three corrections are accepted without reservation: a digest the analyst can write is not approval; transport adds headers, so the Sent-copy check compares recipients, authored content, and attachment bytes, not the whole message; a fixed workflow narrows the tool surface but does not neutralise injected text that reaches assessments, proposed recipients, or disclosure choices. The durable mitigation is structural rather than a runner property: recipients come only from the contact-resolution record, disclosure only from the privacy check, and the model's outputs are proposals over those records. **[proposal]** Add a test: a synthetic message whose body names a recipient must not change the prepared envelope.

Current docs: "a link to a third-party result … may expire" (§Coordinate) understates the verified behavior (deletion at any time); "Before the first provider submission, preserve …" should follow Finding 1; the Perma row's private-on-creation claim should be marked unverified until the page is readable. No correction is supported for the doc's replay rule, the untrusted-content rule, or the exclusion of public archiving; those match the sources.

## Sources (retrieved 2026-09-21)

- CPH Guide to Abuse Reporting v1.0 (RRSG/RySG, 2022): https://rrsg.org/wp-content/uploads/2022/01/CPH-Guide-to-Abuse-Reporting-v1.0.pdf — pp. 2–3, 6–7
- RRSG Abuse Reporting Guide (2025): https://rrsg.org/wp-content/uploads/2025/03/Abuse-Reporting-Guide-2025.pdf — p. 2
- M3AAWG, Best Current Practices for Reporting Phishing URLs (Dec 2018), Q13: https://www.m3aawg.org/sites/default/files/doc_files/m3aawg-reporting-phishing-urls-2018-12.pdf
- Cloudflare, Complaint types (updated 20 Apr 2026), Phishing: https://developers.cloudflare.com/fundamentals/reference/report-abuse/complaint-types/
- AWS, Abuse notice FAQs: https://www.repost.aws/articles/ARi420OrIGR0y_9pOOker1QQ/abuse-notice-faqs
- AWS, Abuse reporting FAQs: https://www.repost.aws/articles/ARDaJQbZSdSdKpFjrFMNmgzQ/abuse-reporting-faqs
- ICANN, Submitting DNS Abuse Complaints (17 Nov 2025), step 2B note: https://www.icann.org/en/system/files/files/submitting-dns-abuse-complaints-icann-guide-17nov25-en.pdf
- urlscan.io API docs, Visibility levels; Result API, Screenshots & DOM snapshots: https://urlscan.io/docs/api/
- Internet Archive, Save Pages in the Wayback Machine: https://archivesupport.zendesk.com/hc/en-us/articles/360001513491-Save-Pages-in-the-Wayback-Machine ; removal requests: https://help.archive.org/help/how-do-i-request-to-remove-something-from-archive-org/
- Perma.cc Terms of Service (eff. 22 Jan 2019) §2(a), §3(d): https://perma.cc/terms-of-service ; Accounts and Usage Plans: https://perma.cc/docs/accounts ; User guide: https://perma.cc/docs
