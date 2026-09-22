# Angry Carp

Angry Carp helps you investigate phishing emails and prepare abuse reports for the providers that can act on them, such as hosts, registrars, and email services. Tracking reports, unfinished case work, and provider outcomes is planned.

You work with an AI agent, review the evidence, and approve each outgoing report. The aim is to help providers stop phishing infrastructure. Reporting does not guarantee a takedown.

## What you can use today

This repository provides portable Markdown instructions and a working [local TypeScript triage command](agent/README.md#assess-prepared-email-evidence). The Flue agent uses Pi browser authentication with your ChatGPT subscription. It can query RDAP and DNS, look up reference-domain candidates, compare domain lookalikes, and find reused passages in two supplied email bodies using Winnowing. Login, local logout, and live assessments have succeeded.

Mailbox acquisition, durable case operations, and report submission remain unimplemented. SQLite is selected for future case storage; Flue's conversation database currently records assessments. The code in `experiments/` contains research checks.

The instructions work with the capabilities your agent already has. They do not connect Gmail, provide storage, or enforce tool permissions by themselves.

## Use the instructions with your agent

Load the instructions for the task at hand, either from the agent's workspace or as an attached document:

| File | Purpose |
| --- | --- |
| [Phishing triage](phishing-triage.md) | Assess prepared email evidence, explain concern and confidence, and identify the next action. |
| [Provider abuse reporting](provider-abuse-reporting.md) | Select verified recipients and prepare readable reports with the necessary evidence and disclosure checks. |

The reporting file is the reusable skill source. There is no packaged skill installer yet. Loading the Markdown explicitly is the supported starting point; copying it into a host's skill directory has not been verified for every agent.

For an agent that can read this repository, start with:

```text
Read phishing-triage.md and assess the prepared email evidence I supply.
Explain the concern, confidence, and next action.
```

If you attach the files instead, refer to the attachments in the prompt. Connect email through your host's supported connection flow if it is available. An agent without email access can help with a supplied, redacted text example. Never paste account-access secrets into the conversation.

Before real mail is processed, establish what the model will receive and where private evidence will be stored. The workflow calls for filtered text, relevant headers, and link information; complete originals and attachment bytes remain local by default. If a connector cannot meet that boundary, the agent must explain the limitation rather than claim it has filtered the evidence.

Load `provider-abuse-reporting.md` when preparing or reviewing a report. Each report is reviewed separately, including its recipient, body, and attachments. Original messages needed for investigations belong in private storage excluded from Git. Local evidence files live in the ignored `evidence/emails/` folder. Ordinary mail is not kept as a permanent archive. Candidate phishing pages are never opened directly by the agent.

## Use with Grok Bot

`phishing-triage.md` assesses prepared evidence and can be used by Grok Bot or another agent. Load `provider-abuse-reporting.md` separately for reporting work. The broader acquisition and case-management requirements are in [Manual workflow](docs/manual-workflow.md).

There is no verified one-click Grok Bot template or installation procedure in this repository. File loading, Gmail access, private storage, and execution controls need checking in the actual Bot. The file does not install or update a scheduled routine. See the [Grok capability research](docs/research/grok-capabilities.md) for what has and has not been established.

## Local agent and tools

The selected local runner is Flue, using Pi's OpenAI Codex provider with ChatGPT subscription authentication. Browser login and local logout have succeeded. The `PhishingTriage` module registers the authenticated provider and loads the shared instructions; a first live assessment has completed. See [local authentication and implementation status](agent/README.md) for commands, credential storage, and remaining work.

The triage command reads a prepared email text file and loads the triage instructions and a compact reporting-channel reference, without filesystem, shell, browser, or mailbox tools for the model. Composio remains a candidate for later Gmail access; no mailbox connection is configured. Neither Flue nor Composio is required to use the Markdown instructions.

See [brand references](docs/brand-references.md), [domain lookalikes](docs/domain-lookalikes.md), and [shared passages](docs/text-reuse.md) for input requirements and algorithm limits. These tools supply observations, not independent phishing verdicts. The agent cannot retrieve official brand pages or search earlier email automatically. Supply official-source findings and any comparison body explicitly; reference domains can come from operator notes or the local directory.

[Reference-data research](docs/research/dns-reference-and-threat-lists.md) compares brand directories, service-domain catalogues, and threat lists. The agent uses a pinned 2FA Directory snapshot, with a [manual update guide](docs/updating-reference-data.md). Service catalogues and threat feeds remain proposals. A listed website, a service association, and a threat-feed hit have different meanings and must remain distinguishable.

The broader incremental-checking workflow will remember completed checks, retry failures, and show mail left unchecked. Larger historical runs and Rust-based screening before AI review remain later candidates for evaluation.

## Code reviews

[.coderabbit.yaml](.coderabbit.yaml) configures local CodeRabbit CLI reviews and pull-request reviews. It uses the `chill` profile, disables poems and in-progress fortunes, and enables automatic PR reviews while skipping drafts. CodeRabbit automatically reads [agent/AGENTS.md](agent/AGENTS.md) for the agent's coding conventions. Local skills referenced there are not bundled with this repository.

From the repository root, review local changes, including new files:

```sh
coderabbit review --uncommitted --include-untracked
```

Add `--agent` when requesting structured feedback through a coding agent. To review a branch against `main`, use `coderabbit review --base main`. These commands match the installed CLI 0.7.6. Reviews send code to CodeRabbit; private evidence and credentials must remain untracked. The config also excludes their known paths from review, but path filters are not a credential-access boundary.

Validate configuration changes with `coderabbit config validate`. For PR reviews, the CodeRabbit GitHub app must be enabled for this repository and the config must be pushed with the branch. No GitHub Actions workflow is required. See the [CLI reference](https://docs.coderabbit.ai/cli/reference), [repository configuration](https://docs.coderabbit.ai/getting-started/yaml-configuration), and [automatic guideline discovery](https://docs.coderabbit.ai/knowledge-base/code-guidelines).

## Project documentation

- [Documentation guide](docs/README.md): usage, assessment output, storage, standards, and design decisions.
- [Standards and reporting guidance](docs/standards-and-reporting.md): RFCs, ICANN guidance, and provider requirements.
- [Workflow specification](docs/manual-workflow.md) and [Gmail labels](docs/gmail-labels.md)
- [Domain glossary](CONTEXT.md), [architecture options](docs/architecture-options.md), and [ADRs](docs/adr/)
- [Planning decisions and open questions](docs/planning/map.md)
- [Research findings](docs/research/) and [experimental code](experiments/)

Shared instructions use the role **operator**. Configure your own reporting identity, signature, mailbox, timezone, and private storage location. Keep credentials and personal evidence out of Git. The local credential file is `agent/auth.json`; evidence files are in `evidence/emails/`. Both locations are ignored by Git.
