# Analyze an original email

The analyzer reads complete message bytes, runs bounded checks, and returns structured observations, findings, reporting candidates and coverage. It does not need Flue, a login or a model. DNS and RDAP run automatically. Candidate websites and email resources are never fetched.

## Run without a model

From the repository root, with Node.js 24 and the workspaces installed. Relative paths in the standalone commands start at the repository root:

```sh
npm --silent run analyze -- evidence/emails/example.eml
```

The terminal shows findings, possible reporting recipients and incomplete checks. It does not print the email body, raw headers or attachment contents. It creates no output file by default.

To retain the complete **private** result:

```sh
npm --silent run analyze -- evidence/emails/example.eml --json evidence/emails/example.analysis.json
```

The output includes decoded bodies, original header values, full extracted references and attachment metadata. The CLI creates it with mode `0600` and refuses an existing output path. Keep private output under the ignored `evidence/` directory. File permissions do not restrict other processes running as the same user. Original bytes remain in your input file and are not duplicated in JSON.

## Route an AI assessment

After [signing in](../agent/README.md#sign-in-and-disconnect), supply a separate reviewed text file:

```sh
npm --silent --prefix agent run triage -- ../evidence/emails/example.eml --reviewed-text ../evidence/emails/example.prepared.txt
```

Review the text for addresses, secrets, tracking parameters and unrelated personal information before running this command. The Flue command resolves relative paths from `agent/`. It sends that text unchanged, plus selected analysis fields. The text-to-original association is your assertion; it is not independently verified. Original MIME bytes, raw headers, unreviewed bodies, attachment contents, filenames and extracted URL paths do not enter the automatic projection.

The projection includes findings, bounded host observations, comparisons, directory matches, domain-registration chronology and check outcomes. Reporting candidates, channel references, IP network records and raw DNS answers are excluded. The complete result keeps them; the deterministic display presents provider roles, contact conditions, sources and network registrations. Failed IP lookups still appear in assessment coverage. Hostnames can themselves contain identifiers, so reduced disclosure is not anonymization. At most 64 valid host observations retain one representative per role, then fill by analyzer priority. Coverage is capped at 64 entries with omitted counts. Skipped lookup plans become reason/count summaries; completed lookup details retain their own small execution budgets. Flue stores the submitted projection and reviewed text in its conversation database.

The public `analysisForModel` export selects evidence for deception assessment, not report preparation. Reuse does not establish that the selected fields are appropriate for every recipient. The private host array retains occurrence order; only selection uses priority order. Source IDs and MIME ownership remain attached. `hostsOmitted.invalid` and `hostsOmitted.budget` distinguish validation exclusions from the disclosure cap. Routing gaps are capped at 32 with an omitted count. Reviewed text and source notes are not rewritten and may still contain provider information. [ADR 0014](adr/0014-keep-provider-routing-outside-ai-assessment.md) records this task boundary.

The result's `routing` controls inference. `no_concerns_detected` returns without opening authentication, creating a conversation or calling AI. `assessment_required` names detected concerns or incomplete checks and retains remaining gaps. Flue automatically calls the model for that branch when reviewed text is supplied. Without reviewed text, it prints the deterministic result and exits with code 2 requesting the approved input; it never substitutes the original. An unanalyzable original can also fall back to reviewed text, with the input failure retained and exit code 1 preserved. The failure projection includes only its kind and sanitized reason. Cancellation and invalid source notes stop the command instead.

Authentication passes, ordinary registrar contacts, and intentionally inapplicable work do not trigger AI. Domain resemblance, image/action registration differences and authentication failure claims do, as concerns for interpretation rather than phishing verdicts. Supplied disputed or uncertain source claims also require assessment. Unparsed identities, omitted content, exhausted important lookups and unrecognized coverage gaps remain material. Passive-image lookup failures are supplementary; missing content that could conceal actions is not. Quoted and embedded hosts excluded from current-message lookups are material gaps and require assessment, including forwarded phishing samples. Known quote heuristics and missing optional comparison references remain disclosed limits. This policy has not been calibrated against a representative corpus and can miss phishing, especially deceptive prose without a recognized indicator.

The terminal prints deterministic findings before optional JSON export or AI assessment, so failures in either step do not hide the analysis. Both commands accept an optional `--json <unused-output-path>`. An omitted point in model prose no longer removes the recorded finding. The model's remaining follow-up tool compares two explicitly supplied texts with Winnowing. Routine DNS, RDAP, directory, domain comparisons and channel selection now run in the analyzer; their former Flue bindings are removed. The standalone HTML extractor remains available for inspecting a supplied HTML fragment. The old triage `--html` option is retired.

## Call the library

```ts
import { analyzeEmail } from '@angry-carp/checks/email-analysis';
import { loadBrandDirectory } from '@angry-carp/checks/brands/local';

const directory = await loadBrandDirectory();
const result = await analyzeEmail(messageBytes, {
	directory,
	referenceDomains: [],
	sourceNotes: [],
	signal: abortController.signal,
});
```

Load the directory once in the trusted caller and reuse it. Input is a `Uint8Array`, not a path. A future Gmail connector can supply decoded `messages.get(format=RAW)` bytes without first saving an `.eml`. Connector acquisition and batch scheduling are not implemented.

`input_failure` means the input could not be analyzed. `analyzed` means a result exists, including partial and failed checks. Neither means safe or malicious. The source records its byte length and SHA-256; oversized input has no computed digest. Acquisition provenance remains caller-supplied and unverified.

The result retains MIME part IDs, separate embedded-message IDs, repeated headers, reported authentication, attachment metadata, host occurrences, HTML extraction, lookup outcomes, directory candidates, comparisons, findings, reporting candidates and coverage. Findings point to observation/check IDs. `referenceDomains` are operator-supplied references, not automatically verified domains. Directory candidates and image hosts carry different provenance. No weighted score, malware scanner, external threat feed or official-site fetch is installed. Text reuse records a missing comparison message rather than inventing a corpus search.

## Selection and limits

Selection is deterministic for the supplied bytes, directory and lookup responses. Live DNS/RDAP data and retrieval times can change between runs.

| Work | Limit and behavior |
| --- | --- |
| Original message | 10 MiB; oversized input fails rather than truncates |
| MIME | 128 nodes including roots; 64 KiB per header block; 512 KiB combined headers; embedded depth two |
| Decoding | 10 MiB combined decoded work, including nested decoding; 512 KiB per text part |
| HTML | Existing 512 KiB input, 200 occurrences and 20,000 visited-node limits per part |
| Host observations | 512; further occurrences produce a coverage gap |
| Directory | 24 distinct name/hostname queries; each lookup retains its own totals and truncation flags |
| Comparisons | 32 distinct observed/reference/source combinations; at most 16 explicit references |
| Findings | 32 image/action registration-domain pairs; 128 displayed findings overall; limits are recorded |
| DNS | 12 name/type pairs per batch, fixed Cloudflare DoH resolver |
| Domain RDAP | Three ICANN registration queries per batch; exact observed hosts remain separate |
| IP RDAP | Three eligible address queries per batch, selected after DNS settles |
| Recovery | One additional batch per family for important transient failures or budget-skipped work; successes reused |
| Requests | At most 48 HTTP requests including recovery, counting RDAP bootstrap and registry requests separately; concurrency three |
| Time | 45-second shared cancellation signal; each lookup also retains its 15-second timeout |

These are operational limits, not measured optimum values or a process-memory ceiling. Synchronous parsing is bounded by input size, not interrupted by a timer. Decoders can emit a chunk before detecting the accepted-output limit. Each owned stream pipeline is awaited and settled.

Host priority is action, reported MAIL FROM, return-path, From, Sender, Reply-To, other authentication identities, signature domains, unknown-purpose text references and images. Plaintext URL purpose is not inferred from file extensions or another MIME alternative. DNS selection first reserves up to four queries for MAIL FROM/return-path MX/TXT prerequisites, then fills the remaining budget by that priority. Domain RDAP reserves one From-domain registration before filling by priority. Action/text-reference/image hosts receive A, AAAA and registration-domain NS queries. Mail identities receive MX and TXT queries. Names and exact hosts select directory candidates. Quoted HTML and `>`-marked text, and embedded messages, retain their observations but do not drive current-message network queries. HTML quotation detection recognizes blockquote elements and div elements with a `gmail_quote` class token. Other HTML/prose forwarding boundaries remain uncertain and appear in coverage. HTML quote markers and recovered-tree enclosure are not proof of authorship or rendering.

Only validated names with an ICANN suffix enter automatic DNS/domain RDAP. Literal and returned addresses use a conservative public-address eligibility policy. Querying public DNS can disclose names to the resolver and, on cache misses, authoritative servers. No original message, mailbox address or URL path is sent in these requests. A hostname can still contain a private identifier.

Failures remain in each lookup result. Budgets and cancellation produce explicit skipped checks. A DNS `NXDOMAIN`, empty answer, truncated response, transport failure and unattempted check are distinct. RDAP arrays are bounded without silently shortening returned values. An omitted or failed check does not become a negative finding.

Recovery reuses complete successful checks and preserves both results of each retry in `retries`. A failed retry, non-NOERROR response or response with fewer answers retains the earlier partial DNS observations as the check result. Both attempts remain recorded with their times; this is not a claim that the retained answer is the latest. Conflicting or partial coverage still requires assessment. It retries transient transport failures, timeouts, server errors, DNS SERVFAIL/truncation and important work skipped by the first budget. It does not immediately retry HTTP 429, refused redirects or deterministic parsing/size failures. The shared deadline is not reset. Those unresolved material failures require AI assessment; deterministic parsing is not repeated against identical bytes. Bulk-mail caching and rate limits across analyses are not implemented.

## RDAP discovery and failures

One analyzer run owns an in-memory discovery loader for domain, IPv4 and IPv6 registries. Concurrent lookups can share a request; completed responses can be reused while fresh. Domain and network registration records are still queried separately. Nothing is cached on disk or shared between analysis runs.

This implements the reuse direction in [RFC 9224 section 8](https://www.rfc-editor.org/rfc/rfc9224.html#section-8) using a conservative subset of [RFC 9111 freshness and age calculations](https://www.rfc-editor.org/rfc/rfc9111.html#section-4.2). Only validated HTTP 200 responses are reusable. `max-age` takes precedence over `Expires`; `Date`, `Age` and request duration reduce remaining freshness. A missing or invalid date, missing explicit freshness, duplicate directives, `no-store`, `no-cache`, `Pragma`, or an unsupported directive disables reuse. `Vary` permits only `Accept` and `Accept-Encoding`, which remain fixed for this loader's requests; other names and `*` disable reuse. The lookup still proceeds. There is no heuristic freshness, conditional revalidation or stale fallback. This is not a general HTTP cache or a claim of complete RDAP conformance.

The run signal owns each shared discovery fetch, with a 15-second request timeout. A lookup retains its own 15-second timeout across discovery and registry work. Cancelling a waiting lookup does not cancel another lookup's discovery request. Cancelling the run cancels the shared transport. Failed or invalid discovery is not retained for a future attempt. Freshness expiry and failed loads can cause more than one request per discovery family; the existing 48-request ceiling remains an upper bound.

Full results retain `discovery.sourceUrl` and its original `retrievedAt`, separately from the registry response's retrieval time. A failed lookup already carries the endpoint where it failed; terminal coverage now prints it. Recognized `ENOTFOUND` and `EAI_AGAIN` codes become `name_resolution`; other non-abort transport failures remain `request_failed`. No raw exception, response body or credential is displayed. The model receives the failure category, not these additional diagnostic URLs or discovery metadata. JSON export remains optional.

Discovery reuse reduces requests. It cannot fix an unavailable registry, a failed first discovery request or every local resolver problem. [Issue 21](planning/issues/21-handle-rdap-discovery-unavailability.md) records the observed failures and the verification limits.

## Supply reviewed source notes

Both commands accept `--source-notes <reviewed-notes.json>`. Library callers pass the same array through `sourceNotes`. The schema is exported as `sourceNotesSchema`; invalid notes fail explicitly before lookups. The CLI reads at most 128 KiB, and the schema accepts at most sixteen notes. Example:

```json
[
  {
    "url": "https://support.example.com/product-information",
    "retrievedAt": "2026-09-22T10:00:00Z",
    "displayedDate": null,
    "claim": "The supplier recorded this product statement from the page.",
    "providedBy": "operator",
    "sourceAuthority": "claimed_official",
    "relation": "supports_concern",
    "subjectHosts": ["download.example.com"],
    "messageDateApplicability": "unknown"
  }
]
```

`providedBy` accepts `operator` or `agent`; `sourceAuthority` accepts `claimed_official`, `other` or `unknown`. `relation` accepts `supports_concern`, `contradicts_concern`, `context` or `unknown`. Applicability accepts `applicable`, `not_applicable` or `unknown`. Subject hosts are exact hostnames, not suffix matches. These are the supplier's assertions, not verified authority, historical applicability or a verdict. Missing/ambiguous directory matches remain uninformative. Conflicting notes remain separate and trigger assessment rather than overwriting one another.

Notes remain separate from message-controlled observations and receive IDs, `acquisition: caller_supplied_note` and `verification: not_performed`. Their URLs never enter the lookup plan. Explicitly supplied notes are included in the model projection with their full source URLs and claim text, so review those fields for private information too. This is an exception for reviewed source evidence, not permission to disclose extracted email URLs. The analyzer fetches no source pages and performs no semantic product-claim comparison.

Registration dates already stored in RDAP now print with their domain, source URL and retrieval time. Repeated dates remain visible; no age, trusted receipt time or historical registration inference is invented. Authentication claim lines show validated domains and individual claim IDs without mailbox local parts. Terminal output escapes complete Unicode control/format code points.

## Authentication and MIME policy

Mailsplit supplies ordered header fields and independently decoded parts. Tolerant MIME parsing can accept malformed boundaries or transfer encodings without diagnostics. The result is not a MIME conformance verdict. A failed leaf retains an unavailable state without a fabricated decoded size. Flowed text is retained without reassembly. Attachments have filenames, declared media types and exact decoded sizes only when decoding completes; their contents are not retained as decoded binary arrays.

The Authentication-Results reader follows RFC 8601 syntax with per-header isolation. It deliberately rejects trailing semicolons, missing authserv-id and vendor extensions such as `action=none`; their raw header remains in the private record and unparsed coverage is visible. This can reduce coverage of Microsoft-generated headers. There is no relaxed-mode toggle. Unknown result keywords remain literal claims, repeated properties remain ordered, and property values stay opaque until identity validation. Unsupported header versions stop interpretation; unsupported method versions remain recorded but do not select targets.

The DKIM reader extracts tag syntax and duplicate names under RFC 6376. Duplicate-tag signatures do not seed identities. Parsing either header never verifies SPF, DKIM or DMARC. An authserv-id string cannot establish who inserted the header. Original Received, Date and Received-SPF fields remain supplied observations, not trusted receipt proof or fresh verification.

## Reporting derivations

- Registrar contacts remain in RDAP evidence. Candidate promotion requires a resource-specific concern: the action side of an image/action mismatch, the observed side of a resemblance comparison, or an exact subject host in a supplied supporting note. Envelope domains and From identities also need their own resource-specific concern; a suspicious action elsewhere in the message does not promote their registrars. Passive images alone do not qualify. Missing justification is recorded; an empty contact stays a channel gap.
- Cloudflare nameservers produce a DNS-role candidate only for a resource with a supported concern. Neither those records nor an IP registration establishes an origin host, Workers or Pages hosting.
- A supplied Received field naming SES produces a qualified email-delivery lead with unknown header provenance.
- A supplied DKIM result naming selector `resend`, together with both current SES MX and SPF configuration at a reported MAIL FROM host, produces a Resend investigation lead. Shared records and a sender-chosen selector do not prove platform custody. A reported failure does not suppress that qualified investigation lead. Missing prerequisites do not become confirmation.

These candidates identify where an investigation request could go. They do not establish abuse, satisfy disclosure conditions or authorize sending. Published channel conditions and source dates remain attached. No Bifrost-specific fact is embedded in general rules.

Candidates identify their affected domain and non-empty subject observation IDs, or this message for a delivery/platform lead. Shared registrars do not merge resource justifications. A supporting note can identify abuse on an image or legitimate domain; directory membership never suppresses it. A contradictory note does not silently erase supporting evidence. AI assessment resolves that conflict before report preparation.

Once the operator chooses report preparation, [provider reporting](../provider-abuse-reporting.md) requires targeted AI research every time to double-check material allegations and current recipients. That reporting runtime remains deferred. Routine analysis/assessment does no browsing, and candidate sites remain prohibited.

## Sources and design

The `gmail_quote` marker also appears in [Mailgun Talon's quotation handling](https://github.com/mailgun/talon/blob/master/talon/html_quotations.py), inspected on 2026-09-22. We record the marker and retain its contents instead of deleting text. Talon also handles cases where a wrapper contains the current body. Our marker is a heuristic, not an RFC rule or proof that the contents belong to an earlier sender; skipped marked content stays visible in coverage.

[ADR 0011](adr/0011-analyze-email-before-assessment.md) records the ownership change and alternatives. The implementation reuses the [MIME review](research/mime-parser-contract.md), [header-reader inspection](research/model-independent-email-analysis.md), [scanner precedents](research/email-analysis-precedents.md), [address-parser review](research/email-address-parser-review.md), [HTML extraction](email-links.md) and [reporting catalogue](reporting-catalogue.md).

Relevant standards are [RFC 5322](https://www.rfc-editor.org/rfc/rfc5322), [MIME RFC 2045](https://www.rfc-editor.org/rfc/rfc2045), [RFC 2046](https://www.rfc-editor.org/rfc/rfc2046), [Authentication-Results RFC 8601](https://www.rfc-editor.org/rfc/rfc8601), [DKIM tag syntax](https://www.rfc-editor.org/rfc/rfc6376#section-3.2), and [RDAP bootstrap RFC 9224](https://www.rfc-editor.org/rfc/rfc9224). They define individual syntax and lookup contracts, not this coordinator or a phishing score.

The MIME adapter uses Node streams and `email-addresses`. It is separate from Flue but is not verified on Workers and is not a credential sandbox. A Workers caller would need a verified MIME adapter/runtime and its own acquisition/storage boundary. Existing pure checks and network owners remain independently callable.

Standalone commands live in `cli/`; reusable output and disclosure functions live in `lib/src/email-analysis/analysis-output.ts`. Bounded file acquisition is the separate `@angry-carp/checks/node/read-input` export. [ADR 0012](adr/0012-separate-cli-from-flue.md) records this dependency boundary. The [follow-up issues](planning/map.md#analyzer-follow-up) record known role, recipient-selection and display gaps.
