# Offline extraction of email images and action links

Research date: 2026-09-22. The original proposal and pre-installation findings below are historical; the [implementation follow-up](#accepted-dependencies-and-implementation) records subsequent approval and verification. This extends the [existing detection design](phishing-detection-design.md#proposed-flow). Initial research inspected public documentation, source and npm metadata without installing packages, reading private originals, visiting candidate sites or making model calls.

## Recommendation

Use a maintained HTML parser to produce source-attributed observations, then reuse the existing domain checks. Prefer `parse5` for the HTML component because malformed nesting affects which link contains an image. Keep MIME decoding separate. This requires HTML supplied by trusted preparation: the current prepared text has already lost element nesting and cannot reconstruct it reliably.

Run extraction in the trusted preparation path before model assessment. Flue should consume selected observations, not reconstruct markup and send it back to a tool. The reusable function belongs under `lib/src/email-links/`; file loading and disclosure remain outside it. A direct library call needs no HTTP service. No runtime change or new Flue tool is authorized by this note.

An image on a reference brand's domain and an action link on another domain is useful context. It does not prove either authorization or deception. Compare each role against an independently supplied reference, preserving that reference's provenance. Do not promote an image hostname into an official brand reference merely because the sender used it.

## Established implementations and research

The [independent scanner review](email-link-scanner-precedents.md) records pinned source evidence. Rspamd exposes image URL flags, HTML attributes and ancestry; its linked-image rules walk through intermediate ancestors to find an anchor. SpamAssassin retains URI tag roles and anchor text, though its URI summary does not retain each image-to-anchor pair. These support occurrence records before deduplicated hostname summaries.

PILFER's 2007 paper uses an explicit feature for a URL-looking anchor label whose target has a different host. That is precedent for deterministic evidence extraction, not validation of an image-host mismatch score. Its historical classifier and evaluation do not supply weights for this project. [Fette, Sadeh and Tomasic, section 3.2.3](https://www.cs.cmu.edu/~tomasic/doc/2007/FetteSadehTomasicWWW2007.pdf)

Rspamd also suppresses some displayed-domain mismatches by examining nested URLs in redirector query strings. We should not inherit that suppression: an embedded URL is a sender-supplied string, not proof of where the server redirects. Preserve it separately if this capability is added. [Pinned implementation and interpretation](email-link-scanner-precedents.md#rspamd-compares-displayed-domains-locally)

## Standards define parsing, not a phishing verdict

| Source | Relevant behavior and proposed use |
|---|---|
| [RFC 2045, section 6](https://www.rfc-editor.org/rfc/rfc2045#section-6) and [RFC 2046, section 5.1](https://www.rfc-editor.org/rfc/rfc2046#section-5.1) | Decode MIME transfer encodings and respect multipart boundaries before parsing HTML. Plain text and HTML alternatives are not independent corroboration. Reuse MIME software rather than splitting `.eml` files on blank lines. |
| [RFC 2387](https://www.rfc-editor.org/rfc/rfc2387) and [RFC 2392](https://www.rfc-editor.org/rfc/rfc2392) | Related parts and `cid:` references describe embedded resources. A content ID is not a network hostname. |
| [RFC 2557, sections 4–8](https://www.rfc-editor.org/rfc/rfc2557) | `Content-Location` labels embedded parts and participates in relative-reference resolution. Even an HTTP-shaped reference can identify an embedded part. A Content-Location value is not verified hosting or ownership. |
| [WHATWG HTML parsing](https://html.spec.whatwg.org/multipage/parsing.html) | Tokenization, entity decoding, duplicate attributes and malformed-tree recovery affect extracted relationships. Preserve source locations alongside the recovered tree. |
| [HTML document base URLs](https://html.spec.whatwg.org/multipage/urls-and-fetching.html#document-base-urls) and [URL Standard](https://url.spec.whatwg.org/) | Resolve relative references only with a recorded base. Keep literal attributes and normalized URLs separate. Do not invent a base from the From address or brand domain. Parsing a URL does not request it. |
| [HTML image sources](https://html.spec.whatwg.org/multipage/images.html#parse-a-srcset-attribute) | `srcset` has its own parsing algorithm and alternative candidates. Splitting on commas is not a general implementation. Static extraction cannot establish the selected image without the relevant rendering environment. |

[RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) supplies generic URI syntax and reference-resolution concepts. Use WHATWG URL behavior for HTML web URLs rather than silently mixing two parsers. Neither these RFCs nor the HTML standard prescribes a phishing score for different image and link hosts. Input limits, output shape, privacy projection and concern assessment are project decisions.

## Parser choices

| Candidate | Verified properties | Judgment |
|---|---|---|
| `parse5` 8.0.1 | MIT; ESM and bundled types; one direct dependency, `entities` at `^8.0.0`. The project claims WHATWG compliance and identifies jsdom, Angular, Lit and Cheerio as users. | Preferred HTML parser. Use its tree and source locations, not a browser or a custom HTML regex. [Release manifest](https://github.com/inikulin/parse5/blob/0d56627fc924d40f560fd260ade0e1a935e2369c/packages/parse5/package.json), [project documentation](https://parse5.js.org/) |
| `htmlparser2` 12.0.0 | MIT; callback parsing with low allocations. Its README explicitly acknowledges shortcuts and recommends parse5 for strict HTML compliance. | Credible alternative if measured resource limits require streaming token extraction. It is not automatically equivalent for malformed ancestry. No comparative benchmark was run. [README](https://github.com/fb55/htmlparser2/tree/9d40676a8badfea0dff6d3963c1bcadc2ace82e1), [published metadata](https://registry.npmjs.org/htmlparser2/12.0.0) |
| `mailparser` 3.9.28 | MIT; Node streams for MIME and attachments. `simpleParser` buffers attachments and normally rewrites CID images. Options preserve CID links and suppress generated body conversions. | An established MIME option, not an HTML relationship extractor. Do not inherit conversion defaults or treat its HTML-to-text length option as an overall input bound. [Official options](https://nodemailer.com/extras/mailparser), [source](https://github.com/nodemailer/mailparser/blob/f06b1cee938fb828e5c3f71180cba5601f670a40/lib/mail-parser.js) |
| `postal-mime` 3.0.0 | MIT-0; no runtime dependencies; types and documented browser, Node and Cloudflare Email Workers use. Has MIME/header/embedded-message depth limits. Returns attachment content and assembled body strings. | Stronger initial candidate for future portable MIME ingestion. Size bounds and body provenance still need verification before selecting it. [README](https://github.com/postalsys/postal-mime/tree/e7c35dd9fcddaf73a1359256b1e4865e5cd33521), [manifest](https://registry.npmjs.org/postal-mime/3.0.0) |

Context7 was used for parse5, htmlparser2 and MailParser, then checked against primary sources. One indexed MailParser example described a 100 KB HTML limit. Current documentation says the default is Infinity; source checks decoded string length only on the HTML-to-text conversion path. That option is not a MIME admission limit. This is why snippets alone do not establish the contract.

Both reviewed MIME libraries can assemble content from multiple bodies. Offsets in that returned string are not offsets in original `.eml` bytes, and a flattened body is not proof of one MIME part. Selecting a MIME adapter requires a synthetic check of alternatives, nested messages and Content-Location handling. Do not use undocumented internals merely to force a part-level contract.

The HTML wrapper can accept strings and return observations without Node file APIs or Flue imports. That alone does not verify deployment compatibility. Neither the proposed extractor nor either MIME library was executed in Workers during this review; bundling, memory and runtime checks remain part of selecting the implementation.

## A bounded traversal, not an all-pairs comparison

The proposed extractor accepts a bounded decoded HTML body and a source identifier. Its body source must distinguish an original decoded part from a parser-assembled or operator-prepared body.

1. Parse once with source locations. A parse5 `scriptingEnabled` setting controls `noscript` interpretation; it is not an execution sandbox switch. Record the chosen mode. The ordinary parser produces a tree without rendering a page. [Parser options](https://parse5.js.org/interfaces/parse5.ParserOptions.html)
2. Traverse the tree iteratively, carrying the enclosing anchor ID. Each image receives the appropriate anchor relationship without a separate ancestor search or pairing every image with every link. Collect bounded anchor text during the same traversal. Call it extracted text, not verified visible text.
3. Record each occurrence before deduplication: ID, element and attribute, decoded value, source span, link text or image alt text, and enclosing link where present. Spans use UTF-16 offsets in the supplied decoded HTML string, not original `.eml` bytes. Preserve raw attribute spelling through those spans. Parser-created nodes can lack locations; retain that absence. Record parse recovery and truncated coverage.
4. Classify references as web URL, unresolved relative reference, CID, data reference, other scheme or invalid. This class describes syntax. Separately record embedded-resource resolution, with a part ID when resolved or unavailable when HTML-only input lacks the MIME context. Preserve base provenance when resolving relative references. Empty or fragment-only references need their own interpretation; do not turn them into a guessed external domain.
5. Build `Map<hostname, occurrence IDs>` summaries if needed. Retain full hostnames and use the installed suffix parser for domain boundaries. Compare selected hosts to the explicit reference once each. No binary search, cross-product of images and links, or new fuzzy-matching algorithm is needed.

The post-parse traversal is linear in visited nodes and text processed, with expected constant-time Map access. This is an algorithmic argument for our traversal, not a measured parser throughput or a worst-case guarantee for HTML recovery. Bound input bytes before parsing, traversal work, attribute and text lengths, output count, and output size. Stopping after a result limit must return partial coverage, not an empty safe result. A timer cannot interrupt synchronous parsing on the same JavaScript thread.

For the initial HTML subset, support `a[href]` and `img[src]`, including images inside links. Record unsupported coverage for `srcset`, CSS URLs, SVG, conditional-comment markup, forms, scripts and image pixels. Do not claim exhaustive link discovery. Templates and comments must not silently become displayed content. An unlinked logo and a separate download button form a message-level observation, not an enclosing-anchor pair.

Keep complete URL paths, userinfo and query strings in private evidence where authorized. Give the model selected host relationships and reviewed text; raw URLs can contain recipient IDs or access secrets. Extracting URLs is not redaction. Runtime loading and disclosure controls must be designed with the caller before wiring this into the current triage command.

## Dependency review before installation

None of these packages is present in the current lockfile. npm metadata was read for exact versions, not installed. For parse5 8.0.1, entities 8.0.0 and 8.1.0, and postal-mime 3.0.0, the inspected metadata declares no `preinstall`, `install`, `postinstall` or `prepare` hook. Publish/build scripts are different from install hooks, and absence of hooks says nothing about code executed on import.

All four metadata records include registry signatures. Entities and postal-mime also advertise provenance attestations; parse5's inspected record does not. The signatures and attestations were not cryptographically verified. npm integrity values identify bytes, not whether the code is benign. [parse5 metadata](https://registry.npmjs.org/parse5/8.0.1), [entities metadata](https://registry.npmjs.org/entities/8.1.0), [postal-mime metadata](https://registry.npmjs.org/postal-mime/3.0.0)

A version-specific request to the [OSV querybatch API](https://google.github.io/osv.dev/post-v1-querybatch/) returned no advisory IDs for those four versions on 2026-09-22. That is a dated database result, not a malware audit or proof of safety. Published archives, source-to-package correspondence, signature validity and import-time behavior remain unverified. Before installation, show the proposed exact dependency graph and artifact review to the operator, obtain agreement, and then pin the chosen versions and lockfile. No automatic upgrade policy is proposed.

## Validation and decision record

A few table-driven tests can cover meaningful behaviors: nested linked images; a separate brand image and lookalike action link; a benign CDN and tracking link; entities, userinfo, deceptive subdomains and relative bases; malformed anchors and duplicate attributes; CID and unsupported features; and limits with honest partial output. Verify zero fetch attempts and literal expected observations. These test mechanics, not phishing-detection accuracy.

If the proposal is adopted, add an ADR for offline extraction with element roles. Record the chosen parser/version, source precedents, alternatives, MIME-input boundary, URI semantics, disclosure rules, and known coverage limits. Add `docs/email-links.md` for inputs, outputs, examples, source positions and upgrade checks. Update the library and agent guides only when their integration exists. The portable triage document may describe evidence meaning, but must not acquire a dependency on this TypeScript implementation. No accepted ADR or product documentation is created for an unimplemented proposal.

## Accepted dependencies and implementation

Follow-up, 2026-09-22: the operator approved parse5 **8.0.1** with entities **8.1.0** locked, then confirmed approval after requesting release-age and reported-issue checks. Installed only those two packages with scripts disabled; no existing installed package version changed. parse5 is direct, entities transitive. No MIME parser was installed.

At 2026-09-22 16:45 UTC, npm publication dates placed parse5 8.0.1 at about 156 days old (`2026-04-19T20:16:16.612Z`) and entities 8.1.0 at more than 14 days old (`2026-09-07T22:42:04.929Z`). Both met the requested two-week age check. These are version publication dates, not repository commit dates. [parse5 metadata](https://registry.npmjs.org/parse5), [entities metadata](https://registry.npmjs.org/entities).

Both archives matched npm SHA-512 integrity values; their npm registry ECDSA signatures were verified against the published registry key. Archive inspection found no escaping paths, symlinks or declared install hooks. A bounded static scan found none of the selected network/process/evaluation markers in shipped JavaScript. This did not reproduce source-to-package builds or audit all executable behavior. Registry signatures are not provenance attestations; SLSA provenance was not verified. [Registry keys](https://registry.npmjs.org/-/npm/v1/keys), [parse5 artifact](https://registry.npmjs.org/parse5/8.0.1), [entities artifact](https://registry.npmjs.org/entities/8.1.0).

Exact-version OSV checks returned no advisory IDs. Upstream security pages listed no published advisory; the bounded public search found no compromise report for these versions. Historical parse5 issues include [resource exhaustion](https://github.com/inikulin/parse5/issues/361), [OOM behavior](https://github.com/inikulin/parse5/issues/276) and [nested forms](https://github.com/inikulin/parse5/issues/387). Absence of a current advisory is not a safety guarantee. [parse5 advisories](https://github.com/inikulin/parse5/security/advisories), [entities advisories](https://github.com/fb55/entities/security/advisories).

The implemented scope is narrower than the proposal: one tree walk preserves occurrences without automatic domain comparison, hostname indexing or redirect inference. The offline CLI writes full local evidence and a field-selected model summary. `--html` supplies that summary alongside prepared text, with pairing explicitly described as an operator assertion. Long URL details are omitted without hiding bounded hostnames; scheme-relative hosts are identified without resolving a base. [ADR 0010](../adr/0010-extract-email-link-roles.md) and [usage](../email-links.md) are the current contract. Claude, Grok and OMP independently reviewed the design and implementation; [scanner precedents](email-link-scanner-precedents.md) are recorded separately.
