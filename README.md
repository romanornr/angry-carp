<div align="center">

<img src="assets/angry-carp.png" width="220" alt="An angry carp leaping out of the water" />

<h1><code>angry-carp</code></h1>

<strong>Phishing triage with receipts. Find out who is behind the email and who can shut it down.</strong>

<p>An open source phishing investigation CLI. Runs on its own, from Claude Code or Codex, or as a Flue agent.</p>

<br />
<br />

<a href="#quick-start">Quick start</a> &nbsp;•&nbsp;
<a href="#how-it-works">How it works</a> &nbsp;•&nbsp;
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

Rant time. Somebody registers `yourbank-secure-login.download` on Monday, blasts it out through a perfectly legitimate sending platform on Tuesday, and by the time a blocklist notices, the domain is dead and the next one is up. Your mail filter shrugged. A chatbot will tell you "this looks suspicious" and then invent what to do next. Meanwhile the registrar, the DNS provider and the email platform, the three parties who could actually pull the plug, never hear about it.

Angry Carp is for the person who wants them to hear about it. Give it the original email and it does what a good incident responder does in the first ten minutes: pulls the message apart, finds every domain, link and image, asks the registries who owns them and since when, checks whether a hostname is impersonating a known brand, and writes down exactly what it checked and what it could not. Then it tells you who could take the site down and how to reach them.

It does all of that without an AI. A model is a separate, optional command, and even that one only runs when the evidence raises a concern.

The carp is angry because it is tired. Its revenge is boring on purpose: a report to the registrar with the RDAP record attached, one to the DNS provider with the nameservers, one to the sending platform with the DKIM selector, each with sources and timestamps, each reviewed by a human before it goes out. Phishing infrastructure dies from paperwork. The carp is very good at paperwork.

## What it looks like

A run on a real wallet-drainer lure, with the hostnames replaced by reserved example names. No model was involved. The lookalike domain was registered the day before the email arrived.

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

Every line carries its source URL and retrieval time in the full output. The body and raw headers are never printed.

## Highlights

- **Evidence first.** Parse, look up, compare and derive in plain TypeScript. Every finding carries its source URL and retrieval time.
- **Never touches the link.** DNS and registry lookups only. The suspicious page is never fetched, not even for a screenshot.
- **Knows who to write to.** Registrar abuse contact from RDAP, DNS provider from the nameservers, sending platform from the headers, each with its role and its published intake route.
- **Says what it did not check.** Timeouts, budget limits and unreadable parts show up as named gaps, never as silence.
- **AI is optional and on a leash.** Runs only when there is a concern, sees a reduced projection plus text you reviewed, and answers with evidence IDs that the terminal renders. Its prose never reaches the screen.
- **Built for coding agents.** Codex, Claude Code or any agent with a shell runs the commands and reads the playbooks. No skill installer needed.
- **Nothing is sent without you.** Report preparation checks the draft byte for byte and stops. Sending is a human's job.

## Quick start

You need Node.js 24.

```sh
git clone https://github.com/romanornr/angry-carp
cd angry-carp
npm ci     # installs all workspaces and builds the library
npm test   # optional, runs every workspace's tests
```

Export the suspicious email as an original `.eml` with full headers and put it in `evidence/emails/`, which Git ignores.

> [!TIP]
> Most mail clients call this "Show original", "View source" or "Save as .eml". A forwarded copy loses the headers that matter, so export the message itself.

```sh
# analyze it, print findings, print nothing from the body
npm --silent run analyze -- evidence/emails/example.eml

# same, plus the complete private record as JSON (mode 0600, never overwrites)
npm --silent run analyze -- evidence/emails/example.eml --json evidence/emails/example.analysis.json

# inspect an HTML fragment on its own, no network, no MIME
npm --silent run extract:links -- evidence/example/body.html evidence/example/links.json
```

That is the whole no-AI workflow. Everything below is optional.

## Use it from Codex or Claude Code

Angry Carp is built to be driven by a coding agent, and it does not care which one.

