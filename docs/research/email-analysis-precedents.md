# Model-independent email analysis precedents

Research date: 2026-09-22. This note explains established scanner designs that could guide angry-carp's proposed structured analysis. It does not select a MIME parser, implement a coordinator, or demonstrate detection accuracy. Public documentation only was consulted. No messages, credentials, or candidate sites were accessed.

## Structured analysis already has established precedents

Rspamd returns JSON containing named detection symbols with scores and options, an aggregate score, a recommended action, and optional extracted hostnames and addresses. Its protocol also distinguishes a skipped message. This is a direct precedent for preserving machine-readable findings independently of a prose assessment. It does not mean the result is safe to disclose: optional addresses and identifiers remain private data. [Rspamd protocol](https://docs.rspamd.com/developers/protocol/)

Apache SpamAssassin separates parsing, checking, and optional message rewriting. `check()` returns a `PerMsgStatus` object. Callers can obtain the names and scores of triggered tests, an aggregate score, a textual report, and the original message object without calling `rewrite_mail()`. This supports a reusable analysis API that a CLI, Flue, or another caller can invoke directly. It does not require an HTTP service. [PerMsgStatus API](https://spamassassin.apache.org/full/4.0.x/doc/Mail_SpamAssassin_PerMsgStatus.html)

These systems are precedents for the separation of responsibilities. Adopting their entire implementations is a different decision, with deployment, configuration, and behavior to evaluate. Their existence does not establish that our current checks can replace their detection rules or an analyst's contextual judgment.

## Dependencies matter more than a long list of checks

Rspamd registers dependencies between symbols. Its documentation uses DKIM before DMARC as an example. A dependent check therefore waits for the prerequisite rather than relying on registration order. [Rspamd architecture](https://docs.rspamd.com/developers/architecture/)

SpamAssassin supports header, body, URI, and full-message rules, with meta rules combining other results. Most tests follow numeric priority, but DNS and meta tests have different scheduling. Its asynchronous rules must explicitly signal readiness before dependent meta rules can evaluate. [Rule configuration](https://spamassassin.apache.org/full/4.0.x/doc/Mail_SpamAssassin_Conf.html), [asynchronous rule readiness](https://spamassassin.apache.org/full/4.0.x/doc/Mail_SpamAssassin_PerMsgStatus.html)

For angry-carp, the transferable design is a small, explicit dependency order. Extract message facts before choosing lookup targets. Complete the relevant lookups before deriving provider roles or reporting candidates. Independent requests can run concurrently within a fixed budget. A general plugin scheduler or rules language is unnecessary until actual callers require one. This is a design recommendation, not a requirement from either scanner.

## Findings, decisions, and completeness are different

Rspamd warns that some modules select actions without relying on the total score. It also documents two causes of different scores for the same message: early rejection stops checks, and asynchronous checks can time out. Its `Pass: all` option addresses early rejection, not every possible cause of incomplete analysis. [Rspamd FAQ](https://docs.rspamd.com/faq/)

A list of triggered checks consequently cannot establish that every other check completed with no finding. For our proposed result, each applicable check needs an explicit outcome. Completed with no observation, skipped by policy, missing prerequisite, and lookup failure must remain distinguishable. Preserve resource-limit reasons too. These are recommended contracts derived from the documented failure modes, not claims that Rspamd emits this exact schema.

Reproducibility also needs a defined boundary. Local results can be replayed against fixed input bytes, code, configuration, and reference snapshots. Fresh DNS or RDAP observations can change. Retain their retrieval times and source responses or sufficient normalized evidence for the promised replay behavior. An unchanged input hash alone cannot make a live analysis reproducible.

SpamAssassin's plugin documentation advises keeping per-scan state on the message status object because plugin instances are shared between active scans. We can apply that ownership rule without adopting its plugin architecture: one analysis owns its observations and request budget. [Plugin lifecycle](https://spamassassin.apache.org/full/4.0.x/doc/Mail_SpamAssassin_Plugin.html)

## Standards can inform exports without owning the core

STIX 2.1 separates Observed Data from intelligence assertions. Its email-message object represents decoded fields, preserves repeated headers, and can reference an Artifact containing the original binary message. That supports retaining original evidence separately from normalized fields. STIX does not supply phishing detection rules or automatically remove private information. A future STIX export is plausible; adopting its graph model as the internal API is not justified by a current consumer. [STIX 2.1, sections 4.14 and 6.6](https://docs.oasis-open.org/cti/stix/v2.1/os/stix-v2.1-os.html)

OCSF's Detection Finding represents product-generated detections with evidence, enrichments, producer metadata, and remediation guidance. Its finding status tracks review and resolution, not whether a DNS request succeeded. It is an export precedent, not a replacement for individual check outcomes. No OCSF mapping is proposed here. [OCSF Detection Finding](https://schema.ocsf.io/classes/detection_finding)

## Recommendation

Build one structured analysis result before optional LLM interpretation. Keep observations, execution coverage, policy findings, and reporting candidates distinct. Return the structured result even when no classification is justified. A deterministic renderer can show every finding without relying on a model to choose which facts deserve mention.

This removes model discretion from check execution and evidence retention. It does not supply missing brand knowledge, validate arbitrary attribution rules, or establish a measured phishing classifier. Standards provide useful contracts; accuracy still needs representative cases and explicit expectations.

Context7 supplied current Rspamd documentation. Its available current SpamAssassin index did not answer the API query, so the Apache-hosted 4.0 documentation above was used directly. No scanner was installed or benchmarked.
