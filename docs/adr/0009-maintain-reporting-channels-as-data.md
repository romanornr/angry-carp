---
status: accepted
---

# Maintain reporting channels as data

Store reviewed channel records in the shared TypeScript library and generate the portable Markdown from them. This operator-authored catalogue benefits from compile-time checking and comments; it has no external signed payload requiring the brand directory's JSON import machinery. A generated-file test makes drift visible. Channel conditions, sources, and review dates travel with each result.

Replace the full reference in Flue's initial prompt with a bounded, batched offline lookup. The decision prioritizes relevant context and deterministic selection over an unmeasured token saving. A tool call may add a model round trip; neither reviewer measured end-to-end cost or assessment reliability. Keeping the six-row reference in the prompt was the cheaper integration alternative. The chosen interface also supports direct library callers without Flue.

A lookup selects published routes for an explicitly named provider and service role. It does not attribute that role, evaluate case conditions, or authorize disclosure. Registrar abuse contacts from case RDAP remain separate evidence. Misses preserve reporting gaps instead of synthesizing addresses. [Standards](../research/reporting-channel-catalogue.md) inform these boundaries but do not prescribe this catalogue schema.

Clarification, 2026-09-22: an evidence-backed plausible recipient is eligible for lookup even when involvement remains unconfirmed. The assessment retains that qualification. The catalogue's result does not promote a lead to a verified relationship or satisfy its channel conditions. This clarifies selection guidance without adding a provider detector or changing the record schema.

This changes the channel-loading choice in [ADR 0007](0007-separate-assessment-from-reporting.md), retaining its separation of assessment, readiness and approved reporting. The portable triage instructions refer to an available channel reference without naming a host-specific tool. [Usage](../reporting-catalogue.md) and [updates](../updating-reporting-channels.md) document the maintained interface.

Implementation update, 2026-09-22: [ADR 0011](0011-analyze-email-before-assessment.md) replaces the model-directed integration with deterministic original-message analysis. The reusable catalogue/extractor remains; the former Flue binding or triage `--html` path is retired.
