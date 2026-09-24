# Agent entry points into deterministic tools

Researched 2026-09-24. Research and proposal only. No runtime changes, package installations, mailbox access, or candidate-site requests. Upstream implementation claims below come from source inspection, not execution of upstream tests. The pinned commits are inspected snapshots, not claims about released versions.

Implementation update, 2026-09-24: [ADR 0018](../adr/0018-distribute-cli-agent-entry.md) adopts the entry-point design. [The CLI guide](../../cli/README.md) describes the implemented commands and local package installation. The proposal and current-state descriptions below record the pre-implementation research.

## Recommendation

Give existing agents a short installable skill that starts the standalone analyzer and consumes an explicit, reduced-disclosure JSON result. Keep analysis in `lib/` and command execution in `cli/`. The skill supplies invocation and routing instructions. It does not reproduce DNS, RDAP, parsing, or classification logic.

Package the instructions with the executable so their versions agree. Preserve `phishing-triage.md` as the independent workflow for hosts without the executable, as required by [ADR 0004](../adr/0004-distribute-workflow-independently.md). A CLI-capable host should not need to load that whole investigation workflow before running deterministic checks.

This recommendation combines verified precedents below. It does not require a new service, MCP server, command framework, or integration-specific analyzer.

## Implementation precedents

### Microsoft Playwright CLI installs and checks skills

