# Standalone commands

This workspace runs email analysis and HTML extraction without Flue, Pi or a model. Its only runtime dependency is `@angry-carp/checks`. Node.js 24 is required.

From the repository root after `npm ci`:

```sh
npm --silent run analyze -- evidence/emails/example.eml
npm --silent run extract:links -- evidence/example/body.html evidence/example/links.json
```

These commands build the library, then compile the CLI to JavaScript. Input and output paths are relative to the repository root. Absolute paths also work. When running a workspace script with `npm --prefix cli`, paths are relative to `cli/` instead. These direct scripts use the existing build; rebuild from the root after source edits.

Analysis automatically runs bounded DNS and RDAP lookups. It never visits candidate websites. The terminal displays findings, reporting candidates and incomplete checks without printing the email body or raw headers. Add `--json evidence/emails/example.analysis.json` to save the private structured result. No analysis file is created by default.

HTML extraction uses no network. Its output contains full references and a separate hostname summary. Both commands create output files with mode `0600` and refuse an existing output path. A hostname can contain a private identifier; the summaries are not anonymization.

See [analysis behavior](../docs/email-analysis.md) and [HTML extraction](../docs/email-links.md) for input, output and coverage contracts. [Flue assessment](../agent/README.md) is a separate consumer for optional AI interpretation.

`src/analyze.ts` and `src/extract-links.ts` own command arguments and output. Shared formatting, disclosure and bounded file reading live in `lib/`. Root `npm test` and `npm run check:types` build the library and check all workspaces. [ADR 0012](../docs/adr/0012-separate-cli-from-flue.md) records the boundary.

The result includes routing: completed checks with no concerns need no AI; detected concerns or remaining material gaps require assessment. This command never calls a model. Both analysis commands accept `--source-notes <reviewed-notes.json>`; see [source-note fields and disclosure](../docs/email-analysis.md#supply-reviewed-source-notes). The library reuses successful lookups and makes at most one additional bounded batch per family, under the same deadline.
