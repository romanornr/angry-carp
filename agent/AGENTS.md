# AGENTS.md

This is a [Flue](https://flueframework.com) project: agents are TypeScript functions.

## Layout

- `src/agents/` — agent modules. A module whose first line is the `'use agent'` directive exports agents: every exported capitalized function is one, and the function name is its durable identity.
- `src/db.ts` — the persistence adapter for durable conversations.

## Commands

- `npm --silent run triage -- /absolute/path/prepared-email.txt` — assess prepared email evidence locally and print the final answer once.
- `npm run check:types` — typecheck.
- `npx flue docs search <query>` — search the Flue docs from the terminal (then `flue docs read <path>`).
- `npx flue add` — list blueprints for adding channels, sandboxes, and databases.

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

## TypeScript style

### Readability and size

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

### Types and errors

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

### Comments and JSDoc

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
