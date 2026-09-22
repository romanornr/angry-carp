---
status: accepted
---

# Analyze email before optional model assessment

`analyzeEmail` in the shared library owns MIME/header interpretation, bounded target selection, existing checks, findings and qualified reporting candidates. The standalone command and trusted Flue CLI call it directly. They need no HTTP service between packages. The user approved exact parser pins `@zone-eu/mailsplit@5.4.17` and `email-addresses@5.0.0` after artifact review and isolated tests.

The previous model-directed path completed lookups but could omit supplied HTML observations and a reporting lead from its final answer. Keeping model tool selection and adding stronger prose would leave those decisions discretionary. The chosen design records and displays deterministic findings separately, while preserving optional model interpretation. It does not claim that deterministic findings alone replace a calibrated phishing classifier.

Use Mailsplit's public Splitter, ordered headers and per-node decoder interfaces. Collect bounded parts, then settle one decoding pipeline at a time. This preserves MIME alternatives, embedded-message boundaries and failed leaves. An assembled-body parser would lose that recovery contract. Fresh authentication verification remains separate from parsing supplied claims. [Research](../research/model-independent-email-analysis.md) records Thunderbird-extension and mailauth source inspection; neither private parser is imported or copied wholesale.

Keep each lookup's existing typed result. Explicit skipped and failed outcomes prevent missing work from becoming reassuring absence. A single coordinator builds a deduplicated plan before requests; no plugin engine, weighted score, case database or background scheduler is added. Abort signals reach the existing request owners. Bounds include RDAP bootstrap requests, parsing and output coverage.

The original stays in the trusted runtime. Flue receives an explicit disclosure projection plus a separately supplied, reviewed text file, as selected by the operator. JSON export is optional and private. The reviewed-text association remains an operator assertion. Package ownership and Git ignore rules are not credential isolation.

This supersedes the initial-assessment Flue-tool orchestration in ADR 0009 and the triage `--html` pairing in ADR 0010. Routine bindings are removed in the same change. Reusable library functions and the separate HTML extraction command remain. Winnowing remains a follow-up tool because it requires a second explicitly supplied body. Portable `phishing-triage.md` remains host-independent.

The trade-off is maintaining bounded selection and provider-lead rules in code. Their output keeps provenance and limits. Directory candidates do not become operator verification; Cloudflare DNS does not become hosting; Resend's documented shared setup supports an investigation lead, not custody proof. The strict RFC 8601 reader can leave vendor-specific fields unparsed, visibly. Changes to these policies need behavioral tests, not another prompt paragraph.

The Node MIME adapter is not verified for Workers. Moving hosts later requires validating that adapter and replacing local acquisition/storage, while preserving the result and disclosure contracts. [Usage and limits](../email-analysis.md) are the current interface reference.
