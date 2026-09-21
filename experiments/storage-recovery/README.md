# Synthetic storage recovery experiment

Result on 2026-09-21: all seven scenarios passed with Rust 1.98.0 and rusqlite 0.38.0. This bounded experiment tests SQLite as a candidate for the [manual workflow](../../docs/manual-workflow.md). It does not select the product's storage design or command interface. Rust follows the requested experiment language.

The experiment uses synthetic bytes and imported synthetic report history. It contains no mailbox client, network requests, or send operation. The registrar's confirmation and receipt are fixtures, not submissions. AWS remains awaiting approval. No real mail is copied into the experiment.

## Run

From the repository root, fetch build dependencies once, then run the experiment offline:

```sh
cargo fetch --locked --manifest-path experiments/storage-recovery/Cargo.toml
cargo test --offline --locked --manifest-path experiments/storage-recovery/Cargo.toml
cargo run --offline --locked --manifest-path experiments/storage-recovery/Cargo.toml
```

The build needs Rust, Cargo, and a C compiler for bundled SQLite. It does not need the sqlite3 CLI. Database files live in temporary directories outside the repository. Each directory has mode `0700` on Unix and the runner removes it after its scenario. Build output stays in the ignored `target/` directory.

## Observed results

| Scenario | Result |
| --- | --- |
| Save, exit, reopen | Separate Rust processes recovered original bytes, including CRLF, a folded header, NUL, and non-UTF-8 bytes. The saved SHA-256 digest matched the expected digest. Case revision, acquisition metadata, registrar receipt, AWS draft bytes, and discovery checkpoint survived. |
| Repeat an import | Two repeats left one original and two provider records. Updated review progress and a later checkpoint stayed unchanged. |
| Conflicting original | Reusing an import identity with different bytes failed. A direct original update also failed. Preserved bytes remained identical. |
| Crash before commit | The runner killed a writer after provider and checkpoint updates and forced dirty pages into the rollback journal. A new process recovered the prior state and passed SQLite's integrity check. Reimporting remained safe. |
| Competing writer | An immediate transaction rejected a second writer before its import changed the database. Killing the first writer released the lock and the next import succeeded. |
| Inactive resource | Both fixtures had an apparently inactive resource. Sufficient historical evidence retained an AWS draft. Insufficient evidence produced a held record with a reason and no draft payload. Resource observations stayed separate from evidence support. |
| Simple backup recovery | SQLite's backup API created another database. Replacing the closed original with that backup and reopening recovered identical evidence and pending reports. |

## Scope and limitations

`src/storage.rs` contains the local SQLite operations. `src/main.rs` supplies fixed fixtures and separate worker processes for the experiment. The worker protocol and SQL inspection helpers are test machinery, not a supported application API. The seven integration tests execute those scenarios through the compiled binary.

Original bytes and case state share one SQLite database. Imports use immediate transactions, parameterized BLOB writes, foreign keys, and a zero busy timeout. SQLite can create a temporary rollback journal alongside the database during writes. The database file alone is therefore not a safe live-backup procedure.

The writer check covers a held database transaction. It does not prove ownership of an entire manual run between transactions. A product still needs a defined workspace ownership rule.

The process crash test does not simulate power loss, damaged disks, or a broken filesystem. The simple backup test does not establish a production backup and restore policy, retention, encryption, offsite recovery, or recovery after corruption. SQLite permission controls do not protect evidence from another program running as the same user.

This experiment does not test human approval enforcement, immutable approved MIME versions, uncertain delivery reconciliation, submission budgets, sending, or exactly-once delivery. It keeps one case revision value rather than a revision history. Assessment support is a synthetic fixture input, not a detector. It does not implement Cloudflare Workers or compare alternative databases.

The result supports SQLite's ability to preserve these bounded records through process exit and transaction interruption. The operator subsequently selected SQLite for local storage in [ADR 0006](../../docs/adr/0006-use-sqlite-for-local-case-storage.md). The experiment's schema remains a test fixture.
