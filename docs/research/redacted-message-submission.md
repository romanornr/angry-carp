# Redacted message submission to Netcraft

Researched 2026-09-26 for [the Netcraft map](../planning/netcraft/map.md). Read-only: nothing was submitted and no private evidence was opened. Specification facts refer to the Netcraft v3 OpenAPI document pinned in [Netcraft Report API and reference designs](netcraft-report-api.md).

## Conclusion

Header fields that carry the recipient can be listed and removed deterministically. Bodies, links and attachments cannot be redacted reliably: recipient identifiers may be encoded, unique per recipient, or inside images and attachments, and rewriting a link changes what Netcraft crawls. Netcraft documents nothing about modified messages, neither acceptance nor rejection.

Two identifiers remain whatever redaction does. `/report/mail` requires `email`, like `/report/urls`. Per-recipient link tokens identify the recipient to the attacker when any crawler fetches them, which also affects URL-only submission.

## Where a received message identifies its recipient

| Location | Disclosure | Source |
| --- | --- | --- |
| `To`, `Cc` | Recipient addresses; commonly DKIM-signed | RFC 6376 §5.4.1 |
| `Delivered-To` | Final delivery address, possibly a chain of rewrites | RFC 9228 |
| `X-Original-To` | Recipient as given to Postfix | [Postfix local(8)](https://www.postfix.org/local.8.html) |
| `Received … for <addr>` | One envelope recipient | RFC 5321 §4.4, §7.6 |
| `Received` `by` hosts and addresses | Recipient-side infrastructure | RFC 5321 §7.6; RFC 8617 §8 |
| `Authentication-Results`, ARC headers | Receiving and forwarding operators; ARC signatures can cover `To` | RFC 8617 §4.1, §8 |
| `List-Unsubscribe` | May contain the recipient address, plain or encoded | RFC 8058, Security Considerations |
| `Message-ID` | Lets the originating system recover a redacted recipient from its logs | RFC 5322 §3.6.4; RFC 6590 §5.3 |
| Link fragments and paths | Base64 recipient address, or single-use per-recipient tokens | [IRONSCALES DocuSign case](https://ironscales.com/threat-intelligence/docusign-google-redirect-base64-recipient-tracking); [Gen Digital, Mailer-Go](https://www.gendigital.com/blog/insights/research/the-phishing-link-that-died-on-purpose) |
| Greetings and encoded bodies | Personal details, possibly base64-encoded | [SpamCop FAQ 283](https://www.spamcop.net/fom-serve/cache/283.html) |

Attachments, embedded images, QR codes, hidden HTML text and tracking pixels were not verified from primary sources.

## Effects of redaction

- RFC 6590 recommends consistent keyed transformations of private strings so receivers can still group reports, and warns that fields left intact, such as `Message-ID`, can undo redaction. RFC 5965 §2(d) asks for unmodified originals because changes impede forensic work; §8.5 permits redaction where privacy outweighs operational need.
- Editing signed headers or the body invalidates DKIM and ARC signatures. Removing `Authentication-Results` loses the arrival verdict. Whether Netcraft uses either is unknown; its parsed mail record exposes only `from`, `reply_to`, `subject`, `to`, an MD5 `hash`, `state` and `classification_log`.
- A redacted copy hashes differently from other reporters' copies, so it may not be grouped with them.

## Existing redaction tools

- [vadesecure/anonemail](https://github.com/vadesecure/anonemail/tree/50a0eea377004828e448e06d7c063eb16f50d30a) (GPL-3.0-or-later, dormant since 2016) masks recipient tokens in headers and text and blanks every URL query value. It misses encoded addresses, path and fragment tokens and attachments, and changes reported URLs.
- rspamd `rspamadm mime anonymize` ([`lua_mime.lua` at 763b21fb](https://github.com/rspamd/rspamd/blob/763b21fbd5691ffca33cadd4de5c4394910d6a03/lualib/lua_mime.lua#L1469), Apache-2.0) rebuilds the message for bug reports and discards sender infrastructure, lure text, full URLs and attachments. Unsuitable for phishing reports.
- SpamCop masks recipient addresses and warns that altered messages may not be accepted as evidence.

No surveyed tool redacts reliably while preserving phishing evidence.

## Netcraft's handling of mail

- The v3 specification never mentions redaction, anonymisation, headers or DKIM. Optional AES-256-CBC encryption protects the message in transit, not from Netcraft.
- [Netcraft's privacy policy](https://www.netcraft.com/privacy/) lists for forwarded mail "Your email address, Subject, Message headers and body, Email address(es) of the original recipient(s), Attachments". Threat indicators may be shared with hosts, registrars, platforms, ISPs, law enforcement and other relevant parties.
- Submissions archive after 30 days, removing mail and files from the API. Internal retention after archival is unknown.
- Until archival, `/submission/{uuid}/mail` and `/mail/screenshot` expose the parsed mail, including `to`, to anyone holding the UUID.

## Evidence value compared with URL-only submission

A whole message adds body and attachment analysis, sender and reply-to addresses, a mail-level `suspicious` state available when no URL is confirmed, a rendered screenshot and, if retained, upstream sending-server addresses. URL-only submission carries URLs with optional reason, screenshot and tags. Whether Netcraft uses received-chain addresses or authentication headers from API submissions is unknown and could only be learned from real submissions.
