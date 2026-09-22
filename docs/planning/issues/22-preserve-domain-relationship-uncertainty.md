# Preserve uncertainty about domain relationships

Type: bug
Status: open
Priority: low
Assignee: unassigned
Parent: ../map.md
Blocked by: none
Related: 19-preserve-evidence-limits-in-ai-assessments.md

## Observed gap

The full-pipeline retest at 2026-09-22T22:24Z correctly explained the image/action mismatch, registration chronology and product contradiction. It also described a different sender domain as "unrelated". Different domain names and authentication identities do not, by themselves, establish that their owners or services have no relationship.

The supported High-concern assessment does not depend on that adjective. Issue 19's provider-role separation remains implemented; this ticket tracks a narrower residual inference inside the deception explanation. The private output is retained under ignored `evidence/emails/`.

## Proposed correction

Review the existing domain-mismatch evidence clause in the local assessment instructions and portable workflow. Prefer revising that clause over adding another paragraph, lookup, model pass or provider exception. Describe an observed name difference directly; describe an ownership or authorization relationship only with supporting evidence and provenance.

Keep this host-independent distinction consistent across both documents. Do not add a keyword blacklist: "unrelated" can be supported by independent evidence, and other wording can make the same unsupported claim. Do not suppress the combined evidence of deception or turn every mismatch into a weak assessment.

## Acceptance checks

- Different sender, image and action domains alone produce a name/domain distinction, not a finding of separate ownership or denied authorization.
- An explicitly supported relationship or denial can still be stated with its source. Directory candidates and image hosts do not acquire verified status.
- Evaluate both a legitimate multi-domain service and an impersonation case. A favorable single model output is not a guarantee; record failures as well as improvements.
- Retain the image/action observation, applicable chronology, source contradiction and unexamined-content limits.
- No additional routine browsing, candidate-site requests, second assessment model or automatic report sending.
