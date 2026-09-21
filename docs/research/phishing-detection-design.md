# Detection research and proposed evaluation

Reviewed 2026-09-21. This is a design recommendation supported by a targeted literature review and a synthetic Unicode experiment. It does not select a detector, language, agent framework, or confidence threshold.

The operator accepted comparing local observations, one configured LLM, and their combination on the same cases. Measure false accusations, missed phishing, review workload, and unsupported report claims. Defer custom training until the comparison exposes a need. Dataset access, disclosure, detailed protocol, and acceptance thresholds remain to be specified.

The [additional source review](additional-reporting-and-simulation-sources.md) identifies simulation collections that may help with inert fixtures and scenario coverage. Keep authorized simulations distinct from confirmed malicious campaigns and do not use template familiarity as evidence of real-world detection accuracy.

## Findings that affect the architecture

- [Unicode evaluation](unicode-confusable-evaluation.md): standard comparisons expose lookalikes that normalization alone misses. Script checks, normalization, confusable comparisons, and direction-control observations are complementary. None determines malicious intent.
- [Email research](email-phishing-detection-papers.md): classic features, trained text classifiers, transformers, and LLMs all merit comparison. Dataset age, spam/phishing confusion, campaign overlap, and performance on different corpora limit headline scores.
- [URL and visual research](url-and-visual-phishing-detection.md): literal URL analysis can run locally. Full visual systems often require website artifacts or interaction. Their published results do not measure email-only assessment.

My recommendation is a shared evidence extractor plus a replaceable assessment method. Retain Flue versus fixed-workflow evaluation as a separate question. Choosing an agent runtime does not establish which detector works or whether its report claims are justified.

This is not a selected regex classifier or a novel research algorithm. The proposed observations come from mail and URL parsing, authentication evidence, and established Unicode comparison algorithms. A small regex may be useful for a specific text pattern, but the LEXO rule was evaluated and rejected unchanged. The overall design combines established techniques and must demonstrate its usefulness in the agreed comparison. No reviewed paper validates this exact Angry Carp combination.

## Proposed flow

```text
Private original email
    |
    v
Local parsing and observations
    |
    v
Assessment using explicit evidence and contrary evidence
    |                 |
    |                 +-- permitted external observations when needed
    |                 +-- a focused operator question when context is missing
    v
High, Medium, or Low with reasons and evidence references
    |
    v
Necessary evidence and a provider-specific report draft
    |
    v
Operator review of the exact outgoing report
```

The proposed local extractor records decoded headers, trusted receiver authentication results when available, displayed-link versus literal-target differences, parsed URL structure, Unicode observations, and exact or near-duplicate relationships. It preserves missing inputs and parse failures. It does not render remote content, fetch targets, or infer maliciousness from one unusual feature.

An optional inexpensive classifier could order the assessment queue. A low prioritization score must not silently remove messages from coverage or stand in for a completed Low assessment. If a run reaches its budget, preserve the remaining work as unassessed. This is a proposed behavior to validate alongside acquisition and budget choices.

The analyst must connect the claimed identity, requested action, destination, and available context. It should record uncertainty and contradictions. An unfamiliar sender, Unicode match, failed authentication check, model confidence number, or scanner verdict alone is not a complete report justification. Evidence of a credential request in the email and evidence of a credential-taking website are different claims.

Existing skills can describe these steps and consume observations available through their hosts. The CLI option can extract and record observations consistently. An optional runner coordinates those same operations. No host should invent observations for a module it does not have.

## Compare detectors separately from runners

| Comparison | Question | Evidence required before selection |
| --- | --- | --- |
| Local observations with simple rules | How much useful prioritization can cheap, explainable checks provide? | Missed phishing and false alerts, including legitimate multilingual mail. |
| A conventional local classifier | Does learned text or feature weighting improve the baseline? | Improvement on later, unseen campaigns that justifies training and maintenance. |
| One configured LLM | Can it identify deception and cite evidence with acceptable review load? | Supported claims, abstentions, malformed outputs, cost, and resistance to hostile email instructions. |
| Observations plus an LLM | Does structured evidence improve assessment over the same model without it? | Comparison on identical cases and removal of each signal family in turn. |
| Optional stored website artifacts | Do permitted screenshots or text resolve otherwise ambiguous cases? | Added value when artifacts exist, and explicit behavior when they do not. |
| Fixed workflow versus Flue agent | Does model-selected tool use improve investigations enough to justify its complexity? | Same models, tools, cases, budgets, and approval rules in both runners. |

These are evaluation candidates, not an instruction to build every option now. Start with local observations, one model assessment, and their combination. A classifier requiring custom training and website-artifact analysis can wait until the simpler comparison exposes a concrete need. No private training or model disclosure is authorized by this research.

## Evaluation protocol to specify next

Use synthetic messages for mechanics and adversarial cases. Use separately approved historical evidence for realistic effectiveness. Historical labels need review; prior model verdicts and provider acknowledgements are not automatic ground truth. Include phishing, ordinary spam, legitimate mail, and unresolved examples as separate categories.

Split by time and keep duplicate messages and related campaign templates together. Freeze available intelligence to what the investigator could have known at the time. Reserve later campaigns for final evaluation. Include Dutch and English, legitimate signing and delivery messages, authorized intermediaries, compromised familiar senders, quoted phishing examples, Unicode controls, and parser failures.

Measure High-confidence precision, recall on confirmed phishing, false alerts per thousand legitimate messages, Medium review burden, unassessed coverage, cost, and time. Count abstentions and invalid model outputs rather than dropping them. Report sample counts and uncertainty. A useful detector must also avoid unsupported factual claims and private-data disclosure in drafts.

Test the operations independently: an email cannot authorize a tool call; an assessment cannot approve a report; edited reports require review; uncertain sends require reconciliation; unavailable private scanning cannot become public scanning. Test these properties for both runner candidates, including prompts embedded in messages and returned evidence.

The resulting benchmark should help choose detection and runner behavior. It will not prove attacker identity, global campaign volume, or infrastructure removal. Those require their own observations and case records.
