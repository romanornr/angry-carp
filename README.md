<div align="center">

<img src="assets/angry-carp.png" width="220" alt="An angry carp leaping out of the water" />

<h1><code>angry-carp</code></h1>

<strong>They cast the bait. The carp snaps the rod.</strong>

<p>Check your mail for phishing without opening its links. Get the evidence to clear your inbox, or build the reports that help shut scammers down.</p>
<p>Use it directly in your terminal or let Claude Code CLI, Codex CLI or the bundled Flue agent run the checks for you. The checks themselves need no AI.</p>

<p>
<a href="#use-it-from-codex-or-claude-code"><img src="assets/icons/claude-code.svg" width="28" height="28" alt="" /> Claude Code CLI</a> &nbsp;&nbsp;
<a href="#use-it-from-codex-or-claude-code"><img src="assets/icons/codex.svg" width="28" height="28" alt="" /> Codex CLI</a> &nbsp;&nbsp;
<a href="#use-it-with-the-flue-agent"><img src="assets/icons/flue.svg" width="28" height="28" alt="" /> Flue</a>
</p>

<br />

<a href="#quick-start">Quick start</a> &nbsp;•&nbsp;
<a href="#what-it-looks-like">See it in action</a> &nbsp;•&nbsp;
<a href="#checks-and-algorithms">Under the hood</a> &nbsp;•&nbsp;
<a href="#use-it-from-codex-or-claude-code">Codex / Claude Code</a> &nbsp;•&nbsp;
<a href="#reporting">Reporting</a> &nbsp;•&nbsp;
<a href="#faq">FAQ</a>

<br />
<br />

<a href="https://nodejs.org"><img src="https://img.shields.io/badge/Node.js-24-5FA04E?style=flat-square&logo=nodedotjs&logoColor=white" alt="Node.js 24" /></a>
<a href="https://www.typescriptlang.org"><img src="https://img.shields.io/badge/TypeScript-strict-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript strict" /></a>
<a href="#rules-the-carp-lives-by"><img src="https://img.shields.io/badge/the%20link-never%20visited-EF4444?style=flat-square" alt="The suspicious link is never visited" /></a>
<a href="#what-wakes-the-model-up"><img src="https://img.shields.io/badge/AI-optional-7C3AED?style=flat-square" alt="AI optional" /></a>

</div>

---

**Phishers never let a crisis go to waste.**

You're waiting for the exchange to tell you whether your money is safe. The hack is all over the news, and they've promised an email.

The phishing email looks like the update you've been waiting for. It knows your name, mentions the incident and asks you to sign in to secure your account. The link opens a convincing copy of the exchange's login page. You're trying to protect your money while the page collects your credentials.

The breach is real. The login page is fake.

<details>
<summary>Real attacks behind this example</summary>

