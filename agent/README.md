# Local agent integration

The selected local runner is Flue, using Pi's OpenAI Codex provider with ChatGPT subscription authentication. Browser login and local logout work. `PhishingTriage` registers the authenticated provider and loads `phishing-triage.md`. Reporting channels are selected on demand through an offline tool. The first live assessment through Flue completed successfully. The terminal entry point accepts a prepared-text file and prints the assessment once.

## Sign in and disconnect

Use Node.js 24. Run `npm ci` from the repository root to install both workspaces and build the shared library. Run the following commands from the repository root.

To sign in:

```sh
npm --prefix agent run auth:login
```

The command prints the credential-file location and an OpenAI authorization link. Open the link in your browser and complete sign-in. Pi receives the callback at `http://localhost:1455/auth/callback` by default. The browser must be able to reach that local process. The CLI supports the automatic browser callback, with a five-minute waiting limit and Ctrl+C cancellation; it does not accept pasted authorization codes.

To disconnect locally:

```sh
npm --prefix agent run auth:logout
```

Logout removes the `openai-codex` entry from the local credential store. The file may remain. This does not revoke authorization on OpenAI's side or erase tokens already held by another running process.

## Credential storage and access

The operator selected `agent/auth.json` inside this repository. Both the sign-in/logout CLI and triage agent resolve it relative to their source files, so the terminal's working directory does not change that location. The existing `auth.json` Git ignore rule covers this file. Do not commit it or copy credentials from an existing Codex installation.

Pi owns the OAuth credential format, file locking, token refresh, and persistence. It writes the file with owner-only permissions, `0600`. The file is plaintext, not encrypted. Processes running as the same operating-system user, and privileged processes, can read it. Git ignore rules and file placement do not isolate it from those processes.

The trusted runtime may read, store, refresh, and use tokens. Tokens must stay out of model prompts, tool results, logs, and exposed errors. The assessment accepts prepared email text and gives the model no filesystem, shell, browser, or mailbox tools. The DNS and RDAP tools receive public names, use HTTPS requests without OAuth headers, and have no credential-reading operation. Runtime access to credentials does not grant that access to the model. Tools run in the trusted runtime process, not in a separate operating-system sandbox.

Flue's configured conversation database is `agent/data/flue.db`, separate from the credential store. It contains conversation data from completed assessments, but does not import original email files or maintain structured case records. Editing a prepared evidence file does not update past conversations.

Original emails and prepared evidence files live in `evidence/emails/` at the repository root. The whole `evidence/` folder is ignored by Git. Local evidence directories use owner-only permissions (`0700`), and the files use `0600`. These permissions allow other processes running as the same user to read them; the model's lack of filesystem tools is a separate boundary.

## Code responsibilities

| File | Responsibility |
| --- | --- |
| `src/auth.ts` | Keeps Pi's `ModelRuntime` private and exposes login, logout, and the authenticated provider. Replaces exposed authentication errors with fixed messages. |
| `src/auth-cli.ts` | Selects the credential path, handles the browser interaction and cancellation, and prints command results. |
| `src/triage-cli.ts` | Reads prepared text, runs Flue, prints the assessment, and releases Pi sessions after Flue disposal. |
| `src/agents/phishing-triage.ts` | Registers the authenticated provider, lookups, and local comparison tools, and loads triage instructions; reporting channels are available through a separate lookup tool. |
| `../lib/src/lookups/rdap.ts` | Discovers the RDAP endpoint through IANA and returns selected registration evidence. |
| `../lib/src/lookups/ip-rdap.ts` | Uses IANA's longest address-prefix match and returns the containing registered network. |
| `../lib/src/lookups/dns.ts` | Queries a fixed public resolver and returns DNS answers with their source and retrieval time. |
| `../lib/src/lookups/request-json.ts` | Bounds HTTP responses, blocks redirects, and returns safe transport errors. |
| `src/tools/lookups.ts` | Validates model inputs and exposes DNS, domain RDAP and IP RDAP as Flue tools. |
| `../lib/src/lookalikes/compare-domains.ts` | Compares supplied domain names locally using Unicode and public-suffix data. |
| `src/tools/lookalikes.ts` | Exposes the comparison as a Flue tool with its reference-provenance instructions. |
| `../lib/src/text-reuse/winnowing.ts` | Finds shared passages in two supplied bodies using local Winnowing. |
| `src/tools/text-reuse.ts` | Exposes passage comparison and its input-provenance instructions to Flue. |
| `../lib/src/brands/brand-directory.ts` | Validates the public snapshot and builds private name, word, and hostname Maps for local lookup. |
| `src/tools/brands.ts` | Exposes source-labelled directory candidates through `lookup_brand`. |
| `../lib/src/brands/check-directory.ts` | Checks an installed or staged snapshot without authentication or a model call. |
| `../lib/src/brands/load-directory.ts` | Loads the public snapshot during trusted Node setup, shared by the agent and maintenance command. |

