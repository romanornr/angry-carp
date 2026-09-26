# Model-independent email analysis

Research and proposal, 2026-09-22. No coordinator, MIME dependency, classifier or acquisition service was implemented in this pass. The existing HTML extraction work remains uncommitted. This note proposes the next ownership change, informed by the [scanner precedents](email-analysis-precedents.md), existing library APIs, and independent Claude, Grok and OMP reviews.

## Implementation update, 2026-09-22

The operator approved the coherent analyzer increment, both exact parser pins, and the original-plus-reviewed-text disclosure contract. The implementation and current limits are documented in [email analysis](../email-analysis.md) and [ADR 0011](../adr/0011-analyze-email-before-assessment.md). The proposals below are historical, including the unused result.ts/formatter split and agent-local standalone command paths. [ADR 0012](../adr/0012-separate-cli-from-flue.md) moves the commands into cli/ and shared output/file-reading functions into lib/. The implemented modules keep their existing result types and do not add a rules engine.

Header policy is strict RFC 8601 syntax with per-header isolation, opaque property text, repeated values and explicit unsupported method versions. Vendor extensions remain unparsed with raw evidence retained. Claude compared 66 upstream Thunderbird-extension test headers and reported that all 19 rejected fields were also rejected by its default strict mode. Our synthetic tests cover production folding, SMTPUTF8/CFWS, repeated values, unsupported versions and resource limits. No upstream parser was copied wholesale.

## Recommendation

Make one library operation produce a complete structured analysis before optional AI interpretation. Its caller supplies email bytes, acquisition context, reference information and lookup policy. The operation parses, runs applicable checks, retains outcomes and derives reporting candidates. A deterministic renderer displays that record; an AI assessment is an additional artifact that cannot replace or erase it.

The recent Bifrost test motivates this separation, but does not prove a lookup-selection bug caused the omitted HTML discussion. Flue received all three HTML observations, completed 13 tool calls including IP RDAP, and omitted the HTML distinction from its final answer. It also omitted Resend as a reporting lead. Fixed check selection prevents discretionary omission of planned checks; direct rendering prevents a prose summary from hiding recorded findings. Neither alone proves assessment accuracy.

Call this **email analysis**. A parser supplies syntax and decoded parts; the analysis also includes network observations and derivations. Our glossary defines an **assessment** as a judgment. Keep that distinction even when a future deterministic classifier supplies the judgment.

## Existing components and missing work

| Area | Reuse | Work still required |
| --- | --- | --- |
| Message input | Existing HTML extractor and private-output conventions | Select and review a MIME parser; preserve ordered/repeated headers, body provenance and parse limitations. |
| Authentication | Existing DNS transport; standards research | Parse reported results and signatures separately from verification. Trusted receipt context and a reviewed verifier are additional capabilities. |
| URLs and images | `extractEmailLinks` | Feed decoded parts directly, retaining occurrence roles and part identity. Plain-text URL extraction needs an explicit parsing policy. |
| Brand references | Directory Maps and `compareDomains` | Choose bounded candidates and reference provenance. A directory miss or sender-chosen image host cannot establish legitimacy. |
| Registration and DNS | `lookupRdap`, `lookupDns`, `lookupIpRdap` | Deterministic target eligibility, priority, budgets and dependency order. |
| Reporting | `findReportingChannels`, case RDAP contacts | Derive provider-role candidates from evidence using reviewed mappings; the existing channel API does not do attribution. |
| Passage reuse | `findSharedPassages` | Requires another supplied message; otherwise record the missing prerequisite. No corpus search is installed. |

These modules already work without Flue. The missing work is more than putting their calls in a loop: reference selection, provider-role inference, disclosure policy and complete execution accounting are currently partly decisions made by the model.

## Result and lifecycle

Proposed result sections, not an implemented schema:

