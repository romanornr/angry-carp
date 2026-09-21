# Flue, Gmail, and Jev compatibility

Research date: 2026-09-22. The initial documentation check did not connect accounts or submit model requests. The operator subsequently authorized the Flue starter described below. Gmail integration remains untested.

## Jev through OpenRouter

OpenRouter lists `typesafe/jev-1.13` and the moving alias `~typesafe/jev-latest`. Its official cookbook calls `POST https://openrouter.ai/api/alpha/decisions` with `model`, `state`, and typed `questions`. This verifies an OpenRouter access path for Jev. The endpoint is marked alpha. [Model listing](https://openrouter.ai/typesafe/jev-1.13/), [Official decisions example](https://github.com/openrouterteam/docs/blob/main/cookbook/building-agents/gate-tool-calls-with-jev.mdx)

Flue supports OpenRouter among its model providers. That does not prove its ordinary agent-model calls support OpenRouter's separate decisions endpoint. A proposed integration would call Jev from a bounded classification tool while a conversational model handles investigation and drafting. Neither this integration nor Jev's phishing accuracy has been tested. Jev must not replace operator report approval. [Flue models](https://flueframework.com/docs/guide/models/), [Jev's typed outputs](https://docs.typesafe.ai/introduction)

## Gmail access from Flue

Flue accepts remote MCP servers through `useMcpConnection`, with Streamable HTTP, authorization headers, dynamic credential resolution, and an explicit tool allowlist. Flue leaves OAuth flows, token storage, and refresh to the application or integration. These capabilities make the following connections plausible; an authenticated end-to-end test remains necessary. [Flue MCP](https://flueframework.com/docs/guide/mcp/), [Connection definition](https://flueframework.com/docs/reference/agent-api/)

| Option | Verified setup | Limitation for Angry Carp |
| --- | --- | --- |
| Composio Gmail MCP | Gmail supports Composio-managed OAuth. Users authorize through a connect link; Composio supplies the OAuth app and manages tokens. MCP configurations can restrict exposed tools and accept an API-key header. The Gmail schemas expose RAW-message retrieval and Spam inclusion. | Introduces a separate service handling Gmail authorization and tool execution. Actual consent permissions, byte fidelity, Spam coverage, and disclosure behavior still need an authenticated check. |
| Google's Gmail MCP | Google documents a Streamable HTTP endpoint with OAuth and search/read tools. | Requires Developer Preview membership, a Google Cloud project, and OAuth setup. The documented thread-read formats do not establish complete RAW export. |
| Pipedream Gmail MCP | Documents account connection and tools to find email, read threads, and retrieve attachments. | Its documented reads may truncate content. They do not establish unchanged original-message export or complete Spam coverage. |

Sources: [Composio Gmail](https://docs.composio.dev/toolkits/gmail), [Managed OAuth](https://docs.composio.dev/toolkits/managed-auth), [Composio MCP configuration](https://docs.composio.dev/docs/single-toolkit-mcp), [Google MCP setup](https://developers.google.com/workspace/gmail/api/guides/configure-mcp-server), [Google thread formats](https://developers.google.com/workspace/gmail/api/reference/mcp/tools_list/get_thread), [Pipedream Gmail](https://mcp.pipedream.com/app/gmail).

Composio's full schemas document `format: "raw"` on `GMAIL_FETCH_MESSAGE_BY_MESSAGE_ID` as the entire RFC 2822 message encoded in base64url. `GMAIL_FETCH_EMAILS` exposes `include_spam_trash`. Managed-auth configurations also support overriding requested scopes. These are documented capabilities, not results from the operator's account. See [Gmail schemas](https://docs.composio.dev/toolkits/gmail.md), [Scope controls](https://docs.composio.dev/docs/authentication/controlling-scopes), and the [focused evidence-contract check](gmail-connector-evidence-contract.md).

## Implication for the next step

Composio also documents browser authentication for its consumer Connect MCP endpoint when the client supports that flow. Clients without this support use a consumer API key. This corrects the earlier assumption that every local user necessarily needs a developer project API key. Consumer connections and developer-project connections are separate, so the developer Gmail schemas above do not by themselves establish the consumer endpoint's exposed capabilities. Flue's documented token/header support does not establish automatic browser OAuth onboarding. Verify that flow and the consumer tools before promising a keyless setup. [Consumer authentication and project boundaries](https://docs.composio.dev/kb/guide/consumer-project-boundaries-and-auth-selection)

Composio is a concrete candidate for evaluating Flue without requiring the operator to create a Google OAuth application. This is a recommendation to evaluate, not a selected provider or permission to connect an account. Tool allowlists and OAuth scopes are separate controls: hiding send tools does not reduce the permission granted to the OAuth application.

Before using real mail, verify the granted permissions, raw export and Spam behavior, and whether originals can enter private local storage without entering model context. The existing requirement to filter model evidence remains unchanged. A synthetic Flue demonstration can test tool invocation without Gmail access, but cannot establish those mailbox properties.

The reusable Rust case operations remain independent of the runner. Flue's TypeScript integration would call those operations rather than duplicate case and approval rules. The connector-to-local transfer is still an open integration question.

## Startup guide read before scaffolding

The operator requested reading the startup guide before deciding whether to create an agent. The guide and linked getting-started page were read on 2026-09-22. They describe a TypeScript agent running locally under Node.js, with a minimum Node version of 22.19.0. A local run does not need an HTTP server or Cloudflare deployment. [Startup instructions](https://flueframework.com/start.md), [Getting started](https://flueframework.com/docs/guide/getting-started/)

The guide directs agent-assisted setup through `flue init`. Its `--force` option can overwrite scaffold filenames, including README, configuration, and agent instructions. The operator subsequently authorized a fresh `agent/` directory, created with `@flue/cli@2.1.0`, and dependency installation. The starter now selects `openai-codex/gpt-5.6-sol`, as approved by the operator. Authentication and Gmail tools have not been connected. [Startup instructions](https://flueframework.com/start.md)

The operator prefers the existing OpenAI subscription login, with OpenRouter reserved for optional Jev use later. The [Codex login investigation](codex-login-reuse.md) establishes a supported SDK route and explains why Flue's direct provider does not automatically inherit that login. A separate OpenAI credential store is no longer the proposed next step; the runtime integration needs to be settled first.
