# Repository instructions

## Portable assessment instructions

Keep `phishing-triage.md` usable as a standalone download by people and agents without Flue or this repository's TypeScript code. Put Flue-specific tool instructions and runtime integration under `agent/`, loaded separately from the shared assessment instructions.

When changing workflow distribution or runtime boundaries, follow [ADR 0004](docs/adr/0004-distribute-workflow-independently.md).

When updating reporting routes, follow [the channel update procedure](docs/updating-reporting-channels.md). It covers source edits, review dates, generation, and drift checks.

## Code ownership

`lib/` owns reusable checks and their schemas. `agent/` owns Flue bindings, authentication, and conversation storage. Import the library through its package exports; migrate callers and delete obsolete paths in the same change. Package separation does not restrict filesystem access or create a credential sandbox.

## Skills to apply

Read and apply these skills when the corresponding work arises:

| Work | Skill |
|---|---|
| Reading or changing TypeScript | `typescript-best-practices`, including its required `principle-type-system-discipline` prerequisite |
| Integrating a new requirement into the design | `principle-redesign-from-first-principles` |
| Planning an addition, refactor, or rewrite | `principle-subtract-before-you-add` |
| Choosing abstractions or assessing change size | `principle-laziness-protocol` |
| Diagnosing and fixing a bug | `principle-fix-root-causes` |

Apply the relevant skills together. Design with the complete requirement
in mind, then deliver the smallest coherent increment.

Keep necessary input validation, security boundaries, and resource cleanup.
Reduce complexity by addressing its cause rather than removing safeguards.

Follow the user's agreed review and implementation steps. A skill does
not authorize expanding the scope or skipping review.

When reading or changing TypeScript, follow [the shared style guide](docs/typescript-style.md).
