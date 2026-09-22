---
status: accepted
---

# Separate standalone commands from Flue

The analyzer already runs without a model, but its commands, output functions and file reader were packaged under `agent/`. A consumer installing that package also receives Flue and Pi. The operator chose a separate `cli/` workspace for the existing standalone consumer, with `@angry-carp/checks` as its only runtime dependency. Review `cli/package.json` and the resolved dependency tree when changing that boundary. No HTTP service sits between packages.

`lib/src/email-analysis/analysis-output.ts` owns reusable text formatting and the model disclosure projection. `lib/src/node/read-input.ts` owns bounded local-file acquisition. Both have explicit package exports. Keeping filesystem imports under a separate Node export lets an in-memory caller use the output functions without importing the file reader. This does not make the MIME analyzer Workers-compatible or provide a credential sandbox.

`cli/src/analyze.ts` and `cli/src/extract-links.ts` own arguments, file output and exit status. `agent/src/triage-cli.ts` keeps Flue setup, authentication, reviewed-text submission and provider cleanup. Both consumers call the shared analyzer and output functions directly. The portable assessment instructions stay independent of all three packages.

The alternative was leaving standalone commands in `agent/` because they did not import Flue. That met source-level reuse but not independent dependency ownership. Placing every command in `lib/` would combine reusable operations with executable entry points. The additional workspace makes that distinction explicit without adding another runtime framework.

The migration moves callers, tests and commands together and deletes the former paths. Root `analyze` and `extract:links` scripts build the library, compile the CLI and run the new commands with paths relative to the repository root. The former `agent` scripts are removed. Flue's `triage` command and its working-directory behavior remain unchanged.

[ADR 0011](0011-analyze-email-before-assessment.md) still owns analysis behavior and disclosure. This decision changes packaging, not lookup selection or reporting policy. Known behavior gaps are tracked in [issues 14–17](../planning/map.md#analyzer-follow-up).

The CLI ships JavaScript from `dist/`. An isolated packed-consumer test reproduced [Node 24's refusal to strip TypeScript under node_modules](https://nodejs.org/docs/latest-v24.x/api/typescript.html#type-stripping-in-dependencies). Reusing the existing compiler avoids a runtime loader; the Node-only command tests run the compiled entry points. Direct workspace commands consume the last build, so use root commands during development. The workspace scripts remain usable in the packed package, while root scripts supply build ordering and preserve root-relative paths.
