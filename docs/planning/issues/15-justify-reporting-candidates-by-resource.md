# Justify reporting candidates by the affected resource

Type: bug
Status: implemented
Priority: high
Assignee: unassigned
Parent: ../map.md
Blocked by: none
Related: 14-preserve-link-role-uncertainty.md

## Resolution, 2026-09-22

Implemented resource-specific candidate eligibility. Registrar/DNS subjects require action-side mismatch evidence, observed-side resemblance evidence or an exact host named in a supplied supporting note. Envelope and From hosts are not promoted merely because another resource is suspicious. Contacts remain in RDAP; missing justification is recorded. Non-empty subject IDs and resource names travel to output. Tests cover borrowed images, explicitly supported image/sender resources, shared registrars and plaintext lookalikes. Claude and Grok reviewed the policy; the reproduced envelope over-promotion was removed.

The sections below retain the original gap and acceptance criteria.

## Observed gap

`deriveFindings` currently turns each found registrar contact into a reporting candidate. The 2026-09-22 comparison therefore listed the genuine-logo domain's registrar despite having no abuse evidence against that resource. The contact was accurate; promotion to a reporting candidate was not justified. The terminal also hides which registration the contact belongs to.

## Proposed correction

Preserve resource contacts in lookup evidence. A reporting candidate must name the affected resource, its role, the supporting finding or qualified lead, and the provider relationship. The [glossary](../../../CONTEXT.md) distinguishes a resource contact from a reporting candidate. Reuse observation/check IDs instead of inferring intent from a registrar name.

Choose the smallest explicit eligibility rule against synthetic cases before implementing it. Role alone does not establish abuse. A broad contact list can remain inspectable without implying that every contact should receive a report. Never exempt a domain merely because it is official, appears in a directory or serves an image: compromised legitimate resources can also warrant reporting.

Claude's independent proposal is a required non-empty set of subject observation IDs, plus role-based eligibility. The alternative is linking eligibility to findings. Subject IDs make the justification inspectable but do not prove the rule that selected them is sound. Finding linkage can wrongly hide a recipient when unrelated finding limits are hit; blanket image/text exclusions can hide a real malicious resource. Evaluate those counterexamples before choosing. Record why a contact was not promoted rather than erasing its lookup evidence.

## Acceptance checks

- Borrowed-logo evidence preserves the image registrar contact but does not create a report candidate without a resource-specific abuse basis.
- Supported download and sender leads identify their exact target and registrar relationship.
- Independently supported abuse on a legitimate/image resource remains eligible.
- Shared registrars and shared infrastructure do not merge distinct resource justifications or imply common attacker control.
- SES/Resend investigation leads retain their attribution limitations and do not gain sending authority.

This changes candidate derivation and display, not the underlying RDAP contact or reporting-channel catalogue. No report is sent by its tests.