- [Coinbase's May 2025 disclosure](https://www.coinbase.com/blog/protecting-our-customers-standing-up-to-extortionists) describes stolen customer information used to impersonate support and trick customers into transfers.
- [Binance's phishing-email examples](https://www.binance.com/en-GB/support/faq/examples-of-phishing-emails-360020817051) show verification links leading to fake login pages that collect passwords and 2FA backup keys. A separate example delivers malware disguised as a PDF.

</details>

Recognizing the trap is one thing. Getting the operation investigated means inspecting email headers, tracing domains and finding the providers who can act on your evidence.

- **Check your mail.** Let your connected agent work through the messages you authorize, or check one from the terminal. Get findings to help decide what to keep, delete or report. You don't have to spot the suspicious message first.
- **Go after the infrastructure.** Trace lookalike domains and provider roles, then prepare reports to help get phishing pages removed, domains suspended and sending accounts disabled. Make phishers spend their time rebuilding.

The checks need no AI account and never open the suspicious site. [AI assessment](#what-wakes-the-model-up) and [report preparation](#reporting) come afterwards, when needed.

The carp's revenge is paperwork, addressed to the people who can pull the plug.

## What it looks like

An email promoting a fake crypto-wallet app used the real brand's image domain while its download button led to a different, lookalike domain. Here is an excerpt from the no-AI analysis, with hostnames replaced by reserved example names. The installer was never downloaded or examined.

```text
$ npm --silent run analyze -- evidence/emails/example.eml

AI assessment required: concerns_detected.

- Image host wallet.example and action host wallet-apps.example use different
  registration domains. This does not establish ownership or deception.
- wallet-apps.example resembles or contains the identifying label of wallet.example.
  Reference source: message_image.
- DKIM=pass (header.i domain=newsletters.example) is a supplied header claim. Receiver
  provenance is unknown; fresh verification was not performed.
- SPF=pass (smtp.mailfrom domain=send.newsletters.example) is a supplied header claim.

Reporting candidates (no reports sent):
- Example Registrar (registrar, wallet-apps.example)
  Contact: abuse@registrar.example.
  Source: https://rdap.registrar.example/domain/wallet-apps.example; retrieved 2026-09-23
- cloudflare (dns, wallet-apps.example): Nameservers support a DNS relationship,
  not origin hosting, Workers or Pages.
- amazon-ses (email-delivery, this message): Supplied Received header names SES.
- resend (sending-platform, this message): Reported resend selector plus current SES
  MX/SPF configuration supports an investigation request, not proof of Resend handling.

Registrations (reported dates; no age or trusted receipt time inferred):
- wallet-apps.example:  2026-08-22T08:39:39Z
- newsletters.example:  2026-08-23T07:13:28Z
- wallet.example:       2021-02-05T08:56:34Z

Coverage:
- registrar_contact_without_resource_concern (3)
- Fresh authentication verification, payload scanning and official-site verification
  were not performed.
- Text reuse comparison skipped: no second message supplied.
```

One email, several leads: the borrowed branding, the lookalike download, registration dates and provider roles. Lookup records retain source URLs and retrieval times; local findings point to their recorded observations. The terminal does not print the body or raw headers.

## Highlights

- **Evidence first.** Parse, look up, compare and derive in plain TypeScript. Findings point to recorded evidence; network observations carry sources and retrieval times.
- **Never touches the link.** DNS and registry lookups only. The suspicious page is never fetched, not even for a screenshot.
- **Knows who to write to.** Registrar contacts from RDAP, DNS roles from nameservers, delivery and platform leads from header/DNS evidence. Each candidate comes with the basis for contacting it.
- **Looks past the spelling.** Unicode confusables and brand-plus-word comparisons expose resemblance that a plain string comparison misses.
- **Use the checks in your own tools.** The standalone CLI and Flue call the same library. Import it directly without installing Flue or running a service.
- **Says what it did not check.** Timeouts, budget limits and unreadable parts show up as named gaps, never as silence.
- **AI is optional and on a leash.** Runs on concerns or important gaps, sees selected evidence plus text you reviewed, and answers with evidence IDs that the terminal renders. Its prose never reaches the screen.
- **Built for coding agents.** Codex, Claude Code or any agent with a shell runs the commands and reads the playbooks. The portable playbooks need no skill installer.
- **No reports sent behind your back.** Report preparation checks the draft byte for byte and stops. Sending is a human's job.

## Quick start

You need Node.js 24.

```sh
git clone https://github.com/romanornr/angry-carp
cd angry-carp
npm ci     # installs all workspaces and builds the library and CLI
npm test   # optional, runs every workspace's tests
```

Export the suspicious email as an original `.eml` with full headers and put it in `evidence/emails/`, which Git ignores.

> [!TIP]
> Most mail clients call this "Show original", "View source" or "Save as .eml". Export the message itself. Inline forwards can lose headers. Attaching the original preserves more structure, but the analyzer treats that attachment as embedded content and reports its coverage separately.

```sh
# analyze it, print findings, print nothing from the body
npm --silent run analyze -- evidence/emails/example.eml

# same, plus the complete private record as JSON (mode 0600, never overwrites)
npm --silent run analyze -- evidence/emails/example.eml --json evidence/emails/example.analysis.json

# inspect an HTML fragment on its own, no network, no MIME
npm --silent run extract:links -- evidence/example/body.html evidence/example/links.json
```

Analysis saves no output file unless you request `--json`. That file is the complete private record: decoded bodies, headers, full URLs and attachment metadata. Keep it under `evidence/`; it is not the reduced input used by Flue.

You can stop here with the terminal findings, or continue with AI assessment and report preparation below.

## Use it from Codex or Claude Code

**You can use Angry Carp from Claude Code CLI or Codex CLI.** [Set up the executable and skill](cli/README.md#use-an-existing-agent), then let the host run the checks and consume the reduced structured result. The executable also works outside this checkout.

<img src="assets/icons/gmail.svg" width="22" height="22" alt="" /> If your agent already has access to Gmail through a connector, MCP server or extension, that connection can supply the email. The analyzer needs the original message bytes, usually saved as an `.eml` file. If the connector exposes only message text, the agent can use the portable assessment playbook with that text and identify the missing evidence. Mailbox access belongs to your configured host. Angry Carp does not include a Gmail connector.

| Host | How it plugs in | Lookups | Model calls |
| --- | --- | --- | --- |
| Claude Code CLI, Codex CLI, opencode, any agent with a shell | Runs the CLI through a skill or bundled instructions | Yes, from the CLI | Whatever the host already does |
| Flue agent (bundled) | `npm --prefix agent run triage` | Yes | On concerns or important gaps, through a ChatGPT subscription |
| A chat assistant that only reads documents | Attach the two playbooks and a redacted email | No, paste what you know | Every turn |
| No AI at all | `analyze`, `extract:links`, `report` | DNS/RDAP in `analyze`; other commands are offline | None in these commands |

With the executable installed, the flow is:

1. The agent runs `angry-carp analyze <original.eml> --format json`. This returns selected evidence and coverage, without the email body or raw headers. The separate `--json <path>` option retains a full private analysis for local operations.
2. Completed no-concerns checks need no further assessment. For concerns or gaps, the host loads `angry-carp instructions assessment`, selects a structured conclusion, and uses `angry-carp assess` to validate and display recorded evidence.
3. When you request reporting, the agent loads `angry-carp instructions reporting`. It follows the preparation procedure, researches the allegation and recipient, and supplies attributed research and an exact draft. `angry-carp report check` checks their structure, references and byte bindings. You review the claims and exact draft.

A prompt that works:

```text
Use the angry-carp skill to check /absolute/path/example.eml.
Follow the routing in its structured output. Keep original bytes and full
private analysis out of model context. Do not visit URLs from the email.
```

The two Markdown playbooks also work on their own. Attach `phishing-triage.md` and a redacted email to any assistant that can read documents and ask for an assessment. Use the host's lookup tools or supply recorded results alongside the email. The playbooks work independently of Flue and do not assume that the host has our TypeScript checks.

There is no packaged skill or MCP server yet.

## How it works

```text
 original.eml
      │
      ▼
 ┌────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌────────┐
 │ parse  │──▶│ observe │──▶│ look up │──▶│ compare │──▶│ derive │
 └────────┘   └─────────┘   └─────────┘   └─────────┘   └───┬────┘
  MIME parts   host roles    DNS + RDAP    brands +      findings,
  headers      and context  never the     lookalikes    candidates,
  auth claims  link, image,  link itself   logo vs       and every
               From, DKIM                  button        check that
                                                         did not run
                                                            │
                    ┌───────────────────────────────────────┴───────┐
                    │ checks clear                      concern or gap│
                    ▼                                                ▼
             print and stop                                ┌──────────────────┐
             zero tokens                                   │ model (optional) │
                    │                                      │ reduced input in │
                    │                                      │ evidence IDs out │
                    │                                      └────────┬─────────┘
                    └──────────────────┬────────────────────────────┘
                                       ▼
                        optional report preparation
```

Everything above the fork is plain TypeScript with no model, no account and no API key. Asynchronous work shares a 45-second deadline, parsing has size limits, and no check opens the suspicious link. The model box runs only if you use the AI command, and even then only when the fork goes right. The last box is where a human decides.

RDAP, if you have not met it, is the modern replacement for WHOIS: a JSON API for registration dates, available registrant details and abuse contacts. Identity fields can be absent or redacted. Angry Carp uses it for domains and for IP addresses.

## Why not let the agent do all of it?

Angry Carp is built to work with agents. But why spend a model turn choosing a routine DNS query, or depend on its final paragraph to remember an image/link mismatch? Let code collect the evidence once, then give the model the part that needs interpretation.

**The checks have a plan.** Host roles determine lookup priority. DNS, domain registration and IP registration share a bounded request budget, with up to 48 HTTP requests including recovery. The selection rules are explicit; live DNS and registry answers can change between runs.

**The suspicious site stays unopened.** The analyzer parses links as data and queries DNS and registries. The bundled assessment model has no browser or fetch tool. There is no candidate-page visit hidden in the analysis.

**Missing evidence stays visible.** Timeouts, skipped lookups and unreadable parts are recorded. The terminal prints the deterministic findings before an optional model call, so even a failed assessment cannot take those findings away.

**Provider roles come from recorded evidence.** During development, a model called infrastructure a proxy without supporting evidence. Provider routing now stays outside the Flue assessment input. The terminal displays the recorded roles and reporting candidates separately.

**You choose what the model reads.** Flue sends selected findings, host roles, comparisons, registration chronology and check outcomes, plus selectable evidence records and your reviewed text. Raw MIME and unreviewed bodies stay in the runtime. The [disclosure section](#what-leaves-your-machine) covers source notes and other AI hosts.

**The model selects; code renders.** Concern, confidence, a hypothesis and evidence IDs form the answer. The terminal displays the stored facts behind those IDs. An unknown ID fails visibly. The model can still choose a wrong hypothesis, but it cannot add an invented factual paragraph to this display.

**Routine checks cost no model tokens.** Parsing, lookups, directory matching and domain comparisons run without inference. When applicable checks finish without concerns or material gaps, the Flue command stops before loading credentials or opening a conversation.

This split has not been benchmarked against an agent-only workflow or a labelled phishing corpus. Routing is an attention policy, and deceptive prose without an implemented signal can pass it. The benefit we can demonstrate today is that check execution, evidence retention and factual rendering no longer depend on what the model chooses to mention.

A domain also does not need to appear on a blocklist before these checks can examine it. The analyzer compares its spelling and context and retrieves its registration record directly. The [detection research](docs/research/phishing-detection-methods.md) explains why list membership alone is insufficient.

## When you should not use it

- **You want a spam filter.** Angry Carp looks at one email you chose, deeply. It does not sit in front of a mailbox and it does not score volume.
- **You need a safety guarantee.** No concerns means the implemented checks found no signal, not that the email is safe. AI can assess deception, but the system has not been calibrated against a labelled corpus.
- **You need to see the page.** It will not open the link, ever. Page scanning is not implemented.
- **You want one-click reporting.** Sending is not built yet. Today it prepares and checks; you send.

## Use it with the Flue agent

Flue is a TypeScript framework where an agent is an ordinary function: you compose the model, the tools and the storage in code ([flueframework.com](https://flueframework.com/)). Angry Carp ships one Flue agent. It runs the same deterministic analysis, and when routing calls for it, talks to a model through your ChatGPT subscription. No API key. The current default model is `openai-codex/gpt-5.6-sol`.

Sign in once. The command prints a link and waits for the browser to call back on `localhost:1455`.

```sh
npm --prefix agent run auth:login
```

Run an assessment. Flue sends selected analysis fields, selectable evidence records and one text file that you prepare: the scam's own wording, with your data taken out. Keep the lure ("your wallet will be locked in 24 hours"). Remove what is yours or someone else's: your name and address, order numbers, tracking tokens in links, quoted earlier conversations, signatures.

> [!IMPORTANT]
> That file goes to the model exactly as you saved it. Nothing rewrites or redacts it for you.

```sh
npm --silent --prefix agent run triage -- ../evidence/emails/example.eml --reviewed-text ../evidence/emails/example.prepared.txt
```

| Routing result | What happens |
| --- | --- |
| No concerns or material gaps | Prints the deterministic result and exits. It never loads credentials, never opens the conversation database, never calls a model. |
| Concern or gap, reviewed text supplied | Sends selected evidence plus your reviewed text to the model. Prints the findings first, then the rendered assessment. |
| Concern or gap, no reviewed text | Prints the deterministic result and exits with code 2. It never substitutes the original email for the text you did not review. |

The bundled Flue assessment model has exactly two tools: one that compares two supplied texts for reused passages, and one that submits its structured assessment and ends the conversation. It has no filesystem, shell, browser, search or mailbox access.

Credentials live in `agent/auth.json` (plaintext, owner-only permissions, ignored by Git). Conversations live in `agent/data/flue.db`. Sign out locally with `npm --prefix agent run auth:logout`. The [agent guide](agent/README.md) covers storage and what the runtime can and cannot isolate.

## What leaves your machine

Analysis and optional Flue assessment make the following requests. Installation, login and research in another AI host have their own network activity.

| Destination | What is sent | When |
| --- | --- | --- |
| Cloudflare DNS over HTTPS | Selected hostnames and record types | Analysis, when eligible targets exist |
| IANA RDAP bootstrap, then the registry it names | Discovery requests, selected registration domains and public IP addresses | Analysis, when applicable |
| OpenAI, through your ChatGPT login | Selected analysis and evidence records, reviewed text and any supplied source notes | Only the Flue triage command, only when routing says there is a concern or gap |
| The suspicious link | Nothing, ever | Never |

Initial budgets allow 12 DNS queries, three domain registrations and three IP registrations. Recovery can extend those allocations, with at most two attempts per check and 48 HTTP requests overall. See [selection and limits](docs/email-analysis.md#selection-and-limits).

Hostnames can contain tracking identifiers. DNS sends them to the resolver and may cause queries to authoritative servers. Preserve the original unchanged; if you redact before analysis, use a separate copy and record that the input was modified.

Flue's automatic projection excludes raw headers, unreviewed bodies, attachments, filenames, extracted URL paths and raw DNS answers. Your reviewed text is sent unchanged. Optional `--source-notes` includes supplied claims and full source URLs. Hostnames can still identify recipients, so this is reduced disclosure, not anonymization.

Those restrictions belong to the Flue integration. A separate coding agent that reads the private JSON can see its bodies, headers and full URLs. Git ignore rules and file permissions do not restrict a process running as your user.

## What wakes the model up

DNS and RDAP run during evidence collection, before the assessment decision. They do not wait for a phishing verdict. The analyzer deduplicates eligible targets and bounds the requests. If applicable checks finish without concerns or important gaps, Flue skips the AI assessment. Targeted web research happens when you choose to prepare a report.

| Triggers an assessment | Does not |
| --- | --- |
| A hostname looks like a reference or brand domain (Unicode skeleton match or label containment) | An SPF, DKIM or DMARC pass |
| Images and action links live on different registrable domains | A registrar abuse contact with no concern on that resource |
| A reported SPF, DKIM or DMARC fail, softfail or policy result | Checks that were intentionally not applicable |
| A supplied note that disputes or supports abuse | Known heuristic limits, such as where a quoted reply starts |
| Unparsed sender identities or content that could not be read | Image lookups that failed |
| Important DNS or registration checks still incomplete after bounded recovery | A missing optional comparison reference |
| Hosts inside quoted or forwarded messages that were not queried | |

A concern triggers interpretation. A reporting candidate identifies somewhere to investigate. Neither automatically sends a report.

## Checks and algorithms

These are working algorithms and parsers, not tasks handed to a chatbot. The [`@angry-carp/checks` library](lib/README.md) exposes them independently of Flue.

- **See through lookalike spelling.** Unicode comparison can match visually confusable letters, while label containment catches names such as `bifrostwalletapps.download` against `bifrostwallet.com`. Suffix-aware parsing also keeps `paypal.com.attacker.net` from being mistaken for a PayPal subdomain.
- **Keep the logo and the click separate.** HTML extraction records image sources, action destinations and which anchor encloses an image. Borrowed branding does not conceal where the button points.
- **Find reused passages.** Given two bodies, Winnowing returns shared text and its positions. Five-token grams and four-gram windows give an eight-token detection threshold before resource limits apply. Matches are verified against tokens, so a hash collision alone is not evidence of reuse.

The analyzer runs the applicable checks below. Passage comparison is separately available for two explicitly supplied texts.

| Check | What it does | How | Limits |
| --- | --- | --- | --- |
| MIME parsing | Splits the original into ordered headers and independently decoded parts, so one broken part does not hide the rest | `@zone-eu/mailsplit` | 10 MiB, 128 parts, embedded messages two deep. Malformed boundaries are accepted silently. |
| Address parsing | Reads From, Sender, Reply-To and Return-Path | `email-addresses` | No encoded-word decoding, no internationalized domain conversion. |
| Authentication claims | Reads Authentication-Results and DKIM-Signature as claims someone made, not facts | Strict RFC 8601 reader with per-header isolation, RFC 6376 tag reader | Never verifies SPF, DKIM or DMARC. Rejects vendor extensions such as Outlook `action=none`, so some Microsoft headers are recorded as unparsed. |
| Link and image roles | Walks parsed HTML and records supported anchor/image references, including which link wraps each image | `parse5`, WHATWG URL | 512 KiB, 20,000 nodes, 200 occurrences. No CSS, SVG, forms, QR codes or `cid:` images. |
| Quote detection | Marks `blockquote`, Gmail quote wrappers and `>` lines, so hosts in a quoted reply are not treated as current | Heuristic shared with Mailgun Talon | A heuristic. Skipped content is reported, not deleted. |
| DNS | A, AAAA and NS queries for link/image observations, MX and TXT for mail identities; returned CNAME records are retained | Cloudflare DNS over HTTPS | 12 initial queries, plus bounded recovery. NXDOMAIN, empty, truncated, failed and never-attempted are five different outcomes. |
| Domain registration | Registrar, registration dates and available abuse contacts for selected registration domains | RDAP with IANA bootstrap (RFC 9224), registrable domain from the Public Suffix List via `tldts` | 3 initial domains, plus bounded recovery. No WHOIS fallback, no redirects. |
| IP registration | Network registration records for selected public addresses | IP RDAP, longest-prefix bootstrap | 3 initial addresses, plus bounded recovery. Private ranges excluded. Network records do not identify origin hosting or a service product. |
| Brand references | Matches hostnames and display names against a pinned snapshot of the 2FA Directory, crowdsourced service/domain associations | Exact hostname, exact name, or all-words name | Incomplete and not a blocklist. No match means nothing. |
| Domain lookalikes | Compares selected hosts with supplied references, directory candidates and image domains in the same message | Unicode UTS #39 confusable skeletons, label containment, script inventory, IDNA via Node | Unicode 17 data. No edit distance. Invisible characters are escaped and their positions recorded. |
| Shared passages | Finds reused text between two messages, the way plagiarism checkers do | [Winnowing](docs/text-reuse.md#algorithm-and-returned-evidence) (Schleimer, Wilkerson and Aiken, 2003): 5-word grams, windows of 4, FNV-1a hashes | 16,000 UTF-16 units per body, 10 matches. Two texts only, no corpus. Footers match legitimately. |
| Recovery | Retries transient failures inside a shared budget | At most two attempts per check; transient failures, partial DNS answers and deferred checks share recovery budgets | Rate limits and deterministic failures are not retried. |
| Reporting candidates | Works out who could receive a report and in what role | Rules: registrar when that resource has a concern, Cloudflare nameservers, Amazon SES in a Received header, Resend's DKIM selector plus SES mail records | A candidate is somewhere to ask. It is not attribution and not permission to send. |
| Report preparation | Checks SHA-256 bindings between analysis, preparation and draft records; an optional receipt records reviewed file digests | Digest binding, an idea from in-toto | Checks consistency and source policy. Does not verify the research and does not send. |

Resource limits and omitted work are recorded in coverage. The [analysis contract](docs/email-analysis.md#selection-and-limits) lists the budgets, priorities and recovery behavior.

<details>
<summary><b>The standards behind the checks</b></summary>

RFCs solve practical problems here. IANA bootstrap locates the registry for a domain or IP range. RDAP makes registration dates and available abuse contacts machine-readable. Authentication-Results gives us a grammar for reading receiver claims without confusing parsing with verification. HTTP cache rules let concurrent lookups reuse fresh discovery data. These are specific contracts we use, not a claim of complete protocol conformance.

| Standard | Where it applies |
| --- | --- |
| [RFC 5322](https://www.rfc-editor.org/rfc/rfc5322.html), [RFC 2045](https://www.rfc-editor.org/rfc/rfc2045.html), [RFC 2046](https://www.rfc-editor.org/rfc/rfc2046.html) | Message and MIME structure |
| [RFC 6854](https://www.rfc-editor.org/rfc/rfc6854.html), [RFC 6532](https://www.rfc-editor.org/rfc/rfc6532.html) | Address groups and international addresses |
| [RFC 8601](https://www.rfc-editor.org/rfc/rfc8601.html) | Authentication-Results syntax, and the rule that the header's own name cannot prove who wrote it |
| [RFC 6376](https://www.rfc-editor.org/rfc/rfc6376.html) | DKIM tag syntax and duplicate-tag rejection |
| [RFC 7208](https://www.rfc-editor.org/rfc/rfc7208.html), [RFC 7489](https://www.rfc-editor.org/rfc/rfc7489.html), [RFC 9989](https://www.rfc-editor.org/rfc/rfc9989.html) | SPF and DMARC, read as inputs to interpret, not verified |
| [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986.html), WHATWG HTML and URL | Link extraction and URL parsing |
| [RFC 7480](https://www.rfc-editor.org/rfc/rfc7480.html), [RFC 9082](https://www.rfc-editor.org/rfc/rfc9082.html), [RFC 9083](https://www.rfc-editor.org/rfc/rfc9083.html), [RFC 9224](https://www.rfc-editor.org/rfc/rfc9224.html) | RDAP transport, queries, responses and bootstrap |
| [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110.html), [RFC 9111](https://www.rfc-editor.org/rfc/rfc9111.html) | Safe retries and freshness of cached discovery data |
| [RFC 1035](https://www.rfc-editor.org/rfc/rfc1035.html) | DNS semantics. The Cloudflare JSON API has no RFC, and the docs say so. |
| [Unicode UTS #39](https://www.unicode.org/reports/tr39/), [UAX #15](https://www.unicode.org/reports/tr15/) | Confusable skeletons and normalization |
| ICANN gTLD RDAP Response Profile | Registrar abuse contact fields |
| [RFC 2142](https://www.rfc-editor.org/rfc/rfc2142.html) | Role mailboxes. The channel catalogue never invents an `abuse@` address. |
| [RFC 5965](https://www.rfc-editor.org/rfc/rfc5965.html), [RFC 6650](https://www.rfc-editor.org/rfc/rfc6650.html), [RFC 6590](https://www.rfc-editor.org/rfc/rfc6590.html), [RFC 5901](https://www.rfc-editor.org/rfc/rfc5901.html), [RFC 7970](https://www.rfc-editor.org/rfc/rfc7970.html) | Abuse-report and incident formats, studied for later export. Not implemented yet. |

[Standards and reporting guidance](docs/standards-and-reporting.md) explains where each one stops applying.

</details>

## Borrowed from software that came before

Angry Carp copies ideas, not code, and writes down what it left behind.

| Source | Taken | Left behind |
| --- | --- | --- |
| [PILFER, WWW 2007](https://www.cs.cmu.edu/~tomasic/doc/2007/FetteSadehTomasicWWW2007.pdf) | A research precedent for extracting explicit email and URL features before classification. | Its trained random forest and dot-count feature are not implemented. Its benchmark results do not describe Angry Carp. |
| Rspamd | Structured findings kept apart from the recommended action. Explicit prerequisite ordering. Image and displayed-URL roles with anchor walking. The lesson that a list of fired checks cannot prove the other checks ran. | Its verdict rules, redirector exemptions and weighted score. |
| SpamAssassin | A check returns results without rewriting the message. One analysis owns its state. URI details keep their tag types. | The plugin system and rules language. |
| Thunderbird DKIM Verifier extension, mailauth, Mox | Per-header failure isolation and the strict-versus-relaxed test cases. The 19 upstream test headers Angry Carp rejects are also rejected by the extension's default strict mode. | The extension's newest-authserv fallback as a trust policy for arbitrary uploaded `.eml` files. No parser was copied. |
| Mailgun Talon | The `gmail_quote` marker as a quote heuristic. | Deleting quoted text. Angry Carp keeps it and reports it as not queried. |
| Chrome's IDN display policy | Published script and confusable-name checks as a reference for the comparison design. | Treated as a policy, not an evaluated detector. |
| dnstwist and the combosquatting research | Comparing suspicious spellings and brand-plus-word names directly, without waiting for a blocklist entry. | Permutation generation. Angry Carp judges the domain in front of it. |
| MetaMask eth-phishing-detect | Studied local list matching and the distinction between threat lists and brand references. | Its detector and lists are not installed. Allowlist precedence and its fuzzy verdict were not adopted. |
| Cortex (TheHive) | Structured judgments rendered separately from the model's reasoning. | Its level names and silent fallback to `info`. |
| in-toto | Binding a report to exact artifact digests. | Attestation format, signatures and trust claims. |
| Anthropic, "Building effective agents" | Fixed workflow for routing and rendering, model judgment only where judgment is needed. | |

The [scanner precedents](docs/research/email-analysis-precedents.md), [header-reader inspection](docs/research/model-independent-email-analysis.md), [structured assessment decision](docs/adr/0016-render-recorded-assessment-evidence.md) and [report-binding decision](docs/adr/0015-attribute-host-report-research.md) record the sources and trade-offs. The [research index](docs/README.md) also preserves rejected approaches, including a homoglyph regex whose empty alternatives matched ordinary invoice addresses.

## Reporting

This is the revenge part, and it is partly built.

**Working today.** A reviewed [channel catalogue](reporting-channels.md) lists verified intake routes by role: Amazon SES for email delivery, Resend as a sending platform, Cloudflare for reverse proxy, DNS and registrar, and the registrars Trustname and Hostinger. Other registrars are reached through the abuse contact in their RDAP record. For everything else the analysis records a gap rather than guessing an address.

<p>
<a href="reporting-channels.md"><picture><source media="(prefers-color-scheme: dark)" srcset="assets/icons/aws-dark.svg" /><img src="assets/icons/aws.svg" width="26" height="26" alt="" /></picture> Amazon SES</a> &nbsp;&nbsp;
<a href="reporting-channels.md"><picture><source media="(prefers-color-scheme: dark)" srcset="assets/icons/resend-dark.svg" /><img src="assets/icons/resend.svg" width="26" height="26" alt="" /></picture> Resend</a> &nbsp;&nbsp;
<a href="reporting-channels.md"><img src="assets/icons/cloudflare.svg" width="26" height="26" alt="" /> Cloudflare</a> &nbsp;&nbsp;
<a href="reporting-channels.md"><img src="assets/icons/hostinger.svg" width="26" height="26" alt="" /> Hostinger</a> &nbsp;&nbsp;
<a href="reporting-channels.md">Trustname</a>
</p>

The `report` command prepares a report without sending it:

```sh
npm --silent run report -- start request.json --analysis example.analysis.json --output preparation.json
npm --silent run report -- check preparation.json research.json draft.json --analysis example.analysis.json
```

`start` validates your reviewed request (who, in what role, about which resource, alleging what, asking for what) and ties it to the analysis by digest. Your AI then researches the allegation, the provider relationship and the current intake, and writes the draft. `check` holds the report if byte bindings disagree, the destination is one of the suspicious hosts, a source is off the permitted list, or a check is unsupported. It exits 3 when held and prints "Nothing is approved or sent." The checker validates consistency; you review whether the research and allegations are true. The [preparation guide](docs/report-preparation.md) documents every field.

**Planned.** The broader reporting workflow includes sending with per-report approval, follow-up after seven days, stalled-destination tracking, an escalation dossier for ICANN Compliance, and a SQLite case store for originals, assessments and provider outcomes.

The outcome to look for is a provider confirming that it removed a phishing page, suspended a domain or disabled an abusive sending account. Keep that reply and the specific action it describes. A receipt acknowledgement records delivery only. Providers decide what action to take, and the current commands prepare and check reports without sending them or tracking replies automatically.

## Rules the carp lives by

| Rule | Why |
| --- | --- |
| Never fetch a candidate phishing URL or its assets | A visit can disclose tracking identifiers and expose the visiting client to hostile content. The analyzer keeps candidate URLs as data. |
| Keep the complete original unchanged, outside Git | A summary omits information. Preserve the bytes for later verification and provider requests. |
| Analyze before any model runs | An earlier model-driven version silently forgot a supplied HTML observation and a reporting lead. The analyzer now records those observations independently of the model's answer. |
| No concern or material gap, no Flue assessment | Material gaps are unfinished work, not reassurance. |
| The model interprets deception, code picks recipients | Provider roles and reporting candidates are displayed from recorded evidence, outside the Flue assessment task. |
| The model selects, the runtime renders | The display separates the model's hypothesis from the recorded evidence it selected. |
| Assessment, readiness and approval are three different things | High confidence is not a reason to send. |
| Reporting channels are data, the Markdown is generated | Each channel has a review date. Drift is a failing test. |
| The playbooks work without the code | `phishing-triage.md` is a standalone download for any agent. |

Each rule is written down as a decision record with the alternatives that were considered.

<details>
<summary><b>Reference data and licences</b></summary>

| Data | Source | Licence | Notes |
| --- | --- | --- | --- |
| Brand directory | 2FA Directory snapshot, 2,570 services, pinned in `lib/reference-data/2fa-directory/` | MIT | Loader checks SHA-256 and schema. The GPG signature check is manual. Updates are manual. |
| Public Suffix List | via `tldts` | MIT | Where a registrable domain starts |
| Unicode confusables | via `@moderation-api/unicode-spoofing`, Unicode 17 | MIT | Skeletons and primary script |
| Reporting channels | `lib/src/reporting/channels.ts`, each record dated | Project | Regenerate with `npm run reporting:generate`, check drift with `npm run reporting:check` |

Threat feeds (HaGeZi, OpenPhish, URLhaus) and the MetaMask phishing list were evaluated and remain proposals. A directory listing, a threat-feed hit and a service association mean different things, and the design keeps them distinguishable.

</details>

## What is not built yet

- Mailbox cleanup: label suspected phishing and offer opt-in automatic removal from your inbox. Automatic deletion is planned, with deletion rules and evidence retention still to be designed.
- Built-in mailbox connection and monitoring through Flue. For now, export the `.eml` yourself or use your AI host's existing connector.
- Sending reports and the approval step.
- The SQLite case store. Today the state is `evidence/emails/` plus the Flue conversation database.
- Fresh SPF, DKIM or DMARC verification. Claims are read, not checked.
- Attachment scanning, page scanning and official-site verification.
- Campaign linking across stored mail. Eclat, MinHash and CUSUM are researched, not implemented.
- ARF and IODEF export.
- A detection benchmark. The routing policy has not been calibrated against a real corpus.

## FAQ

**Why is it called Angry Carp?**
Because "anti-phishing tool" is what everyone else is called, and because the carp has had enough. Carp are also famously hard to kill, which is the right attitude for chasing registrars.

**Do I need an OpenAI or Anthropic account?**
No. `analyze`, `extract:links` and `report` never call a model. Only the separate Flue triage command does, and it uses a ChatGPT subscription through browser login rather than an API key.

**Can it clean up my inbox automatically?**
That is planned. Mailbox labels and opt-in automatic deletion will let you act on phishing without preparing a provider report. Today, Angry Carp analyzes the email and leaves mailbox changes to you or your configured host.

**Does it send anything anywhere?**
Analysis sends selected names and addresses for DNS/RDAP lookups. Flue assessment sends selected evidence, reviewed text and supplied source notes. See [what leaves your machine](#what-leaves-your-machine) for the full distinction, including other AI hosts.

**Can I use it without the code?**
Yes. `phishing-triage.md` and `provider-abuse-reporting.md` work as plain instructions for any assistant that reads documents. Use the host's own tools or supply recorded lookup results alongside the message.

<details>
<summary><b>Repository layout</b></summary>

| Path | Owns |
| --- | --- |
| `lib/` | `@angry-carp/checks`: every check, formatter and schema. No Flue or Pi dependency. |
| `cli/` | `analyze`, `extract:links` and `report`. Depends only on the library. |
| `agent/` | Flue bindings, ChatGPT authentication and conversation storage. |
| `phishing-triage.md` | The assessment playbook, portable to any agent. |
| `provider-abuse-reporting.md` | The report-preparation playbook. |
| `reporting-channels.md` | Generated channel reference. |
| `docs/` | Guides, decision records, research notes and the planning map. |
| `evidence/` | Your originals and prepared files. Ignored by Git; CLI-created JSON uses mode `0600`. Protect files you place here yourself. |
| `experiments/` | Rust and C++ probes for mailbox export, SQLite recovery and Unicode confusables. |

</details>

<details>
<summary><b>Develop</b></summary>

```sh
npm ci                 # install all workspaces and build the library and CLI
npm test               # build, then node --test in every workspace
npm run check:types    # build, then tsc --noEmit in every workspace
npm run brands:check   # verify the brand directory snapshot
```

The root lockfile records dependency versions for `npm ci`. Parser and comparison packages use exact manifest pins; Flue currently uses a version range. MIME, header and URL parsers handle message syntax, while Valibot validates structured inputs and lookup responses at their boundaries.

TypeScript follows the [style guide](docs/typescript-style.md). [AGENTS.md](AGENTS.md) holds the rules for coding agents working on this repository. CodeRabbit reviews use [.coderabbit.yaml](.coderabbit.yaml); run `coderabbit review --uncommitted --include-untracked` locally.

</details>

## Read more

- [Documentation index](docs/README.md)
- [Email analysis contract](docs/email-analysis.md) and the [CLI guide](cli/README.md)
- [Domain lookalikes](docs/domain-lookalikes.md), [brand references](docs/brand-references.md), [shared passages](docs/text-reuse.md), [email links](docs/email-links.md)
- [Report preparation](docs/report-preparation.md) and the [reporting catalogue](docs/reporting-catalogue.md)
- [Standards and reporting guidance](docs/standards-and-reporting.md)
- [Domain glossary](CONTEXT.md)

---

<div align="center">
<em>The carp is not done. Bring it an email.</em>
</div>
