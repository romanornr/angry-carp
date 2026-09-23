# Preserve uncertainty about domain relationships

Type: bug
Status: implemented, evaluated and reviewed
Priority: low
Assignee: unassigned
Parent: ../map.md
Blocked by: none
Related: 19-preserve-evidence-limits-in-ai-assessments.md

## Observed gap

The full-pipeline retest at 2026-09-22T22:24Z correctly explained the image/action mismatch, registration chronology and product contradiction. It also described a different sender domain as "unrelated". Different domain names and authentication identities do not, by themselves, establish that their owners or services have no relationship.

The supported High-concern assessment does not depend on that adjective. Issue 19's provider-role separation remains implemented; this ticket tracks a narrower residual inference inside the deception explanation. The private output is retained under ignored `evidence/emails/`.

## Proposed correction

The [joint research synthesis](../../research/remaining-assessment-and-reporting-work.md) records the standards basis, proposed clause and paired evaluation. Implementation remains separate from the reporting runtime in ticket 18.

Review the existing domain-mismatch evidence clause in the local assessment instructions and portable workflow. Prefer revising that clause over adding another paragraph, lookup, model pass or provider exception. Describe an observed name difference directly; describe an ownership or authorization relationship only with supporting evidence and provenance.

Keep this host-independent distinction consistent across both documents. Do not add a keyword blacklist: "unrelated" can be supported by independent evidence, and other wording can make the same unsupported claim. Do not suppress the combined evidence of deception or turn every mismatch into a weak assessment.

## Acceptance checks

- Different sender, image and action domains alone produce a name/domain distinction, not a finding of separate ownership or denied authorization.
- An explicitly supported relationship or denial can still be stated with its source. Directory candidates and image hosts do not acquire verified status.
- Evaluate both a legitimate multi-domain service and an impersonation case. A favorable single model output is not a guarantee; record failures as well as improvements.
- Retain the image/action observation, applicable chronology, source contradiction and unexamined-content limits.
- No additional routine browsing, candidate-site requests, second assessment model or automatic report sending.

## Implementation and evaluation

Revised the existing mismatch bullet in both instruction documents. No library classification, tool, keyword blacklist or routine model pass was added.

The [initial paired evaluation](../../research/evaluations/domain-relationships-2026-09-23.jsonl) records four synthetic calls to `openai-codex/gpt-5.6-sol`: two cases under the prior instructions and the same two under the revised instructions. It retains inputs, prompt digests and complete answers, including the failure. The old impersonation response called the sender domain "unrelated" without supporting evidence. The revised response left ownership and authorization unestablished and retained High concern from the product contradiction, installation request and chronology. Both legitimate multi-domain responses were Low concern and attributed the supplied relationship note.

Claude identified ownership disclaimers in those initial inputs that made the task easier. Removed both disclaimers and repeated the four calls, retaining the [second evaluation](../../research/evaluations/domain-relationships-without-hints-2026-09-23.jsonl). Both old and revised instructions avoided unsupported relationship claims in that repeat. This demonstrates variance and does not establish a causal improvement rate.

Human review assessed every ownership, authorization or relationship claim against the supplied evidence, rather than scanning for a forbidden word:

| Run and case | Prior instructions | Revised instructions |
|---|---|---|
| Initial legitimate service | Low; supplied service relationships attributed, ownership unknown | Low; supplied relationships attributed, ownership unknown |
| Initial impersonation | High; unsupported "unrelated sender domain" | High; relationship left unknown |
| Without hints, legitimate service | Low; supplied relationships attributed | Low; supplied relationships attributed |
| Without hints, impersonation | High; name difference, no asserted ownership relationship | High; name difference, authorization not established |

Both revised impersonation answers retained chronology, the product contradiction, authentication limits and unknown payload behavior. The second did not explicitly discuss the logo. This is a targeted relationship evaluation with synthetic reviewed text, not a full original-message pipeline or a comprehensive output-coverage test. One observation per case and variant cannot guarantee future wording. The portable document received the same clause and a text review; only the local instructions were model-evaluated.

The former `agent/src/evals/domain-relationships.ts` ran these paired instruction tests. It was removed when the structured contract replaced free-form output. The retained JSONL files document the historical results.

The output is created exclusively with mode 0600. A failed later call leaves earlier results intact. Both evaluations exited naturally; the runner typechecked and all eight agent tests passed. Claude independently approved the clause, reviewed both sets of outputs and accepted the corrected evaluator for this limited scope. The recorded model name comes from the same exported constant used by the production agent. Grok's implementation review is unavailable because its pane reached the weekly usage limit.

## Full-pipeline retest

The 2026-09-22T23:49Z run used the same original and reviewed text as the 22:24Z baseline, verified by file hashes. It exited normally in 32.685 seconds. The answer retained High concern, the image/action distinction, registration dates, the supplied official-product contradiction and unknown payload behavior. Provider candidates remained in the deterministic output.

