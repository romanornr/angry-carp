# Preserve link-role uncertainty across email alternatives

Type: bug
Status: implemented
Priority: high
Assignee: unassigned
Parent: ../map.md
Blocked by: none

## Resolution, 2026-09-22

Implemented distinct `text-reference` observations and a shared exhaustive role priority for lookup and disclosure. Occurrence arrays retain source order. Plaintext-only links still receive bounded web-host checks; conflicting alternatives retain separate roles. Disclosure distinguishes invalid-host and cap exclusions. Synthetic tests cover alternative ordering, plaintext-only coverage and reserved mail prerequisites.

The sections below retain the original gap and acceptance criteria.

## Observed gap

The 2026-09-22 real-email comparison found that plaintext representations of logo URLs became `action` observations. They were scheduled before the actual HTML download anchor, and the image domain consumed an IP-RDAP slot. The same result retained accurate HTML image/anchor roles. This is a role-selection defect, not a parser failure or proof that the image domain is safe.

## Proposed correction

In `lib/src/email-analysis/observations.ts`, preserve a plaintext URL as a link whose purpose is unknown instead of assigning the HTML action role. Let the coordinator prioritize structured action evidence and mail prerequisites before ambiguous text links and passive images. Preserve every occurrence and its MIME part ownership. Record budget exclusions normally.

Do not infer purpose from a filename extension, brand-directory membership or the fact that another alternative mentions the same host. Alternatives can disagree; one exact URL can be both an image source and an action destination. A plaintext-only message must still receive useful bounded lookups. The output/projection must retain the distinction for later interpretation.

Claude independently recommends an explicit `text-reference` role. The existing exhaustive role-priority map then requires a deliberate rank. Its review confirms that plaintext links cannot create cross-part image/action findings: that rule already requires a shared HTML source part. The defect is labelling and budget selection. Also distinguish invalid-host exclusions from cap exclusions when revising disclosure coverage; both currently contribute to `hostsOmitted`. Observation arrays currently use priority order, while IDs retain source provenance.

## Acceptance checks

- A multipart alternative with plaintext logo URLs before the download URL selects the HTML action host first without losing image observations.
- A plaintext-only lure still schedules its links within the same request ceiling.
- Conflicting alternatives and a URL with both image/action occurrences preserve both roles and sources.
- Many image/ambiguous links cannot starve reserved mail prerequisites; skipped work remains explicit.

Use synthetic messages. No candidate-site visit, new parser package or model call is needed. The package migration does not implement this fix.
