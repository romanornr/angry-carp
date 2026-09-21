# Evaluate Unicode and phishing detection research

Type: research
Labels: wayfinder:research
Status: resolved
Assignee: planning agent
Parent: ../map.md
Blocked by: none

## Question

What do Unicode's confusable-detection mechanisms and representative phishing-detection research contribute to Angry Carp? Distinguish local email and URL observations from methods needing website access. Assess dataset quality, false-positive risks, privacy, and evaluation requirements before choosing a detector or runner.

## Answer

Completed a primary-source review of email, URL, and visual detection methods, plus an offline ICU experiment on 13 synthetic string pairs. Standard Unicode comparisons expose useful lookalikes but do not establish deception. Normalization and script checks alone miss some examples. The experiment also exposes differences between ordinary and direction-aware comparison.

The literature supports comparing explainable observations, conventional classifiers, and evidence-grounded model assessments. It does not establish a winning detector for this mailbox. Dataset leakage, outdated corpora, spam/phishing label confusion, and missing website inputs prevent importing headline accuracy claims.

The [synthesis and proposed evaluation](../../../docs/research/phishing-detection-design.md) links the [Unicode evaluation](../../../docs/research/unicode-confusable-evaluation.md), [email papers](../../../docs/research/email-phishing-detection-papers.md), and [URL and visual papers](../../../docs/research/url-and-visual-phishing-detection.md). The experiment's source and versioned output are linked from the Unicode note. C++ was used to exercise the installed ICU library, not selected for the product.

Recommended next work is an agreed evaluation protocol. Detector choice, thresholds, disclosure to model providers, and Flue versus fixed workflow remain unresolved. No private mail, malicious datasets, candidate websites, scans, or operational reports were used.

## Operator response

The operator accepted the initial comparison of local observations, one configured LLM, and their combination on identical cases, measuring false accusations, missed phishing, review workload, and unsupported report claims. Custom training waits until that comparison exposes a need. This accepts the evaluation direction, not a detector, regex rule, language, dataset disclosure, or training run.