The DNS and RDAP cores use Web APIs and Valibot. They have no Flue, authentication, or filesystem imports; `src/tools/lookups.ts` owns their Flue bindings. The reusable checks and reporting catalogue come from [the shared package](../lib/README.md). Flue calls its exports directly, with no intermediate HTTP service.

Both `@earendil-works/pi-ai` and `@earendil-works/pi-coding-agent` are pinned to `0.83.0`. This integration reuses Pi's provider and credential storage. It does not wrap the Codex CLI as a Flue model adapter. The provider's `apiKey` resolver accepts the resolved OAuth authentication; that name does not imply separate API billing.

The standalone triage command owns process shutdown. Flue's `await using` disposes its runtime first; the command then calls Pi's existing `cleanupSessionResources()` on success or failure. Pi 0.83.0 can retain a cached WebSocket with a five-minute timer that Flue does not release. The zero-argument cleanup clears all Pi sessions, so it belongs to this process-owning command, not to a shared provider's close method. It does not log out or delete credentials. A cleanup failure retains any printed assessment and reports a separate fixed error with exit status 1.

`allowModelNetwork: false` disables catalog downloads during runtime creation. It does not disable OAuth traffic or every later catalog refresh.

## What has been checked

On 2026-09-22, browser login completed successfully. File metadata confirmed `0600` permissions and Git ignore coverage without reading token contents. The operator then ran local logout successfully. No model request was made through this integration during those checks.

Type checking and nine offline CLI scenarios passed. The CLI scenarios simulated the authentication dependency and covered argument handling, callback completion, cancellation, timeout, and safe error output. Token refresh has not been exercised with a live request.

The dependency audit reported seven affected package entries, tracing to Undici, brace-expansion, and the existing Hono dependency. Inspection found no trigger for the reported vulnerabilities in the current authentication path; the affected versions remain installed. Importing Pi initializes a plain Undici global dispatcher in a fresh Node process. Dependency updates and future server exposure require their own assessment.

## Assess prepared email evidence

After signing in, run this command from the repository root with the absolute path to your prepared text file:

```sh
npm --silent --prefix agent run triage -- /absolute/path/prepared-email.txt
```

The npm command runs from `agent/`, which controls relative input paths and the database location. The agent resolves `agent/auth.json` and the root `phishing-triage.md` relative to its source file. Reporting channels come from the library lookup. It does not load the full reporting guide. Use an absolute input path, or a path relative to `agent/`:

```sh
npm --silent --prefix agent run triage -- ../evidence/emails/example.prepared.txt
```

Supply extracted email text, relevant headers, and link information with account-access secrets and unrelated personal information removed. The supplied message and instructions are sent to the configured OpenAI provider. Flue's configured database stores conversation data in `agent/data/flue.db`. The command reads the prepared text locally; email contents are not passed as command arguments or echoed by the CLI. The input must be prepared text, not a raw `.eml` file. Independent source findings can accompany the email in a separately labeled section of the same input file. Include the source URL, retrieval date, relevant statement, and limits of the finding. These are case evidence, not general assessment rules.

