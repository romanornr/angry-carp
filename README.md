# Angry Carp

Angry Carp helps you investigate phishing emails and prepare abuse reports for the providers that can act on them, such as hosts, registrars, and email services. It tracks what was reported, what remains unfinished, and what providers say they removed or blocked.

You work with an AI agent, review the evidence, and approve each outgoing report. The aim is to help providers stop phishing infrastructure. Reporting does not guarantee a takedown.

## What you can use today

This repository currently provides Markdown instructions for guided investigation and report drafting. The [local integration](agent/README.md) provides Pi browser authentication and a Flue agent for triaging prepared email evidence. Login and local logout have succeeded; a first live Flue assessment has completed. There is no production Angry Carp CLI yet. Rust tools and local SQLite storage are planned; the code in `experiments/` contains research checks, not an application to install.

The instructions work with the capabilities your agent already has. They do not connect Gmail, provide storage, or enforce tool permissions by themselves.

## Use the instructions with your agent

Make these two files available together, either in the agent's workspace or as attached documents:

| File | Purpose |
| --- | --- |
| [Manual Gmail workflow](phishing-workflow.md) | Start a scoped investigation, assess messages, resume unfinished work, and track provider responses. |
| [Provider abuse reporting](provider-abuse-reporting.md) | Select verified recipients and prepare readable reports with the necessary evidence and disclosure checks. |

The reporting file is the reusable skill source. There is no packaged skill installer yet. Loading the Markdown explicitly is the supported starting point; copying it into a host's skill directory has not been verified for every agent.

For an agent that can read this repository, start with:

```text
Read phishing-workflow.md and provider-abuse-reporting.md.
Help me prepare a manual phishing investigation. First explain which
email, evidence-storage, and privacy capabilities are available.
Propose Inbox and Spam over the last 14 days, capped at 10 messages,
and wait for me to start the run. Do not send reports or change mail.
```

If you attach the files instead, refer to the attachments in the prompt. Connect email through your host's supported connection flow if it is available. An agent without email access can help with a supplied, redacted text example. Never paste account-access secrets into the conversation.

Before real mail is processed, establish what the model will receive and where private evidence will be stored. The workflow calls for filtered text, relevant headers, and link information; complete originals and attachment bytes remain local by default. If a connector cannot meet that boundary, the agent must explain the limitation rather than claim it has filtered the evidence.

Each report is reviewed separately, including its recipient, body, and attachments. Original messages needed for investigations belong in private storage outside this repository. Ordinary mail is not kept as a permanent archive. Candidate phishing pages are never opened directly by the agent.

## Use with Grok Bot

`phishing-workflow.md` describes a manual workflow usable by Grok Bot and other agents. Pair it with `provider-abuse-reporting.md` when preparing instructions for a Grok Bot.

There is no verified one-click Grok Bot template or installation procedure in this repository. File loading, Gmail access, private storage, and execution controls need checking in the actual Bot. The file does not install or update a scheduled routine. See the [Grok capability research](docs/research/grok-capabilities.md) for what has and has not been established.

## Local agent and tools

The selected local runner is Flue, using Pi's OpenAI Codex provider with ChatGPT subscription authentication. Browser login and local logout have succeeded. The `PhishingTriage` module registers the authenticated provider and loads the shared instructions; a first live assessment has completed. See [local authentication and implementation status](agent/README.md) for commands, credential storage, and remaining work.

The triage command reads a prepared email text file and uses the existing workflow and reporting instructions, without filesystem, shell, browser, or mailbox tools for the model. Composio remains a candidate for later Gmail access; no mailbox connection is configured. Neither Flue nor Composio is required to use the Markdown instructions.

The broader incremental-checking workflow will remember completed checks, retry failures, and show mail left unchecked. Larger historical runs and Rust-based screening before AI review remain later candidates for evaluation.

## Project documentation

- [Workflow specification](docs/manual-workflow.md) and [Gmail labels](docs/gmail-labels.md)
- [Domain glossary](CONTEXT.md), [architecture options](docs/architecture-options.md), and [ADRs](docs/adr/)
- [Planning decisions and open questions](docs/planning/map.md)
- [Research findings](docs/research/) and [experimental code](experiments/)

Shared instructions use the role **operator**. Configure your own reporting identity, signature, mailbox, timezone, and private storage location. Keep credentials and personal evidence out of Git. The operator-approved local credential file is `agent/auth.json`, which is ignored by Git; original email evidence remains outside the repository.