| Section | Contract |
| --- | --- |
| Source | Input digest, byte length, acquisition description and, when retained, a reference to the separately stored original. A hash proves byte consistency, not authenticity. |
| Message | Parsed sender/address fields, raw and interpreted dates, ordered headers, decoded parts and parsing limits. This record is private. |
| Authentication | Reported receiver claims and their provenance. Fresh verification is explicitly not performed in this increment. |
| Attachments | Filenames, declared content types and decoded sizes, with explicit unavailable values when decoding fails or exceeds limits. Attachment hashes and malware scanning are outside the selected increment. |
| Resources | Full observed hosts, IPs and private references, with roles and source occurrences. Preserve individual occurrences even when lookups are deduplicated. |
| Checks | Every planned check with its typed result, or an explicit failure/skipped/missing-input outcome. Reuse existing result types rather than flattening them into booleans. |
| Findings | Stable finding IDs, supporting check/occurrence references, and applicable rule versions. Observations and inferred relationships remain distinguishable. |
| Reporting candidates | Provider, role, resource, supporting evidence, attribution limitation, available channels and outstanding conditions. A candidate is not permission to send. |
| Coverage | Input/traversal limits, query budgets, excluded resources, missing references, timestamps, code/policy versions and dataset identities. |

Use one async `analyzeEmail` coordinator with ordinary direct calls. A `Map` retains resource identity and occurrences; query-keyed Maps deduplicate DNS by name/type, domain RDAP by registration target, IP RDAP by address, and comparisons by explicit pair. Full hosts stay in the evidence even when a registered domain is used for RDAP. Apply suffix rules deliberately; private hosting suffixes and registry registration targets are not interchangeable.

The operator accepted continuing independent checks after a lookup failure. Dependent checks record the missing prerequisite, while completed results remain available. When official references are not supplied, bounded directory candidates and supported comparisons retain their source and ambiguity. Neither an absent directory match nor an association establishes legitimacy.

Oversized or unparseable input returns an explicit input failure. Recoverable part failures preserve usable results with missing coverage identified. Forwarded-message and quoted-reply evidence remain separate where identifiable, with uncertainty recorded where not. A caller can choose a separate LLM assessment using the portable instructions after an incomplete analysis; the failed analysis never becomes a successful check because a model supplied prose. The original remains available to the trusted caller under the existing disclosure policy.

Derive the initial plan after parsing. Independent permitted lookups run with bounded concurrency; IP registration follows relevant address results, and reporting candidates follow the supporting observations. Budgets are allocated in a stable priority order before dispatch, not won by whichever request finishes first. Prioritize action and sender resources; record lower-priority exclusions rather than querying every image/tracking hostname without limit.

Keep state and deduplication local to one analysis. Repeated fresh runs can observe changed DNS/RDAP; replay requires retained observations, policy and reference versions. Existing lookup calls have their own timeouts. A total deadline/cancellation policy needs an explicit integration change rather than claiming an unused `AbortSignal` already provides it. No generic plugin system, DAG scheduler, event bus, HTTP service or database is necessary for this first consumer.

## What can run without AI

Parsing, host-role comparisons, name comparisons, directory queries, permitted DNS/RDAP, registration-age calculations, reviewed provider-lead rules, channel selection and rendering need no LLM. Running the standalone analysis therefore needs no model login or inference. The operator subsequently selected automatic DNS/RDAP for eligible targets, without an `--online` flag. Query limits and failures remain visible. An offline operator mode is not required by this decision.

Rule-based classification is possible, and established scanners use scores and actions. That does not supply validated weights for our corpus. Keep scoring or a High/Medium/Low classifier a separately tested policy decision. Do not map “no rule matched” to “safe.” Arbitrary product claims and an official FAQ contradiction still need structured trusted reference facts, an analyst, or optional language-model interpretation. A schema-constrained model can return typed claims, but types cannot prove their truth.

