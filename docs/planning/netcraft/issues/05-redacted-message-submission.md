# Can a redacted original message be submitted without identifying the operator?

Type: research
Status: resolved
Assignee: claude
Parent: ../map.md

## Question

Where does a received phishing message carry the recipient's identity: `To`, `Delivered-To`, `Received` chains, DKIM and ARC headers, personalised links and tracking tokens, greetings, attachments and embedded images? Can those be removed reliably while leaving evidence Netcraft can still use, and does Netcraft accept a modified message through `/report/mail`? Also record what Netcraft's privacy policy says it retains from mail submissions.

## Answer

Partly. Recorded in [Redacted message submission to Netcraft](../../../research/redacted-message-submission.md), researched 2026-09-26.

- Recipient-bearing headers can be removed deterministically. Bodies, links and attachments cannot be redacted reliably, because identifiers may be encoded, unique per recipient, or inside images and attachments.
- Netcraft documents nothing about modified messages. Its parsed mail record includes `to`, visible to anyone with the submission UUID until archival.
- No surveyed redaction tool preserves phishing evidence while removing recipient identity.
- Per-recipient link tokens identify the recipient to the attacker whenever a crawler fetches them. This applies to URL-only submission too, so it belongs in the whole-URL privacy check.
