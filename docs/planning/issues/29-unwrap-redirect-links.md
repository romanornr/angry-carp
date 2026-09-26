# Unwrap redirect links during link extraction

Type: capability
Status: open
Priority: medium
Assignee: unassigned
Parent: ../map.md
Related: netcraft/issues/04-specify-whole-url-privacy-check.md, 15-justify-reporting-candidates-by-resource.md

## Outcome

Link extraction recognises redirect wrappers, such as `google.com/url?q=`, Microsoft Safe Links and Proofpoint URL Defense, and records the destination they carry alongside the wrapper. Domain checks, provider routing and the Netcraft privacy check then see the phishing destination. The extractor records every link as written today, so a destination hidden behind an open redirect is never checked, looked up or considered as a reporting candidate. Reporting candidates require a concern tied to the specific host, so the redirector itself is normally not proposed either.

## Constraints

- Unwrap offline, only from data inside the wrapper URL itself, such as a query parameter or a base64-encoded segment. Never follow a redirect over the network; [ADR 0001](../../adr/0001-prohibit-direct-candidate-fetches.md) prohibits direct candidate fetches.
- Keep the wrapper as its own observation. An open redirect on a legitimate service can itself be worth reporting to that service.
- Prefer maintained redirect rules, such as ClearURLs `redirections` or Brave `debounce.json`, over a hand-written list; see [Removing recipient data from phishing URLs](../../research/url-privacy-sanitization.md).
