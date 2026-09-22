# Email similarity and campaign linking

Research date: 2026-09-22. Status: proposal, not an accepted implementation plan. Sources retrieved on this date. No private email, credential, or conversation database was read for this research.

## Recommendation

For repeated unwanted email, investigate comparisons that explain which passages or indicators recur. Compare exact text-shingle overlap with Winnowing on a small, operator-selected set before choosing an implementation. A shingle is an overlapping fragment of text. Include legitimate messages with shared footers and templates in the comparison.

The useful result is a statement such as "these messages share this passage and this destination," with references to the source messages. A similarity result does not itself establish unsolicited delivery, phishing, or common attacker identity. Adult subject matter does not establish spam. The recipient's unwanted-mail designation and the message's deceptive behavior are separate observations.

This fits the existing [campaign-linking decision](../planning/issues/03-define-evidence-and-campaign-claims.md). Strong repeat evidence can support provisional links, provided each link records its reason and can be corrected. Each message retains its own assessment.

## What the algorithms provide

| Method | Verified capability | Proposed use here |
| --- | --- | --- |
| Eclat | Enumerates combinations of items that meet minimum support through transaction-set intersections. | Discover repeated combinations of email indicators after those indicators are reliably extracted. |
| Winnowing | Selects local fingerprints of text fragments and retains their positions. | Find and show reused passages despite changes elsewhere in a message. |
| MinHash | Estimates set resemblance using compact randomized sketches. | Reduce comparison cost if exact shingle comparisons become expensive. |
| CUSUM | Accumulates deviations to detect a shift in a monitored process. | Detect changing arrival rates after collection coverage and a baseline exist. |

Sources: [Zaki's Eclat implementation and original-paper references](https://github.com/zakimjz/ECLAT), [Schleimer, Wilkerson, and Aiken, SIGMOD 2003](https://sschleimer.warwick.ac.uk/Maths/winnowing.pdf), [Broder, 1997](https://www.cs.princeton.edu/courses/archive/spring13/cos598C/broder97resemblance.pdf), and [NIST CUSUM guidance](https://www.itl.nist.gov/div898/handbook/pmc/section3/pmc323.htm).

Winnowing guarantees a shared fingerprint for identical substrings of at least `k + w - 1` units under its selection algorithm and consistent preprocessing. This is a guarantee about matches in the processed representation, not about spam detection. Verify matched source fragments after hash matches. Common footers and quoted messages can match perfectly without being useful evidence of a campaign.

MinHash estimates Jaccard similarity, `|A intersection B| / |A union B|`. The matching-minimum probability equals this ratio under a uniformly random permutation. Real hash families approximate that construction. At small scale, exact set comparison avoids sampling error. Comparing containment as well as overall overlap may help when a reused passage sits inside a much larger message. That is a proposed comparison, not a validated email detector.

CUSUM needs a defined measurement, baseline, and alert parameters. Mail counts require attention to collection gaps, changing total volume, and seasonality. An incomplete mailbox export cannot establish an arrival-rate baseline. No CUSUM parameters are selected here.

## Eclat and statistical claims

Eclat can supply evidence for campaign linking, but it does not assign campaign membership or determine maliciousness. It has no inherent requirement for thousands of messages. Its value depends on whether repeated multi-feature combinations reveal useful associations beyond individual shared indicators. Large feature sets can produce many redundant combinations even in a small corpus.

For two features occurring in `a` and `b` of `N` messages, expected overlap is `a*b/N` under independent random placement. Lift and statistical significance are not phishing probabilities. Searching many combinations and retaining the most surprising ones creates a multiple-testing problem. A hypergeometric test alone does not resolve sampling bias, dependence, or selection. See [Hamalainen and Webb's tutorial on statistically sound pattern discovery](https://link.springer.com/article/10.1007/s10618-018-0590-x).

Do not count a domain, its nameservers, and its CDN as independent corroboration. These correlated observations can generate redundant itemsets. Shared providers remain useful context but do not alone justify a campaign link. Keep delivery counts separate from counts of distinct content variants. Reimporting one message must not manufacture another observation, while genuinely separate deliveries should remain available for volume analysis.

## What phishing research does and does not establish

[Cui et al., WWW 2017](https://site.uottawa.ca/~bochmann/Curriculum/Pub/2017%20-%20Tracking%20phishing%20attacks%20over%20time.pdf) studied phishing websites and found extensive reuse through DOM similarity. Some attack classes persisted through their ten-month observation period. This supports examining recurrence but does not validate an email fingerprinting algorithm.

[Oest et al., USENIX Security 2020](https://www.usenix.org/conference/usenixsecurity20/presentation/oest-sunrise) measured an average campaign duration of 21 hours in their dataset. That finding does not justify discarding older matches in this mailbox. Individual site activity, delivery bursts, and recurring template families can have different lifetimes.

## Representation and runtime boundaries

The present Flue agent assesses prepared text and has no cross-message feature store. Its conversation database is not a campaign index. The next design should define comparable inputs before adding a miner or a persistent store.

`phishing-triage.md` remains a downloadable, runtime-independent assessment guide. It must not require these TypeScript implementations or assume that Grok, Codex, or another consumer has their tools. Any future implementation belongs under `agent/`; Flue-specific tool guidance must be supplied separately by that agent. This research note is not loaded into the assessment prompt. This separation follows [ADR 0004](../adr/0004-distribute-workflow-independently.md).

Proposed constraints for a comparison increment:

- Compare extracted message bodies, excluding preparation notices, operator annotations, and duplicated plain-text/HTML alternatives. Otherwise our own preparation format could dominate matches.
- Preserve originals and record extraction and normalization versions. Keep source references for matched spans. Hashes and fingerprints are not anonymization.
- Distinguish not supplied, not examined, extraction failed, and successfully examined with no finding. A failed QR decoder cannot establish absence of a link.
- Treat literal links, decoded QR payloads, and verified redirect destinations as different observations. Decoding a QR payload does not authorize following it.
- Record typed indicator values, provenance, and derivation relationships. Do not treat all strings as equivalent features.
- Perform comparisons locally in TypeScript. A later Flue integration can receive bounded results without filesystem access. No model training or automatic prompt accumulation is necessary.

The current prepared text cannot supply original HTML structure, attachment bytes, or image pixels. Local extraction from operator-supplied originals would be a separate increment. It does not require a database first.

[Unicode normalization](https://www.unicode.org/reports/tr15/) and [confusable skeleton comparison](https://www.unicode.org/reports/tr39/) are different transformations. Normalization alone does not equate all visually similar letters. Keep literal, normalized, and any confusable-derived matches distinguishable. The existing domain comparator is not a validated whole-email normalization policy.

Weighted edit distance could add typo observations beyond the current domain skeleton and containment checks, but custom costs and decision thresholds need evidence. Defer that extension until examples show a useful gap.

## Next decision

First decide whether the operator-selected examples contain repeated bodies, repeated indicators, or mainly unrelated spam. For repeated bodies, the proposed comparison is exact shingle overlap versus Winnowing, with visible matched passages and legitimate controls. For repeated indicators, start with an index from each indicator to its source messages and assess whether Eclat adds useful combinations. No runtime changes, storage format, dependency, blocking rule, or automatic reporting action are approved by this note.
