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

At the time of this research, recommended next work was an agreed evaluation protocol. Detector choice, thresholds, disclosure to model providers, and Flue versus fixed workflow were unresolved. This initial research used no private mail, malicious datasets, candidate websites, scans, or operational reports.

## Implementation update, 2026-09-22

The operator subsequently selected Flue and approved TypeScript tools for [domain lookalikes](../../domain-lookalikes.md) and [shared passages using Winnowing](../../text-reuse.md), alongside RDAP and DNS. These tools return observations for the assessment. They do not independently classify phishing. Offline regression tests cover their behavior; a comparative accuracy evaluation against model-only assessment has not been performed.

[Campaign-linking research](../../research/email-similarity-and-campaign-linking.md) informed the passage comparator. Eclat, MinHash, CUSUM, model training, and automatic corpus matching remain unimplemented. [Offline brand lookup](../../research/offline-brand-lookup.md) and [DNS catalogues and threat lists](../../research/dns-reference-and-threat-lists.md) identify possible data sources. No dataset or catalogue tool has been adopted. This leaves benchmark design and any data-source integration open without reopening the chosen local runner.

## Operator response

The operator accepted the initial comparison of local observations, one configured LLM, and their combination on identical cases, measuring false accusations, missed phishing, review workload, and unsupported report claims. Custom training waits until that comparison exposes a need. This accepts the evaluation direction, not a detector, regex rule, language, dataset disclosure, or training run.
