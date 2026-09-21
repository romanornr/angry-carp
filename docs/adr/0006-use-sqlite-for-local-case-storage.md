---
status: accepted
---

# Use SQLite for local case storage

Use a private local SQLite database for complete original email bytes and their integrity digests, case records, provider actions, draft versions, and acquisition checkpoints. Keeping originals as BLOBs alongside their records allows a transaction to save related evidence and progress together, without coordinating a database and a separate file store. The operator selected SQLite after the [bounded recovery experiment](../research/manual-capability-check.md) recovered these records across process restarts and interrupted transactions.

The database belongs outside Git. Keep parsed observations separate from unchanged originals. The first importer was withdrawn because its structures and interface were chosen without adequate domain discussion. SQLite remains the selected local storage technology; that choice does not approve the withdrawn schema, manifest format, identity rules, or locking design. Revisit those from the agreed domain before implementing a replacement.

Future hosting must reassess whether originals need cloud storage at all, as well as retention, access, and recovery requirements. R2 and cloud SQL were mentioned during discussion, but no future storage arrangement is selected. Local originals remain in SQLite; export an `.eml` when needed rather than maintaining a second authoritative file store. Keep local storage details separate from case rules without building cloud adapters or synchronization now.
