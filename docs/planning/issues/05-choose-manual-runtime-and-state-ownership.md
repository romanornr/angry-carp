# Choose the manual runtime and state ownership

Type: grilling
Labels: wayfinder:grilling
Status: claimed
Assignee: operator with Codex
Parent: ../map.md
Blocked by: 01, 02, 03, 04, 06, 08

## Question

Which architecture best supports the agreed manual workflow: portable agent instructions with existing connectors, a deterministic mailbox and evidence tool assisted by an AI analyst, or another established approach? Compare safety enforcement, privacy, evidence fidelity, restart recovery, cross-agent portability, maintenance, and operational cost. Identify the authoritative owner of case state and how multiple agents avoid duplicate submissions.

Choose a language only if custom code is justified. Explain what existing tools can supply before adding new components. Record warranted architectural trade-offs in docs/adr/ without designing the deferred scheduler or dashboard.

## Comments

The operator authorized a synthetic check of existing-login reuse. The implementation calls Codex CLI directly because SDK 0.155.1 lacks `--ignore-user-config` and `--ephemeral` options. See the [implementation update](../../research/codex-login-reuse.md#bounded-implementation-update) and [run instructions](../../../agent/README.md). The Flue starter remains unchanged. This check does not settle real-evidence isolation, Gmail transfer, case structures, or the final runner.

Current implementation status: the operator authorized a Flue starter in `agent/` and selected `openai-codex/gpt-5.6-sol`. Authentication and investigation tools are not connected. The operator then proposed reusing the existing Codex login. The [integration findings](../../research/codex-login-reuse.md) distinguish supported Codex SDK use from an unvalidated Flue provider adapter. Recommend discussing a direct SDK call before implementing separate OpenAI credential storage. This does not select a replacement runner or change case authority, Gmail permissions, or report approval requirements.

The operator accepted incremental checking through the existing agent connection first. Keep the initial Inbox and Spam trial at 14 days and ten messages. Remember successful checks, retry failures, and use overlapping discovery without relying solely on a last-checked timestamp. Keep ordinary-message content temporary and retain originals needed for investigations. Larger one- or two-month backlog runs and Rust screening before AI review are deferred candidates whose value and reliability need evaluation. The behavior is agreed; checkpoint representation and connector transfer remain open engineering work.

The operator selected an agent already connected to email as the initial entry point, after identifying the setup burden of separate Gmail OAuth credentials. This supersedes the earlier assumption that Rust must acquire and screen mail before the agent receives it. Existing connectors supply mailbox access; reusable Rust operations remain the direction for durable case work in SQLite. Both agent-guided and terminal use share those case operations. The [architecture proposal](../../architecture-options.md#agent-instructions-and-existing-connectors) records the choice. Connector disclosure behavior and transfer of originals into local storage remain unverified. The withdrawn importer's types, schema, manifests, and command names remain unapproved. Standalone acquisition and a custom runner are deferred.

The operator selected SQLite for local storage after the recovery check. [ADR 0006](../../adr/0006-use-sqlite-for-local-case-storage.md) records originals and case records together in a private database. The operator questioned whether storing originals in R2 or separate files would help at all. Future cloud retention and storage placement remain undecided. This settles the local database choice while runtime, whole-run ownership, and approval enforcement remain open.

Latest scope: the operator authorized bounded mailbox and synthetic storage checks, explicitly excluding any sending. The [capability findings](../../research/manual-capability-check.md) record three RAW samples and Spam ID coverage through the current connector. This supersedes the earlier assumption below that Spam access remained wholly unverified; it does not activate Spam discovery in an installed routine. The operator now prefers Rust for scripts and reusable implementation, with future Workers reuse as a consideration. Local execution remains the current target.

Three competing sketches are in [Manual architecture options](../../../docs/architecture-options.md): agent instructions with connectors, a private case tool assisted by AI, and a hosted shared case system. The initial entry point is now selected above; evidence intake and case ownership details remain open.

The operator explicitly requested principle-redesign-from-first-principles. The sketches now derive their responsibilities from the agreed evidence, privacy, approval, and case requirements. Treat the existing Grok routine as experience and migration input; do not make its prompt, scheduler, or labels the foundation of the new architecture.

The operator clarified that portability means one reusable agent-independent CLI usable by Codex, Claude, omp, or another LLM. Shared live cases between a local machine and Grok's cloud runtime are not an initial requirement. Separate model API credentials are acceptable as an option, but an embedded model runner is not a requirement. Reusable code owns case operations so each agent does not recreate scripts; existing connectors supply initial mailbox access. The command interface needs a concrete walkthrough before deeper architecture choices.

The operator selected local execution for the first version and deferred consideration of Cloudflare. The analyst runtime remains open. Flue supports local runs and model selection across providers, so it is a candidate for a standalone analyst runner even without cloud hosting. Compare that experience with an existing coding agent calling the CLI before selecting a dependency. Keep case operations independent of the chosen runner.

The operator proposed modular distribution: downloadable skills or Markdown for existing agents, reusable CLI operations, and an optional local agent such as Flue. The architecture comparison now separates distribution from execution and state ownership. The operator accepted useful guided investigation and report drafting without the CLI, with missing host capabilities stated explicitly. This distribution decision is recorded in [Keep the workflow independent of tools and runtimes](../../../docs/adr/0004-distribute-workflow-independently.md). Compare a full agent runtime with a smaller agent library and a fixed workflow with focused model calls before selecting the local runner. This ticket remains open because runtime, storage, enforcement, and interface choices are unresolved.

The [local runtime research](../../../docs/research/local-agent-runtime-options.md) compares Flue, Pi agent core, and a fixed AI SDK workflow. Multi-provider model support is available in each. The remaining choice concerns how the investigator chooses its steps and how much session behavior the framework supplies. No runtime was installed or selected.

The operator agreed to adopt the modular structure and compare Flue against a fixed workflow before choosing the local runner. Pi remains background research, not an additional required implementation. The comparison should test how much freedom the investigator needs to choose its next operation, rather than select a framework for model-provider support alone.

The operator supplied a LEXO article about Unicode lookalikes in sender names as future detection input. Its useful signal and a reproduced false positive in its published regex are recorded in [Phishing evidence options](../../../docs/research/phishing-evidence-options.md#unicode-lookalikes-in-sender-names). This is a candidate evidence-extraction feature, not a selected classifier or permission to report from a regex match.

The operator challenged whether planning was grounded in the supplied template and actual reports. A [retrospective review](../../../docs/research/existing-report-workflow-review.md) now compares both original Markdown files with selected outgoing correspondence and evidence attachments. Preserve the existing report structure and operational recovery rules. Prioritize exact evidence packaging, verified destinations, defensible claims, approval, and scoped provider outcomes. The seven-day first-run proposal was already in the routine and must be treated as an existing setting, not a new requirement. The later suggestion to expand discovery to Spam remains unaccepted and capability-dependent.
