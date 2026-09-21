# CLI workflow sketch

Status: earlier interface proposal, reopened for review. The importer implementation has been withdrawn. None of these command names or data shapes is a requirement for its replacement. The operator wants an agent-guided experience with direct terminal use also supported.

The [manual workflow specification](manual-workflow.md) defines the operations, interrupted-work behavior, and remaining validation checks behind this interface.

This sketch covers the reusable software option. The [modular architecture proposal](architecture-options.md#proposed-modules-and-ways-to-use-them) also considers downloadable instructions and an optional local analyst runner.

Angry Carp is a reusable toolbox with private case records. A calling LLM reads evidence, judges deception, and supplies report wording. The CLI performs the repeatable operations so each agent does not write its own mailbox, parsing, scanning, or sending scripts.

## What you type

When working in an existing agent, start by asking it to check the mailbox using the Angry Carp workflow. The agent calls the reusable tools and brings you each question or report that needs your decision. You do not assemble assessment files or copy report IDs between commands.

For direct terminal use, the proposed entry points are:

```text
angry-carp inbox
  Show saved cases and unfinished work, with the next action for each.

angry-carp show C001
  Read the email evidence and see progress with each provider.

angry-carp review
  Open the next item needing your decision.
  For a report, show one provider's exact outgoing contents.
  Offer: Send this report, Request changes, or Later.
```

Here, inbox means the saved work queue, including cases discovered in Spam. Opening it does not fetch mail or run an AI model. Show when the mailbox was last fetched and which folders were covered.

Review must state what the operator is deciding. An uncertain email needs a focused question. A report needs its verified destination, wording, and disclosed evidence. Opening review never grants approval. Selecting Send this report approves that version and requests its submission through the same checked operation used by other callers.

## Commands the calling agent uses

Keep commands flat and use everyday verbs. These are callable separately so an existing agent can resume work without an embedded model runner.

| Proposed command | Purpose |
| --- | --- |
| `angry-carp fetch` | Retain new messages and resume the saved mailbox checkpoint. |
| `angry-carp inbox --json` | List saved cases and unfinished actions. |
| `angry-carp show C001 --json` | Return extracted text, header observations, and evidence references. |
| `angry-carp note C001 --stdin` | Save the agent's classification, reasoning, uncertainties, and supporting references as structured data. |
| `angry-carp scan C001 --link L001` | Request a private external scan after the target passes privacy checks. Optional when email evidence is sufficient. |
| `angry-carp draft C001 --stdin` | Validate the proposed destination, wording, and evidence, then save a report version for review. |
| `angry-carp send R001` | Submit the operator-approved report version and record the attempt outcome. |

The agent supplies structured note and draft data through standard input. The operator does not need to create intermediate JSON files. A note records the model's judgement and evidence; it cannot approve a report or mark it sent. The send command cannot create operator approval.

These names replace the earlier nested command proposal for discussion. They are not implemented or accepted as a final interface. Input schemas and the approval mechanism still need validation. A model's classification remains a recorded claim, not a guarantee supplied by the CLI.

## What the CLI owns

The operator selected one report at a time for review. The review operation presents the selected provider's payload and evidence, with other case actions summarized separately. Approval applies only to that report version; unfinished provider reports remain available on resume.

- Mailbox access, pagination, checkpoints, deduplication, and unchanged private originals.
- Safe extraction of message text, headers, literal links, and attachment metadata, using existing libraries where suitable.
- Case records, evidence references, provisional campaign links, provider tickets, and action history.
- Destination-specific privacy checks and external scan requests, with uncertain targets held for review.
- Report versions, evidence packaging, approval records, submission reconciliation, and due follow-up work.

## What the calling agent owns

- Explaining the deception, uncertainty, and contrary evidence.
- Proposing supported campaign links and investigating which verified providers can act.
- Supplying recipient-specific wording using the shared reporting skill.
- Asking the operator focused questions when context is missing.

The shared CLI returns readable output for a person and structured output for an agent. Changing the calling LLM does not change the evidence or action history in the private workspace. Different machines do not automatically share that workspace.

Keep command-line argument handling thin. Reusable code behind it owns the operations and rules. Calling agents create structured assessment or report data, not replacement implementations of those operations.

## Three cases the interface must handle

An email explicitly requests a recovery phrase. The agent can prepare an evidence-backed report without scanning a website. High confidence still does not authorize sending.

The operator approves a report, then its wording changes. The changed report requires renewed review. Approval must identify the outgoing contents it covers.

A send times out. The CLI preserves the uncertain attempt and reconciles it before allowing another send. Approval alone does not justify a blind retry.

The throwaway [CLI workflow prototype ticket](planning/issues/08-prototype-cli-workflow.md) links an earlier simulated terminal walkthrough of these scenarios. It uses synthetic data, makes no network requests, and does not implement real approval or host isolation. Its older command names do not represent this revised proposal.

## Scope of the CLI's controls

The CLI never fetches candidate infrastructure directly. It also cannot disable unrelated browser or shell tools in whichever agent calls it. Compatible host restrictions and the operator-approval mechanism still need concrete designs; the prototype does not prove them.

An optional local model runner, such as a Flue agent, can call the same operations. The CLI does not require a hosted application or its own LLM runtime. A downloadable instruction package can also guide a narrower workflow using the host's existing capabilities.
