# Established approaches to stripping private data from URLs

Type: research
Status: resolved
Assignee: claude
Parent: ../map.md

## Question

How do established projects remove identifying data from URLs before sharing or scanning them, and which methods fit a check that must strip recipient identifiers and tokens from phishing URLs without operator setup? Candidates include tracking-parameter lists (ClearURLs, Firefox query stripping, AdGuard and Brave URL filters), secret and token detection by pattern and entropy (detect-secrets, gitleaks, TruffleHog), Safe Browsing URL canonicalisation, and how scanners such as urlscan handle private data in submitted URLs. Record project, licence and pinned permalink for each adopted method, with false-positive and false-negative behaviour.

## Answer

Recorded in [Removing recipient data from phishing URLs](../../../research/url-privacy-sanitization.md), researched 2026-09-26.

- Tracking-parameter lists add nothing beyond dropping the query, but show that redirect wrappers must be unwrapped first.
- Secret-scanner entropy scoring cannot separate tokens from ordinary path words at URL lengths; character-class rules fit better.
- Email-security rules (Sublime Security, YARA's base64 technique) find the recipient's own address in encoded forms; that suits a check built from the message headers.
- Token-gated kits will often show Netcraft a harmless page after shortening, so "no threats" is an expected outcome.
- A nine-step algorithm is proposed for the privacy-check ticket.
