---
status: accepted
---

# Submit phishing URLs to Netcraft as automatic threat-feed submissions

Netcraft's public Report API blocks confirmed phishing in feeds that browsers and mail filters use, usually far sooner than a provider takedown. The operator therefore re-admits Netcraft, previously excluded from the default reporting path over value and privacy cost, as a threat-feed submission rather than an abuse report. Provider abuse reports remain the takedown route. [Netcraft's customer takedown service](../research/netcraft-report-api.md#netcrafts-two-services) is not used.

A threat-feed submission makes no allegation under the operator's identity, so it is sent without an approval prompt when every condition holds. The assessment concern level is High and at least one deterministic analyzer finding supports it, so a model error cannot send alone. The URL is a reporting candidate in a phishing role and passes the whole-URL privacy check required by [ADR 0002](0002-limit-scanner-disclosure.md). A reporting address is configured in git-ignored local settings, which is the operator's standing consent. Submission happens at the end of the analysis run and can be switched off. Abuse reports sent under the operator's identity keep requiring approval under [ADR 0005](0005-keep-report-authority-in-case-operations.md).

Only URLs are submitted, with a neutral reason and no content from the message. Whole messages are never submitted, not even by operator opt-in, because operators cannot judge what a message discloses, and recipient identifiers in bodies and links cannot be removed reliably and Netcraft exposes the parsed recipient through the submission link. The reporting address is never inferred from mail and never written into reports, logs or exports. Submission UUIDs are secrets, because anyone holding one can read that address through Netcraft's API. Netcraft's verdict is a service classification: a dated observation that can escalate later, not a decision about the case or a takedown.

The API has no idempotency key and no listing of one's own submissions. A submission whose outcome is unknown is recorded as such and never retried automatically. No submission may be sent before the whole-URL privacy check and these submission records exist; the [Netcraft planning map](../planning/netcraft/map.md) specifies both. Research and pinned reference implementations are in [Netcraft Report API and reference designs](../research/netcraft-report-api.md).
