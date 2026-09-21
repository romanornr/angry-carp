# Manual mailbox and storage capability check

Date: 2026-09-21. Scope: bounded mailbox reads and an offline synthetic storage experiment. The operator excluded sending because of duplicate-report risk. No test message, abuse report, draft, scan, label change, or folder change was requested or performed by these checks.

## Mailbox findings

The connector completed paginated Spam-ID enumeration. Repeated enumeration and label counts agreed. These checks read identifiers, not every message body. Exact mailbox counts remain private.

Only three distinct messages were retrieved for export testing: one Spam message, one Inbox message, and one Inbox message selected with `has:attachment`. The Spam raw retrieval was repeated and returned the same encoded bytes. A minimal read confirmed its Spam label. A separate one-result Inbox search followed its next page token. The entire Inbox was not enumerated or classified.

| Sample | MIME structure | Result |
| --- | --- | --- |
| Spam | Plain text and HTML | Raw export saved unchanged; repeated retrieval matched. |
| Inbox | Plain text and HTML | Raw export saved unchanged. |
| Inbox with attachment | Plain text, HTML, and one PDF attachment | Header names and decoded leaf sizes match the separate FULL response. |

All three originals contain From, To, Date, Message-ID, Received, and MIME-Version headers. These presence checks do not authenticate their values. The PDF was retained and counted as bytes, never opened or rendered. No HTML, remote image, or candidate URL was loaded.

Google defines the RAW representation as the entire RFC 2822 email encoded with base64url. The live results are consistent with that documented capability. [Gmail message resource](https://developers.google.com/workspace/gmail/api/reference/rest/v1/users.messages)

The originals and acquisition records are private files outside the repository. The directory has mode 0700 and the original files have mode 0600. Message IDs, raw bytes, and integrity digests stay there. File permissions do not provide encryption or a backup.

The [Rust export auditor](../../experiments/mailbox-export/README.md) reread all three saved originals. Their digests matched the initial saved copies. Its MIME counts and the attachment sample's header names and decoded sizes matched the independent FULL-response metadata. An initial Python inspection preceded the operator's Rust preference; the reusable repository auditor is Rust.

### Limits and implementation consequences

- This verifies Spam access through this connector in this mailbox at this time. It does not verify Grok's connector, future runs, or an atomic mailbox snapshot. Concurrent mailbox changes still require acquisition reconciliation.
- The check retained three provider RAW representations. It did not compare them against Gmail's interactive Download Original feature or an independently authenticated client. Message-size limits, malformed MIME, encrypted messages, and large attachments remain untested.
- Parsed output is derived evidence. The Rust and Python parsers differed by two decoded bytes on the Spam HTML part, despite identical original digests. The cause has not been established. Do not reconstruct a purported original from parsed parts or claim parser equivalence from this check.
- Transporting raw payloads through the agent's shell arguments hit command-size limits. Chunked local transfer completed the samples, but this is unsuitable as the normal acquisition path. The reusable mailbox client should stream provider responses directly into private storage.
- No full-mailbox phishing review, model evaluation, historical reporting reconciliation, or attachment execution occurred.

## Storage experiment

The [Rust storage recovery experiment](../../experiments/storage-recovery/README.md) uses synthetic originals and provider history only. It tests a local SQLite candidate independently of Gmail. Any recorded prior submission in the fixture is invented test history, not a message sent by this experiment.

All seven scenarios passed: separate-process restart, repeated import, conflicting-original rejection, interrupted transaction recovery, competing-writer rejection, evidence sufficiency separate from resource activity, and reopening a simple SQLite backup. The recovered case retained the original bytes and digest, a synthetic registrar receipt, an AWS draft awaiting approval, and its discovery checkpoint.

SQLite kept original bytes and related records together in one transaction. The operator subsequently selected it for local storage in [ADR 0006](../adr/0006-use-sqlite-for-local-case-storage.md). The experiment does not compare storage alternatives or select a production schema. Its writer lock covers a transaction, not the whole manual run.

This check concerns durable evidence and unfinished work. It does not establish operator approval enforcement, real send reconciliation, a production backup policy, encrypted storage, power-loss recovery, or Workers compatibility. Sending remains excluded from the authorized work.

## Evidence from apparently inactive resources

The operator clarified that a disappeared phishing page may leave too little proof to report. The reporting guide and manual workflow now require a provider action to remain held when its allegation lacks support. Resource activity and evidence sufficiency are separate facts. Retained evidence may support a report about past activity, but inactivity alone proves neither phishing nor a takedown.

## Language and future hosting

The operator prefers Rust for scripts and reusable implementation, partly to allow future Workers use. These experiments keep parsing separate from local file access. Rust Workers compile for WebAssembly and use Workers bindings; native CLI processes and local database access need separate treatment. No Workers runtime or hosted storage is selected. [Workers Rust bindings](https://github.com/cloudflare/workers-rs)

## Historical validation of the withdrawn importer

The first local Rust importer was subsequently withdrawn for a domain and interface reset. The following results describe that discarded implementation, not a selected replacement design. It was validated against synthetic fixtures and these same three exported files, without new Gmail reads. A private manifest selected exactly those three originals. The first command imported one, a separate resume command imported two, and repeating the original import attempted zero files and added zero records. A read-only database comparison found all three stored BLOBs byte-identical to their source files. SQLite's integrity check returned `ok`.

The validation store remains private outside Git. It contains no case assessment, approval, or submission record. The Rust integration tests additionally cover failed-file recovery, conflicting originals, rollback when a progress update fails, competing processes, and lock release after abrupt process exit. The command lock is stronger than the experiment's transaction-only lock, but it does not coordinate an entire multi-command agent conversation.
