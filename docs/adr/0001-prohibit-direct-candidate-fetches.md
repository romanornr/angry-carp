---
status: accepted
---

# Prohibit direct fetches of candidate phishing resources

Angry Carp must not directly fetch candidate phishing URLs or their remote assets from the agent environment. Investigation uses inert message evidence and results returned by external analysis services, sacrificing direct interactive inspection to avoid executing candidate pages in the agent's browser and signed-in environment. the operator permits automatic external scans in the future system subject to the [scanner disclosure boundary](0002-limit-scanner-disclosure.md); the technical enforcement mechanism remains unresolved.
