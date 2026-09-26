# Specify the whole-URL privacy check

Type: grilling
Status: resolved
Assignee: claude
Parent: ../map.md
Blocked by: 11

## Question

[ADR 0002](../../../adr/0002-limit-scanner-disclosure.md) requires a privacy check over a URL's hostname, path, query and fragment before external disclosure, but no code implements it. What counts as private (the operator's address in plain, encoded or hashed form, names, recipient tokens, magic links, session or tracking identifiers), how is uncertainty handled, and when may a reduced URL be submitted instead of the original? The check serves automatic threat-feed submission and existing scan rules alike. Per-recipient tokens need a rule of their own: an undecodable token still identifies the recipient to the attacker once a crawler fetches it, and removing it may break the lure ([redaction research](../../../research/redacted-message-submission.md)).

## Answer

Decided with the operator on 2026-09-26, informed by [Removing recipient data from phishing URLs](../../../research/url-privacy-sanitization.md).

- Private: the operator's email addresses in any encoding, full name, username or handles, home or office address, phone number, birthday, magic links, password-reset, session, OTP and account-access tokens, and per-recipient tracking tokens. A first name alone does not count.
- Detection needs no operator setup: recipient addresses, display names and usernames come from the message's own headers and greeting, and patterns find encodings and token-like values. An optional local identifier list may come later.
- Tokens are removed before sending, and a shortened URL is submitted rather than skipping submission. The exact submitted URL is stored as the scan target.
- A shortened URL is submitted even if removing the token may hide the lure from Netcraft; privacy comes first.
- The check is built for Netcraft, whose submission pages are visible to anyone with the link. A future scanner integration under ADR 0002 would reuse it; none exists now.
- Provider abuse reports are not shortened. They keep the exact URL, including query and kit tokens, for accuracy, under the existing provider reporting guide. Only secrets granting access to the operator's real accounts stay excluded there.
- Because only URLs are submitted, no dedicated matcher is built for home addresses, phone numbers or birthdays. The shortening rule removes the query, fragment and token-like path segments where such data would appear. Targeted detection covers only the recipient's address, name and username from the message headers.
- Base64, hex and similar encodings are reversible, so an encoded address is as private as a plain one. No dedicated search for encoded forms or hashes is built: dropping the query and cutting random-looking segments removes them.
- No URL sanitizer existed before this decision. Lookups send only hostnames, which is a different rule.

The check, in order:

1. Use the destination recovered from redirect wrappers by link extraction ([parent issue 29](../../issues/29-unwrap-redirect-links.md)).
2. Drop the query and fragment.
3. Remove hostname labels left of the registrable domain, and cut the path before the first segment, that contains the recipient's plain or percent-encoded address, full name or username, or that looks random: at least eight characters mixing character classes, hex of at least 16, a UUID, or at least six digits.
4. Fall back to `https://host/` when nothing remains.
5. Do not submit if the recipient's plain or percent-encoded address still appears.
6. Store the exact submitted URL as the scan target, with the reason for each cut. Record a later "no threats" as probably cloaked, not as a bad report.

Measure the random-segment rule against sample phishing URLs before the specification freezes.
