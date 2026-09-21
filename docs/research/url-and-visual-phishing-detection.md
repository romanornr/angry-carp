# URL and visual phishing detection research

Research date: 2026-09-21. This is a targeted primary-source review, not a systematic literature review or a detector benchmark. No candidate phishing URLs were visited, no scans were submitted, and no datasets or software were downloaded. Recommendations below remain proposals.

## What the research can contribute

The useful split for Angry Carp is between analyzing evidence already available and acquiring new website evidence. URL classifiers can inspect a literal URL without requesting it. Website detectors often require screenshots, page text, or interactive browsing. Their published results do not measure classification of an email using only its headers and body.

| Research | Inputs and method | Fit for Angry Carp |
|---|---|---|
| [URLNet, 2018](https://arxiv.org/abs/1802.03162) | Learns character and word representations of the URL string using convolutional networks. Studies malicious URLs, a broader category than phishing. | A useful historical baseline for an optional local URL signal. The method need not fetch the target, but a score cannot establish page behavior or brand authorization. |
| [Phishpedia, USENIX Security 2021](https://www.usenix.org/conference/usenixsecurity21/presentation/lin) | Recognizes logos in screenshots and compares the inferred brand against the page's domain. Uses legitimate reference brands rather than training on phishing examples. | Could assess an already acquired screenshot and URL. Brand resemblance is evidence to explain and corroborate, not an automatic report decision. |
| [PhishIntention, USENIX Security 2022](https://www.usenix.org/conference/usenixsecurity22/presentation/liu-ruofan) | Combines brand recognition with credential-taking intention, including interaction to reach or confirm credential-taking pages. | Its complete workflow conflicts with direct-visit restrictions. Static parts might be reusable, but an adaptation would need its own evaluation. |
| [PhishLLM, USENIX Security 2024](https://www.usenix.org/conference/usenixsecurity24/presentation/liu-ruofan) | Uses language models for brand-domain knowledge and credential-taking interpretation, with search-based validation of model claims. | Useful evidence that model reasoning can complement explicit observations. It does not justify trusting a model's remembered official domains or giving it unrestricted browsing. |
| [Ji et al., USENIX Security 2025](https://www.usenix.org/conference/usenixsecurity25/presentation/ji) | Evaluates visual detectors against 451,000 real-world phishing websites and examines evasion. Finds that strong results on curated datasets can coexist with poor performance on real-world data. | A reason to test the whole workflow on representative mail and available artifacts before relying on any published detector accuracy. |

This selection represents URL learning, visual matching, interactive intention analysis, model-assisted analysis, and an independent robustness evaluation. It is not a ranking of products or a claim to cover every recent paper.

## Existing implementations and reuse limits

The [official Phishpedia repository](https://github.com/lindsey98/Phishpedia/blob/main/README.md) documents a URL and screenshot as detector inputs and provides the research implementation. That makes its inference component a candidate for later reuse, subject to a dependency, license, model-weight, and network-behavior review. We have not performed that review or installed it.

The original PhishLLM repository currently redirects to [PhishVLM](https://github.com/code-philia/PhishVLM), an extension of the published work. Its documented workflow uses screenshots, brand validation, a headless browser, and login-interface clicks when the current page is not classified as credential-taking. An unchanged run would therefore violate Angry Carp's direct-visit boundary. A screenshot-only adaptation would be a different system and must not inherit the original paper's measured performance claims.

Context7 resolution returned no library for either PhishVLM or PhishIntention. Implementation facts above therefore use the authors' repositories and papers directly. This note supplies no setup commands or API integration recipe.

## Safe use of external observations

The following are proposed integration rules derived from the agreed Angry Carp privacy policy. They do not imply that any particular scanner account exposes every required artifact.

- Prefer email evidence and existing permitted observations. A new external scan still requires the agreed private-scan and complete-URL privacy checks. Never submit full mail or attachments to a scanner.
- If a permitted result supplies a screenshot, final URL, capture time, or stored page text, record which artifact each conclusion uses. A screenshot from a different path or time cannot prove what the original recipient saw.
- Read stored HTML as untrusted data. Do not render it in a network-enabled browser, load its assets, follow its links, or execute scripts. Model processing must treat embedded instructions as hostile evidence.
- A scanner result may itself contain personal data. Permission to submit a privacy-checked URL is not blanket permission to send every returned artifact to another model provider.
- If a method requires missing HTML, a later page, CAPTCHA interaction, or unavailable private artifacts, record the gap and continue with the available evidence. Missing visibility is not proof of safety and does not authorize a local visit.
- Compare related URLs, page hashes, or distinctive assets with their source and time. Shared infrastructure or copied kits do not establish a common human operator. Counts describe observed artifacts, not total campaign reach. See [existing observation limits](phishing-evidence-options.md#what-historical-scans-establish).

For platform-specific availability and privacy, the earlier [evidence options](phishing-evidence-options.md) record the official scanner documentation. This review did not revalidate account quotas or entitlements.

## Evaluation before adoption

TESSERACT demonstrates how unrealistic class distributions and incorrect time splits inflate security-classification results. Its experiments concern Android malware, not email phishing. Applying that lesson to Angry Carp is our proposed evaluation design, not a phishing benchmark result from the paper. [TESSERACT, USENIX Security 2019](https://www.usenix.org/conference/usenixsecurity19/presentation/pendlebury)

1. Compare simple local observations, URL classification, an evidence-grounded model assessment, and optional artifact analysis on the same cases. Measure whether each addition improves useful decisions enough to justify its cost and disclosure.
2. Evaluate later messages using only knowledge available at decision time. Keep duplicates and closely related campaign templates from leaking across training and test sets. Evaluate unseen domains and brands separately where enough examples exist.
3. Include legitimate multilingual senders, outsourced delivery services, document-signing requests, and compromised legitimate domains. A balanced public benchmark is not an estimate of the operator's actual false-alert burden.
4. Measure High-confidence precision, missed confirmed phishing, unnecessary Medium reviews, unsupported claims in draft reports, and analyst effort. Report sample counts and uncertainty. A detector's score is not a calibrated probability without supporting validation.
5. Preserve provenance for ground-truth labels. Provider acknowledgement, sender-account suspension, and resource removal are different observations; none alone labels every linked message. Do not test against labels created solely by the detector being tested.
6. Record performance when screenshots or external services are unavailable. Test stale captures, redirections, model disagreement, hidden or altered logos, and hostile instructions inside page content. Ji et al.'s findings support testing evasion and real-world coverage; these exact Angry Carp scenarios are our proposal.

The initial recommendation is to extract explainable local signals and evaluate evidence-grounded assessments first. Keep website analysis as an optional consumer of permitted artifacts. No detector, framework, language, or confidence threshold is selected by this research.