| Host | How it plugs in | Lookups | Model calls |
| --- | --- | --- | --- |
| Claude Code, Codex, opencode, any agent with a shell | Runs the CLI, reads the playbooks | Yes, from the CLI | Whatever the host already does |
| Flue agent (bundled) | `npm --prefix agent run triage` | Yes | Only on concern, through a ChatGPT subscription |
| A chat assistant that only reads documents | Attach the two playbooks and a redacted email | No, paste what you know | Every turn |
| No AI at all | `analyze`, `extract:links`, `report` | Yes | None |

Point Codex, Claude Code or a similar tool at the repository and the flow is:

1. The agent runs `npm --silent run analyze -- <original.eml> --json <analysis.json>`. Now it has structured evidence with sources instead of an email it has to eyeball.
2. The agent reads [phishing-triage.md](phishing-triage.md), the assessment playbook: what the observations mean, why concern and confidence are different things, what the next action is.
3. If a report is warranted, the agent reads [provider-abuse-reporting.md](provider-abuse-reporting.md), does targeted research about the allegation and the recipient, and writes two files: its research with sources, and the exact draft. `npm run report -- check` verifies both against the preparation before you look at it.

A prompt that works:

```text
Analyze evidence/emails/example.eml with `npm --silent run analyze -- ... --json`.
Then read phishing-triage.md and assess the result. Explain the concern, the
confidence and the next action. Do not visit any URL from the email.
```

The two Markdown playbooks also work on their own. Attach `phishing-triage.md` and a redacted email to any assistant that can read documents and ask for an assessment. It will reason well, but it will not have DNS, registration, brand or lookalike evidence unless you paste it in. Running the code is what turns opinions into evidence.

There is no packaged skill or MCP server yet.

## How it works

```text
 original.eml
      │
      ▼
 ┌────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌────────┐
 │ parse  │──▶│ observe │──▶│ look up │──▶│ compare │──▶│ derive │
 └────────┘   └─────────┘   └─────────┘   └─────────┘   └───┬────┘
  MIME parts   every host    DNS + RDAP    brands +      findings,
  headers      and its role  never the     lookalikes    candidates,
  auth claims  link, image,  link itself   logo vs       and every
               From, DKIM                  button        check that
                                                         did not run
                                                            │
                    ┌───────────────────────────────────────┴───────┐
                    │ nothing found                     concern or gap│
                    ▼                                                ▼
             print and stop                                ┌──────────────────┐
             zero tokens                                   │ model (optional) │
                    │                                      │ reduced input in │
                    │                                      │ evidence IDs out │
                    │                                      └────────┬─────────┘
                    └──────────────────┬────────────────────────────┘
                                       ▼
                        report preparation, you approve
```

Everything above the fork is plain TypeScript with no model, no account and no API key. It finishes in under a minute and never opens the suspicious link. The model box runs only if you use the AI command, and even then only when the fork goes right. The last box is where a human decides.

RDAP, if you have not met it, is the modern replacement for WHOIS: a JSON API where registries publish who registered a domain, when, and where to send abuse complaints. Angry Carp uses it for domains and for IP addresses.

## Why not let the agent do all of it?

Angry Carp is built to work with agents, so this is not an argument against them. It is an argument about which part of the job belongs to code. Paste the email into ChatGPT or Claude and you get a plausible opinion in ten seconds. Point Claude Code or Codex at the file and it can run `dig` and `whois` itself. That works right up until you need the result to be right, private, repeatable and cheap.

**An agent on its own does the lookups differently every time.** Which records it queries, whether it follows the CNAME, whether it checks the image host at all, depends on how the conversation went. Angry Carp runs the same bounded plan on every email: the same DNS record types, RDAP for every registrable domain, IP registration for every resolved address, at most 48 requests. Run it twice, get the same evidence.

**An agent on its own will open the link.** Not out of malice. It wants to see the page, so it fetches it, and now the attacker has your IP, a hit on their tracker, and possibly a payload on your machine. Angry Carp has no code path that fetches a candidate URL. That is a rule in the design, not a prompt instruction the model might reinterpret.

**An agent cannot tell you what it did not check.** If a lookup times out mid-conversation, the answer just gets vaguer. Angry Carp records every skipped, failed and unattempted check by name. A missing answer is unfinished work, never a clean bill of health.

