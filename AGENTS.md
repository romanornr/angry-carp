# Repository instructions

## Portable assessment instructions

Keep `phishing-triage.md` usable as a standalone download by people and agents without Flue or this repository's TypeScript code. Put Flue-specific tool instructions and runtime integration under `agent/`, loaded separately from the shared assessment instructions.

When changing workflow distribution or runtime boundaries, follow [ADR 0004](docs/adr/0004-distribute-workflow-independently.md).
