# Local agent integration

The selected local runner is Flue, using Pi's OpenAI Codex provider with ChatGPT subscription authentication. Browser login and local logout work. `PhishingTriage` registers the authenticated provider and loads the shared workflow and reporting instructions. The first live assessment through Flue completed successfully. The terminal entry point now accepts a prepared-text file and prints the assessment once.

## Sign in and disconnect

Use Node.js 24. Run these commands from the repository root.

To sign in:

```sh
npm --prefix agent run auth:login
```

The command prints the credential-file location and an OpenAI authorization link. Open the link in your browser and complete sign-in. Pi receives the callback at `http://localhost:1455/auth/callback` by default. The browser must be able to reach that local process. The CLI supports the automatic browser callback, with a five-minute waiting limit and Ctrl+C cancellation; it does not accept pasted authorization codes.

To disconnect locally:

```sh
npm --prefix agent run auth:logout
```

Logout removes the `openai-codex` entry from the local credential store. The file may remain. This does not revoke authorization on OpenAI's side or erase tokens already held by another running process.

## Credential storage and access

The operator selected `agent/auth.json` inside this repository. The CLI resolves it relative to its own source file, so the terminal's working directory does not change the location. The existing `auth.json` Git ignore rule covers this file. Do not commit it or copy credentials from an existing Codex installation.

Pi owns the OAuth credential format, file locking, token refresh, and persistence. It writes the file with owner-only permissions, `0600`. The file is plaintext, not encrypted. Processes running as the same operating-system user, and privileged processes, can read it. Git ignore rules and file placement do not isolate it from those processes.

The trusted runtime may read, store, refresh, and use tokens. Tokens must stay out of model prompts, tool results, logs, and exposed errors. The first email assessment will accept prepared email text and give the model no filesystem, shell, browser, or mailbox tools. Runtime access to credentials does not grant that access to the model.

Flue's configured conversation database is `agent/data/flue.db`, separate from the credential store. It is not the authoritative case store.

## Code responsibilities

| File | Responsibility |
| --- | --- |
| `src/auth.ts` | Keeps Pi's `ModelRuntime` private and exposes login, logout, and the authenticated provider. Replaces exposed authentication errors with fixed messages. |
| `src/auth-cli.ts` | Selects the credential path, handles the browser interaction and cancellation, and prints command results. |
| `src/triage-cli.ts` | Reads the prepared-text file, runs the agent through Flue's runtime API, and prints one progress line and the final assessment. |
| `src/agents/phishing-triage.ts` | Registers the authenticated provider, loads the shared instructions, and scopes `PhishingTriage` to assessment of supplied email evidence. |

Both `@earendil-works/pi-ai` and `@earendil-works/pi-coding-agent` are pinned to `0.83.0`. This integration reuses Pi's provider and credential storage. It does not wrap the Codex CLI as a Flue model adapter. The provider's `apiKey` resolver accepts the resolved OAuth authentication; that name does not imply separate API billing.

`allowModelNetwork: false` disables catalog downloads during runtime creation. It does not disable OAuth traffic or every later catalog refresh.

## What has been checked

On 2026-09-22, browser login completed successfully. File metadata confirmed `0600` permissions and Git ignore coverage without reading token contents. The operator then ran local logout successfully. No model request was made through this integration during those checks.

Type checking and nine offline CLI scenarios passed. The CLI scenarios simulated the authentication dependency and covered argument handling, callback completion, cancellation, timeout, and safe error output. Token refresh has not been exercised with a live request.

The dependency audit reported seven affected package entries, tracing to Undici, brace-expansion, and the existing Hono dependency. Inspection found no trigger for the reported vulnerabilities in the current authentication path; the affected versions remain installed. Importing Pi initializes a plain Undici global dispatcher in a fresh Node process. Dependency updates and future server exposure require their own assessment.

## Assess prepared email evidence

After signing in, run this command from the repository root with the absolute path to your prepared text file:

```sh
npm --silent --prefix agent run triage -- /absolute/path/prepared-email.txt
```

The npm command runs from `agent/`. The module resolves `auth.json` there and reads `../phishing-workflow.md` and `../provider-abuse-reporting.md`. Use this command so those relative paths resolve consistently.

Supply extracted email text, relevant headers, and link information with account-access secrets and unrelated personal information removed. The supplied message and instructions are sent to the configured OpenAI provider. Flue's configured database stores conversation data in `agent/data/flue.db`. The command reads the prepared text locally; email contents are not passed as command arguments or echoed by the CLI. The input must be prepared text, not a raw `.eml` file.

`PhishingTriage` returns High, Medium, or Low concern, supporting and contrary evidence, material uncertainties, and the next supported action. No filesystem, shell, browser, mailbox, scanning, or sending tools are registered for the model. Keep report approval separate from assessment. Gmail access, case operations, and sending remain separate work.

The operator completed a first assessment of a prepared historical email. The original `flue run` command echoed the input and duplicated the answer; `triage-cli.ts` uses the same Flue runtime directly without subscribing to the verbose event display.

For Cloudflare later, replace the local browser-login entry point and file storage with suitable runtime and storage components. Keep those concerns separate from model access. Workers compatibility has not been verified; no cloud infrastructure is implemented.

## Earlier Codex CLI experiment

`src/check-codex.ts` and `npm run check:codex` remain from the earlier existing-login experiment. That command makes a synthetic model request through Codex CLI and consumes subscription capacity. It is not needed for the selected Pi OAuth path. The [historical findings](../docs/research/codex-login-reuse.md) explain that experiment.
