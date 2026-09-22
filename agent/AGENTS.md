# AGENTS.md

This is a [Flue](https://flueframework.com) project: agents are TypeScript functions.

## Layout

- `src/agents/` — agent modules. A module whose first line is the `'use agent'` directive exports agents: every exported capitalized function is one, and the function name is its durable identity.
- `src/tools/` — Flue bindings call the shared library directly.
- `src/db.ts` — the persistence adapter for durable conversations.

## Commands

- `npm --silent run triage -- /absolute/path/prepared-email.txt` — assess prepared email evidence locally and print the final answer once.
- `npm run check:types` — typecheck.
- `npx flue docs search <query>` — search the Flue docs from the terminal (then `flue docs read <path>`).
- `npx flue add` — list blueprints for adding channels, sandboxes, and databases.
