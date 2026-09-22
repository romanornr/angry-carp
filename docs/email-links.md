# Email images and action links

The offline extractor records `a[href]` and `img[src]` occurrences, including which link encloses each image. It can expose a message using a familiar image host while directing clicks elsewhere. Different hosts are an observation, not a verdict: legitimate messages also use separate image and download services.

## Extract and review locally

Supply a decoded **UTF-8 HTML body**, not an original `.eml`, a rendered page, or HTML reconstructed from prepared text. For original-message MIME decoding, use [email analysis](email-analysis.md). Preserve the original separately and record how you obtained its HTML body.

From the repository root, using an existing case directory under the ignored `evidence/` folder:

```sh
npm --silent run extract:links -- evidence/example/body.html evidence/example/links.json
```

The command reads a regular local file, makes no network requests, and writes one new JSON file with mode `0600`. It refuses to overwrite an existing file. `extraction` contains private full references, bounded anchor/alt text, and source positions. `modelSummary` is an optional host-only inspection projection. Neither input nor output content is printed. Keep the output inside `evidence/`; Git ignoring it is not a filesystem access boundary.

For Flue assessment, use the [original-message command](email-analysis.md#add-an-ai-assessment) with a separately reviewed text file. The old triage `--html` pairing is retired. MIME analysis feeds decoded HTML directly into this extractor.

The standalone summary retains selected hosts, roles, relationships and coverage. Hostnames can contain tracking identifiers, so it is not anonymization. It does not itself send anything to a model.

## Interpret the result

| Field | Meaning |
| --- | --- |
| `quoteContext` | `marked_quote` inside a recovered blockquote or `div.gmail_quote`, otherwise `unmarked`; not proof of authorship. |
| `id` | Identifier within this extraction; repeated references remain separate occurrences. |
| `kind` | An anchor destination or image source. |
| `reference` | HTML-decoded attribute value and syntax classification. HTTP(S) references also retain the URL parser's serialization and full hostname, including IP literals. |
| `enclosingAnchorId` | Anchor occurrence in the recovered tree, or `null`. Relative, empty and unsupported anchor destinations still have IDs. |
| `attributeSpan`, `elementSpan` | Half-open UTF-16 offsets into the supplied HTML string, or `null`. Not offsets into original MIME bytes. Attribute slices preserve literal entity spelling. |
| `text`, `alt` | Bounded source text, not rendered visibility. Truncation is explicit. |
| `parseErrors` | Recovery diagnostics counted by code; not evidence of intent. |

For `<a href="https://download.example/setup"><img src="https://brand.example/logo.png"></a>`, the summary retains `brand.example`, `download.example` and their image/link relationship. It omits `/setup` and `/logo.png`. An unenclosed logo remains an image observation without an asserted clickable relationship.

## Parsing and coverage

parse5 8.0.1 applies [WHATWG HTML tree construction](https://html.spec.whatwg.org/multipage/parsing.html). One iterative depth-first walk then carries the enclosing anchor. Recovery can move elements or create nodes. Enclosure is tree-derived, not lexical nesting, visual placement, or proof that all mail clients agree. No rendering, script execution or resource fetching occurs. `scriptingEnabled: false` selects `noscript` parsing behavior; it is not a sandbox switch.

The standard [URL parser](https://url.spec.whatwg.org/) classifies values without a base URL. Relative paths remain unresolved; `<base>` is counted but not applied. For `//host/path`, HTTP-family parsing extracts the hostname into a distinct `scheme_relative` observation without claiming a scheme or resolved destination. Content IDs, data URLs, other schemes, empty values and invalid references remain distinguishable. Query strings do not establish redirects. Even an HTTP image URL might identify an embedded MIME part via Content-Location; `embeddedResourceResolution: unavailable` leaves that question open.

Coverage counts record encountered base elements, srcset, styles, SVG, forms, scripts, templates, comments and other observed URL-bearing attributes. SVG, template, script, style and other non-HTML subtrees are skipped. Counts describe the inspected portion, not every reference in the input. CSS URLs, SVG links, form destinations, client-specific conditional markup, MIME resolution, attachments, QR codes and browser visibility are not implemented.

| Limit | Behavior |
| --- | --- |
| 512 KiB UTF-8 HTML | Reject before parsing; never parse a truncated file. The local reader also rejects invalid UTF-8. |
| 20,000 visited nodes | Stop and report `node_limit`. |
| 200 occurrences | Stop before another occurrence and report `occurrence_limit`. |
| 4,096 UTF-16 units per retained reference field | Classify before limiting details: HTTP(S) and scheme-relative hosts survive long paths/queries. Oversized value, URL or hostname fields become `null`; other oversized references get an omitted marker. Report `reference_limit`. |
| 256 UTF-16 units per text/alt excerpt | Clip without splitting a surrogate pair; flag truncation and report `text_limit`. |

The input limit bounds acquisition and parser input. parse5 builds its tree before traversal limits apply. There is no synchronous parser deadline or claim of public-upload-service suitability; that deployment needs its own concurrency and isolation policy. Missing links and partial coverage never certify safety.

## Reuse and updates

```ts
import { extractEmailLinks } from '@angry-carp/checks/email-links';

const observations = extractEmailLinks(decodedHtml);
```

The function validates its input and performs no I/O. File loading and model projection belong to `agent/`. Workers execution and bundling have not been verified.

Only parse5's public `parse` function is called. No serializer, streaming, browser or MIME package is added. A named import does not remove other installed code: parse5's public entry point re-exports other modules. Avoid private import paths or copying parser internals merely to shrink the apparent dependency.

parse5 is pinned to `8.0.1`; entities is transitive and locked to `8.1.0`. Before updating, review exact release age, changes, advisories, dependencies, install hooks, archive integrity and available signatures. Update the recorded parser version with the package, run `npm test` and `npm run check:types`, and review malformed-HTML and disclosure behavior. No automatic updates run. [Artifact review](research/email-link-extraction.md#accepted-dependencies-and-implementation), [ADR 0010](adr/0010-extract-email-link-roles.md) and [scanner precedents](research/email-link-scanner-precedents.md) record the evidence and decisions.

The standalone command belongs to `cli/` and consumes the `@angry-carp/checks/email-links` export. [ADR 0012](adr/0012-separate-cli-from-flue.md) separates it from Flue; the public library owns both extraction and `summarizeEmailLinks`.
