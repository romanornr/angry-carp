# Reusing an existing Codex login

Checked on 2026-09-22. The operator proposed reusing the existing Codex sign-in instead of creating another OpenAI credential store. The initial investigation below is followed by the bounded implementation update. This does not select the final investigator runtime.

## What is established

The installed CLI is `codex-cli 0.155.1`. Running `codex login status` returned `Logged in using ChatGPT`. This confirms the selected authentication method, not that a model request will succeed or that subscription capacity remains. No credential file was opened, token copied, model request made, or mailbox accessed during this check.

Codex caches its own login and refreshes ChatGPT tokens during use. Its configured storage can be a file under `CODEX_HOME`, which defaults to `~/.codex`, or an operating-system credential store. Angry Carp can leave those credentials under Codex's control. We have not inspected this machine's storage setting and should not claim a specific location. [Codex authentication](https://learn.chatgpt.com/docs/auth)

The TypeScript `@openai/codex-sdk` wraps the Codex CLI and exposes threads, streamed events, and structured output. Calling Codex through that interface uses Codex's authentication machinery. The SDK can select a local executable through `codexPathOverride`. Reuse requires the intended user environment and Codex home; another OS account or an isolated home may not have that login. [Codex SDK](https://learn.chatgpt.com/docs/codex-sdk), [TypeScript SDK source](https://github.com/openai/codex/tree/main/sdk/typescript)

The app-server offers a richer client interface. Its managed ChatGPT mode owns OAuth storage and refresh, and `account/read` can inspect authentication without requesting a token refresh. The experimental external-token mode instead makes the caller responsible for supplying and refreshing tokens. That mode does not solve our desire to leave credentials with Codex. [App-server authentication](https://learn.chatgpt.com/docs/app-server#authentication)

## What this means for Flue

The installed Flue runtime is 2.1.0. Its model layer uses Pi providers. The current starter selects `openai-codex/gpt-5.6-sol`, whose installed provider calls the ChatGPT backend through Pi's own OAuth implementation. Inspection of that provider and its OAuth module found no loading of Codex's credential cache. The model name alone does not connect Flue to the installed Codex CLI. [Flue providers](https://flueframework.com/docs/reference/provider-api/)

Flue requires a model for each agent. A tool that invokes the Codex SDK is possible, but the Flue agent still needs an authenticated model to choose and call that tool. Consequently, adding a Codex tool alone does not solve authentication for the main Flue investigator. [Flue model configuration](https://flueframework.com/docs/guide/models/)

| Approach | Existing Codex login | Engineering consequence |
| --- | --- | --- |
| Local application calls the Codex SDK | Codex owns authentication. | Recommended next integration to verify. Codex runs the investigation conversation; reusable case operations stay independent. This changes the proposed runtime arrangement. |
| Client uses Codex app-server | Codex owns authentication in managed mode. | Useful if we need interactive approval events, account UI, or richer client controls. More protocol integration than the first bounded task needs. |
| Flue agent calls Codex as a tool | Codex owns the delegated task's authentication. | Flue still needs its own authenticated model. Two agent loops are unnecessary for the first investigator. |
| Custom Flue provider backed by Codex | Plausible, not validated. | Must translate messages, tool calls, results, streaming, cancellation, and errors between two different interfaces. This is more than a credential adapter. |
| Read Codex tokens into Pi | Not selected. | Couples Angry Carp to credential formats and refresh ownership, and may miss OS credential storage. Avoid adding a second consumer of the token cache. |

The SDK runs an agent, not a generic model-completion endpoint. A custom provider cannot be assumed correct just because it returns text. In particular, Flue's tool execution and conversation state must not silently conflict with Codex's own tools and history.

## Recommendation and next implementation boundary

Keep the existing OpenAI login under Codex's control. Suspend the proposed Angry Carp-specific OpenAI login command and token store. Prefer a direct SDK call for the first local integration check, subject to discussing the runtime consequence with the operator. Keep the Flue starter unchanged until that choice is settled. OpenRouter remains an optional later path for Jev, not an automatic fallback for the main investigator.

The next implementation should demonstrate one synthetic task through the existing login, with a structured response and no new OpenAI credentials. Before running it:

- Select the intended Codex executable and verify ChatGPT authentication. An API-key environment or configured alternative provider must not silently change billing or routing.
- Verify availability of the intended `gpt-5.6-sol` model through Codex. Flue's catalog entry alone does not establish account access.
- Constrain the child process's tools, network access, MCP connections, hooks, and filesystem exposure. A read-only filesystem alone does not prevent URL requests or unrelated file reads. Existing Codex settings and connections must not become implicit authority for Angry Carp.
- Explain where Codex stores conversation history. Reusing authentication does not eliminate additional local records. Send only the already-agreed filtered evidence to the model when real-mail work is eventually enabled.

Success means a synthetic response arrives using the existing subscription login without copying credentials. A missing login, unavailable model, or exhausted allowance must produce an explicit failure, without a paid API fallback. This check would not establish safe Gmail acquisition, no-fetch enforcement for real mail, or approval-safe sending.

Codex authentication also does not grant Gmail access. Composio authorization remains a separate integration. The local CLI process requires a compatible host; this design does not establish deployment in a Cloudflare Worker.

No runtime adapter, credential store, or SDK dependency was added during the initial investigation. The runner choice remains open, so no new architecture decision record is accepted here.

## Bounded implementation update

The operator authorized continuing with a synthetic integration check. Inspection of TypeScript SDK 0.155.1 found no options for `--ignore-user-config` or `--ephemeral`, while the installed CLI supports both. The SDK dependency was briefly installed for inspection and removed. The check calls the CLI directly instead of adding an executable wrapper around the SDK. These flags skip the normal user configuration while retaining Codex authentication and request a session without persisted session files.

[`agent/src/check-codex.ts`](../../agent/src/check-codex.ts) exposes `npm run check:codex`. It uses only a fixed synthetic document-request example and requires a `Medium` classification with `reportReady: false`. A small environment allowlist excludes API credentials and endpoint overrides. Both authentication inspection and execution select Codex's `auto` credential-store mode so skipping user configuration does not change which store the model call uses. No token is read or copied by Angry Carp.

The child process disables common tools and integrations, uses an empty temporary working directory, and requests a read-only sandbox. It disables history persistence and cleans up its synthetic files after completion. Administrator configuration and operational logs remain reasons not to claim complete isolation or zero disk writes. See the [command instructions and storage explanation](../../agent/README.md).

The first attempt revealed that leaving the subprocess stdin pipe open makes Codex wait for more input, even with a prompt argument. The command now closes stdin before awaiting the child. This integration check exercises that behavior along with authentication and structured output; separate helper tests have not been added.

Validation on 2026-09-22: `npm run check:types` passed. After closing stdin, `npm run check:codex` passed against Codex 0.155.1 with `gpt-5.6-sol`, returning exactly `{"classification":"Medium","reportReady":false}` through the existing ChatGPT login. The earlier attempt's diagnostic was `Reading additional input from stdin...`, confirming why it stalled. This establishes one successful synthetic model call. It does not measure detection quality or prove the real-mail privacy boundary.
