# Local agent integration

This directory contains a Codex login capability check and the earlier Flue starter. It is not yet a mailbox investigator. The Codex command accepts only a built-in synthetic example.

## Check your existing Codex login

Use Node.js 24 and an installed Codex CLI. The integration was developed against Codex 0.155.1. It requires `--ignore-user-config` and `--ephemeral`; an older CLI may reject these options.

From this directory, run:

```sh
npm install
codex login status
npm run check:codex
```

If you are not signed in, run `codex login` and choose ChatGPT. Do not add an OpenAI API key to `.env` for this check.

The command submits one synthetic document-request example using `gpt-5.6-sol`. It consumes subscription capacity. Success requires this exact result:

```json
{
	"classification": "Medium",
	"reportReady": false
}
```

The command prints `Codex login reuse check passed.` after validating the response. Missing authentication, an unavailable model, a timeout, or an unexpected answer produces an error. There is no automatic retry, model substitution, or API-key fallback.

This check passed on 2026-09-22 using Codex 0.155.1 and the existing ChatGPT login. Type checking also passed.

## Credentials and temporary files

Codex owns the login and token refresh. Both the status check and model call select Codex's `auto` credential-store mode, which prefers the OS credential store and falls back to its auth file. `CODEX_HOME` is preserved if set; otherwise Codex uses its normal home. Angry Carp does not read or copy tokens and does not create another credential store. This per-process choice does not edit your Codex configuration. [Codex authentication](https://learn.chatgpt.com/docs/auth)

The command creates a private directory under the OS temporary directory for the synthetic output schema and response, then removes it when the command finishes. Forced termination can leave that synthetic directory behind. It requests an ephemeral Codex session and disables history persistence; this does not promise that Codex writes no operational logs or updates no authentication metadata.

The child process receives a small environment allowlist, without API keys or endpoint overrides. It skips user configuration and execution rules, uses an empty working directory and a read-only sandbox, and disables shell, browser, app, plugin, hook, and subagent features. These controls are scoped to this check. They do not yet establish a verified isolation boundary for real phishing evidence or all administrator-managed configuration.

## Why this calls the CLI

The TypeScript SDK 0.155.1 does not expose the CLI's `--ignore-user-config` and `--ephemeral` flags. Calling the CLI directly keeps those controls without adding an SDK wrapper. [Integration findings](../docs/research/codex-login-reuse.md) explain the relationship to Flue.

The Flue starter remains in `src/agents/hello.ts`. It has no connected credentials or investigation tools. The main runner choice remains open. Gmail authorization, durable cases, and sending are separate work.

Run `npm run check:types` to type-check the code. The synthetic command is the behavior check for this increment; it is not a phishing-detection benchmark.
