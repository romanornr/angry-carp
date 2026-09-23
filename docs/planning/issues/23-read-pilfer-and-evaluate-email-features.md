# Read PILFER and evaluate reusable email features

Type: research
Status: open
Assignee: unassigned
Parent: ../map.md
Blocked by: none
Related: 09-evaluate-phishing-detection-research.md

## Question

Which ideas from Ian Fette, Norman Sadeh and Anthony Tomasic's *Learning to Detect Phishing Emails* (WWW 2007) are worth testing in Angry Carp?

Read the [original paper](https://www.cs.cmu.edu/~tomasic/doc/2007/FetteSadehTomasicWWW2007.pdf), starting with sections 3.2 (features) and 4 (evaluation). The [existing research note](../../research/email-phishing-detection-papers.md#1-learning-to-detect-phishing-emails--www-may-2007) records the initial review. This is a local reading and research ticket, not approval to implement a detector.

## Points to investigate

- Map the paper's ten features to current checks, missing observations and inputs Angry Carp does not collect.
- Examine section 3.2.8's dot count. It takes the maximum count across an entire link, not just its hostname. Compare that coarse observation with subdomain depth, public-suffix boundaries and redirect parameters. Do not assume a threshold proves phishing.
- Revisit displayed-link versus destination mismatches, distinct registration domains and registration timing. Identify what each adds beyond the current evidence.
- Separate useful observations from the trained random forest. Examine corpus selection, historical evidence availability and whether the evaluation supports later phishing campaigns.

## Done when

- The operator has a concise reading summary with section references and examples.
- Each candidate is marked already implemented, worth an experiment, deferred or rejected, with a reason.
- Any proposed experiment has benign controls, expected observations and a way to measure added value. No candidate-site visits are needed.
- No paper accuracy figure is presented as Angry Carp's accuracy. Implementation and any private-data evaluation remain separate decisions.