The project documents `playwright-cli install --skills` and a fallback where the agent reads `playwright-cli --help`. Its npm package declares a `playwright-cli` executable. The wrapper delegates command execution to `playwright-core/lib/tools/cli-client/program`; it does not implement browser commands itself. [CLI documentation](https://playwright.dev/docs/getting-started-cli), [package manifest](https://github.com/microsoft/playwright-cli/blob/74354ecc7a43da16d91a9bc54fa8db8283a3fcf5/package.json), [entry point](https://github.com/microsoft/playwright-cli/blob/74354ecc7a43da16d91a9bc54fa8db8283a3fcf5/playwright-cli.js).

`skillCheck.js` locates the skill bundled with the installed `playwright-core`. It compares that content against project-local copies in `.claude/skills/playwright-cli` and `.agents/skills/playwright-cli`, after normalizing line endings. A mismatch produces an update instruction on stderr. This is a concrete check against copied instructions drifting from the executable. It does not install a missing skill. [Implementation](https://github.com/microsoft/playwright-cli/blob/74354ecc7a43da16d91a9bc54fa8db8283a3fcf5/skillCheck.js).

Transferable idea: an executable entry point, discoverable help, and instructions tied to the installed version. Angry Carp does not need Playwright's browser sessions or its separate update-notification network request. The inspected skill is substantial, so this precedent does not establish that an effective skill must be tiny.

### Vercel agent-browser separates discovery from detailed instructions

Its external `SKILL.md` is a discovery stub directing the agent to `agent-browser skills get core`. Detailed instructions live in `skill-data/`, shipped alongside the stub. `cli/src/skills.rs` implements list, get, and path commands. The get command includes supplementary files only when requested with `--full`. [Discovery skill](https://github.com/vercel-labs/agent-browser/blob/d01253d9db28d75080e36da3c1c31ef89454731e/skills/agent-browser/SKILL.md), [skill command implementation](https://github.com/vercel-labs/agent-browser/blob/d01253d9db28d75080e36da3c1c31ef89454731e/cli/src/skills.rs).

The command normally locates instructions relative to the installed executable. It also permits an environment override, so version agreement is a packaging property rather than an unconditional guarantee. JSON mode emits a response object on stdout. In `print_primary_response`, JSON serialization is a separate branch from human formatting. This is machine serialization, not a privacy filter. [Package lookup](https://github.com/vercel-labs/agent-browser/blob/d01253d9db28d75080e36da3c1c31ef89454731e/cli/src/skills.rs#L29-L79), [output implementation](https://github.com/vercel-labs/agent-browser/blob/d01253d9db28d75080e36da3c1c31ef89454731e/cli/src/output.rs#L494-L530).

Transferable idea: a small discovery instruction can load the installed tool's current workflow on demand. Angry Carp can use one bundled entry guide without copying this project's multi-skill registry or browser daemon.

### GitHub CLI shares retrieval between human and machine output

The inspected tree also contains a canonical `skills/gh/SKILL.md` and a preview `gh skill install` command. Its agent registry selects `.agents/skills` for Codex and `.claude/skills` for Claude Code. Installed metadata tracks the source revision and skill tree. Updates compare recorded and remote tree hashes, not compatibility with the installed CLI or integrity of local file contents. This is a concrete multi-host distribution precedent, with different guarantees from Playwright's content comparison. [Canonical skill](https://github.com/cli/cli/blob/b6770c8bc54c72e74e785c307850446b8e10be9d/skills/gh/SKILL.md), [preview command](https://github.com/cli/cli/blob/b6770c8bc54c72e74e785c307850446b8e10be9d/pkg/cmd/skills/skills.go), [agent registry](https://github.com/cli/cli/blob/b6770c8bc54c72e74e785c307850446b8e10be9d/internal/skills/registry/registry.go#L49-L74), [update implementation](https://github.com/cli/cli/blob/b6770c8bc54c72e74e785c307850446b8e10be9d/pkg/cmd/skills/update/update.go#L257-L370).

`AddJSONFlags` takes a command's allowed fields and uses them for validation, completion, and help metadata. The PR view command passes selected fields into its existing finder and passes the returned object to an exporter. Unknown field names fail with the available names. Tests assert literal public field lists and serialized output. [Flag implementation](https://github.com/cli/cli/blob/b6770c8bc54c72e74e785c307850446b8e10be9d/pkg/cmdutil/json_flags.go), [PR view implementation](https://github.com/cli/cli/blob/b6770c8bc54c72e74e785c307850446b8e10be9d/pkg/cmd/pr/view/view.go#L97-L143), [exporter tests](https://github.com/cli/cli/blob/b6770c8bc54c72e74e785c307850446b8e10be9d/pkg/cmdutil/json_flags_test.go#L298-L390).

Results go to stdout, while command failures use stderr and exit status. Field selection is not a complete data-access restriction: the finder adds internal fields needed for retrieval, and jq filtering happens after serialization. [Error handling](https://github.com/cli/cli/blob/b6770c8bc54c72e74e785c307850446b8e10be9d/internal/ghcmd/cmd.go#L187-L240), [finder](https://github.com/cli/cli/blob/b6770c8bc54c72e74e785c307850446b8e10be9d/pkg/cmd/pr/shared/finder.go#L208-L290), [formatting manual](https://cli.github.com/manual/gh_help_formatting).

Transferable idea: reuse the operation and define an explicit output contract. Angry Carp needs a fixed disclosure projection before serialization. Generic field selection, jq, and templates would add options without solving that boundary.

## Discovery across hosts

Agent Skills defines a `SKILL.md` with name and description metadata, instructions, and optional supporting files. The description helps discovery; detailed instructions load when the skill is selected. This is a published skill format, not an RFC defining Angry Carp's analysis or routing. [Agent Skills specification](https://agentskills.io/specification).

Codex supports explicit skill invocation and description-based selection. Claude Code supports explicit `/skill-name` invocation and automatic selection. Their documented project locations differ: Codex uses `.agents/skills`; Claude Code uses `.claude/skills`. Both document symlink support for local skill directories. Distribution must account for each host's discovery rules instead of assuming one folder works everywhere. [Codex skills](https://developers.openai.com/codex/skills/), [Claude Code skills](https://code.claude.com/docs/en/skills).

A skill teaches an agent how to start. It does not guarantee invocation or compliance. Explicit invocation and host smoke tests make discovery checkable. Schema validation and disclosure projection belong in code, where a model cannot bypass them by submitting a different response shape. Arbitrary host shell access still permits actions outside the tool; package boundaries do not create a sandbox.

## Apply this to Angry Carp

The existing [library](../../lib/README.md) and [standalone CLI](../../cli/README.md) already separate deterministic analysis from Flue. The current `--json` option saves a complete private result to a file. It is not a reduced model-input mode. `cli/package.json` currently declares no installed binary and remains private. [Current analysis contract](../email-analysis.md).

The proposed complete increment would cover these connected changes:

1. Expose a built CLI entry point usable outside the checkout. Reuse existing commands and library exports, without rebuilding for each message.
2. Add an explicit agent-output mode that writes one versioned JSON result to stdout. Reuse `analysisForModel` and preserve routing, coverage, and evidence identifiers. Keep full private JSON export separate. Diagnostic text must not contaminate stdout in this mode.
3. Ship one short discovery skill and its version-matched workflow. The workflow obtains authorized original bytes, invokes analysis, checks execution status and routing, and explains missing-input handling. It does not invent an original from a connector's snippet.
4. For `no_concerns_detected`, return the deterministic result without another assessment operation. For concerns or material gaps, use the existing structured assessment contract. Reuse validation and rendering from [ADR 0016](../adr/0016-render-recorded-assessment-evidence.md) for host-supplied selections, rather than accepting a new free-form factual report.
5. Load reporting instructions only when the operator requests report preparation. Preserve required host research and approval separately from assessment. Keep the portable Markdown workflow available for users without the runtime.

These are proposed changes, not existing commands. The precise flag and entry-guide command should be chosen together with the CLI change. No installed `angry-carp` command is claimed here.

The design is an application function with thin adapters. `analyzeEmail` owns execution, `cli/` owns argument parsing and serialization, and a skill describes the calling sequence. The existing discriminated result and routing types supply the control flow. A versioned output object and evidence IDs supply the exchange format. None of these requirements introduces a search algorithm, plugin registry, queue, or new database. This is our interpretation of the precedents, not terminology prescribed by those projects.

The agent output must retain the current disclosure limits. Hostnames can contain identifiers, and reviewed source notes can include full URLs and claims. Reduced disclosure is not anonymization. A general-purpose host already uses inference to interpret a request and invoke the CLI. The routing goal is to avoid an additional assessment, not promise zero host tokens.

## Acceptance checks

Test the installed package outside the repository, not only workspace imports. Verify that help and bundled instructions resolve without checkout-relative paths. Machine mode must produce one parseable result on stdout with a documented version and execution status. Seed private bodies, headers, and identifiers into fixtures and assert the intended disclosure boundary.

Exercise a no-concerns message, a concern, an incomplete check, and invalid input. Validate host assessment selections against recorded evidence and reject unknown IDs. Then run one explicit skill invocation in Codex and one in Claude Code. Those host tests establish that the documented setup works in the tested versions; they do not prove every future automatic invocation.

## Independent opinion and decisions

Claude's independent report agreed on a short skill, discoverable CLI help, JSON on stdout, documented exit status, and retaining the existing library. It also distinguished skill discovery from enforcement. The report was delivered at `/tmp/angry-carp-agent-entry-claude.md`; the durable conclusions and source links are recorded here.

Two proposed details are not adopted in this recommendation. Claude suggested a broader `analysisForAgent` view containing terminal reporting candidates and network registrations. An agent consuming that view still receives those facts in its model context. For initial assessment, retain the narrower projection and [ADR 0014's separation](../adr/0014-keep-provider-routing-outside-ai-assessment.md). Expose reporting information for the explicit reporting task instead.

Claude's suggested skill also assumes a repository checkout and relative playbook paths. That can support local development, but an installed skill may live elsewhere. The proposed executable and bundled entry guide must work outside the checkout, with their referenced files included in the package. A skill installer alone does not supply the executable or its dependencies.

No token or latency savings were benchmarked. Exa located primary material, Context7 supplied CLI documentation, and pinned source inspection established the implementation details. GitHub CLI inspection was delegated independently. No claim about the number of implementation lines is needed to select this design.
