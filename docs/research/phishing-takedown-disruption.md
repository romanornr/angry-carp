# Phishing takedowns and operational disruption

Research date: 2026-09-23. This note assesses evidence for Angry Carp's mission wording. It covers provider abuse reports and the removal of phishing infrastructure, with separate treatment of operational effects and offender psychology.

The existing [provider reporting note](provider-reporting-requirements.md) distinguishes browser detection reports from hosting takedowns. The [registrar escalation note](registrar-escalation.md) explains why removing phishing content and suspending an entire domain require different judgments. Those distinctions remain relevant to the mission.

## What the sources establish

| Primary source and date | Evidence | Limit |
| --- | --- | --- |
| Moore, Clayton, and Stern, [Temporal Correlations between Spam and Phishing Websites](https://www.usenix.org/legacy/event/leet09/tech/full_papers/moore/moore_html/), LEET, 2009-04-21. The [conference schedule](https://www.usenix.org/legacy/events/leet09/tech/tech.html) confirms the date. | The authors measured phishing website lifetimes alongside associated spam. Spam still advertised up to 75% of sites that remained alive after one week. Fast-flux operators stopped sending associated spam shortly after site removal. This supports removal as a way to interrupt active phishing campaigns. | Historical observational evidence, not a randomized takedown trial. Changes in spam do not establish lasting deterrence, replacement costs, or emotions. |
| Hutchings, Clayton, and Anderson, [Taking Down Websites to Prevent Crime](https://www.cl.cam.ac.uk/~ah793/papers/2016takedown.pdf), published 2016-06-09 according to the [university publication record](https://www.research.ed.ac.uk/en/publications/taking-down-websites-to-prevent-crime). | Twenty-two interviews with 24 people involved in takedowns describe intended effects, including interrupted access and more work or expense to maintain and replace sites. | These are practitioner accounts, not measurements of offender costs or feelings. The paper also notes that many sites are cheap and fast to replace. Its example of increased perceived detection risk combines takedown with arrest, so it cannot establish the effect of provider action alone. |
| UK NCSC, [Takedown: removing malicious content to protect your brand](https://www.ncsc.gov.uk/guidance/takedown-removing-malicious-content-to-protect-your-brand), published and reviewed 2022-09-21. | Describes takedown through notification to the host or a request to the registrar to suspend a domain established for fraud. Anyone can report abuse through these channels. Providers act on evidence and applicable service terms. | Operational guidance, not an impact experiment. Requests can take hours, days, or weeks, and some providers ignore them. Submitting a report does not establish removal. |
| Agarwal and Vasek, [Examining newly registered phishing domains at scale](https://academic.oup.com/cybersecurity/article/12/1/tyag020/8735840), published 2026-07-16. | Studies 15,126 newly registered phishing domains over 11 months. It distinguishes malicious registrations from compromised legitimate websites and finds domain reuse, supporting different mitigation choices for different infrastructure. | The reported mean lifetime of 8.6 days uses passive DNS and certificate observations. The authors explain that this can underestimate early activity and overestimate persistence. It is not a report-to-removal measurement or evidence of a takedown's causal effect. |

## Costs, deterrence, and fear are different claims

Successful removal prevents access to the affected content or domain while that removal remains effective. The phishing measurement study connects site removal with campaign behavior. This supports an operational disruption claim with a defined scope.

Replacement requires resources, but these sources do not quantify the additional cost imposed by an ordinary abuse report. "Make phishing harder to sustain" is a defensible aim. "Make phishing unprofitable" is an unsupported outcome claim.

Targeted searches for phishing takedown studies, offender interviews, fear, panic, deterrence, and replacement costs found no direct empirical evidence that ordinary provider takedowns cause phishers to experience fear or panic. This was a bounded search, not a systematic literature review. None of the four sources measures those emotions. Downtime, reduced spam, and practitioner expectations cannot establish them. Evidence about arrests, botnet operations, or offenders' self-reported attitudes would require separate qualification and would not establish the psychological effect of Angry Carp's workflow.

## Recommended mission wording

> Angry Carp's mission is to get phishing infrastructure taken offline through evidence-backed abuse reports to the providers that can act. The goal is to shorten the time phishing sites can reach victims and make campaigns harder to sustain.

This states removal as the goal and reporting as the means. It does not claim that Angry Carp controls provider decisions or has already demonstrated an effect. Confirmed removal and elapsed time to removal would be more relevant evidence of progress than report counts alone. Offender fear or panic should remain outside factual README claims unless direct evidence becomes available.

## Follow-up: lifetimes, responder awareness and recurrence

Reviewed 2026-09-23 against the original papers. Their historical measurements describe particular datasets, not current provider performance or a guaranteed reporting outcome.

### Takedown delays and resilient infrastructure

Moore and Clayton's *Examining the Impact of Website Take-down on Phishing* (eCrime 2007), sections 3.1, 4 and 5.1, reports median observed lifetimes of 19.52 hours for ordinary phishing sites, 55.14 for Rock-Phish domains and 111 for fast-flux domains. The corresponding means were 61.69, 94.68 and 196.2 hours. These observations exclude sites already unavailable on initial inspection. They are not timings from an Angry Carp report or from a reliably observed deployment time. The architecture allowed continued operation despite changes to individual addresses. This supports distinguishing a domain from its current network endpoints when choosing a reporting recipient. It does not make ordinary CDN address rotation evidence of phishing. [Original paper, figure 3](https://www.cl.cam.ac.uk/~rnc1/ecrime07.pdf)

The early-exposure claim has a more direct source in Oest et al.'s *Sunrise to Sunset* (USENIX Security 2020). Section 5 reports that detection followed the first victim visit by nearly nine hours on average, with 62.73% of victim visits already occurring by detection. The measured first-to-last-victim window averaged roughly 21 hours. These are victim-traffic and detection measurements for the study's sampled attacks, not a universal time limit or provider response SLA. They support reducing avoidable delay before the first actionable report. [Original paper, section 5](https://www.usenix.org/system/files/sec20-oest-sunrise.pdf)

### The right responder must learn about the resource

Moore and Clayton's *The Consequence of Non-Cooperation in the Fight Against Phishing* (eCrime 2008) compared six months of feeds and website availability. Relevant takedown companies missed sites known to other sources. Sections III and IV associate those information gaps with longer availability and examine cooperation against shared Rock-Phish infrastructure. This supports getting evidence to parties that can act rather than assuming someone else has already informed them. It does not prove that indiscriminate reporting or public disclosure is the best route for each private email. [Original paper](https://www.cl.cam.ac.uk/~rnc1/ecrime08pre.pdf)

The separate [recompromise and disclosure review](phishing-recompromise-and-disclosure.md) verifies the 2011 one-year figure, distinguishes the earlier 2009 dataset and tests the proposed explanation for public-list effects.

## Workflow ideas to evaluate

These are engineering proposals inferred from the research, not adopted runtime behavior or authorization to submit reports.

| Proposal | Practical behavior | Evidence of usefulness |
| --- | --- | --- |
| Reduce delay to the first useful report | Prepare each justified provider request from the same evidence record. Do not make a ready host report wait for an unrelated registrar response. Retain source verification and operator approval. | Measure operator first observation to approved submission, separately from provider response time. |
| Request the action appropriate to the resource | Keep malicious registrations distinct from compromised legitimate sites. Request removal and compromise investigation for an affected site where supported. Request registrar action when the domain itself is supported as abusive. | Record which resource and role each provider actually addressed. Do not count a page removal as suspension of its domain. |
| Preserve recurrence as new evidence | Link a later supplied message or provider update to an earlier resource and outcome. Mark it as a repeated reference until evidence supports renewed activity. | Distinguish old lures still circulating, continuing abuse, new compromise and unknown status. Shared hosting alone must not combine cases. |
| Ask about remediation when compromise is established | A follow-up can ask whether the underlying compromise was investigated, rather than treating deletion of one page as proof of repair. | Keep the provider's answer and scope. Silence does not establish that a vulnerability remains. |
| Evaluate selective intelligence sharing | Consider a separate, reviewed disclosure to an appropriate anti-phishing recipient. Decide what exact URLs or evidence may be exposed before adding a destination. | Compare useful acknowledgements, action and disclosure costs. The historical association does not authorize automatically publishing private URLs. |

Start with the existing [case and provider outcome design](../planning/issues/04-define-case-and-provider-outcomes.md). Preserve first observation, submission, acknowledgement and action-confirmation times separately. A provider reply is an attributed statement of action, not an independently observed removal time. Unanswered reports remain unknown, and repeated confirmations count once per action and resource. Report medians and unresolved counts only after collecting enough comparable cases, rather than borrowing the papers' averages as product claims.

The existing seven-day follow-up choice is a workflow default, not a finding from these papers. This research motivates evaluating it, but supplies no universally optimal replacement interval. No automatic polling, candidate-site fetching, vulnerability probing, public submission, new dependency or runtime change was performed for this review.
