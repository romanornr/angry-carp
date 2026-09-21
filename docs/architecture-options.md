# Manual architecture options

The [manual workflow specification](manual-workflow.md) now states the proposed operational contract and validation checks. The [independent review response](research/independent-review-response.md) records which second-opinion findings changed it and which implementation proposals remain open.

Status: the operator selected an agent already connected to email as the initial entry point. Reusable local Rust operations and SQLite remain the direction for case storage. Standalone mailbox acquisition and an optional analyst runner are deferred. The modular distribution remains accepted, including useful standalone skills and Markdown.

Angry Carp's workflow should be reusable through downloadable instructions, existing agents, and an optional local runner. Reusable mailbox, evidence, case, scan, and report operations support agents with executable-tool access. Agents supply reasoning and wording instead of recreating operational scripts. The comparison below records the alternatives considered; it does not select a language, database, or model.

The initial Angry Carp software runs locally. People may also bring its instructions to an existing hosted agent. Cloudflare hosting for Angry Carp remains an option for later consideration. Shared live state between local and cloud agents is not required. Separate model API credentials are acceptable as an option. See the [CLI workflow sketch](cli-workflow-sketch.md) for the proposed interaction with reusable code.

## Proposed modules and ways to use them

Maintain one workflow and one reporting skill, then package the instructions for each host. Keep the optional software behind a small interface so choosing a model runtime does not determine how evidence and reporting work.

| Module | Responsibility | Who can use it |
| --- | --- | --- |
| Workflow and reporting instructions | Evidence standards, investigation steps, disclosure rules, report wording, and follow-up rules | An operator or any capable agent |
| Host-specific instruction packages | Explain how to load the workflow, connect available tools, and identify missing capabilities | Grok Bot or a coding agent with the required capabilities |
| Reusable case tool and CLI | Intake of supplied evidence, private storage, case changes, checked disclosures, report versions, approval checks, and submission history | Existing agents and a local runner |
| Optional local analyst runner | Call a configured model and coordinate the permitted case operations | An operator who wants a standalone Angry Carp run |

These are responsibilities, not a requirement for separate repositories, services, or published packages. A module should earn its interface through actual reuse.

The entry points are downloadable instructions with existing connectors, instructions plus the local CLI, and the local CLI plus an optional analyst runner. The operator accepted support for useful investigation and drafting without the CLI. This mode must identify unavailable functions instead of claiming complete mailbox coverage, preserved originals, reliable case recovery, or enforced approvals that its host cannot supply. See [Keep the workflow independent of tools and runtimes](adr/0004-distribute-workflow-independently.md).

The prohibition on direct candidate fetches and the requirement to approve every report apply to every entry point. Missing controls do not relax those rules. A host without the required controls can support a narrower task, such as reasoning over supplied inert evidence and preparing a draft, with unavailable actions left to the operator. The concrete compatibility checks still need specification.

Host packages should contain setup and tool-use differences. They should reference or bundle a versioned copy of the same workflow and reporting skill. For a host that needs a single pasted document, assemble a self-contained export from those sources rather than maintain a separate report template. Include all required reference material in a download so relative links do not point to missing files. Packaging does not carry credentials, personal identity, originals, or case state.

Grok Bot distinguishes reusable skills from scheduled routines. Its template documentation excludes custom code and scripts, so installing its instructions must not imply that the CLI is installed or connected. Verify each host's import mechanism before promising a downloadable package for it. [Grok skills and routines](https://docs.x.ai/grok-bot/skills-routines-and-automations), [Grok templates](https://x.ai/bot/guides/templates-for-grok-bot).

The following architecture comparison concerns execution and case ownership. Its alternatives need not be mutually exclusive distribution choices.

## Design from the agreed requirements

Treat the requirements as foundations of a new design. The historical Grok routine provides operational experience and existing cases. The rewritten [Provider abuse reporting](../provider-abuse-reporting.md) guide supplies the shared reporting instructions. Its schedule, labels, prompt structure, and choice of host do not determine the new system's structure.

