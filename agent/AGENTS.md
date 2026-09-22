# AGENTS.md

This is a [Flue](https://flueframework.com) project: agents are TypeScript functions.

## Layout

- `src/agents/` — agent modules. A module whose first line is the `'use agent'` directive exports agents: every exported capitalized function is one, and the function name is its durable identity.
- `src/tools/` — the passage-comparison follow-up binding. Routine checks run through the shared analyzer.
- `src/db.ts` — the persistence adapter for durable conversations.

## Commands

- Standalone analysis and HTML extraction belong to [`cli/`](../cli/README.md).
- `npm --silent run triage -- /absolute/path/original.eml --reviewed-text /absolute/path/reviewed.txt` — automatically assess concerns or unresolved material gaps; completed no-concerns checks skip AI.
- For input, disclosure or lookup-selection changes, read [the analysis contract](../docs/email-analysis.md).
- `npm run check:types` — typecheck.
- `npx flue docs search <query>` — search the Flue docs from the terminal (then `flue docs read <path>`).
- `npx flue add` — list blueprints for adding channels, sandboxes, and databases.