The model nevertheless used "unrelated sender identity" as supporting evidence without a source establishing that relationship. This leaves the acceptance condition unmet. The instruction change remains in place, but the ticket is reopened. The private terminal transcript is `evidence/emails/2026-08-23-bifrost-wallet.ticket22-retest-20260922T234936Z.md`. No candidate website was visited and no report was prepared or sent. RDAP for the image domain again returned `request_failed`; the displayed URL now identifies the registry request rather than leaving its stage unknown.

## Positive instruction replay and second failure

Replaced the mismatch clause with positive instructions to name the claimed identity, observed domain and cited evidence of a connection. The historical extended evaluator accepted `--input <reviewed-model-input.json>` to replay the exact same evidence under both prompts without repeating DNS/RDAP. The six-response replay is private at `evidence/diagnostics/ticket22-positive-replay.jsonl`. Both prompts kept the legitimate control Low and the impersonation cases High. The revised replies made no unsupported relationship claim in those three samples; the old prompt called the real sender domain "separate from the represented brand" without support for a brand relationship.

The subsequent full-pipeline run at 2026-09-23T00:02Z still said "unrelated domain" and "unrelated delivery domain" without supporting evidence. It exited normally in 37.399 seconds and all registration lookups succeeded. The result is retained at `evidence/emails/2026-08-23-bifrost-wallet.recovery-retest-20260923T000219Z.md`. The positive instruction therefore does not close this ticket. Further prompt prohibitions are stopped. The operator subsequently approved structured conclusion and evidence selections with runtime-rendered facts; free-form factual prose cannot provide that structural guarantee.

## Structured replacement

[ADR 0016](../../adr/0016-render-recorded-assessment-evidence.md) replaces local factual prose with validated selections. The renderer rejects extra prose and unknown record IDs; the CLI ignores the model text channel. No additional prompt prohibition or second model operation was added. The portable workflow remains a free-form guide for other hosts and does not inherit this runtime guarantee.

The offline CLI fixture emits an invented relationship sentence alongside its structured submission. Tests verify that the sentence never appears, that selected evidence does, that missing/unknown submissions fail visibly, and that the command exits naturally after one model request. The shared renderer test rejects extra fields and escapes stored terminal text. These tests establish the display boundary, not classification accuracy.

The replacement manual evaluator runs the actual structured agent over the legitimate multi-domain and contradicted-product controls. It records the selected result and rendered output with the model and prompt digest. It makes live model calls, uses in-memory conversations and creates an exclusive mode-0600 file:

```sh
node agent/src/evals/assessments.ts --output /path/to/new-results.jsonl
```

## Structured evaluation, 2026-09-23

The [two synthetic controls](../../research/evaluations/structured-assessments-2026-09-23.jsonl) returned Low concern/high confidence/no specific deception for the documented multi-domain service, and High concern/moderate confidence/deceptive software delivery for the contradicted product announcement. Both emitted valid selections. These two samples check the intended distinction, not a calibrated accuracy rate.

The same original Bifrost email and reviewed text completed in 20.792 seconds with exit 0 at 00:16Z. All four domain RDAP queries succeeded, including `bifrostwallet.com`. The assessment selected High concern, high confidence and deceptive software delivery. Its eight records included the image/action distinction, lookalike finding, two registration records and three authentication claims, plus the reviewed-text label. The runtime displayed each recorded qualification without invented relationship prose. The private transcript is `evidence/emails/2026-08-23-bifrost-wallet.structured-retest-20260923T001625Z.md`.

This output trades narrative detail for attribution: the official-product statement remains inside the reviewed text, represented by its label. A separately supplied source note can give that statement its own selectable, attributed record. The runtime does not extract new facts from arbitrary reviewed prose. Fresh authentication, payload behavior and historical source applicability remain unverified. No candidate website was visited and no report was sent.

## Source-note display and review closure

Claude's review identified the opaque reviewed-text reference as a display limitation. The existing external observation was therefore supplied through `--source-notes`, without new retrieval. It is saved privately as `evidence/emails/2026-08-23-bifrost-wallet.source-notes.json`. Only a UTC retrieval date had been recorded, so source notes now accept a date-only value as well as a timestamp. The renderer preserves that precision and the declared historical applicability. Reporting-research timestamps and chronology checks are unchanged.

The final run at 00:20Z exited 0 in 20.085 seconds. All domain RDAP lookups succeeded. It selected High concern, moderate confidence and impersonation, with the official-product observation individually displayed as a supplied claim, its URL, retrieval date and unknown historical applicability. The private transcript is `evidence/emails/2026-08-23-bifrost-wallet.structured-notes-20260923T002022Z.md`. The change in hypothesis/confidence between runs is recorded rather than treated as a stable classification guarantee.

The final gates passed: 105 library tests, 3 CLI tests, 10 agent tests and all workspace typechecks. Claude verified the Flue pattern and final deltas and closed the review. Optional cross-field classification rules were not adopted: an unresolved Medium concern can legitimately lack a specific supported deception hypothesis. No dependency or extra inference stage was added. Grok's review remains unavailable because its pane reached its usage limit.
