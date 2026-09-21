# Grok capabilities relevant to Angry Carp

Research date: 2026-09-21.

This preliminary memo records official documentation and implications for the design interview. It does not select an architecture or resolve a Wayfinder ticket. The user's exact Grok product, plan, and connector configuration remain unverified.

Context7 resolved the Grok Bot and xAI API documentation. Focused Context7 queries and the official pages below supplied the findings. This research did not access Gmail, run a routine, submit a report, or visit a candidate phishing site.

## Grok Bot routines and consumer Grok Automations

Grok Bot distinguishes a reusable skill from a routine that tells one Bot when to execute a workflow. Skills can contain decision rules, expected outputs, and safety boundaries. Private skills are shared across the account's Bots. Routines support schedules and supported event triggers, and continue while the user's laptop is closed. The documentation asks users to confirm the owning Bot, timezone, inputs, expected result, approval boundary, and behavior when a source is missing. It recommends proving a task before automating it. [Grok Bot skills and routines](https://docs.x.ai/grok-bot/skills-routines-and-automations)

A Bot can own up to 50 routines. The app keeps the 20 most recent run records per routine. A test run performs real work, including connected-tool calls and file changes. These limits make routine history insufficient as the sole record of a long-running abuse-reporting desk. [Grok Bot skills and routines](https://docs.x.ai/grok-bot/skills-routines-and-automations)

Consumer Grok also documents Automations at `grok.com/automations`. An automation can include instructions, attached files, connectors, skills, and a mode. Each run starts a fresh request with the saved instructions and current data. Schedules use the user's timezone. Email triggers filter incoming mail by sender, recipient, or subject. These statements describe consumer Grok Automations; they do not establish identical behavior in Grok Bot Routines. [Automations announcement](https://x.ai/news/grok-automations)

## Files, state, and sharing

Grok Bot provides a persistent cloud computer. Its documentation recommends `/workspace` for durable project files. Files and supported browser state survive normal updates and recovery. Reset restores the latest saved snapshot, so recent changes can be lost. Temporary directories and manually installed packages are replaceable. [Computer and apps](https://docs.x.ai/grok-bot/computer-and-apps)

Every Bot on an account shares the computer's files, browser sessions, and command-line credentials. Connectors are also account-wide. A separate Bot does not isolate suspicious evidence from the user's other Bots or signed-in services. [Computer and apps](https://docs.x.ai/grok-bot/computer-and-apps)

Grok Bot templates package instructions, selected memories, skills, and plugins. The template guide says custom code and scripts are excluded. A shared Bot template therefore does not establish a mechanism for distributing executable software or transferring a case ledger. [Templates guide](https://x.ai/bot/guides/templates-for-grok-bot)

## Gmail access

Consumer Grok's Gmail connector documents Gmail search operators and access to message bodies, headers, and attachments. It also supports drafts, sending, forwarding, and label changes when the corresponding permissions are enabled. The base connection uses `gmail.readonly`; additional capabilities depend on additional scopes. [Gmail connector](https://docs.x.ai/grok/connectors/gmail-google-calendar)

The reviewed connector page does not establish complete Spam enumeration or byte-for-byte raw message export. Those capabilities remain unverified. The page belongs to the consumer Grok documentation, so its behavior and privacy statements cannot be assumed to describe whichever Gmail plugin the user installed in Grok Bot.

## Controls relevant to candidate phishing URLs

Grok Bot's Auto Review evaluates proposed actions with a model. Personal rules can require approval or permit matching actions automatically, subject to the reviewer's other checks. The documentation describes Auto Review as a complement to least privilege and explicit boundaries. A written prohibition on visiting phishing URLs is therefore not evidence of a technical network restriction. [Approvals, security, and privacy](https://docs.x.ai/grok-bot/approvals-security-and-privacy)

The documented network destination allowlist is Enterprise-only. Teams without a network policy default to allowing all destinations. Blocking a plugin does not block access to the same service through its website. Whether the user's account can enforce the required network restrictions remains an open question. [Grok Bot network policy](https://docs.x.ai/grok-bot/security#network-policy)

## xAI API conversation state

The xAI Responses API can store prompts, reasoning content, and responses. Storage is enabled by default, and responses remain available for 30 days. Clients can disable this storage with `store: false` and manage history themselves. [Generate text](https://docs.x.ai/developers/model-capabilities/text/generate-text)

This API feature describes conversation state. It does not establish an API for operating the user's Grok Bot routines, accessing their connector sessions, or maintaining a permanent reporting ledger.

## Implications for the interview

The documented skills and routines support exploring a workflow expressed in Markdown with product-specific scheduling. That is a feasibility observation, not a decision to keep the entire workflow in prompts.

The distinction between instructions and enforced capabilities matters for Angry Carp. Its requirement to avoid candidate infrastructure needs a defined enforcement mechanism. Persistent files also need explicit recovery and reconciliation rules if they record reports that must not be sent twice.

Neither the documentation nor this research establishes a need for Rust. The language choice depends on which responsibilities require software after the workflow and safety boundaries are settled.

## Questions still requiring verification

- Does the existing routine run in Grok Bot or consumer Grok Automations, and under which plan?
- Which Gmail plugin is installed, and which scopes and tools does it expose?
- Can that plugin enumerate Spam completely, paginate results reliably, and export raw original messages?
- Can routine instructions and skills be imported, exported, or updated programmatically?
- Can the runtime restrict the analyst's network access independently of a model's judgment?
- How does the scheduler handle overlapping runs, retries, missed runs, and daylight-saving transitions?
- Can the runtime read and update shared case records outside its own account storage?
- What evidence remains after a send times out, a run stops, or the computer restores an older snapshot?

Missing documentation is not evidence that a capability is absent. These questions require focused documentation checks or safe tests against the actual product configuration.
