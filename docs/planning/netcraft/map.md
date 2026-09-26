# Submit phishing URLs to Netcraft automatically

Labels: wayfinder:map
Parent: [Find Angry Carp's workflow and architecture](../map.md)

## Destination

A frozen, buildable specification, under [ADR 0019](../../adr/0019-submit-urls-to-netcraft-automatically.md), for automatic Netcraft threat-feed submission and service-classification tracking. Every adopted pattern cites the established software it comes from by pinned permalink. This map delivers no sending code; sending waits on the case operations in [ticket 24](../issues/24-implement-provider-outcomes-and-recurrence.md).

## Notes

- Purpose: protect other people quickly through Netcraft's blocking feeds. Provider abuse reports remain the takedown route.
- A threat-feed submission is not an abuse report (see [CONTEXT.md](../../../CONTEXT.md)). The operator's rule: it is sent automatically, without an approval prompt, when all of these hold.
  - Nothing is sent under the operator's identity and no private detail leaks.
  - A reporting identity is configured locally (see the identity decision below). Without one, nothing is sent automatically; the case shows a prepared submission instead.
  - The assessment concern level is High and at least one deterministic analyzer finding supports it.
  - The URL is a reporting candidate in a phishing role and passes the whole-URL privacy check.
- Submission happens at the end of the analysis run, as soon as the case qualifies, and can be switched off. Abuse reports sent under the operator's identity keep requiring approval.
- URLs only, for privacy. Whole messages are never submitted; see the opt-in decision below.
- [ADR 0019](../../adr/0019-submit-urls-to-netcraft-automatically.md) records the policy above. The remaining tickets specify how it is carried out.
- [Parent issue 29: Unwrap redirect links during link extraction](../issues/29-unwrap-redirect-links.md) must land before automatic submission, because the privacy check relies on it.
- Facts and references: [Netcraft Report API and reference designs](../../research/netcraft-report-api.md). Build from the official specification and cite pinned permalinks in code comments.
- No surveyed Netcraft client is well engineered throughout, so choose references per concern:
  - Endpoint surface and command structure: Palo Alto's Cortex XSOAR integration, [demisto/content `Packs/Netcraft_V2`](https://github.com/demisto/content/tree/cccfa684bc08d02989a03c3ff5ba5e16fbe638de/Packs/Netcraft_V2). It is the most established, not the best engineered: no retries or 429 handling, polling stops at the first verdict, timeouts leave no record, errors are untested. Do not copy its customer API-key authentication.
  - Error classification and observed API behaviour: ask-arthur, unlicensed, so ideas only.
  - Outbound submission life cycle, idempotency and uncertain outcomes: mature software outside the Netcraft niche, per [ticket 09](issues/09-outbound-submission-lifecycle-designs.md).
- Build separate modules with narrow interfaces, following [ADR 0012](../../adr/0012-separate-cli-from-flue.md): redirect unwrapping in link extraction, the URL privacy check as a pure `lib/` function returning the submitted URL and a reason for each cut, the Netcraft client as its own adapter, and submission records in case operations. None of them depends on Netcraft's client except the adapter.
- Before designing or building any module, study how established software solves it, and prefer a maintained library or rule set over hand-written logic, for example the Public Suffix List through tldts, or maintained redirect rules. Record each adopted source by pinned permalink.
- Consult grilling, domain-modeling and research as the parent map describes. The operator wants the engineering explained as decisions are made.

## Decisions so far

- [Netcraft Report API facts and reference designs](issues/01-netcraft-api-facts-and-reference-designs.md): official v3 spec located and pinned; no key needed, `email` required, sandbox available; no project records uncertain submissions.
- [Mature designs for outbound submission life cycles](issues/09-outbound-submission-lifecycle-designs.md): record intent before sending, never retry an unknown outcome automatically, resolve it by operator evidence; retry libraries only for GET polls; a seven-state model is proposed for the submissions ticket.
- [Can a redacted original message be submitted without identifying the operator?](issues/05-redacted-message-submission.md): partly; headers can be redacted but bodies, links and attachments cannot be reliably, and Netcraft's parsed mail exposes `to` via the UUID link.
- [How Netcraft handles a non-personal reporter address](issues/02-netcraft-non-personal-reporter-address.md): no verification; the address is public to anyone with the UUID; free-mail domains get delayed results; Cloudflare Email Workers, AgentMail, Fastmail or Gmail can be read by code, forwarders cannot.
- [Choose the reporting identity for threat-feed submissions](issues/03-choose-threat-feed-reporting-identity.md): an operator-configured address in git-ignored local configuration, possibly their own; never inferred, never logged; UUIDs kept secret; result emails not read; a dedicated domain stays optional.
- [Decide whether operators may opt in to whole-message submission](issues/10-decide-whole-message-opt-in.md): no; whole messages are never submitted, because operators may leak details without understanding the implications.
- [Established approaches to stripping private data from URLs](issues/11-url-sanitization-approaches.md): search for the recipient's own address in encoded forms, drop query and fragment, cut token-like segments by character class; entropy scoring does not fit; a nine-step algorithm is proposed.
- [Specify the whole-URL privacy check](issues/04-specify-whole-url-privacy-check.md): unwrap redirects, drop query and fragment, cut identifying or random-looking labels and segments, fall back to the host, final check for the plain address; encoded forms are covered by cutting, not searched; "no threats" after cutting is accepted as probable cloaking.

## Not yet specified


- How automatic submission divides between `lib/` and `cli/` under [ADR 0012](../../adr/0012-separate-cli-from-flue.md), and how it reaches the case operations it depends on.
- A test plan against Netcraft's `/api/v3/test` sandbox and recorded responses.

## Out of scope

- Netcraft's customer takedown service, which requires a Netcraft customer account. Takedown states observed on public submissions are still recorded.
- Submitting whole messages, redacted or not.
- Background or unattended operation.
- Other threat-feed services such as Google Safe Browsing or public urlscan. The parent map tracks public urlscan separately.
