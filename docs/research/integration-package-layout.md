# Integration and package layout precedents

Research date: 2026-09-23. This note compares ownership in two official repositories and the Agent Skills specification. It proposes no migration or new workspace.

## What the sources establish

Mastra puts its core library in `packages/core`, its executable CLI in `packages/cli`, and its Tavily integration in `integrations/tavily`. The Tavily package declares a peer dependency on `@mastra/core`. The executable `mastracode/tui` package consumes both the core and Tavily packages. Thus, an integration can be an imported capability, while a different package owns the application. The directory `packages/` also contains an executable, so the name does not mean libraries only. Sources pinned to `c61d52c338dbd77f3e8f0e7487f44b1f0a0d1350`: [core manifest](https://github.com/mastra-ai/mastra/blob/c61d52c338dbd77f3e8f0e7487f44b1f0a0d1350/packages/core/package.json), [CLI manifest](https://github.com/mastra-ai/mastra/blob/c61d52c338dbd77f3e8f0e7487f44b1f0a0d1350/packages/cli/package.json), [Tavily manifest](https://github.com/mastra-ai/mastra/blob/c61d52c338dbd77f3e8f0e7487f44b1f0a0d1350/integrations/tavily/package.json), and [application manifest](https://github.com/mastra-ai/mastra/blob/c61d52c338dbd77f3e8f0e7487f44b1f0a0d1350/mastracode/tui/package.json).

n8n keeps the executable `n8n`, reusable `n8n-core`, and connector collection `n8n-nodes-base` under `packages/`. The executable depends on the other two. Gmail nodes belong to the connector collection, rather than a separate workspace for each external service. This shows that dependency ownership can remain distinct under one directory category. Sources pinned to `fe0fad574337a5fa875a0e8650c0dbcc49a1c272`: [CLI manifest](https://github.com/n8n-io/n8n/blob/fe0fad574337a5fa875a0e8650c0dbcc49a1c272/packages/cli/package.json), [core manifest](https://github.com/n8n-io/n8n/blob/fe0fad574337a5fa875a0e8650c0dbcc49a1c272/packages/core/package.json), and [connector manifest](https://github.com/n8n-io/n8n/blob/fe0fad574337a5fa875a0e8650c0dbcc49a1c272/packages/nodes-base/package.json).

The Agent Skills specification requires a directory with `SKILL.md`. Scripts, references, and assets are optional. It does not require `package.json`, npm publication, or membership in a JavaScript workspace. A skill may declare environment requirements in its metadata. [Agent Skills specification](https://agentskills.io/specification)

Context7 also confirms that Mastra applications can run as servers or inside existing web frameworks, and can import workspace packages. This documents deployment choices, not a mandatory repository layout. [Mastra deployment overview](https://github.com/mastra-ai/mastra/blob/main/docs/src/content/en/docs/deployment/overview.mdx), [monorepo deployment](https://github.com/mastra-ai/mastra/blob/main/docs/src/content/en/docs/deployment/monorepo.mdx)

## Implications for Angry Carp

The following judgments are recommendations, not requirements from those projects.

The current `lib/`, `cli/`, and `agent/` split already expresses the dependency ownership required by [ADR 0012](../adr/0012-separate-cli-from-flue.md). `apps/{cli,flue}` with `packages/checks` would make executable consumers visually explicit, but the precedents do not justify that move by themselves.

`integrations/flue` is a reasonable name if the aim is to identify framework-specific code. It needs an explicit description that this package also owns execution, authentication, and conversation storage. A future Gmail integration may instead be a connector imported by multiple execution hosts. Sharing their parent directory would not make those responsibilities identical.

A portable skill can live in `skills/phishing-triage` without becoming an npm workspace. Its distribution must preserve the independent assessment instructions required by [ADR 0004](../adr/0004-distribute-workflow-independently.md). Add a package manifest only when there is a concrete JavaScript build or distribution requirement.

Keep the current layout unless directory ambiguity is causing a real problem. If the user wants Flue named explicitly now, moving only `agent/` is the smaller option. Decide future Gmail and skill packaging from their consumers and distribution needs when those components exist. None of the sources establishes that every model provider needs a separate application.

These are large framework repositories with different release needs. Their layouts supply examples, not evidence that Angry Carp benefits from the same number of directories or packages.
