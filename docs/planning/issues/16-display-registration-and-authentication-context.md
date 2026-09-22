# Display registration timing and distinguish authentication claims

Type: improvement
Status: implemented
Priority: medium
Assignee: unassigned
Parent: ../map.md
Blocked by: none

## Resolution, 2026-09-22

Implemented registration-date display with domain, source and retrieval time, without an age calculation. Separate authentication claims display validated domains and claim IDs without mailbox local parts. Complete Unicode code-point escaping preserves astral format characters. Fixed-timestamp, disclosure and Unicode tests pass; dates remain in the existing structured result and optional private export.

The sections below retain the original gap and acceptance criteria.

## Observed gap

The analyzer saved registration dates but its terminal display omitted them. In the 2026-09-22 comparison, interpreting those dates added a material timeline. Two different DKIM pass claims also appeared as indistinguishable lines. The structured record contained more useful context than the display.

## Proposed correction

Display each relevant registration date with its domain and lookup provenance. If calculating elapsed time, select and label the reference timestamp explicitly. A sender Date or supplied Received value is not a trusted receipt time; do not silently choose the first header. Invalid, missing, conflicting or future-relative timestamps need explicit handling. Displaying the dates themselves is preferable to inventing a trusted reference.

Identify separate authentication claims using validated domain/selector fields and their source IDs where useful. Keep them labelled as reported results. Use the existing identity parser and terminal escaping; never print raw properties, mailbox local parts or complete headers.

Claude notes that age at lookup time can use the recorded `retrievedAt` without reading the clock. That is different from age when the email arrived; label the reference time and preserve that distinction. Dates already reach the model, so this work does not require another export or storage layer.

The same review reproduced an escaping defect: `charCodeAt(0)` records only the high surrogate for astral format characters matched by `\p{Cf}`. A future fix must escape the complete code point, for example with `codePointAt(0)` and `\u{...}` notation, so rendering does not discard evidence.

## Acceptance checks

- A result with registration events displays the dates and domains without a model.
- Any relative interval names its reference and trust limitation, and cannot turn missing/invalid chronology into an age.
- Two DKIM claims for different signing domains are distinguishable; unsupported values stay visible as coverage without leaking raw text.
- Terminal and disclosure tests retain the existing privacy and output bounds.
- Astral Unicode format characters such as U+E0041 and U+1D173 remain distinguishable in escaped output, along with ordinary control characters.

Use fixed synthetic timestamps and records. No new lookups or score are needed.
