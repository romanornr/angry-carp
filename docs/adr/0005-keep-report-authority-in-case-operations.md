---
status: accepted
---

# Keep report authority in reusable case operations

When Angry Carp's reusable software is installed, case operations own report versions, operator approvals, and submission history independently of the calling agent or optional runner. The operator chose agent portability and approval for every initial-version report, so changing models or resuming a conversation must not grant sending authority or lose an uncertain submission. This requires an operator approval mechanism and durable case storage beyond a runner's session checkpoint; their implementations remain open, and instruction-only hosts must state which guarantees they cannot enforce.

Software enforcement also requires host restrictions that prevent the analyst from bypassing case operations through another sender or manufacturing operator approval.

[ADR 0006](0006-use-sqlite-for-local-case-storage.md) subsequently selects SQLite for local storage. The approval mechanism and production case operations remain unimplemented.
