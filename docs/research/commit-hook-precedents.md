# Commit hook precedents

Inspected on 2026-09-24. This note records pinned source configurations, not hook executions or estimates of adoption.

## Vercel AI SDK

Source snapshot: `vercel/ai@2147b86ac48bb0e707eaeb8c8e09af4ab0023012`.

The Husky pre-commit hook runs `pnpm lint-staged`. Before that, a staged `package.json` triggers `pnpm install` and `git add pnpm-lock.yaml`. A nonempty `ARTISANAL_MODE` skips the hook. [Hook source](https://github.com/vercel/ai/blob/2147b86ac48bb0e707eaeb8c8e09af4ab0023012/.husky/pre-commit)

The root lint-staged configuration maps `*.{js,jsx,ts,tsx}` to `ultracite fix`. These are fixes on matching staged files. The hook does not invoke the root Konsistent command. The root manifest declares lint-staged `^15.5.1` and Konsistent `1.0.0-beta.9`. [Package scripts and configuration](https://github.com/vercel/ai/blob/2147b86ac48bb0e707eaeb8c8e09af4ab0023012/package.json)

CI separately runs `pnpm run check`, which invokes `ultracite check`, and `pnpm konsistent`. The latter runs `turbo run konsistent:validate konsistent:check --log-order=grouped --log-prefix=none`. Those root tasks validate and check `.github/konsistent.json`; both depend on `konsistent-provider#build`. CI also has separate type checking, builds, and tests. These commands receive no staged-file list. [CI workflow](https://github.com/vercel/ai/blob/2147b86ac48bb0e707eaeb8c8e09af4ab0023012/.github/workflows/ci.yml), [root scripts](https://github.com/vercel/ai/blob/2147b86ac48bb0e707eaeb8c8e09af4ab0023012/package.json), [Turbo dependencies](https://github.com/vercel/ai/blob/2147b86ac48bb0e707eaeb8c8e09af4ab0023012/turbo.json#L106-L113)

## Vue Router

Source snapshot: `vuejs/router@287507b1861558407562b3145443d22785c6b0b8`.

The root manifest installs simple-git-hooks through `postinstall`. Its pre-commit command is `pnpm lint-staged`, with these tasks:

| Matching staged files | Command |
| --- | --- |
| `*.{ts,vue,js,mts,mjs}` | `oxlint --fix --no-error-on-unmatched-pattern` |
| `*` | `oxfmt --no-error-on-unmatched-pattern` |

The hook applies fixes and formatting to staged files. The manifest declares lint-staged `^17.0.8`, Oxlint `^1.73.0`, and Oxfmt `^0.58.0`. [Hook and lint-staged configuration](https://github.com/vuejs/router/blob/287507b1861558407562b3145443d22785c6b0b8/package.json)

CI runs `pnpm run lint`, which is `oxfmt --check && oxlint`, followed by recursive build, type tests, and unit tests. The lint command receives no staged-file list and uses the tools' repository configuration. Its workflow excludes specified documentation and playground paths from triggering runs. [CI workflow](https://github.com/vuejs/router/blob/287507b1861558407562b3145443d22785c6b0b8/.github/workflows/test.yml), [lint script](https://github.com/vuejs/router/blob/287507b1861558407562b3145443d22785c6b0b8/package.json)

## Stashing and partial commits

Both hooks invoke lint-staged without flags that disable its backup stash or handling of partial staging. The inspected lint-staged v15.5.1 and v17.0.8 documentation describes the same defaults: append matching staged filenames to task commands, create a backup stash, hide unstaged changes in partially staged files, and automatically stage task edits. Error handling restores the original state by default. These versions are the declared dependency range floors, not independently verified lockfile resolutions. [v15.5.1 documentation](https://github.com/lint-staged/lint-staged/blob/6a73e5b843567dae42562d7cbc034edf1297f129/README.md), [v17.0.8 documentation](https://github.com/lint-staged/lint-staged/blob/5f3b8f28e895972bd5a2cdba733327b49859b91f/README.md)

## Local observations and proposal

Both commands passed in this checkout. These are single-run measurements, not benchmarks.

| Command | Elapsed time | Scope |
| --- | --- | --- |
| `npm run lint` | 14.695 seconds | Build library and CLI, type-aware Oxlint, and Konsistent |
| `npm run lint:structure` | 0.831 seconds | Konsistent validation and checks; checks reported 5 ms |

The checkout had no configured `core.hooksPath`, no existing pre-commit file, and no `.github` directory. This research installed nothing, ran no hooks, and changed no hook, dependency, or configuration files.

The proposed approach is to run the fast structural checks before commits, full lint before pushes and in CI, and tests and type checks in CI. This proposal differs from the two precedents, which use staged-file fixes before commits. Running `npm run lint:structure` directly would inspect the working tree, including unstaged edits. It would not prove that a partially staged commit satisfies the structural rules.