`PhishingTriage` returns the four sections described below. No filesystem, shell, browser, mailbox, scanning, or sending tools are registered for the model. Gmail access, case operations, and sending remain separate work.

The operator completed a first assessment of a prepared historical email. The original `flue run` command echoed the input and duplicated the answer; `triage-cli.ts` uses the same Flue runtime directly without subscribing to the verbose event display.

Known limitation observed on 2026-09-22: one later live run printed the complete assessment but the process remained running and was terminated manually. Shutdown has not been diagnosed or fixed. If the final assessment has printed and the command does not exit, use Ctrl+C to stop it.

## Read the assessment

The instructions request four short sections:

| Section | What it tells you |
| --- | --- |
| Assessment | The conclusion, High/Medium/Low concern level, and confidence in the particular conclusion. |
| Evidence | The decisive facts and their sources, including material contrary evidence. Inferences are identified separately. |
| Checks and gaps | What came from your supplied evidence, what the agent checked during this run, and which unresolved facts matter. |
| Next action | A concrete step suited to your situation, including whether report preparation has a specific blocker. |

The agent can request domain registration through `lookup_rdap`, IP network registration through `lookup_ip_rdap`, and public DNS records through `lookup_dns`. It cannot search the web or read official websites. An official-source excerpt remains your supplied evidence. The assessment must distinguish supplied notes from lookup checks actually completed during this run, including unsuccessful or unattempted checks.

High concern can coexist with missing reporting details or unknown installer behavior. Low concern from limited evidence does not certify safety. Assessments can change when new evidence arrives; a verdict does not authorize sending a report.

To include new evidence, add a labeled source note to your prepared file and rerun the command. Keep the URL, retrieval date, relevant statement, and limitations together. A rerun creates a new conversation; the command does not update a structured case record or automatically load earlier assessments. Include the earlier conclusion in your prepared context if you want an explicit comparison.

The output format is an instruction to the model, not a validated response schema. The CLI prints the returned text. Review claims against their cited evidence before acting.

See [standards and reporting guidance](../docs/standards-and-reporting.md) for the RFCs and provider sources, and [ADR 0007](../docs/adr/0007-separate-assessment-from-reporting.md) for the reason assessment and reporting are separate. These documents are not loaded into the agent prompt.

## Domain registration lookups

The same triage command now makes `lookup_rdap` available to the model. The model chooses when a registration date or registrar would resolve a material gap. The instructions limit it to three relevant public domains from the supplied evidence, once each. This selection and count limit are prompt instructions, not runtime enforcement. The runtime accepts syntactically valid ASCII or punycode domains, rejects URLs and IP literals, and controls the request destinations.

