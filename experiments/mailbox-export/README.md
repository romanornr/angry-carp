# Check saved email exports

This bounded Rust experiment parses existing local `.eml` files as inert bytes. It prints byte counts, SHA-256 digests, header names, MIME types, and decoded part sizes. It does not print header values, bodies, filenames, or attachment contents. Treat the resulting metadata and digests as private acquisition records.

```sh
cargo test --locked --manifest-path experiments/mailbox-export/Cargo.toml
cargo run --locked --manifest-path experiments/mailbox-export/Cargo.toml -- /private/path/sample.eml
```

The program has no mailbox client, network operation, renderer, attachment executor, or sender. It reads originals without rewriting them. `mailparse` decodes MIME transfer encoding to count bytes, including attachment bytes, without opening the attachment as a document. Parser success does not prove the message is authentic or complete.

The parsing function accepts bytes and is separate from the local executable's file access. Rust is the operator's preferred implementation language. Workers portability remains untested; compiling a native executable does not establish WebAssembly compatibility.

The [capability findings](../../docs/research/manual-capability-check.md) describe the live sample size, Spam enumeration, private storage location, and limits of this check. No private samples belong in this directory.
