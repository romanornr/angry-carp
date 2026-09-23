# Flue assessment

The [standalone CLI](../cli/README.md) runs analysis without a model or login. Use Flue with Pi's OpenAI Codex provider and your ChatGPT subscription to interpret selected findings and reviewed text. [Full analysis behavior and limits](../docs/email-analysis.md) describe the result and disclosure contracts.

## Analyze an email

From the repository root:

```sh
npm --silent run analyze -- evidence/emails/example.eml
```

DNS and RDAP run automatically within fixed budgets. No candidate website is visited. The terminal prints findings, reporting candidates and coverage, without the body or raw headers. Nothing is saved unless you supply `--json <unused-output-path>`; that private output is created with mode `0600`.

## Assess analyzed email evidence

After signing in, supply the original and an explicitly reviewed text file:

```sh
npm --silent --prefix agent run triage -- ../evidence/emails/example.eml --reviewed-text ../evidence/emails/example.prepared.txt
```

Paths are relative to `agent/` under `npm --prefix`; absolute paths also work. The command analyzes the original in the trusted runtime. Completed applicable checks with no concerns return without loading authentication or conversation storage. Detected concerns or material gaps after bounded recovery automatically send selected fields and the reviewed text to OpenAI. Without reviewed text, required assessment stops with exit code 2; the original is never substituted. It prints deterministic findings and the AI assessment separately. Your original, unreviewed body, raw headers and attachment contents are not automatically sent. Hostnames can carry identifiers. The reviewed text is sent unchanged, so remove secrets and unrelated personal data yourself.

The old prepared-text-only and `--html` triage paths are replaced. To inspect a separate HTML fragment without MIME or a model, use [the independent extractor](../docs/email-links.md).

## Read the assessment

The model follows [the local assessment instructions](phishing-assessment.md) and submits concern, confidence, a deception hypothesis and evidence IDs. The CLI renders the selected recorded findings, registration records and attributed source notes. Reviewed email text is represented by a label rather than printed. Invalid or missing selections exit with code 1 while preserving the deterministic output. Free-form model prose is not displayed. The hypothesis and evidence weighting remain model judgments; this does not validate their correctness. [ADR 0016](../docs/adr/0016-render-recorded-assessment-evidence.md) records this contract.

The model interprets deception evidence; the runtime separately renders provider roles, reporting routes, their conditions and source provenance. The model does not receive the automatic provider-candidate or IP network records. Full investigation guidance remains available in standalone `phishing-triage.md`. [ADR 0014](../docs/adr/0014-keep-provider-routing-outside-ai-assessment.md) explains the split.

High concern, reporting readiness and permission to send are separate. Use `--source-notes <reviewed-notes.json>` to make separately reviewed external claims individually citable in the rendered assessment, following [the source-note contract](../docs/email-analysis.md#supply-reviewed-source-notes). No web browser or search is installed. Research is mandatory during future report preparation, not routine analysis; [ADR 0013](../docs/adr/0013-route-assessment-by-concerns-and-coverage.md) records this policy.

## Sign in and disconnect

Use Node.js 24. Run `npm ci` from the repository root to install the workspaces and build the shared library. Run the following commands from the repository root.

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

The operator selected `agent/auth.json` inside this repository. Both the sign-in/logout CLI and triage agent resolve it relative to their source files, so the terminal's working directory does not change that location. The existing `auth.json` Git ignore rule covers this file. Do not commit it or copy credentials from an existing Codex installation.

Pi owns the OAuth credential format, file locking, token refresh, and persistence. It writes the file with owner-only permissions, `0600`. The file is plaintext, not encrypted. Processes running as the same operating-system user, and privileged processes, can read it. Git ignore rules and file placement do not isolate it from those processes.

The trusted runtime may read, store, refresh, and use tokens. Tokens must stay out of model prompts, tool results, logs, and exposed errors. The model receives reviewed text and selected analysis fields. It has no filesystem, shell, browser or mailbox tools. The analyzer receives message bytes, not credentials, and performs public DNS/RDAP requests without OAuth headers. Runtime access to credentials does not grant that access to the model. Tools run in the trusted runtime process, not in a separate operating-system sandbox.

Flue's configured conversation database is `agent/data/flue.db`, separate from the credential store. It contains conversation data from completed assessments, but does not import original email files or maintain structured case records. Editing a prepared evidence file does not update past conversations.

Original emails and prepared evidence files live in `evidence/emails/` at the repository root. The whole `evidence/` folder is ignored by Git. Local evidence directories use owner-only permissions (`0700`), and the files use `0600`. These permissions allow other processes running as the same user to read them; the model's lack of filesystem tools is a separate boundary.

## Code responsibilities

| File | Responsibility |
| --- | --- |
| `../lib/src/email-analysis/analyze-email.ts` | Coordinates parsing, local checks and bounded DNS/RDAP; returns structured evidence and findings. |
| `../cli/src/analyze.ts` | Standalone original-email command without Flue or auth dependencies. |
| `../lib/src/email-analysis/analysis-output.ts` | Formats terminal results and selects the model disclosure fields. |
| `src/triage-cli.ts` | Calls the analyzer, supplies reviewed text to Flue, prints both outputs and owns shutdown. |
| `src/agents/phishing-triage.ts` | Loads `phishing-assessment.md`, registers the provider, structured assessment submission and optional passage comparison. |
| `src/auth.ts`, `src/auth-cli.ts` | Keep Pi's ModelRuntime private; handle browser login, storage and logout with sanitized errors. |
| `../lib/src/node/read-input.ts` | Reads bounded regular files without blocking on a FIFO. |

Both Pi packages remain pinned to `0.83.0`. This reuses Pi's provider and credential storage, not a Codex CLI adapter. `allowModelNetwork: false` disables catalog downloads during runtime creation, not OAuth or every later refresh.

The command disposes Flue through `await using`, then calls Pi's `cleanupSessionResources()` on success or failure. Pi can retain a cached WebSocket and a five-minute timer. Global cleanup belongs to this command, which owns all sessions in its process; it neither logs out nor deletes credentials. Cleanup failure reports a distinct sanitized message.

## Lookups and reporting

The analyzer selects DNS, domain RDAP and IP RDAP targets before optional assessment. Counts are runtime limits, not model instructions. [Selection, eligibility and limits](../docs/email-analysis.md#selection-and-limits) explain query priority, cancellation and privacy. [Reporting derivations](../docs/email-analysis.md#reporting-derivations) explain qualified recipients. Routes come from the maintained [reporting catalogue](../docs/reporting-catalogue.md) and case RDAP contacts.

The model retains `find_shared_passages` for two explicitly supplied body texts. Routine DNS, RDAP, brand, domain-comparison and reporting-channel bindings have been removed; the corresponding library functions remain directly reusable.

## Verify locally

```sh
npm test
npm run check:types
```

Root commands build the library before testing all workspaces. Synthetic tests exercise parsing, lookup planning, failure/cancellation, disclosure and the real Flue/Pi lifecycle with fake credentials and transport. They do not read stored credentials, call a model or visit candidate websites. Browser login and local logout were separately exercised by the operator earlier.

## Future deployment

MIME analysis currently uses Node streams. Workers execution has not been verified. A future deployment must validate or replace that adapter and the local login/file-storage concerns. Checks still use direct library calls; no cloud infrastructure or intermediate HTTP service is implemented.

`src/check-codex.ts` remains from the earlier existing-login experiment. It makes a synthetic model request and consumes subscription capacity. It is unnecessary for this Pi OAuth path; [historical findings](../docs/research/codex-login-reuse.md) explain it.