The [existing report workflow review](research/existing-report-workflow-review.md) compares the pre-rewrite skill and routine with sent reports, selected text attachments, and desk replies. Preserve the useful existing workflow and make intentional changes explicit. The research identifies reading burden as well as evidence-packaging, routing, claim-support, and outcome-recording failures. The reporting rewrite addresses the instructions; reusable code still needs to enforce the relevant operational checks.

| Requirement | Consequence for every candidate architecture |
| --- | --- |
| Complete originals remain private and unchanged | Store source evidence separately from assessments and disclosure copies. An agent revising its judgement must not rewrite the source. |
| Multiple agents may use the workflow | Case identity, evidence references, approvals, and submission history must survive a change of agent or model. |
| Different people may use Angry Carp | Shared workflows use the operator role. Each deployment supplies its reporting identity, mailbox, signature, timezone, and private evidence location. |
| A case can involve several providers | Track each reporting action and response independently. One overall resolved flag cannot represent mitigation at one provider and unfinished work at another. |
| Every initial-version report needs approval | Classification proposes a report; approval authorizes its reviewed payload. A High assessment cannot substitute for authorization. |
| The analyst must not contact candidate infrastructure | Enforce the restriction through available capabilities. A written instruction is not a technical restriction on an unrestricted browser or shell. |
| Scanners and abuse desks receive different evidence | Check the destination and disclosure purpose before data leaves the private store. One generic upload permission is insufficient. |
| Campaign links can be wrong | Preserve their supporting evidence and allow correction without losing original messages or provider ticket history. |
| Sending can fail ambiguously | Preserve the attempted action and reconcile delivery before retrying. An uncertain result cannot become a clean unsent state. |
| The first version runs manually | Scheduling is an optional caller of the workflow, not its owner. A future scheduler should not redefine evidence or reporting permissions. |

Gmail labels remain summaries of case work. The case record carries the facts. The model's conversation history is not the case record, and a scan verdict is one observation rather than a substitute for an assessment.

Existing routine settings such as daily budgets and age limits need an explicit fit check for manual operation. Preserve proven evidence and reporting rules without silently importing every Grok-specific operating choice.

## Agent instructions and existing connectors

```text
The operator -> agent instructions -> Gmail and approved analysis connectors
                         -> private evidence and case files
                         -> report preview -> the operator's approval -> sending tool
```

The host agent coordinates acquisition, assessment, records, and report preparation. Existing connectors supply mailbox operations. Markdown carries the workflow and report-writing rules.

This is the selected starting point. The operator uses an agent that already has email access, without creating a separate Gmail OAuth application for Angry Carp. The agent checks new and previously unchecked messages within the agreed scope. Rust screening before the agent sees a message is not a prerequisite for this path.