**An agent invents the next step.** During development, a replayed run showed the model claiming a provider was "a proxy" with no evidence, even after it had been handed the correct roles. So the code now decides who a report goes to and under what conditions. The model never sees that part. It interprets deception, nothing else.

**An agent sees the whole email.** Angry Carp sends the model a projection: findings, hostnames with their roles, comparisons, registration dates and check outcomes, capped at 64 hosts. It does not send the raw message, raw headers, the unreviewed body, attachments, filenames, URL paths or DNS answers. The message text the model reads is a file you cleaned yourself. Hostnames can still carry identifiers, so call this reduced disclosure, not anonymization.

**An agent's answer is prose you have to trust.** Here the model returns a structured pick: concern (high, medium, low), confidence, one hypothesis from a fixed list, and evidence IDs. The terminal prints the stored records behind those IDs. If the model names an ID that does not exist, the run fails loudly and the deterministic output stays on screen.

**You pay tokens only for judgment.** Parsing, lookups and comparisons are free. An email whose checks all completed with no concerns produces a full analysis and zero model calls. An SPF pass, a registrar contact, or a check that did not apply never wakes the model up.

So the split is: code collects the evidence and draws the boundary, the agent reads the result, applies the playbook and does the reporting research. Each side does the part it is good at. That is what the [agent section](#use-it-from-codex-or-claude-code) is for.

Honesty clause: nobody has benchmarked this against a plain-agent baseline yet, and the routing is an attention policy, not a calibrated classifier. It can miss phishing whose only tell is persuasive prose.

Compared with a blocklist, the difference is time. One study found that over 90% of lookalike domains evaded popular blacklists for at least a month. Angry Carp checks registration age and Unicode resemblance locally, on the message in front of you, right now.

## When you should not use it

- **You want a spam filter.** Angry Carp looks at one email you chose, deeply. It does not sit in front of a mailbox and it does not score volume.
- **You want a verdict.** It gives you observations, concerns and a confidence, and it says "this does not establish deception" a lot. That is deliberate. Nothing here has been benchmarked against a labelled corpus, and phishing whose only tell is persuasive prose can walk right past the deterministic checks.
- **You need to see the page.** It will not open the link, ever. Page evidence will come from private external scans later, not from your machine.
- **You want one-click reporting.** Sending is not built yet. Today it prepares and checks; you send.

## Use it with the Flue agent

Flue is a TypeScript framework where an agent is an ordinary function: you compose the model, the tools and the storage in code ([flueframework.com](https://flueframework.com/)). Angry Carp ships one Flue agent. It runs the same deterministic analysis, and when routing calls for it, talks to a model through your ChatGPT subscription. No API key. The current default model is `openai-codex/gpt-5.6-sol`.

Sign in once. The command prints a link and waits for the browser to call back on `localhost:1455`.

```sh
npm --prefix agent run auth:login
```

Run an assessment. The model never sees the email itself. It sees the structured projection and one text file that you prepare: the scam's own wording, with your data taken out. Keep the lure ("your wallet will be locked in 24 hours"). Remove what is yours or someone else's: your name and address, order numbers, tracking tokens in links, quoted earlier conversations, signatures.

> [!IMPORTANT]
> That file goes to the model exactly as you saved it. Nothing rewrites or redacts it for you.

```sh
npm --silent --prefix agent run triage -- ../evidence/emails/example.eml --reviewed-text ../evidence/emails/example.prepared.txt
```

| Routing result | What happens |
| --- | --- |
| No concerns | Prints the deterministic result and exits. It never loads credentials, never opens the conversation database, never calls a model. |
| Concern or gap, reviewed text supplied | Sends the projection plus your reviewed text to the model. Prints the findings first, then the rendered assessment. |
| Concern or gap, no reviewed text | Prints the deterministic result and exits with code 2. It never substitutes the original email for the text you did not review. |

The model has exactly two tools: one that compares two supplied texts for reused passages, and one that submits its structured assessment and ends the conversation. It has no filesystem, shell, browser, search or mailbox access.

Credentials live in `agent/auth.json` (plaintext, owner-only permissions, ignored by Git). Conversations live in `agent/data/flue.db`. Sign out locally with `npm --prefix agent run auth:logout`. The [agent guide](agent/README.md) covers storage and what the runtime can and cannot isolate.

## What leaves your machine

No telemetry, no analytics, no update checks. The complete list of outbound traffic:

| Destination | What is sent | When |
| --- | --- | --- |
| Cloudflare DNS over HTTPS | Hostnames from the email, at most 12 queries | Every `analyze` |
| IANA RDAP bootstrap, then the registry it names | Registrable domains (at most 3) and resolved IP addresses (at most 3) | Every `analyze` |
| OpenAI, through your ChatGPT login | The reduced projection plus the text file you prepared (the lure, minus your data) | Only the Flue triage command, only when routing says there is a concern or gap |
| The suspicious link | Nothing, ever | Never |

Hostnames can themselves contain identifiers, such as a tracking subdomain with your address in it. The lookups send those hostnames to the resolver and the registries. If that matters for a message, redact it before analysis.

## What wakes the model up

| Triggers an assessment | Does not |
| --- | --- |
| A hostname looks like a reference or brand domain (Unicode skeleton match or label containment) | An SPF, DKIM or DMARC pass |
| Images and action links live on different registrable domains | A registrar abuse contact with no concern on that resource |
| A reported SPF, DKIM or DMARC fail, softfail or policy result | Checks that were intentionally not applicable |
| A supplied note that disputes or supports abuse | Known heuristic limits, such as where a quoted reply starts |
| Unparsed sender identities or content that could not be read | Image lookups that failed |
| DNS or registration lookups on important hosts that failed after two attempts | A missing optional comparison reference |
| Hosts inside quoted or forwarded messages that were not queried | |

A concern is a reason to look, not a verdict. The output says so every time.

## Checks and algorithms

Everything here runs without a model. Each check is a function you can call on its own from the `@angry-carp/checks` library.

| Check | What it does | How | Limits |
| --- | --- | --- | --- |
| MIME parsing | Splits the original into ordered headers and independently decoded parts, so one broken part does not hide the rest | `@zone-eu/mailsplit` | 10 MiB, 128 parts, embedded messages two deep. Malformed boundaries are accepted silently. |
| Address parsing | Reads From, Sender, Reply-To and Return-Path | `email-addresses` | No encoded-word decoding, no internationalized domain conversion. |
| Authentication claims | Reads Authentication-Results and DKIM-Signature as claims someone made, not facts | Strict RFC 8601 reader with per-header isolation, RFC 6376 tag reader | Never verifies SPF, DKIM or DMARC. Rejects vendor extensions such as Outlook `action=none`, so some Microsoft headers are recorded as unparsed. |
| Link and image roles | Walks the HTML once and records every link and image, including which link wraps each image | `parse5`, WHATWG URL | 512 KiB, 20,000 nodes, 200 occurrences. No CSS, SVG, forms, QR codes or `cid:` images. |
| Quote detection | Marks `blockquote`, Gmail quote wrappers and `>` lines, so hosts in a quoted reply are not treated as current | Heuristic shared with Mailgun Talon | A heuristic. Skipped content is reported, not deleted. |
| DNS | A, AAAA and NS for link and image hosts, MX and TXT for sender hosts, CNAMEs followed | Cloudflare DNS over HTTPS | 12 queries per run. NXDOMAIN, empty, truncated, failed and never-attempted are five different outcomes. |
| Domain registration | Registrar, registration dates and abuse contact for each registrable domain | RDAP with IANA bootstrap (RFC 9224), registrable domain from the Public Suffix List via `tldts` | 3 domains per run. No WHOIS fallback, no redirects. |
| IP registration | Network owner for each resolved address | IP RDAP, longest-prefix bootstrap | 3 addresses per run. Private ranges excluded. Says who owns the block, not what product runs on it. |
| Brand references | Matches hostnames and display names against a pinned snapshot of the 2FA Directory, a crowdsourced list of services and their real domains | Exact hostname, exact name, or all-words name | Incomplete and not a blocklist. No match means nothing. |
| Domain lookalikes | Compares each host with your reference domains, directory matches and the image domains in the same email | Unicode UTS #39 confusable skeletons, label containment, script inventory, IDNA via Node | Unicode 17 data. No edit distance. Invisible characters are escaped and their positions recorded. |
| Shared passages | Finds reused text between two messages, the way plagiarism checkers do | Winnowing (Schleimer, Wilkerson and Aiken, 2003): 5-word grams, windows of 4, FNV-1a hashes | 16,000 characters per body, 10 matches. Two texts only, no corpus. Footers match legitimately. |
| Recovery | Retries transient failures inside a shared budget | Two attempts per check, retry only on 5xx, timeouts, resets and SERVFAIL | Rate limits and deterministic failures are not retried. |
| Reporting candidates | Works out who could receive a report and in what role | Rules: registrar when that resource has a concern, Cloudflare nameservers, Amazon SES in a Received header, Resend's DKIM selector plus SES mail records | A candidate is somewhere to ask. It is not attribution and not permission to send. |
| Report preparation | Ties a reviewed request, the analysis and the exact draft together by SHA-256 so nothing changes under you | Digest binding, an idea from in-toto | Checks consistency and source policy. Does not verify the research and does not send. |

Every limit is a fixed number in the code, and every exhausted budget shows up in the output as a gap.

<details>
<summary><b>Standards it follows</b></summary>

| Standard | Where it applies |
| --- | --- |
| RFC 5322, RFC 2045, RFC 2046 | Message and MIME structure |
| RFC 6854, RFC 6532 | Address groups and international addresses |
| RFC 8601 | Authentication-Results syntax, and the rule that the header's own name cannot prove who wrote it |
| RFC 6376 | DKIM tag syntax and duplicate-tag rejection |
| RFC 7208, RFC 7489, RFC 9989 | SPF and DMARC, read as inputs to interpret, not verified |
| RFC 3986, WHATWG HTML and URL | Link extraction and URL parsing |
| RFC 7480, RFC 9082, RFC 9083, RFC 9224 | RDAP transport, queries, responses and bootstrap |
| RFC 9110, RFC 9111 | Safe retries and freshness of cached discovery data |
| RFC 1035 | DNS semantics. The Cloudflare JSON API has no RFC, and the docs say so. |
| Unicode UTS #39, UAX #15 | Confusable skeletons and normalization |
| ICANN gTLD RDAP Response Profile | Registrar abuse contact fields |
| RFC 2142 | Role mailboxes. The channel catalogue never invents an `abuse@` address. |
| RFC 5965, RFC 6650, RFC 6590, RFC 5901, RFC 7970 | Abuse-report and incident formats, studied for later export. Not implemented yet. |

[Standards and reporting guidance](docs/standards-and-reporting.md) explains where each one stops applying.

</details>

## Borrowed from software that came before

Angry Carp copies ideas, not code, and writes down what it left behind.

| Source | Taken | Left behind |
| --- | --- | --- |
| Rspamd | Structured findings kept apart from the recommended action. DKIM before DMARC. Image and displayed-URL roles with anchor walking. The lesson that a list of fired checks cannot prove the other checks ran. | Its verdict rules, redirector exemptions and weighted score. |
| SpamAssassin | A check returns results without rewriting the message. One analysis owns its state. URI details keep their tag types. | The plugin system and rules language. |
| Thunderbird DKIM Verifier extension, mailauth, Mox | Per-header failure isolation and the strict-versus-relaxed test cases. The 19 upstream test headers Angry Carp rejects are also rejected by the extension's default strict mode. | Its "trust the newest authserv-id" fallback, which is wrong for an uploaded `.eml`. No parser was copied. |
| Mailgun Talon | The `gmail_quote` marker as a quote heuristic. | Deleting quoted text. Angry Carp keeps it and reports it as not queried. |
| Chrome's IDN display policy | The most concrete published lookalike rule set, as a reference for the comparison design. | Treated as a policy, not an evaluated detector. |
| dnstwist and the combosquatting research | The evidence that lookalike checks must stay local because blocklists lag. | Permutation generation. Angry Carp judges the domain in front of it. |
| MetaMask eth-phishing-detect | A small local matcher over a data snapshot. | The wallet controller and its Levenshtein fuzzy verdict. |
| Cortex (TheHive) | Structured judgments rendered separately from the model's reasoning. | Its level names and silent fallback to `info`. |
| in-toto | Binding a report to exact artifact digests. | Attestation format, signatures and trust claims. |
| Anthropic, "Building effective agents" | Fixed workflow for routing and rendering, model judgment only where judgment is needed. | |

Each comparison is written up in full, including the rejects, such as a published homoglyph regex whose empty alternatives matched ordinary invoice addresses.

## Reporting

This is the revenge part, and it is partly built.

**Working today.** A reviewed [channel catalogue](reporting-channels.md) lists verified intake routes by role: Amazon SES for email delivery, Resend as a sending platform, Cloudflare for reverse proxy, DNS and registrar, and the registrars Trustname and Hostinger. Other registrars are reached through the abuse contact in their RDAP record. For everything else the analysis records a gap rather than guessing an address.

The `report` command prepares a report without sending it:

```sh
npm --silent run report -- start request.json --analysis example.analysis.json --output preparation.json
npm --silent run report -- check preparation.json research.json draft.json --analysis example.analysis.json
```

`start` validates your reviewed request (who, in what role, about which resource, alleging what, asking for what) and ties it to the analysis by digest. Your AI then researches the allegation, the provider relationship and the current intake, and writes the draft. `check` holds the report if any bytes changed, the destination is one of the suspicious hosts, a source is off the permitted list, or a check is unsupported. It exits 3 when held and prints "Nothing is approved or sent." The [preparation guide](docs/report-preparation.md) documents every field.

**Coming next.** This is where the carp stops preparing and starts sending. Sending with per-report approval, follow-up after seven days, stalled-destination tracking, an escalation dossier for ICANN Compliance, and a SQLite case store for originals, assessments and provider outcomes.

An acknowledgement from a provider is not a takedown, and a high concern is not permission to send. The code keeps those apart on purpose.

## Rules the carp lives by

| Rule | Why |
| --- | --- |
| Never fetch a candidate phishing URL or its assets | Visiting tips off the attacker, can execute payloads, and produces evidence nobody can reproduce. Page evidence will come from private external scans. |
| Keep the complete original unchanged, outside Git | A parsed summary is not evidence. Providers and investigators need the bytes. |
| Analyze before any model runs | An earlier model-driven version silently forgot a supplied HTML observation and a reporting lead. Code does not forget. |
| No concern, no tokens | Material gaps are unfinished work, not reassurance. |
| The model interprets deception, code picks recipients | The model made an unsupported provider claim in a replay. It no longer gets the chance. |
| The model selects, the runtime renders | No free-form model prose reaches the screen, so a wrong hypothesis cannot dress itself up as fact. |
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

- Mailbox connection. No Gmail or IMAP. You export the `.eml` yourself.
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

**Does it send anything anywhere?**
DNS queries to Cloudflare's resolver and RDAP queries to IANA and the registries. Nothing else leaves your machine unless you run the AI command, and then only the projection described above.

**Can I use it without the code?**
Yes. `phishing-triage.md` and `provider-abuse-reporting.md` work as plain instructions for any assistant that reads documents. You lose the lookups, so paste in what you know.

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
| `evidence/` | Your originals and prepared files. Ignored by Git, owner-only permissions. |
| `experiments/` | Rust and C++ probes for mailbox export, SQLite recovery and Unicode confusables. |

</details>

<details>
<summary><b>Develop</b></summary>

```sh
npm ci                 # install all workspaces and build the library
npm test               # build, then node --test in every workspace
npm run check:types    # build, then tsc --noEmit in every workspace
npm run brands:check   # verify the brand directory snapshot
```

Runtime dependencies are pinned exactly: `@zone-eu/mailsplit`, `email-addresses`, `parse5`, `tldts`, `@moderation-api/unicode-spoofing` and `valibot` in the library, `@flue/runtime` and two Pi packages in the agent. Every external input crosses a Valibot schema before a function sees it.

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
