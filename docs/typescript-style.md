# TypeScript style

## Run the checks

Run `npm run lint`, `npm run check:types`, and `npm test` from the repository
root. Linting builds the package exports first, checks library, CLI,
and Flue source with Oxlint, then runs Konsistent. Both checks include tests
where their rules apply and neither rewrites files. `npm run lint:structure`
runs Konsistent alone without building or making network requests.

[Oxlint](https://oxc.rs/docs/guide/usage/linter/type-aware) and its
`oxlint-tsgolint` engine are project-local dev dependencies. The root
`.oxlintrc.json` enables correctness rules, promise handling, and rejection
of explicit `any`. Import restrictions reject Flue and Pi imports and
re-exports in `lib/` and `cli/`, including literal dynamic imports.
They are review aids, not a filesystem sandbox or a complete
dependency-graph check.

The configuration preserves intentional patterns: Node's runner owns
top-level test promises, `using` declarations own resource cleanup, and
object-rest destructuring can omit fields. Authentication parsing and
terminal escaping intentionally match control characters. Tests may
stringify captured values and sort comparison fixtures without a comparator.
The `test` exemption also matches `t.test`, so await or return subtests
explicitly. Other promise calls inside tests remain checked. No line-count limit,
formatting preset, or automatic fix command is imposed.

### Tool selection, checked 2026-09-24

TypeScript 7.0.2 was already installed and was npm's latest stable release.
[typescript-eslint currently supports TypeScript below 6.1](https://typescript-eslint.io/users/dependency-versions/).
Oxlint's type-aware engine uses TypeScript Go, avoiding a second compiler
installation solely for ESLint. Keep the existing typecheck command.

[Konsistent](https://github.com/vercel-labs/konsistent) is a project-local
dev dependency, pinned to `1.0.0-beta.9`. Its two conventions require the
three workspace README files and the assessment-output and report-preparation
regression test files. Builds and TypeScript already check the implementation
files and their consumed exports. Oxlint owns import restrictions because
Konsistent beta.9 misses re-exports and dynamic imports.

These are presence checks, not checks of documentation or test quality.
One fixture test proves all five deletions fail while their parent directories
remain. Missing parent directories match nothing in beta.9; workspace build
and typecheck commands remain necessary.

Keep `konsistent.json` at the root and run the npm scripts there. The root is
the tool's default config location. `.github/` is an optional location selected
with `--config-path`; moving the config does not change the working directory
used to match files. It adds no checking capability.

[AI SDK uses Konsistent for repeated provider contracts](research/structural-lint-precedents.md).
Our smaller codebase does not have that family of implementations. Vue Router
was an Oxlint precedent, not another Konsistent adopter. Reassess additional
rules against concrete mistakes they catch beyond the existing gates.

If a file was removed accidentally, restore its meaningful content. For an
intentional move, update the convention and fixture test together. An empty
replacement passes the presence check but does not restore the lost coverage.
Run `npm run lint:structure` and `npm test` after changing the configuration.

The optional upstream [konsistent-fix-violations skill](https://github.com/vercel-labs/konsistent/blob/1dac00eee7762eece7ef631533176cc25840d1d9/skills/konsistent-fix-violations/SKILL.md)
guides agents through deciding whether a rule or the code needs correction.
It uses an interactive approval workflow and defers configuration authoring
to the separate `konsistent-config` skill. The local installation is under
`.agents/skills/konsistent-fix-violations/`, which is gitignored; it is not
bundled with Angry Carp's runtime or installed globally. The skill adds no
lint rules. Use the installed beta.9 docs for predicate compatibility.

Pinned `oxlint` 1.82.0 was published on September 7, and `oxlint-tsgolint`
7.0.2001 on July 21. Both were over two weeks old at review. Archive hashes
and npm registry signatures were verified for both wrappers and their
Linux x64 artifacts. None declared install hooks. The OSV query returned
no advisories for those versions on September 24. Installation used
`--ignore-scripts`; no existing dependency version changed. These checks
do not constitute a source or native-binary malware audit.

Konsistent beta.9 was published on September 2, over three weeks before
adoption. The isolated trial verified archive hashes and npm registry
signatures for its dependency set; none declared install hooks, and OSV
returned no advisories for those versions. The six newly installed root
dependency artifacts match that reviewed set. Existing locked versions
were unchanged. Konsistent carries a nested TypeScript 5.9.3 for parsing;
the project's compiler remains 7.0.2. This is a development-only dependency
and does not enter the installed checks or CLI runtime dependency trees.
For updates, inspect the release changes, regenerate the lockfile with
scripts disabled, review new artifacts, and rerun the negative fixtures.

## Readability and size

- Prefer explicit `if` statements and early returns over ternary
  expressions. Use `else` when it makes the alternatives easier to follow.
- Use an exhaustive `switch` when handling a discriminated union.
- Reduce code by removing redundant work, duplicated decisions, and
  unnecessary wrappers. Prefer fewer concepts over fewer physical lines.
- Keep related logic together. Extract a function when its name explains
  a meaningful operation or removes distracting detail from its caller.
- Avoid helpers that merely forward arguments or force readers to jump
  between files.
- Keep mutable state in the smallest practical scope.
- Follow existing formatting. Avoid unrelated formatting changes.

## Types and errors

- Reuse authoritative library and domain types instead of copying them.
- Validate external input at entry points. Trust validated internal types.
- Prefer narrowing over `as` assertions. Use `unknown` instead of `any`
  for values whose shape is not established.
- Keep `try` blocks focused on the operation whose failure is handled.
  Use `finally` for cleanup that must happen on success and failure.
- Move substantial callback definitions outside cleanup blocks when that
  makes the operation easier to read.
- Catch errors where recovery or safe translation is possible.
  Keep credentials out of error messages and logs.

## Comments and JSDoc

- First try clearer names, types, and control flow.
- Use comments for non-obvious reasons, external constraints, security
  boundaries, or ordering requirements that code alone cannot explain.
- Place a comment immediately above the relevant code. Keep it as short
  as the explanation permits.
- Avoid comments that narrate the next statement, decorative section
  banners, and commented-out code.
- Use JSDoc when callers need a contract that the signature cannot express:
  side effects, ownership, cancellation behavior, or important failure
  conditions. Being exported alone does not require JSDoc.
- Do not repeat TypeScript types in `@param` or `@returns` tags.
- Keep architecture decisions and operating instructions in project docs.
  Link from code only when that context is needed to understand it.
- Give TODOs a concrete remaining action and an issue reference or removal
  condition. Update or remove comments when their assumptions change.
