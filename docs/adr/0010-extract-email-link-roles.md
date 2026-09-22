---
status: accepted
---

# Extract email link roles before model assessment

Parse operator-supplied HTML in the shared library and retain each anchor/image occurrence plus its enclosing-anchor relationship. This preserves information lost by a deduplicated domain list. parse5's WHATWG tree construction gives a documented recovery model for malformed nesting; regex or token-only parsing would not supply the same relationship. One depth-first walk avoids comparing every image with every link. [Scanner precedents](../research/email-link-scanner-precedents.md) inform role separation; their verdict rules and redirector exemptions are not copied.

Keep acquisition and a field-selected model summary in `agent/`, with optional `--html` integration. The library accepts decoded HTML, not MIME messages. File pairing remains an operator assertion. Full references and source text stay in optional local output; the added model summary carries hosts, roles, relationships and coverage. Hostnames can still contain private identifiers. Package separation is not a credential sandbox.

Do not resolve relative references, MIME Content-Location or content IDs, follow redirects, fetch resources, render HTML, or infer deception from different hosts alone. RFCs 2045/2046, 2387, 2392 and 2557 explain the unimplemented MIME boundary. WHATWG HTML and URL define the parsing behavior, not a phishing detection algorithm. [Standards research](../research/email-link-extraction.md) records those sources.

The operator approved parse5 8.0.1 and locked entities 8.1.0 after [artifact review](../research/email-link-extraction.md#accepted-dependencies-and-implementation). Use supported exports instead of copied parser internals. Input, traversal and output limits constrain this local increment; public-service isolation and Workers execution remain unverified. [Usage and limits](../email-links.md) describe the implemented contract.

Implementation update, 2026-09-22: [ADR 0011](0011-analyze-email-before-assessment.md) replaces the model-directed integration with deterministic original-message analysis. The reusable catalogue/extractor remains; the former Flue binding or triage `--html` path is retired.