The library accepts message bytes without requiring a file. The local CLI reads an `.eml`; a future Gmail adapter can decode the [RAW message response](https://developers.google.com/workspace/gmail/api/reference/rest/v1/users.messages) directly into memory. Retention remains a caller responsibility under the existing ordinary-mail and case policies. Retained originals stay in private host-controlled storage, with a digest/reference in the result. Do not put raw email bytes in the default JSON sent to a model or returned by a future public service. Provide a separate field-selected disclosure projection; structured data is not automatically redacted, and hostnames may carry identifiers. Connector acquisition must hand bytes to trusted runtime code before model exposure. Filtering a tool result afterwards is too late.

The operator accepted a terminal display of findings, reporting candidates and failed/skipped checks, without full email or raw-header output. The result object is returned in memory; JSON file export is optional and must be requested. This is separate from Flue's existing conversation persistence and original-message retention. The [decision discussion](../planning/issues/13-define-model-independent-email-analysis.md) records the agreement.

## Standards and reuse choices

[Rspamd](https://docs.rspamd.com/developers/protocol/) separates named findings from a recommended action in JSON. [SpamAssassin](https://spamassassin.apache.org/full/4.0.x/doc/Mail_SpamAssassin_PerMsgStatus.html) exposes check results separately from optional message rewriting. Borrow that separation; neither requires adopting its entire server or language stack. Their implementations also show why a list of triggered findings is not a record of all attempted checks. The [precedents note](email-analysis-precedents.md) documents dependencies, timeouts and per-message state.

[RFC 8601](https://www.rfc-editor.org/rfc/rfc8601.html) requires a trust relationship for Authentication-Results. An operator-configured `authserv-id` string alone does not establish it: a sender can forge the name. [RFC 7208](https://www.rfc-editor.org/rfc/rfc7208.html#section-4.1) defines SPF inputs including the connecting IP and SMTP identity. Reading an old `.eml` is not equivalent to witnessing that SMTP session. DKIM verification uses original signed content and keys; current verification is not a reconstruction of historical DNS.

The current DMARC specification is [RFC 9989](https://www.rfc-editor.org/info/rfc9989/), which obsoletes RFCs 7489 and 9091. Package support must be checked against the chosen semantics. Authentication passes do not certify harmless content or detect every lookalike/display-name attack.

Postal-mime and MailParser are candidates from the [earlier parser research](email-link-extraction.md); no MIME artifact was approved or installed. [Mailauth](https://github.com/postalsys/mailauth) offers Node authentication APIs and a custom DNS resolver, but broad defaults, transport behavior, protocol support and dependencies need review before use. Do not hand-roll authentication/header ABNF based on an unverified line-count estimate. STIX or OCSF can inform a future export without replacing the smaller internal schema.

Context7 and the [Postal-mime documentation](https://github.com/postalsys/postal-mime) describe repeated ordered headers, first-header convenience fields, recursion limits and assembled body representations. Parser selection must verify whether the public API preserves individual text/HTML part identity. A joined or synthesized body cannot silently acquire source-part offsets or enclosure claims about a single original part. Bound total bytes and breadth separately from nesting. These API contracts need synthetic tests before a dependency decision; documentation is not an artifact audit.

OMP's bounded source review found that [mailauth 5.0.3 policy discovery](https://github.com/postalsys/mailauth/blob/8e1b299a673c265127ab8c07eb11e4b532f0e8c6/lib/dmarc/get-dmarc-record.js) checks the exact domain and then the PSL-derived organizational domain. That is not RFC 9989's DNS Tree Walk. This is a specific source-based gap, not a complete conformance audit. Verification is therefore a separate dependency/behavior decision, not a prerequisite for shipping parsed authentication claims. SPF macro expansion can also disclose more than bare public hosts; a controlled verifier resolver needs its own disclosure contract.

## Independent opinions and corrections

Claude, Grok and OMP independently support a typed analysis operation before optional synthesis, preserving incomplete checks and qualified provider roles. Claude and Grok initially overstated trust obtainable from an `authserv-id` match; both corrected this. Claude also misdescribed the live omission as failed domain selection and overstated how much was already implemented; the corrections are reflected above. Scores are not inherently invalid: the shared recommendation is to defer an uncalibrated phishing score, not ban future deterministic classification.

OMP prefers Postal-mime for bounded assembled-body ingestion, with MailParser reserved for a demonstrated streaming need. It identifies missing public per-part provenance, authentication-context requirements, the DMARC discovery gap, and existing lookup-summary limits. Parent inspection confirms domain RDAP currently slices some arrays without omitted counts; complete aggregate coverage will need those limits exposed. Do not describe the current normalized lookup summaries as lossless evidence. None of these reviews installs or approves a new package.

## Coherent migration to review before coding

### Proposed public contract

The input is message bytes plus separately supplied source context and optional comparison references. The caller supplies a loaded brand directory once for reuse; the analyzer neither loads a file nor receives OAuth credentials. A missing reference message records passage comparison as skipped rather than pretending to search a corpus.

The top-level result has two variants:

| Result kind | Contents |
| --- | --- |
| `input_failure` | A bounded reason such as input size or parse failure, source identity where available, and an explicit statement that analysis did not run. No fabricated message or empty successful check list. |
| `analyzed` | Parsed message observations, reported authentication claims, attachment metadata, resources, check outcomes, findings, reporting candidates and coverage. This means an analysis record exists, not that every check succeeded or the message is safe. |

Keep existing DNS, RDAP, directory, lookalike and passage result types intact inside their check records. A performed check carries its actual result, which may itself report a failure. A skipped check carries its target and reason. Do not add an outer `success` flag that contradicts an inner lookup failure. Part and occurrence references connect findings to source material; unavailable source boundaries are explicit.

The caller retains the original bytes, so neither variant needs to duplicate the original in its output. Flue consumes a separate disclosure projection. The terminal formatter consumes findings and coverage, not raw MIME or model prose. JSON serialization happens only at an output boundary.

### Proposed file responsibilities

These are proposed locations, not files created by this research:

| Location | Responsibility |
| --- | --- |
| `lib/src/email-analysis/analyze-email.ts` | Public operation, bounded query planning and coordination of existing checks. |
| `lib/src/email-analysis/parse-message.ts` | Reviewed MIME/header parser integration, part provenance, recoverable failures and attachment metadata. No custom MIME parser. |
| `lib/src/email-analysis/findings.ts` | Deterministic evidence relationships and qualified provider-role leads, calling the existing reporting catalogue. |
| `lib/src/email-analysis/result.ts` | Shared analysis schemas and derived types; reuse existing check result types. |
| `agent/src/analyze-cli.ts` | Local input, results display and explicitly requested private JSON export. No Flue or OAuth dependency. |
| `agent/src/format-analysis.ts` | Deterministic terminal display with safe handling of untrusted text. |
| Existing triage CLI and Flue entry point | Call the same analyzer and supply selected evidence to optional model assessment. Retire replaced orchestration in the same change. |

Parser API fidelity, exact header-parser reuse, reference selection and provider-role rules still need a concrete code preview. The [subsequent MIME review](mime-parser-contract.md) found that Postal-mime and MailParser do not expose the proposed per-part recovery contract. An authorized artifact review and eight isolated tests support Mailsplit's public part interface and caller-managed interpretation failures. It remains a candidate for project selection, with Node dependencies and unverified Workers execution. None of these parsers establishes authorship of quoted text or reports every malformed input.

Proposed home: `lib/src/email-analysis/`, exporting `analyzeEmail`; keep low-level domain modules where they are. Separate MIME interpretation or provider-attribution modules only where they own substantial domain logic. Put file loading, private output and model disclosure under `agent/` initially, with a standalone `analyze` command that does not import Flue/authentication.

Once the input contract and parser are approved, implement one usable wave: message bytes enter bounded analysis, which returns a structured result for display, optional export and optional Flue assessment over a selected projection. Migrate triage callers and tests together, retiring the separate prepared-text/HTML pairing path once its replacement covers the caller's needs. Remove routine model-directed lookup selection from that migrated initial assessment; retain follow-up tools only for demonstrated separate uses. Preserve reusable library functions, not obsolete integration paths. The portable `phishing-triage.md` remains independent of these APIs.

Acceptance is behavioral: a non-AI command records the HTML distinction and every supported reporting candidate even if an optional model mentions neither; every selected check settles visibly; network requests stay within the eligible target plan and budgets; partial input and missing references cannot become a clean result; the model projection excludes private fields. Record call counts, latency and disclosed size before claiming savings. No empirical cost or accuracy improvement is established by this proposal.

## Implementation preview, 2026-09-22

This is a proposed interface, not implemented code. Mailsplit's artifact review and behavioral tests are complete. Header-parser selection remains open as described below. Do not treat this preview as approval to add another dependency.

The two callers use the same operation. The existing brand-directory loader stays outside that operation:

```ts
// Proposed library export: @angry-carp/checks/email-analysis
// Implementation: lib/src/email-analysis/analyze-email.ts
const result = await analyzeEmail(messageBytes, {
  directory,
  referenceDomains: [],
});

// Proposed agent/src/analyze-cli.ts: no model call or mandatory file write.
process.stdout.write(formatAnalysis(result));
```

`messageBytes` is a `Uint8Array`. `directory` is the existing `BrandDirectory` type. Each supplied reference domain carries its source and review status; the analyzer never labels a reference verified by default. An empty array permits bounded directory candidate retrieval and comparisons between observed image/action hosts. Neither establishes an official domain.

Keep the result branches visible at the call site. The following is the public shape sketch; the named record types need their detailed schemas during implementation review:

```ts
type EmailAnalysis =
  | {
      kind: 'input_failure';
      reason: 'input_limit' | 'malformed_message';
      source: SourceIdentity;
    }
  | {
      kind: 'analyzed';
      source: SourceIdentity;
      message: ParsedMessage;
      checks: AnalysisChecks;
      findings: Finding[];
      reportingCandidates: ReportingCandidate[];
      coverage: Coverage;
    };
```

`ParsedMessage` owns ordered header observations, authentication claims, parts, attachment metadata and resource occurrences. Those private observations must not be copied wholesale into a model prompt. `AnalysisChecks` has named collections for the existing capabilities, using their actual return types. Each collection records performed and skipped work, including missing comparison input. Avoid a generic check registry or a second set of DNS/RDAP response schemas.

The coordinator parses, enumerates targets, runs the bounded plan, then derives findings and reporting candidates. Those stages are ordinary function calls. Parsing failure returns before network work. Lookup failure stays in the analysis while independent lookups continue. The formatter reads the recorded findings directly, so a later model summary cannot suppress them.

### Selection rules to implement

- Preserve each resource occurrence and its part/quote context. Deduplicate requests, not observations. Distinguish quoted or attached-message resources without claiming that quote markers prove authorship.
- Prioritize action destinations, sender-related identities, then image resources. Query exact public DNS names; exclude recipient addresses and names derived only from recipient headers. Record rejected, unsupported and budget-excluded targets. Public-looking hostnames can still contain private identifiers.
- Deduplicate DNS by name and record type. Use the ICANN registration boundary for domain RDAP, retaining the original host and the separate private-suffix interpretation used by domain comparisons. Do not send an IP literal to domain RDAP.
- Allocate limits before starting requests. Keep query selection stable when response timing changes. Numeric byte, part, query and deadline limits remain a review item; existing per-request timeouts do not provide an analysis-wide deadline.
- Compare an image with its enclosing action link first. Other image/action comparisons retain their weaker same-part association. Reuse the extractor's recovered-tree semantics and record limitations instead of claiming every image is a brand logo.
- Query the directory with eligible exact hosts and bounded name candidates taken from explicit message fields or caller references. Preserve each candidate's source field. Do not claim arbitrary brand recognition or silently invent acronym expansion.
- Derive reporting leads only from named, reviewed rules. Preserve the distinction between reported header claims, DNS observations and registration results. A Resend setup pattern produces an investigation lead, not confirmed handling; Cloudflare nameservers identify configured DNS service, not origin hosting. Generic registrar abuse contacts can come directly from case RDAP without inventing a provider ID or address.

Provider evidence rules belong with reporting logic and source references, rather than in the portable prompt. Reuse the existing channel catalogue for published routes. Rule IDs and supporting observation IDs belong in each candidate so a user can inspect why it was selected.

### Header reuse finding

The reviewed Mailsplit `Headers.getList()` retains ordered, repeated fields, including empty values. `getDecoded()` unfolds values but omits empty ones; `getFirst()` discards other instances. Keep the ordered observations. Its `getHeaders()` output is generated header material, not a substitute for the original message bytes. See the [public interface](https://github.com/zone-eu/mailsplit) and the pinned artifact in the [MIME review](mime-parser-contract.md).

Mailsplit and its reviewed dependencies do not supply a public address parser. [email-addresses](https://github.com/jackbearheart/email-addresses) is a focused candidate with public address-field parsing APIs, but its artifacts have not been reviewed or approved here. Do not replace address grammar with splitting on commas or `@`.

`libmime.parseHeaderValue` parses MIME parameters, not DKIM tag lists or Authentication-Results. It overwrites duplicate parameters. [RFC 6376 section 3.2](https://www.rfc-editor.org/rfc/rfc6376#section-3.2) makes duplicate DKIM tags invalid. A DKIM observation reader must preserve them and report invalid syntax without performing verification.

The inspected [mailauth internal parser](https://github.com/postalsys/mailauth/blob/master/lib/parse-dkim-headers.js) is not a public root export and does not preserve the required repeated claims and nested-comment behavior. Do not add the authentication package merely to reach that private helper. A suitable public Authentication-Results parser remains unverified. Any local reader proposed instead must handle nested comments, quoted pairs, quoted semicolons, repeated methods/properties, `none`, and malformed input against [RFC 8601](https://www.rfc-editor.org/rfc/rfc8601). Received fields remain ordered observations unless a reviewed parser supports a more specific interpretation.

### Caller migration and disclosure

The standalone command owns byte acquisition, terminal escaping and optional exclusive private export. The library owns neither paths nor credentials. The Flue caller uses the same result, prints the deterministic display, and supplies a separately selected model projection for optional assessment. Full headers, raw URLs and attachment contents remain outside that projection.

Body disclosure needs an explicit contract before replacing the current reviewed-text input. Deriving text from an original `.eml` does not remove secrets, and stripping address headers does not anonymize it. Do not silently migrate an approved prepared-text workflow into automatic raw-body submission. Retire the old input path and routine model tool selection together when the replacement covers both analysis and disclosure requirements.

The next review must settle header reuse, concrete resource limits and that body-disclosure contract. These are remaining implementation requirements, not reasons to reopen the agreed deliverable or build a separate service.

## Authentication draft and reuse review

The subsequent implementation attempt added `lib/src/email-analysis/authentication.ts` (now `lib/src/email-analysis/authentication-headers.ts`). It is a draft with no package export or runtime caller. Do not treat its existence as a completed analyzer or a conformant authentication parser. The operator challenged its size and requested independent review before further integration.

The draft was written against RFC 8601 and RFC 6376, not copied from Thunderbird. Code comments link to the governing grammar. The following implementations were inspected as alternatives and design references:

| Reference | Useful precedent and limit found in source inspection |
| --- | --- |
| [Thunderbird DKIM Verifier Authentication-Results parser](https://github.com/lieser/dkim_verifier/blob/1badb6c8d639bd5973f870fa7bfc6f96facba9ca/modules/arhParser.mjs.js) and [RFC helpers](https://github.com/lieser/dkim_verifier/blob/1badb6c8d639bd5973f870fa7bfc6f96facba9ca/modules/rfcParser.mjs.js) | JavaScript quoted-value grammar and ordered method results. Property objects overwrite duplicates; adapting it requires reviewing its helper imports and behavior. It is not a drop-in dependency with our result contract. |
| [Mox Authentication-Results parser](https://github.com/mjl-/mox/blob/main/message/authresults.go) | Cursor-based consumption and ordered method/property records. It is Go code, not an existing TypeScript dependency. Inspection is not a conformance test. |
| [Mailauth header parser](https://github.com/postalsys/mailauth/blob/8e1b299a673c265127ab8c07eb11e4b532f0e8c6/lib/parse-dkim-headers.js) | Existing JavaScript implementation, but a private module with duplicate-collapsing behavior and an explicit nested-comment limitation. |

On 2026-09-22 the operator requested whole-repository inspection. Shallow clones are at `/tmp/angry-carp-upstream-review/dkim-verifier` and `/tmp/angry-carp-upstream-review/mailauth`. Their revisions are respectively `1badb6c8d639bd5973f870fa7bfc6f96facba9ca` and `8e1b299a673c265127ab8c07eb11e4b532f0e8c6`; the links above are pinned accordingly. Mox remains a moving source link from the earlier inspection. No upstream packages, scripts or tests were installed or executed. The Thunderbird repository is an extension, not Thunderbird core.

The wider source inspection adds these facts:

- Thunderbird's [caller](https://github.com/lieser/dkim_verifier/blob/1badb6c8d639bd5973f870fa7bfc6f96facba9ca/modules/arhVerifier.mjs.js#L36) catches parsing failure per header, then applies a separate account trust policy. Its newest-authserv fallback is not an appropriate trust policy for arbitrary uploaded `.eml` input. Reuse the separation, not that trust inference.
- Its [parser tests](https://github.com/lieser/dkim_verifier/blob/1badb6c8d639bd5973f870fa7bfc6f96facba9ca/test/unittest/arhParserSpec.mjs.js) distinguish strict and relaxed handling, including Outlook `action=`, a missing authserv-id, quoted Unicode identifiers, and mismatched comment delimiters. This supplies concrete interoperability cases rather than an unsupported assertion about how often malformed mail occurs. Tests were read, not run.
- Mailauth's [parser tests](https://github.com/postalsys/mailauth/blob/8e1b299a673c265127ab8c07eb11e4b532f0e8c6/test/dkim/parse-dkim-headers-test.js) exercise crafted property keys, prototype pollution and overwriting the method result/authserv-id. Ordered property records avoid interpreting attacker-controlled names as object paths. That is a reason for the data structure, not a claim that every array-based parser is safe.
- Mailauth's [public entry](https://github.com/postalsys/mailauth/blob/8e1b299a673c265127ab8c07eb11e4b532f0e8c6/lib/mailauth.js) exports authentication operations, not the standalone header parser. Its [DKIM caller](https://github.com/postalsys/mailauth/blob/8e1b299a673c265127ab8c07eb11e4b532f0e8c6/lib/dkim/dkim-verifier.js#L45) uses the parser within a verification lifecycle. Importing that whole lifecycle to read existing claims would add unrelated behavior and dependencies.

If source or tests are adapted, retain the applicable license and attribution and record our changes. Merely sharing a cursor algorithm does not mean the implementation was copied. A source comment should explain the rule it supports rather than imply that an upstream project validated our code.

A shorter segmenter remains a proposal, not a demonstrated replacement. Count method/property extraction, limits and ambiguous malformed tails as part of its implementation. A semicolon splitter alone does not deliver the selected structured claims. Unsupported versions may legitimately stop interpretation under [RFC 8601 section 2.6](https://www.rfc-editor.org/rfc/rfc8601#section-2.6). Untrusted evidence still needs accurate parsing before it selects DNS requests or reporting leads.

A local synthetic probe confirmed that the draft preserves repeated methods/properties, nested comments and quoted semicolons. It also accepts `header.i=a@@example.com` as an opaque property value. That leaves a contract decision between extraction and syntax validation; it does not justify claiming full RFC conformance. No live email, DNS, model or candidate-site request was used for this probe.

Claude, Grok and OMP were asked to challenge reuse, scope, scheduling, lifecycle and types against the existing research. Grok's initial advice to retain only raw Authentication-Results fields would omit the agreed structured SPF/DKIM/DMARC claims. Its operator-reference-only comparison proposal would also narrow the agreed directory-candidate comparisons. Grok amended both after review: the structured claims and source-labelled directory comparisons remain required.

Claude withdrew its proposed 25-line replacement after acknowledging that the estimate excluded claim shaping and recovery. It also withdrew the claim that untrusted evidence does not need strict parsing, its objection to stopping at unsupported header versions, and its objection to Unicode identifiers that the draft already handles when quoted. Neither review establishes that no suitable public package exists; the bounded searches did not find one satisfying this contract.

The remaining proposed changes are specific: distinguish opaque property text from validated identities, make unsupported method versions explicit before downstream use, and test interoperability and rejection behavior. Repeated header collection should not duplicate fields already owned by the MIME result. Per-header failure isolation already matches Thunderbird's caller; per-segment recovery needs separate justification and must never interpret a delimiter hidden in an unterminated quote/comment as a safe restart. No replacement or integration was implemented as part of this source review.

The separate [email-addresses artifact review](email-address-parser-review.md) covers published version 5.0.0. It is a candidate for address fields, not a replacement for Authentication-Results parsing. It has not been installed or executed in this project.
