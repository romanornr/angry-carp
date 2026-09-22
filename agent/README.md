# Local agent integration

The selected local runner is Flue, using Pi's OpenAI Codex provider with ChatGPT subscription authentication. Browser login and local logout work. `PhishingTriage` registers the authenticated provider and loads only `phishing-triage.md`. The first live assessment through Flue completed successfully. The terminal entry point accepts a prepared-text file and prints the assessment once.

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

The operator selected `agent/auth.json` inside this repository. The sign-in and logout CLI resolves it relative to its own source file, so the terminal's working directory does not change that location. The triage agent resolves it relative to the process working directory; the documented npm command sets that directory to `agent/`. The existing `auth.json` Git ignore rule covers this file. Do not commit it or copy credentials from an existing Codex installation.

Pi owns the OAuth credential format, file locking, token refresh, and persistence. It writes the file with owner-only permissions, `0600`. The file is plaintext, not encrypted. Processes running as the same operating-system user, and privileged processes, can read it. Git ignore rules and file placement do not isolate it from those processes.

The trusted runtime may read, store, refresh, and use tokens. Tokens must stay out of model prompts, tool results, logs, and exposed errors. The first email assessment will accept prepared email text and give the model no filesystem, shell, browser, or mailbox tools. Runtime access to credentials does not grant that access to the model.

Flue's configured conversation database is `agent/data/flue.db`, separate from the credential store. It contains conversation data from completed assessments, but does not import original email files or maintain structured case records. Editing a prepared evidence file does not update past conversations.

Original emails and prepared evidence files live in `evidence/emails/` at the repository root. The whole `evidence/` folder is ignored by Git. Local evidence directories use owner-only permissions (`0700`), and the files use `0600`. These permissions allow other processes running as the same user to read them; the model's lack of filesystem tools is a separate boundary.

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

The npm command runs from `agent/`. The module resolves `auth.json` there and reads `../phishing-triage.md`. It does not load the reporting guide. Use an absolute input path, or a path relative to `agent/`:

```sh
npm --silent --prefix agent run triage -- ../evidence/emails/example.prepared.txt
```

Supply extracted email text, relevant headers, and link information with account-access secrets and unrelated personal information removed. The supplied message and instructions are sent to the configured OpenAI provider. Flue's configured database stores conversation data in `agent/data/flue.db`. The command reads the prepared text locally; email contents are not passed as command arguments or echoed by the CLI. The input must be prepared text, not a raw `.eml` file. Independent source findings can accompany the email in a separately labeled section of the same input file. Include the source URL, retrieval date, relevant statement, and limits of the finding. These are case evidence, not general assessment rules.

`PhishingTriage` returns the four sections described below. No filesystem, shell, browser, mailbox, scanning, or sending tools are registered for the model. Gmail access, case operations, and sending remain separate work.

The operator completed a first assessment of a prepared historical email. The original `flue run` command echoed the input and duplicated the answer; `triage-cli.ts` uses the same Flue runtime directly without subscribing to the verbose event display.

## Read the assessment

The instructions request four short sections:

| Section | What it tells you |
| --- | --- |
| Assessment | The conclusion, High/Medium/Low concern level, and confidence in the particular conclusion. |
| Evidence | The decisive facts and their sources, including material contrary evidence. Inferences are identified separately. |
| Checks and gaps | What came from your supplied evidence, what the agent checked during this run, and which unresolved facts matter. |
| Next action | A concrete step suited to your situation, including whether report preparation has a specific blocker. |

The current agent makes no independent web or registration lookups. If you provide an official-source excerpt, its analysis is based on that supplied note. A claim that the agent rechecked the page or attempted RDAP would be incorrect. An unsuccessful lookup is different from one that was never attempted.

High concern can coexist with missing reporting details or unknown installer behavior. Low concern from limited evidence does not certify safety. Assessments can change when new evidence arrives; a verdict does not authorize sending a report.

To include new evidence, add a labeled source note to your prepared file and rerun the command. Keep the URL, retrieval date, relevant statement, and limitations together. A rerun creates a new conversation; the command does not update a structured case record or automatically load earlier assessments. Include the earlier conclusion in your prepared context if you want an explicit comparison.

The output format is an instruction to the model, not a validated response schema. The CLI prints the returned text. Review claims against their cited evidence before acting.

See [standards and reporting guidance](../docs/standards-and-reporting.md) for the RFCs and provider sources, and [ADR 0007](../docs/adr/0007-separate-assessment-from-reporting.md) for the reason assessment and reporting are separate. These documents are not loaded into the agent prompt.

## Future deployment

For Cloudflare later, replace the local browser-login entry point and file storage with suitable runtime and storage components. Keep those concerns separate from model access. Workers compatibility has not been verified; no cloud infrastructure is implemented.

## Earlier Codex CLI experiment

`src/check-codex.ts` and `npm run check:codex` remain from the earlier existing-login experiment. That command makes a synthetic model request through Codex CLI and consumes subscription capacity. It is not needed for the selected Pi OAuth path. The [historical findings](../docs/research/codex-login-reuse.md) explain that experiment.
