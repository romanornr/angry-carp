---
status: accepted
---

# Extract reusable checks from the Flue application

Put the five existing capabilities in one private npm workspace, `@angry-carp/checks` under `lib/`. Flue imports its functions directly; no HTTP service is needed. The previous functions already avoided Flue imports, but installing their owning package also installed Flue and Pi. Separate dependency ownership makes the checks independently installable while retaining one implementation and one root lockfile.

Keep schemas with their domain logic, DNS and RDAP with their shared HTTP reader, and model-facing instructions in `agent/src/tools/`. Export individual modules rather than a root barrel that loads every capability. Move callers, tests, public snapshot data, and maintenance commands together, then remove the old paths. The library emits JavaScript and declarations because [Node refuses TypeScript stripping inside `node_modules`](https://nodejs.org/docs/latest-v24.x/api/typescript.html#type-stripping-in-dependencies). TypeScript's [relative-extension rewriting](https://www.typescriptlang.org/tsconfig/rewriteRelativeImportExtensions.html) preserves the existing source imports while emitting runnable JavaScript.

Public snapshot loading has an explicit Node entry point, `@angry-carp/checks/brands/local`. The pure directory accepts supplied data. Authentication and conversation storage remain agent concerns. Package exports control the supported import interface, not process permissions; this migration does not create a credential sandbox or an email-redaction system. Domain comparison still uses Node IDNA functions; Workers execution remains unverified.

The standalone [assessment instructions](../../phishing-triage.md) retain the portability required by [ADR 0004](0004-distribute-workflow-independently.md). The current package interface and commands are in the [library guide](../../lib/README.md).
