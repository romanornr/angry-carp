# Standalone commands

This workspace runs email analysis, HTML extraction and host-assisted report preparation without Flue, Pi or a model. Its only runtime dependency is `@angry-carp/checks`. Node.js 24 is required.

## Use an existing agent

After `npm ci` at the repository root, put the local executable on your shell's PATH:

```sh
export PATH="$(pwd)/node_modules/.bin:$PATH"
angry-carp --help
```

The executable works from other directories. Paths to message and output files resolve against your current directory. It uses the existing build; run `npm run build` after source changes.

Save the output of `angry-carp instructions skill` as `SKILL.md` inside the chosen host's `angry-carp` skill directory. Codex uses `~/.agents/skills/angry-carp/`; Claude Code uses `~/.claude/skills/angry-carp/`. Review an existing file before replacing it. The short skill loads its workflow from the installed executable, so detailed instructions are not copied into each host. Installing the skill alone does not install the executable. See the [source-backed discovery comparison](../docs/research/agent-entry-points.md#discovery-across-hosts).

Invoke `$angry-carp` in Codex or `/angry-carp` in Claude Code with an authorized original email. Automatic selection depends on the host. No mailbox connector or monitoring is installed by this command. The skill does not pre-approve shell commands with `allowed-tools`; execution remains subject to the host's permissions.

```sh
angry-carp analyze /private/original.eml --format json --output /private/new-packet.json
angry-carp instructions assessment
angry-carp assess /private/new-packet.json /private/selection.json
```

`--format json` writes one version 2 packet to stdout. It contains `analysis` from the existing reduced assessment projection and `assessmentEvidence` with selectable IDs. Domain comparisons use named `resemblance` observations instead of the version 1 comparison fields. Diagnostics stay on stderr. `--output` optionally saves this same packet with mode `0600` and refuses overwrite. `--json` remains the separate full private analysis export, also version 2. Neither file is created by default.

`assess` accepts saved version 1 and version 2 packets and renders their recorded evidence without rerunning detection. It does not reinterpret old comparisons or migrate stored files. Other packet versions are rejected.

An existing output path exits 2 before lookups. A later save failure exits 4 after emitting the result on stdout; reuse that result instead of repeating analysis. A crash during a file write can leave incomplete JSON. Validate saved files before reuse, and retain or remove incomplete output explicitly. No automatic overwriting or cleanup of user files occurs.

On completed no-concerns routing, return the result without further assessment. On concerns or material gaps, the host supplies a structured selection following `instructions assessment`. `assess` validates and renders recorded evidence without network requests or another model call. It rejects unknown IDs, extra selection fields, unsupported packet versions, duplicate record IDs and packets whose routing does not require assessment. Packet files are caller-retained evidence, not authenticated receipts. Keep them unchanged. This path does not include a `reviewed_text` selection because the packet contains no message body.

`angry-carp instructions reporting` loads reporting instructions only when requested. It includes the preparation-file procedure. The existing `report start` and `report check` commands require retained private analysis and explicitly reviewed request/research/draft files. They do not send reports.

## Install the built packages outside the repository

The packages are private and are not claimed to be published on npm. Build and pack both workspaces locally:

```sh
npm run build
npm pack --workspace @angry-carp/checks --ignore-scripts
npm pack --workspace @angry-carp/cli --ignore-scripts
```

In a separate installation directory, pass both generated tarball paths to `npm install --ignore-scripts`. The CLI's dependency resolves to the supplied checks package. Put that directory's `node_modules/.bin` on PATH. No Flue or Pi dependency is required. All instruction files and the reference snapshot travel with these packages. Rebuild before packing; `--ignore-scripts` intentionally does not build for you.

## Develop in the checkout

From the repository root after `npm ci`:

```sh
npm --silent run analyze -- evidence/emails/example.eml
npm --silent run extract:links -- evidence/example/body.html evidence/example/links.json
```

These commands build the library, then compile the CLI to JavaScript. Input and output paths are relative to the repository root. Absolute paths also work. When running a workspace script with `npm --prefix cli`, paths are relative to `cli/` instead. These direct scripts use the existing build; rebuild from the root after source edits.

Analysis automatically runs bounded DNS and RDAP lookups. It never visits candidate websites. The terminal displays findings, reporting candidates and incomplete checks without printing the email body or raw headers. Add `--json evidence/emails/example.analysis.json` to save the private structured result. No analysis file is created by default.

HTML extraction uses no network. Its output contains full references and a separate hostname summary. Both commands create output files with mode `0600` and refuse an existing output path. A hostname can contain a private identifier; the summaries are not anonymization.

See [analysis behavior](../docs/email-analysis.md) and [HTML extraction](../docs/email-links.md) for input, output and coverage contracts. [Flue assessment](../agent/README.md) is a separate consumer for optional AI interpretation.

For reporting, `npm --silent run report -- start ...` creates a private preparation from a reviewed request and existing analysis. Your AI host performs targeted research. `report -- check ...` checks its attributed research and exact draft against that preparation. It never searches or sends. [The report-preparation guide](../docs/report-preparation.md) documents the input files, source policy and operator-review boundary. Held reports exit 3, input/file failures exit 1 and usage errors exit 2.

`src/analyze.ts`, `src/extract-links.ts` and `src/report.ts` own command arguments and output. Shared formatting, disclosure, reporting checks and bounded file reading live in `lib/`. Root `npm test` and `npm run check:types` build the library and check all workspaces. [ADR 0012](../docs/adr/0012-separate-cli-from-flue.md) records the boundary.

The result includes routing: completed checks with no concerns need no AI; detected concerns or remaining material gaps require assessment. This command never calls a model. Both analysis commands accept `--source-notes <reviewed-notes.json>`; see [source-note fields and disclosure](../docs/email-analysis.md#supply-reviewed-source-notes). The library reuses successful lookups and permits at most two attempts per check within the shared request budget and deadline.
