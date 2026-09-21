# Local agent runtime options

Research date: 2026-09-21. These findings compare optional local runners. They do not select a dependency, language, or hosting service.

The [2026-09-22 Gmail and Jev compatibility check](flue-gmail-jev-compatibility.md) verifies OpenRouter's Jev decisions endpoint and documents Gmail MCP options for Flue. It does not establish an authenticated connection or select Flue.

Context7 supplied scoped documentation for Flue, Pi, and Vercel AI SDK. Official documentation and source repositories verified the capabilities below. No dependencies were installed, private messages accessed, or candidate URLs visited.

## Model choice does not require a full agent framework

All three options can use different model providers. Flue itself uses Pi's model-provider protocol, including providers such as Anthropic, OpenAI, Google, and xAI. It also accepts custom compatible endpoints. Model choice alone therefore does not distinguish Flue from a smaller runner. [Flue models](https://flueframework.com/docs/guide/models/)

The architectural question is who chooses the next investigation step: application code following a defined workflow, or a model choosing among available tools. Both approaches can request assessments and report drafts from an LLM. Neither approach should own Angry Carp's authoritative evidence, approval, or submission records.

## Flue

Flue supports local execution through `flue run` and a Node.js API. Its HTTP SDK serves a different purpose: controlling a deployed agent. Local use does not require Cloudflare or a hosted HTTP service. [Flue workflows](https://flueframework.com/docs/guide/workflows/)

Agents mount custom tools with `useTool`. Flue also provides skills, sandbox integration, conversation handling, and recovery features. This is useful if Angry Carp needs a standalone investigator that performs several tool calls, pauses for input, and resumes a conversation. [Flue agents](https://flueframework.com/docs/guide/building-agents/), [Flue tools](https://flueframework.com/docs/guide/tools/)

Flue's local sandbox accesses the host filesystem and spawns real processes. Its name does not establish isolation. An Angry Carp runner should expose restricted domain tools, with candidate-request restrictions verified independently of the framework. [Flue sandbox API](https://flueframework.com/docs/reference/sandbox-api/)

Flue explicitly distinguishes durable execution records from external effects. An effect can complete before its durable record is written, allowing a repeat during recovery. Angry Carp must still prevent duplicate reports and reconcile uncertain sends through its own persistent records. [Flue durability](https://flueframework.com/docs/guide/durability/)

Assessment: Flue can save work when session handling, skills, and recovery are immediate requirements. Its broader framework conventions create more integration to maintain than a few bounded model calls. This is a design judgment, not a measured maintenance or performance result.

## Pi agent core or coding-agent SDK

Pi separates its multi-provider model library, `pi-ai`, from its agent loop, `pi-agent-core`. The core supports custom tools, streaming events, context transformation, and hooks before tool execution. Provider support includes Anthropic, OpenAI, Google, xAI, and compatible local endpoints. [Pi agent core](https://github.com/earendil-works/pi/blob/main/packages/agent/README.md), [Pi model library](https://github.com/earendil-works/pi/blob/main/packages/ai/README.md)

The higher-level coding-agent SDK adds session management and coding-agent behavior. Its SDK supports custom tools and tool selection. The bare agent core is a more relevant comparison if Angry Carp needs a tool loop without adopting a coding assistant's whole environment. Session persistence requires a deliberate integration choice; it is not a case ledger. [Pi SDK](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/sdk.md), [Pi agent core](https://github.com/earendil-works/pi/blob/main/packages/agent/README.md)

Assessment: Pi core offers a smaller agent foundation, but Angry Carp would assemble more of the runner's sessions, user interaction, and recovery. It is not automatically simpler overall. Reusing Pi's coding-agent SDK can supply more behavior, at the cost of auditing and configuring that behavior for a phishing desk.

Current primary documentation uses the `earendil-works/pi` repository and `@earendil-works` package namespace. Older examples use different names. An implementation should pin compatible versions and use their documentation rather than mixing examples.

## A fixed workflow with Vercel AI SDK

AI SDK Core can call providers directly and request structured output. Its workflow examples show application code sequencing model calls and deciding whether another call is needed. This does not require an autonomous agent loop or Vercel hosting. Direct provider instances avoid requiring a model gateway. [AI SDK README](https://github.com/vercel/ai/blob/main/packages/ai/README.md), [AI SDK workflows](https://github.com/vercel/ai/blob/main/content/docs/03-agents/03-workflows.mdx)

For Angry Carp, a possible flow is to acquire evidence, request an assessment, validate the result, obtain allowed additional evidence when needed, and request a report draft. Code controls those transitions. A schema checks the assessment's shape; it does not prove that an accusation is supported by evidence.

Assessment: this is a useful baseline if the investigation steps are largely known. It limits model discretion and makes per-stage budgets easier to define. It can become cumbersome if cases need many different investigation paths. Storage, operator approval, and recovery still need application code.

## Common boundaries and costs

These are proposed Angry Carp responsibilities, independent of the runner choice:

- The reusable case tools own evidence references, approved payload versions, disclosure checks, submission attempts, and reconciliation.
- The runner receives only the evidence needed for its task. Local execution does not mean local inference when a remote model provider receives that evidence.
- Model-provider access needs a separate disclosure policy. Permission to send a URL to a private scanner does not authorize sending a full email to a model provider.
- The runner cannot approve its own reports. Tool availability can reduce exposure, but the sending operation must verify the operator's approval of the current report.
- Agent tools must not supply unrestricted browsing or shell access that bypasses the candidate-request prohibition. This also applies to existing coding agents used with the CLI.
- Model calls, external scanners, and any later hosting have their own costs. An extra review or agent loop can add calls. None of the compared libraries establishes a fixed total operating price.

## Recommendation for the architecture discussion

Keep the workflow instructions and reusable case tools independent of any runner. A user can use an existing suitable agent without installing Flue. An optional local runner can call the same operations.

Keep Flue on the shortlist. Compare it against a fixed workflow before committing to a full agent, with Pi core as the smaller agent-loop alternative. The useful comparison is how much bespoke work each needs for one synthetic investigation, an operator review, and an interrupted send. Model-provider choice is available in all three.

This comparison establishes plausible options, not verified Angry Carp integrations. No runtime has yet demonstrated the complete safety and recovery contract.
