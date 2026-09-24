# Structural lint precedents

Checked 2026-09-24. Keep Oxlint for code-level rules and add project-local
Konsistent for a few cross-file contracts. Vercel's AI SDK already uses both.
Its configuration is a useful precedent for specific export and sibling-file
requirements, not a preset to copy wholesale.

Exa discovery covered two search workstreams and ten requested results.
The findings below were checked against pinned GitHub source files. They
establish committed adoption, not a benchmark or proof that every CI run passes.

## Actual consumer configurations

| Repository and pinned revision | Observed configuration | What fits Angry Carp |
| --- | --- | --- |
| Vercel AI SDK, `2147b86ac48bb0e707eaeb8c8e09af4ab0023012` | Pins `konsistent` to `1.0.0-beta.9`. Its root scripts validate and check `.github/konsistent.json`, and CI runs `pnpm konsistent`. The configuration requires package files and provider exports, with exceptions attached to individual contracts. | Name each contract, check both configuration validity and source structure, and keep exceptions narrow. |
| Vercel AI SDK, same revision | Uses Oxlint alongside Konsistent. Its Oxlint configuration extends Ultracite presets, loads a local URL-validation rule, and has path-specific overrides. | Give each checker a clear responsibility. A large React/Next.js preset and its many disabled rules do not fit this Node project. |
| Vue Router, `287507b1861558407562b3145443d22785c6b0b8` | Uses a small `.oxlintrc.jsonc` with the TypeScript plugin, four explicit rule settings, and generated-output ignores. `lint` runs `oxfmt --check && oxlint`; `lint:fix` is separate. | Keep normal linting read-only and use targeted rule settings. This config does not enable type-aware analysis, so it is not evidence for removing Angry Carp's existing type-aware rules. |

