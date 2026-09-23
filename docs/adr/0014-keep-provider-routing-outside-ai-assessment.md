---
status: accepted
---

# Keep provider routing outside AI assessment

The runtime owns provider-role derivation and reporting-route display. The model interprets deception evidence. A controlled replay showed that correct typed roles plus clearer instructions still produced an unsupported proxy claim. We therefore remove reporting candidates, catalogue prose and IP network records from the automatic assessment projection instead of asking the model to paraphrase facts the runtime can display directly.

The complete analysis keeps those records. Its renderer shows the role, basis, contacts, conditions, sources and network registrations without assigning a service role to a network record. Domain chronology, reported authentication, comparisons, reviewed notes and check outcomes remain in the assessment input. Failed attribution checks remain visible even though successful network details are omitted. This trades model-directed infrastructure interpretation for one deterministic owner of the presented provider roles.

Flue loads `agent/phishing-assessment.md` for the local assessment. [ADR 0016](0016-render-recorded-assessment-evidence.md) replaces its original Assessment, Evidence and Limits prose with structured selections and runtime-rendered facts. The standalone `phishing-triage.md` retains its full investigation and reporting-readiness workflow for other hosts. This refines ADRs 0004 and 0007 for the narrower local task: the local instructions are not a second report template. Both documents define concern levels and evidence principles; changes to those meanings require reviewing both. We accept that maintenance cost rather than load conflicting duties or parse prose headings as a runtime API.

This is a task boundary, not a semantic validator or guarantee about generated text. Reviewed text and source notes may still mention providers; they are not silently rewritten. Explicit report preparation still requires the research and approval described in ADR 0013 and issue 18. No additional model pass, provider switch or orchestration framework is introduced.

[Research](../research/assessment-evidence-limits.md) compares the design with Rspamd's structured scan-result interface and Anthropic's distinction between fixed workflows and model-directed tasks. No RFC prescribes this division or the prose format.
