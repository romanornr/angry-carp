# MIME parser fidelity for email analysis

Initial source inspection, 2026-09-22. The subsequent [artifact review and behavioral checks](#artifact-review-and-behavioral-checks) executed Mailsplit in an isolated temporary environment with the operator's agreement. No project dependency was added. This checks the [agreed analysis behavior](../planning/issues/13-define-model-independent-email-analysis.md), not scanner accuracy. Context7 supplied documentation candidates; direct reads of pinned sources resolved the behavior below.

## Conclusion

Postal-mime and MailParser expose assembled message bodies. Neither reviewed public interface supplies independently recoverable text/HTML parts with a complete diagnostic record. Their convenience output therefore does not establish the part-level contract we proposed.

Evaluate `@zone-eu/mailsplit` directly before selecting a MIME dependency. It exposes the part structure that the higher-level MailParser hides. This is a source-supported candidate, not a verified implementation. Keep the existing HTML extractor and lookup modules. Do not copy parser internals or add a second parser to repair the first one's output.

## Postal-mime 3.0.0

The [published metadata](https://registry.npmjs.org/postal-mime/3.0.0) identifies commit `e7c35dd9fcddaf73a1359256b1e4865e5cd33521`. Its [public types](https://github.com/postalsys/postal-mime/blob/e7c35dd9fcddaf73a1359256b1e4865e5cd33521/postal-mime.d.ts) expose ordered headers, text, HTML and attachments, but no MIME body-part tree or per-part failure collection.

The [implementation](https://github.com/postalsys/postal-mime/blob/e7c35dd9fcddaf73a1359256b1e4865e5cd33521/src/postal-mime.js) can combine text representations and synthesize HTML or plain text. It builds the returned message after processing the tree. A rejection during that work does not return a partial message through the public interface. `forceRfc822Attachments: true` keeps embedded emails as attachments instead of merging their contents into the outer body. Parsing such an attachment separately could isolate its failure, but would not expose every outer MIME part. Stream input is accumulated before parsing, so it is not an input-memory limit.

Attachment content is not uniformly the original transfer-decoded bytes: calendar content is converted to text, line-normalized and re-encoded. Consequently, blindly calling every returned content length the original decoded attachment size would be inaccurate. This matters even though attachment hashing was excluded.

The [MIME node implementation](https://github.com/postalsys/postal-mime/blob/e7c35dd9fcddaf73a1359256b1e4865e5cd33521/src/mime-node.js) throws on depth/header limits. Its flowed-text handling produces text rather than quote provenance. The [charset decoder](https://github.com/postalsys/postal-mime/blob/e7c35dd9fcddaf73a1359256b1e4865e5cd33521/src/decode-strings.js) falls back to Windows-1252 after unsupported label/alias attempts. No public warning reports that fallback. Successful parsing must not be called lossless decoding or proof of valid input.

## MailParser 3.9.28

Independent source inspection checked registry commit `f06b1cee938fb828e5c3f71180cba5601f670a40`. Its [streaming parser](https://github.com/nodemailer/mailparser/blob/f06b1cee938fb828e5c3f71180cba5601f670a40/lib/mail-parser.js) emits attachments individually, but assembles text/HTML. Inline embedded-message contents can enter outer bodies. Some charset-conversion failures leave content unconverted without a structured part warning. [SimpleParser](https://github.com/nodemailer/mailparser/blob/f06b1cee938fb828e5c3f71180cba5601f670a40/lib/simple-parser.js) forwards parser errors; it does not add independent body-part salvage.

This is not a reason to adopt a larger message parser merely because it streams attachments. The required information is the individual MIME part and its interpretation, not just streaming attachment delivery.

## Mailsplit 5.4.17

The [published metadata](https://registry.npmjs.org/@zone-eu/mailsplit/5.4.17) identifies commit `23e2d737ba59017bd9c8bc46aecf68ef551658e5`. It is an exact dependency of the reviewed MailParser version.

Its [public types](https://github.com/zone-eu/mailsplit/blob/23e2d737ba59017bd9c8bc46aecf68ef551658e5/lib/types.d.ts) expose nodes, parent relationships, part numbers, headers and body chunks. Declared content type, filename, charset and transfer encoding remain available. The [documented interface](https://github.com/zone-eu/mailsplit/blob/23e2d737ba59017bd9c8bc46aecf68ef551658e5/README.md) includes `ignoreEmbedded: true`, which leaves embedded messages as leaf parts for separately bounded processing.

The [node decoder](https://github.com/zone-eu/mailsplit/blob/23e2d737ba59017bd9c8bc46aecf68ef551658e5/lib/mime-node.js) transfer-decodes base64/quoted-printable or passes bytes through. Charset conversion is separate. Count decoded bytes before text conversion and retain declared values; do not treat decoder tolerance as strict validation. Unknown transfer encodings need explicit unsupported handling in our adapter.

The [splitter](https://github.com/zone-eu/mailsplit/blob/23e2d737ba59017bd9c8bc46aecf68ef551658e5/lib/message-splitter.js) uses Node streams and stops on structural/limit errors. Source defaults are 1 MiB headers and 1,000 child nodes; the README's infinite header default is stale. Specify limits explicitly. There is no documented resume-after-fatal-error contract.

Inference to test: completed parts can be retained, and an isolated body decode/size failure can be recorded while other parts continue. A fatal structural error still produces input failure. This does not promise every malformed message can be salvaged, nor that all tolerated corruption is reported. Workers execution is unverified; choosing this Node implementation has a portability cost.

## Quotes are not MIME ancestry

[RFC 2046 section 5.2.1](https://www.rfc-editor.org/rfc/rfc2046.html#section-5.2.1) defines encapsulated messages. That structure differs from an inline forwarded paragraph or quoted reply. [RFC 3676 section 4.5](https://www.rfc-editor.org/rfc/rfc3676.html#section-4.5) describes quote depth for flowed plain text. HTML's [blockquote element](https://html.spec.whatwg.org/multipage/grouping-content.html#the-blockquote-element) marks quoted material, not authenticated authorship.

Record identifiable quote structure without deleting its links or declaring them harmless. Sender-controlled quote markers cannot prove who authored a passage. Missing markers leave attribution uncertain. The current HTML extractor records anchor/image relationships but does not record quote ancestry; that would be an explicit addition, not a feature supplied by a MIME library.

## Dependency status and next verification

Registry publication metadata was checked on 2026-09-22:

| Candidate | Published | Direct runtime dependencies | Decision |
| --- | --- | --- | --- |
| Postal-mime 3.0.0 | 2026-08-11 | None | Public output does not meet the proposed part contract. |
| MailParser 3.9.28 | 2026-09-15 | Ten | Assembled-body output does not close the gap. |
| Mailsplit 5.4.17 | 2026-09-15 | `libmime` 5.4.4, `libqp` 2.1.1, `libbase64` 1.3.0 | Candidate for artifact review and a bounded behavioral check. |

Publication dates come from [Postal-mime](https://registry.npmjs.org/postal-mime), [MailParser](https://registry.npmjs.org/mailparser) and [Mailsplit](https://registry.npmjs.org/@zone-eu/mailsplit) registry records. Mailsplit is about seven days old, not two weeks. Its manifest declares no install hooks; that is not a malware review. Transitive artifacts, signatures, advisories and source/package correspondence were not audited in this pass. Do not present it as an approved dependency.

After artifact approval, exercise the public interface with synthetic alternative bodies, attached emails, an independently failing body decode, a fatal splitter limit, ordinary quoted text and attachment byte counts. Assert actual output and zero external requests. These probes decide whether the candidate supports the contract; they are not a new rules engine or a MIME implementation.

## Artifact review and behavioral checks

Completed 2026-09-22 after the operator authorized artifact review followed by isolated testing. Recommendation: use Mailsplit 5.4.17 as the candidate for the Node MIME adapter, with explicit input/part limits and interpretation rules. Selection for the project and production integration remain pending. Workers execution remains unverified.

### Exact artifacts

Three direct dependencies expand to seven runtime packages. All dependency declarations are exact except `iconv-lite`'s `safer-buffer` range, which the experiment pinned to 2.1.2. These are archive SHA-256 values, not source-file hashes:

| Package | Archive SHA-256 |
| --- | --- |
| `@zone-eu/mailsplit@5.4.17` | `144dd5f0d87af82c323405742e235c52c73b843999c629486f4526af22d2c659` |
| `libmime@5.4.4` | `2e1255e17d3b39db31a46b8e4f8c4a14f911bbf57e740afd8f4719191b62a2b3` |
| `libqp@2.1.1` | `bd7447f524f703700160e5561e05a820502bf2cd4d1091cb676d8dbec96427d6` |
| `libbase64@1.3.0` | `9e4eaeaa671312fff7b10e4148e8a3d329f80d74ccf449082d7f44c5ee5b27f2` |
| `iconv-lite@0.7.3` | `40789b7733e230a0439e07075fe2f37819f4a47ee7115fe17188451fab8e3941` |
| `encoding-japanese@2.4.0` | `139693bcc187d087c8b3a5e156c8a322eb9aff25c20c4fac84e92de4fb93f2e6` |
| `safer-buffer@2.1.2` | `78812f65ae3b98071ce1c9bacbe0666f4220d0b2753c2a11530eb27df440a3b3` |

Each archive matched its npm SHA-512 integrity value. ECDSA signatures over package name, version and integrity verified against the [npm registry keys](https://registry.npmjs.org/-/npm/v1/keys). Libqp, libbase64 and safer-buffer use a key whose recorded expiry is 2025-01-29; their registry publication dates precede that expiry. This is cryptographic verification against a published retired key, not independent proof of signing time. Provenance attestations were not verified.

The archives contained no escaping paths, duplicate members, links or special files. Packed manifests agreed with registry names, versions and dependencies, and declared no installation hooks. A bounded JavaScript marker scan found reference URLs in comments and constant iconv-lite warning strings, but no matches for the selected filesystem/network/process-launch imports, dynamic evaluation or environment access. This is not an exhaustive behavioral audit.

All 20 shipped Mailsplit JavaScript, declaration and JSON files compared byte-for-byte with the pinned Git source. Transitive source-to-artifact correspondence was not verified. The seven archives total 542,405 compressed bytes and 1,588,607 unpacked file bytes; neither figure is a bundle-size or runtime-memory measurement.

### Public advisories and release age

An independent public-source pass queried OSV for all seven exact versions and received no advisory records. Public GitHub security-advisory listings were also empty. These are dated database results, not a safety guarantee. [OSV query documentation](https://google.github.io/osv.dev/post-v1-query/), [Mailsplit advisories](https://github.com/zone-eu/mailsplit/security/advisories).

Release notes document earlier security fixes despite the empty advisory lists. [Mailsplit 5.4.15](https://github.com/zone-eu/mailsplit/releases/tag/v5.4.15) addresses boundary smuggling and header injection; [libmime 5.4.2](https://github.com/nodemailer/libmime/releases/tag/v5.4.2) addresses header parsing and prototype pollution. The reviewed versions include those releases, but the experiment did not reproduce every historical security regression.

The open [FlowedDecoder issue](https://github.com/zone-eu/mailsplit/issues/20) reports a historical large-body lockup. [Libmime 5.3.7](https://github.com/nodemailer/libmime/releases/tag/v5.3.7) subsequently improved large-input flowed decoding, so the old issue alone does not establish the same defect in the candidate. The current [FlowedDecoder implementation](https://github.com/zone-eu/mailsplit/blob/23e2d737ba59017bd9c8bc46aecf68ef551658e5/lib/flowed-decoder.js) still buffers its body. The probes used `Splitter` and per-node transfer decoders, not that helper.

Mailsplit and libmime were published on September 15; encoding-japanese on September 14. They are at least one week old at review time, not two. Older dependencies date from July 2026 or earlier. Release age does not establish trustworthiness.

### Observed behavior

The manually verified archives were extracted into a temporary dependency tree without running npm or lifecycle scripts. Node 24.15.0 ran the synthetic probes under Bubblewrap with a separate network namespace, cleared environment and read-only access to `/usr` and the experiment directory. The repository, home directory, credentials and original emails were not mounted. A 192 MiB V8 heap limit and a 20-second parent timeout bounded the test process. The heap flag is not a total RSS limit.

Eight tests passed; the sandboxed process exited naturally with code 0 in 0.213 seconds. This is the duration of a small synthetic test suite, not a throughput benchmark.

| Check | Observed result |
| --- | --- |
| Alternative text and HTML | Separate part numbers and parent relationships; identical output with one-byte, 31-byte and whole-message input chunks. |
| Attached email | `ignoreEmbedded: true` preserved nested bytes separately. A stricter nested-header limit failed independently; outer text and footer remained available. |
| Attachment decoding | Base64 and quoted-printable bytes matched literal expectations. Binary and calendar bytes retained their exact transfer-decoded sizes without calendar reformatting. |
| One invalid UTF-8 body | The caller's fatal text decoder rejected that part while good sibling bodies remained usable. This is caller-managed interpretation failure, not a Mailsplit recovery diagnostic. |
| Fatal structural limits | Header and child-node budgets rejected with `EMAXLEN`. |
| Quoted material | Plain-text quote markers and HTML blockquote markup survived. Authorship was not supplied by the parser. |
| Tolerant malformed input | Missing closing delimiter and invalid base64 character were accepted. The result was not a validation-error inventory. |
| Cancellation | Aborting the public stream pipeline destroyed the source and splitter; the process exited without a forced exit call. |

The probe first collected a bounded synthetic message, then decoded its parts. It demonstrates the public part relationships and independent interpretation paths, not a production streaming-memory design. The adapter must still bound acquisition and each retained/decoded body, classify unsupported encodings, and distinguish declared headers from defaults. Missing parser diagnostics must remain explicit coverage limits.

Session artifacts are temporary at `/tmp/angry-carp-mailsplit-audit-8kl2vpv3/`: `artifact-review.json`, `source-comparison.json`, `behavior.test.cjs` and `behavior-output.txt`. The test source SHA-256 is `d04431756d77da47eb1d553c2580f92cbe421d95d54b7dec3b980440c7a89ae6`. These are research artifacts, not a new project test suite or runtime implementation. No project manifest or lockfile acquired Mailsplit. No mailbox, candidate website, model or deployment was used.
