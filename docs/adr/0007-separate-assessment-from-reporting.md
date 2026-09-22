---
status: accepted
---

# Separate assessment from reporting

Decision date: 2026-09-22. The channel-loading choice below is updated by [ADR 0009](0009-maintain-reporting-channels-as-data.md); the assessment and reporting boundaries remain in force.

This implements the earlier Wayfinder decisions on [evidence and campaign claims](../planning/issues/03-define-evidence-and-campaign-claims.md) and [report evidence and approval](../planning/issues/06-define-report-evidence-and-approval.md). The existing [report-format research](../research/email-report-templates-and-standards.md) and [provider comparison](../research/reporting-requirements-comparison.md) remain the source analysis. This decision does not reopen those reporting policies.

The local agent assesses prepared evidence. At acceptance, it loaded `phishing-triage.md` and a compact `reporting-channels.md` reference for recipient-specific readiness. ADR 0009 replaces that reference load with an offline lookup. Reporting procedures, protocol references, and project history remain outside its initial prompt. Loading the full workflow introduced irrelevant mailbox and submission tasks, while linking High concern to report preparation confused evidence strength with missing reporting details.

Use four output sections: Assessment, Evidence, Checks and gaps, and Next action. They let the operator see the conclusion, its basis, which checks actually occurred, and what to do next. Keep concern, confidence in a specific conclusion, and recipient-specific reporting readiness separate. Supplied source notes remain distinct from checks performed by the agent. A failed lookup and an unattempted lookup are different gaps.

The alternative was one combined investigation-and-reporting prompt. Separate tasks reduce irrelevant instructions and keep reporting authority explicit. The cost is that reporting needs its own invocation and evidence handoff. This decision does not implement that handoff or any new tools.

The four headings apply to the operator's assessment. Provider reports retain the earlier decision to use natural correspondence adapted to the recipient, without a universal section order or minimum length. The reporting guide remains the single drafting instruction source. Concern remains an evidence-based suspicion level, not a new severity scale; confidence is explained for each conclusion without invented probability estimates.

The headings and concern levels are project choices. [Standards and provider guidance](../standards-and-reporting.md) inform evidence handling and future integrations without imposing this prose format. The agent instructions own the output rules; user documentation explains their meaning. Changes to the headings remain possible without changing the separation between assessment and reporting.

[ADR 0014](0014-keep-provider-routing-outside-ai-assessment.md) narrows the local model's output to Assessment, Evidence and Limits. The runtime displays provider roles and reporting routes. The portable workflow retains the four sections described above.
