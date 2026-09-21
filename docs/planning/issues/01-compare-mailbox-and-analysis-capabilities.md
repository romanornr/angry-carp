# Compare established mailbox and analysis capabilities

Type: research
Labels: wayfinder:research
Status: resolved
Assignee: Codex mailbox research agent
Parent: ../map.md
Blocked by: none

## Question

Which existing capabilities can support manual, portable mailbox acquisition and analysis without contacting candidate infrastructure? Establish Gmail's original-message export, Spam discovery, identifiers, incremental discovery, and relevant access boundaries from official documentation. Compare a connector, an existing supported client or CLI, and a small custom client at the capability level. Explain what deterministic parsing or filtering can establish and where contextual model judgement would remain necessary. Do not select an implementation language or architecture.

Use the observed connector access as local evidence without assuming every platform exposes identical operations. Record missing capabilities and verification needs. Do not download the mailbox, submit URLs, or mutate mail as part of this research.

## Answer

Gmail's API supports raw original-message retrieval, explicit Spam inclusion, pagination, immutable message IDs, and incremental history. The current connector advertises several of these capabilities but lacks an explicit Spam-inclusion flag and history-list operation; completeness and export fidelity need bounded verification.

An existing CLI may supply acquisition without a custom scanner. The researched Google Workspace CLI disclaims official Google support and warns of pre-1.0 breaking changes, so its suitability must be tested rather than assumed. Deterministic extraction supplies evidence and prioritization; it does not independently establish a phishing verdict or common attacker identity.

See [Mailbox and analysis capabilities](../../../docs/research/mailbox-capabilities.md) for findings, sources, and remaining verification needs. Research was committed on `research/mailbox-capabilities` at `b5c87034799b6279d6bc00d411831093238d981d`; the report is also copied into this workspace. No architecture or language was selected.