Each lookup fetches the [IANA bootstrap directory](https://data.iana.org/rdap/dns.json), selects an HTTPS service using the longest matching domain suffix, and requests its `/domain/{domain}` record. It sends only the queried domain to that service. It does not request the candidate website. No cookies or authentication headers are supplied. Responses are limited to 512 KiB each, with a 15-second deadline for the complete lookup. Redirects, referral links, and WHOIS fallback are not followed.

The result contains the query domain, source URL, retrieval time, status, relevant registration events, registrar name and IANA ID, and abuse email addresses nested under that registrar. Registrant details and unrelated contacts are omitted. Missing contacts remain missing; the tool does not substitute the registrant's email. A not-found result means that the queried endpoint returned HTTP 404, not that a domain is available or safe. The tool boundary rejects invalid input before a request. Lookup results distinguish HTTP errors, unavailable services, and failed requests.

Submit the registered domain, not a subdomain or URL. The tool does not infer a registrable domain using a public-suffix list. It queries the supplied name exactly, lowercased. It uses the first eligible HTTPS endpoint; another endpoint or a registrar referral may provide information this increment cannot retrieve. Current registration data does not prove historical ownership, website hosting, or phishing.

Native `fetch` keeps this operation independent of Node filesystem access and OAuth. Valibot, already used by Flue, is now a direct dependency for tool inputs and external JSON validation. An examined alternative, [rdapper](https://github.com/jakejarvis/rdapper/blob/main/src/rdap/normalize.ts), extracts normalized contacts only from top-level entities; preserving nested registrar abuse attribution would still need custom extraction. No general web client, shell tool, or RDAP package is added.

Flue stores the tool results with the assessment conversation in `agent/data/flue.db`. They are not automatically appended to your prepared email file or a structured case record. The terminal still prints only the final assessment after its progress line.

## IP registration lookups

`lookup_ip_rdap` accepts a bare IPv4 or IPv6 address from supplied evidence or DNS answers. It rejects URLs, ports, CIDRs and IPv6 zone IDs, and canonicalizes IPv6 spelling. The tool description limits selection to three distinct relevant addresses once each; this count is a model instruction, not a runtime limit.

The library fetches IANA's [IPv4](https://data.iana.org/rdap/ipv4.json) or [IPv6](https://data.iana.org/rdap/ipv6.json) directory, selects the longest binary prefix under [RFC 9224 section 5](https://www.rfc-editor.org/rfc/rfc9224.html#section-5), and requests `/ip/{address}` from the first eligible HTTPS registry endpoint. It verifies that the returned network has the same address family and contains the query. The queried address is never a request destination. The shared client applies the domain lookup's 15-second deadline, 512 KiB response limit, credential omission and redirect refusal. There is no endpoint failover, referral following or application cache.

Results include the canonical query, source URL, retrieval time, network range and IP version. Optional network handle, name, type and country are limited to 200 characters each; absent values are `null`. Contacts, notices and links are omitted. A network record describes registration, not origin hosting, current routing or Workers/Pages use. Nameserver evidence and address-network evidence remain separate even when both name the same company. A missing record or failed request establishes neither safety nor non-registration.

## DNS lookups

`lookup_dns` accepts a public name and one of A, AAAA, NS, MX, TXT, or CNAME. Underscore labels support DKIM selectors and DMARC. The instructions limit queries to 12 relevant name/type pairs per assessment, once each. Relevance, public-name selection, and query counts are prompt rules; the runtime validates syntax and record type and fixes the destination.

The tool uses [Cloudflare's DNS JSON endpoint](https://developers.cloudflare.com/1.1.1.1/encryption/dns-over-https/make-api-requests/dns-json/) at `https://cloudflare-dns.com/dns-query`. Cloudflare sees the queried name and the client's network address. Its public resolver [does not send EDNS Client Subnet](https://developers.cloudflare.com/1.1.1.1/faq/) to authoritative servers. Cache misses can still reach those servers; DNS lookup is not an invisible observation or a website visit.

Results preserve each answer's name, record type name (or `TYPE<number>` for an unmapped type), TTL, and data, including CNAME records alongside address answers and TXT quoting. Each observation includes the query, source URL, retrieval time, DNS response code, and truncation flag. NOERROR with no answers differs from NXDOMAIN, SERVFAIL, transport failure, and a truncated response.

Responses have a 15-second deadline and a 512 KiB byte limit. Parsed answers are limited to 20 records and 4,096 characters per record's data. Oversized answer sets return `response_too_large` instead of silently dropping records or treating valid DNS data as malformed. Redirects are blocked, and the response question must match the request. No cookies or authorization headers are supplied.

DNS can support attribution but does not establish the origin host or historical configuration. Nameservers identify a DNS service; the separate IP RDAP tool supplies network-registration evidence. Inbound MX records alone do not identify a sending platform.

The lookup cores are read-only and keep no local state. Repeating a lookup makes a new request and may return changed records. There is no application cache or automatic retry. A rerun of the triage command creates a new conversation; it does not resume a previous assessment.

## Local comparisons

For name comparisons, the agent has the local [`compare_domains` tool](../docs/domain-lookalikes.md). Supply an independently sourced reference in operator notes, or ask the agent to select a candidate from [`lookup_brand`](../docs/brand-references.md). Keep directory provenance distinct from operator verification. The comparator returns Unicode and label observations; it does not verify ownership or decide whether the message is phishing.

For two explicitly supplied bodies, [`find_shared_passages`](../docs/text-reuse.md) returns reused text and positions using Winnowing. Supply both bodies in labeled sections of the prepared input and ask for a comparison. It has no access to earlier messages or files, and shared text alone is not a spam verdict.

`lookup_brand` reads in-memory indexes built from the public 2FA Directory snapshot in `lib/reference-data/2fa-directory/` at the repository root. It supports exact names, name-word intersections, and exact hostnames, with source metadata and explicit output limits. See [lookup behavior](../docs/brand-references.md) and [manual updates](../docs/updating-reference-data.md). No threat list or learning mechanism is installed. Official product announcements still need to be supplied as separately sourced findings.

## Reporting recipients

The agent calls `lookup_reporting_channels` with up to 10 provider-and-service-role pairs after evidence supports the relationship. The offline catalogue returns only relevant routes, retaining conditions, sources and review dates. It does not evaluate those conditions or verify attribution. Misses preserve the channel gap and the case RDAP route for registrars. The [generated reference](../reporting-channels.md) remains downloadable; the full catalogue, reporting guide and research stay outside the initial prompt. See [lookup behavior](../docs/reporting-catalogue.md) and [updates](../docs/updating-reporting-channels.md).

Readiness is recipient-specific. A missing origin host does not block a supported registrar or sending-provider report. The assessment identifies the role, attribution evidence, channel, and actual blocker for each justified recipient. It does not draft or submit reports.

A source-backed plausible recipient can receive a channel lookup while its involvement remains unconfirmed. Label the lead and explain its evidence rather than promoting it to confirmed attribution. For example, a vendor-named DKIM selector with shared SES records can justify asking that vendor to investigate, but those records do not prove key custody or handling of the message. This is reporting guidance, not a deterministic provider detector. General reliability of model lead retention has not been evaluated.

Cloudflare's Phishing & Malware form is the default route. Its [report API](https://developers.cloudflare.com/api/resources/abuse_reports/methods/create/) requires account entitlement and a scoped Abuse Reports Edit token. Neither form automation nor API submission is implemented. The registrar email is appropriate only when Cloudflare is the registrar. Routine brand notifications are excluded from this workflow.

## Verify the agent tools

From the repository root:

```sh
npm test
npm run check:types
```

The root command builds the shared package and runs both workspace suites. The offline suite exercises lookup and comparison cores, the installed brand snapshot, and registration of all seven Flue tools. Binding tests catch runtime schema restrictions that TypeScript cannot check. Network tests mock responses and exercise the real parsers. A child-process lifecycle test runs the actual command and agent with synthetic authentication, an in-memory database, disabled fetch and an in-memory WebSocket. It checks natural exit after successful output, an output error and a sibling cleanup error. No test reads stored credentials or contacts a model.

## Future deployment

For Cloudflare later, replace the local browser-login entry point and file storage with suitable runtime and storage components. The lookup cores use `fetch`, `URL`, streams, and `AbortSignal`, independently of those local concerns. Workers supports [fetch within a request handler](https://developers.cloudflare.com/workers/runtime-apis/fetch/) and [stream iteration](https://developers.cloudflare.com/workers/runtime-apis/streams/readablestream/). Invoke the lookup during a request rather than at module initialization. Actual Workers deployment has not been tested; no cloud infrastructure is implemented.

## Earlier Codex CLI experiment

`src/check-codex.ts` and `npm run check:codex` remain from the earlier existing-login experiment. That command makes a synthetic model request through Codex CLI and consumes subscription capacity. It is not needed for the selected Pi OAuth path. The [historical findings](../docs/research/codex-login-reuse.md) explain that experiment.