Build reliable incremental checking first. The accepted trial covers Inbox and Spam over 14 days, capped at ten messages. Successful checks, pending failures, and remaining coverage must survive the next run without retaining ordinary-message content. The [manual workflow](manual-workflow.md#start-and-resume) defines the required behavior. Larger historical runs and Rust screening are later candidates, subject to evaluation rather than prerequisites for the first version.

The connector's disclosure behavior still needs verification. If its response exposes complete message content to the model, later local filtering cannot undo that disclosure. The requirement to provide extracted evidence with secrets and unrelated personal information removed remains in force. Do not assume every email-connected agent can meet it or that its connector can transfer complete originals directly into local storage.

This requires little custom software, but correctness depends heavily on each runtime's tools and persistence. Connector schemas advertise raw reads and Spam searches, while completeness and fidelity remain unverified. Written instructions alone do not enforce the prohibition on candidate requests in a runtime that exposes unrestricted browser or shell tools. The complete operational workflow requires enforceable restrictions and dependable case persistence. A narrower drafting workflow must state its actual capabilities. See [mailbox capabilities](research/mailbox-capabilities.md) and [Grok capabilities](research/grok-capabilities.md).

## A private case tool assisted by AI

The operator's later choice of an already connected agent supersedes the earlier assumption that Rust must acquire and filter every message before the agent receives it. Reusable Rust operations accept evidence supplied through a verified intake path and manage durable case records in local SQLite. The agent proposes assessments. Agent-guided and direct terminal use share those case operations. The connector-to-tool transfer, disclosure controls, APIs, types, and schema still need design and validation.

```text
Mailbox -> existing agent connector -> permitted evidence for assessment
Supplied evidence -> Rust intake and case operations -> private SQLite
Calling agent -> proposed assessment -> Rust case operations -> private SQLite
Terminal -> the same Rust operations

No sending operation is enabled by this acquisition design.
```

The case tool owns the operational invariants: stable evidence references, checkpoints, reporting records, approved report versions, and reconciliation of uncertain sends. Its interface exposes case operations rather than requiring each calling agent to remember a sequence of low-level mutations. Established Gmail capabilities supply acquisition; a custom phishing classifier is not a prerequisite.

AI assesses deception and proposes campaign links and report wording. The CLI records these inputs against evidence references and owns the operational checks. It does not need to run the model itself. Its networking is limited to permitted provider operations and external-evidence requests, never direct candidate fetches. Restrictions on a calling agent's other tools must be enforced by its host; installing the CLI does not restrict an otherwise unrestricted browser or shell.

Rust can validate an assessment's structure and evidence references; those checks cannot establish that its interpretation is true. Keep raw originals distinct from the filtered evidence view and the model's assessment. Ordinary-email content is not retained after assessment. Whether unassessed originals temporarily survive a process restart remains an open engineering decision, separate from permanent case evidence.

The initial tool can serve agents operating on one private workspace. Different operators can use separate instances with their own configuration and evidence. [ADR 0006](adr/0006-use-sqlite-for-local-case-storage.md) selects SQLite for local originals and case records. Host restrictions, evidence retention, and authentication still need implementation choices. Future hosting does not imply that originals move into cloud storage; that need must be established separately.

## A hosted case system shared by agents

```text
The operator / Codex / Claude / Grok -> controlled case interface
                              -> one hosted case store and private evidence archive
                              -> mailbox, restricted analysis, and reporting modules
```

Agents use one authoritative case system. This can give local and cloud callers the same evidence references and submission history without copying mutable case files between them.

It also introduces hosting, authentication, access control, backup, and remote evidence-storage responsibilities before the first manual version is useful. Existing software might supply some responsibilities; none has yet been selected or demonstrated to satisfy the complete workflow. This option earns its cost only if shared access across environments is an initial requirement.

## Comparison

| Concern | Agent instructions and connectors | Private case tool with AI | Hosted case system |
| --- | --- | --- | --- |
| New software | Least, if the host already satisfies the requirements | Limited case and policy logic, with existing clients where suitable | Case logic plus hosting and remote access |
| Candidate-request prohibition | Requires suitable host restrictions; prompts alone are insufficient | CLI controls its own requests; the host must restrict the calling agent's other tools | Same requirement, operated centrally |
| Submission history | Depends on agent persistence and reliable file operations | One tool owns local case mutations | One system owns shared case mutations |
| Local manual operation | Feasible with verified connector capabilities | Natural initial deployment | Requires a running hosted system |
| Grok and local agents sharing live cases | Needs shared storage and coordination | Requires additional remote access or a single chosen runtime | Part of the proposed shape |
| Reuse | Existing connectors and skills | Existing mailbox clients and model runtimes | Existing infrastructure and potentially case-management software |

## Initial direction

Start with the portable workflow in an agent already connected to email. Verify its evidence disclosure and transfer capabilities before defining the shared CLI's intake interface. Keep deterministic evidence handling and reporting state in reusable code where that code is available, while the calling AI supplies evidence-backed assessments and draft wording. The operator prefers Rust for scripts and reusable implementation. That language preference does not select a phishing detector or model runner. Keep local filesystem, process, and storage access separate from reusable logic so a future Workers version can supply its own integrations.

Use existing libraries or clients where they satisfy the contract. A short agent skill teaches the workflow and points to the shared reporting instructions. It does not duplicate mailbox, scan, approval, or submission logic in prompts.

## Optional agent runtime

Flue is a candidate for a local agent runner, as well as possible later hosted operation. Its runtime executes agents; its SDK is a client for deployed agent conversations. A local Flue runner and existing coding agents can call the same CLI. Choosing local deployment does not settle which agent runs the workflow. [Flue workflows](https://flueframework.com/docs/guide/workflows/), [Flue SDK overview](https://flueframework.com/docs/sdk/overview/), [Local execution](https://flueframework.com/docs/cli/run/).

Flue supports multiple model providers and dynamic model selection through `useModel()`. An agent uses one model at a time. The current documentation says a change computed during a run takes effect on the next submitted input, rather than halfway through the current response. Provider credentials come from runtime configuration. This supports a configurable analyst or deliberate escalation to another model, but it does not establish that automatic routing improves phishing assessments. [Flue models](https://flueframework.com/docs/guide/models/).

The operator is considering an optional analyst runner alongside downloadable instructions and existing agents. A Flue runner would own model calls and tool orchestration. The shared case tool would still own evidence, disclosure checks, approvals, and submission history. Start with one configured model if a runner is selected. Switching providers changes who receives the model context, so approved model providers and their evidence access need an explicit policy before automatic switching.

The [local runtime comparison](research/local-agent-runtime-options.md) identifies three plausible approaches. Flue supplies broader session and agent behavior. Pi agent core supplies a smaller tool loop but leaves more runner integration to Angry Carp. A fixed workflow using AI SDK calls models for specific assessments and drafts while application code chooses the steps. All support multiple providers. The proposed evaluation should compare one synthetic investigation, operator review, and interrupted send before choosing a runtime. Local execution with a remote model still discloses the supplied context to that provider.

This distinction was checked through Context7 and official documentation on 2026-09-21. No Flue dependency, TypeScript implementation, hosting platform, or model integration has been selected.

For a later Cloudflare deployment, Flue's JavaScript shell supports file and text operations but not native binaries. Its Cloudflare Sandbox integration provides a container-backed Linux environment for installed CLI tools. A native Angry Carp executable would need a compatible environment such as that sandbox; it cannot be assumed to run inside a plain Worker. [Cloudflare target](https://flueframework.com/docs/guide/cloudflare-target/), [Cloudflare Sandbox](https://flueframework.com/docs/ecosystem/sandboxes/cloudflare/).

Keep reusable domain operations separate from command-line argument parsing. That allows the initial CLI to remain small and gives a later integration a choice of invocation method without duplicating the rules. This does not commit the project to a remote API, container deployment, or an additional adapter now.

## Decisions still needed

The [detection research and proposed evaluation](research/phishing-detection-design.md) distinguish detector quality from runner orchestration. Both comparisons need representative evidence before implementation choices are settled.

- How does each instruction package identify its host's capabilities and limit work when a required capability is missing?
- Does the local runner need an agent that chooses its next tool, or a fixed sequence of operations with model calls for assessments and drafts?
- Does the proposed command interface cover the operator's manual workflow without requiring replacement scripts?
- Which runtime can enforce the required tool and network restrictions?
- Can the selected connector supply the permitted model view and transfer unchanged originals to local storage without exposing them in model context?
- What is the private archive's acquisition scope, retention policy, and recovery plan?
- Which SQLite schema and workspace ownership rule prevent conflicting case updates, and how will submission reconciliation use those records?
- How will the existing Grok routine hand off unfinished cases, and which system owns reporting during migration? Manual operation alone does not prevent overlap with an existing scheduled sender.