AI SDK evidence: [package scripts and dependencies](https://github.com/vercel/ai/blob/2147b86ac48bb0e707eaeb8c8e09af4ab0023012/package.json),
[Konsistent configuration](https://github.com/vercel/ai/blob/2147b86ac48bb0e707eaeb8c8e09af4ab0023012/.github/konsistent.json),
[CI job](https://github.com/vercel/ai/blob/2147b86ac48bb0e707eaeb8c8e09af4ab0023012/.github/workflows/ci.yml),
and [Oxlint configuration](https://github.com/vercel/ai/blob/2147b86ac48bb0e707eaeb8c8e09af4ab0023012/.oxlintrc.json).
Vue Router evidence: [Oxlint configuration](https://github.com/vuejs/router/blob/287507b1861558407562b3145443d22785c6b0b8/.oxlintrc.jsonc)
and [package scripts](https://github.com/vuejs/router/blob/287507b1861558407562b3145443d22785c6b0b8/package.json).

The AI SDK's reusable convention library requires provider creator exports,
settings types, and corresponding implementation files. This is actual
consumer code because its repository configuration references that library.
Its separate ready-to-use configuration for third-party providers is a
distribution example, not evidence that another project adopted it. The
package README still labels publication guidance preliminary.
[Convention definitions](https://github.com/vercel/ai/blob/2147b86ac48bb0e707eaeb8c8e09af4ab0023012/tools/konsistent-provider/src/index.ts),
[package purpose](https://github.com/vercel/ai/blob/2147b86ac48bb0e707eaeb8c8e09af4ab0023012/tools/konsistent-provider/README.md).

This sample verifies one established Konsistent consumer. It does not establish
broad independent adoption. Konsistent's own end-to-end fixtures are tests,
not additional consumers.
[Fixture directory](https://github.com/vercel-labs/konsistent/tree/c25c08aa54e6e1bf914d739475bd5011335cc52b/e2e/fixtures).

## Beta.9 is the implementation reference

The `konsistent@1.0.0-beta.9` tag resolves to
`c25c08aa54e6e1bf914d739475bd5011335cc52b`. Main was
`1dac00eee7762eece7ef631533176cc25840d1d9` when checked. Its changelog records
beta.10's new `callFunction` predicate and a fix for `if` and `ifNot` evaluation
inside `for.files`. Those features and corrected semantics must not be assumed
for beta.9. Use the installed schema and pinned source when designing rules.
[Beta.9 tag](https://github.com/vercel-labs/konsistent/tree/konsistent%401.0.0-beta.9),
[changelog at inspected main](https://github.com/vercel-labs/konsistent/blob/1dac00eee7762eece7ef631533176cc25840d1d9/packages/konsistent/CHANGELOG.md).

Beta.9 has two relevant limits:

- Its parser records static import declarations separately from exports.
  Dynamic import expressions do not populate the import collections used by
  its import predicates. Preserve Oxlint's framework-import restrictions;
  Konsistent imports are not a complete dependency boundary.
  [Parser](https://github.com/vercel-labs/konsistent/blob/c25c08aa54e6e1bf914d739475bd5011335cc52b/packages/konsistent/src/typescript/parser.ts),
  [import matcher](https://github.com/vercel-labs/konsistent/blob/c25c08aa54e6e1bf914d739475bd5011335cc52b/packages/konsistent/src/typescript/import-matcher.ts).
- Path selection operates on existing matches. Requiring an export in a file
  does not by itself require that file to exist. Pair symbol checks with
  `haveFiles` on an existing parent or stable anchor. A sibling-file check
  establishes presence, not test quality or runtime behavior.
  [Path matcher](https://github.com/vercel-labs/konsistent/blob/c25c08aa54e6e1bf914d739475bd5011335cc52b/packages/konsistent/src/core/path-matcher.ts),
  [file predicate](https://github.com/vercel-labs/konsistent/blob/c25c08aa54e6e1bf914d739475bd5011335cc52b/packages/konsistent/src/predicates/have-files.ts).

Context7 supplied current Konsistent and Oxlint documentation for comparison.
Its Konsistent examples refer to `main`, so they were not treated as beta.9
compatibility evidence. Oxlint also distinguishes warning diagnostics from
failing CI; blocking rules should be errors or use an explicit warning policy.
[Oxlint CI behavior](https://oxc.rs/docs/guide/usage/linter/quickstart.html).

## Initial proposal

These are recommendations based on Angry Carp's current ownership rules,
not conventions imposed by the upstream projects:

- Require the portable workflow and shared assessment instructions to remain
  present, together with the CLI workflow resource. Use their common parent
  as an anchor so deleting a required file produces a violation. File presence
  does not establish that the prose remains runtime-independent.
  [Workflow ownership](../adr/0004-distribute-workflow-independently.md),
  [CLI entry distribution](../adr/0018-distribute-cli-agent-entry.md).
- Require the reusable output and report-preparation modules and their
  corresponding tests. Check only the public exports that define those
  boundaries, such as `assessmentPacket`, `formatSavedAssessment`,
  `startReportPreparation`, and `checkReportPreparation`. Avoid requiring
  a companion test for every implementation helper.
  [Output module](../../lib/src/email-analysis/analysis-output.ts),
  [report preparation](../../lib/src/reporting/report-preparation.ts),
  [package ownership](../adr/0012-separate-cli-from-flue.md).
- Keep workspace metadata requirements small, such as `README.md`,
  `package.json`, and `tsconfig.json` in `lib/`, `cli/`, and `agent/`.
  These packages have different responsibilities, so do not impose a shared
  barrel file, build tool, class shape, or declaration order.
  [Repository ownership rules](../../AGENTS.md).

One root JSON configuration is enough for these contracts. The AI SDK's
reusable convention package serves many providers; Angry Carp
has no equivalent need yet. Keep formatting, promise safety, and import
restrictions in Oxlint, and leave semantic correctness to TypeScript and the
existing behavior tests. A structural check must not be described as a
filesystem sandbox, network restriction, or guarantee that a test exercises
the required behavior.

## Review outcome, 2026-09-24

Independent Claude and Grok reviews narrowed the initial proposal. The build
already reads the portable workflow assets, and the CLI imports the four
named functions. Requiring them in Konsistent duplicates existing failures.
Beta.9's `exportFunctions` also requires function declarations: an exported
arrow function with the same callable type fails that predicate. No project
policy requires that syntax distinction.

The adopted configuration keeps two presence checks: the three workspace
README files and two regression test files. Removing those files can pass
the other gates. Empty files still satisfy Konsistent; test quality and
documentation accuracy remain review responsibilities. The fixture test
checks each deletion with its parent directory retained. Deleting a whole
matched directory produces no Konsistent violation in beta.9, so workspace
build and typecheck commands remain part of validation.

We declined a proposed `cli/src/{command}.ts` rule. It would require every
future helper at that level to look like a command, yet could not establish
that `main.ts` dispatches the exported function. No directory migration or
new naming policy was introduced to accommodate the checker.

The configuration stays at the root, Konsistent's default location. Both
reviewers confirmed that `paths` resolve against the process working directory,
not the config directory. Vercel's `.github/` placement offers no additional
checking capability. Its pinned manifest states a beta.9 dependency; that
alone does not prove that every configured block behaves as intended.
