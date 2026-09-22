# Implementing the offline brand directory

Research date: 2026-09-22. Proposed implementation, following [source selection](offline-brand-lookup.md). This concerns candidate official service domains from 2FA Directory. Threat-list membership is a separate capability. No runtime implementation or dependency change was made.

Implementation update, 2026-09-22: the operator subsequently approved this increment. The local lookup and Flue binding now exist; [current behavior](../brand-references.md) and [update commands](../updating-reference-data.md) supersede proposed file and update details below. Verification found that `.sig` contains signed JSON, not a detached signature. Its verified payload has 2,570 entries and differs from the older unsigned response benchmarked here. No runtime dependency was added.

Packaging update, 2026-09-22: [ADR 0008](../adr/0008-extract-reusable-checks.md) moves implementations and public data into `lib/`, with Flue bindings under `agent/src/tools/`. File layouts below remain historical proposals; use the [library guide](../../lib/README.md) for current imports and commands.

## Recommendation

Use built-in JavaScript Maps for exact service names and exact hostnames, plus an inverted index of words in service names. Load and validate one pinned snapshot in the trusted runtime, then construct the indexes once per process. Each Flue call returns a bounded set of source-labelled candidates. No catalogue enters the prompt and no lookup downloads data.

This follows the actual questions: a complete service name, a broad name such as Google, or a supplied hostname. It does not discover arbitrary brands across an entire email. There is no need for binary search, a search service, vector embeddings, a database, or another runtime dependency in this increment.

## Existing implementations and measured data

2FA Directory's [website search](https://github.com/2factorauth/2fa.directory/blob/936988910aa342f09ef8f77d89eb96d193cae5d2/src/components/search.js) sends queries to Algolia. Its website code is GPL-3.0, separately from the directory data's MIT licence. Reusing that hosted search would add a network dependency. Reuse the public data format instead.

The publisher's [API documentation](https://2fa.directory/api) describes v3 name/record pairs, additional domains, optional full URLs, signed downloads, caching, and attribution. Its [generator](https://github.com/2factorauth/twofactorauth/blob/667daf68737fd833acb4be457e8fca0f2bf9a9b1/scripts/APIv3.js) turns categories into `keywords`; these are not aliases. Its [JSON schema](https://github.com/2factorauth/twofactorauth/blob/667daf68737fd833acb4be457e8fca0f2bf9a9b1/tests/schemas/APIv3.json) documents the external shape. We can validate the fields we consume using the already-installed Valibot, without executing the publisher's generator or installing its build dependencies.

The downloaded `https://api.2fa.directory/v3/all.json` contained 2,569 rows in 514,655 uncompressed bytes. SHA-256: `02d17e97f88357bed10e95cb2c1fde995a6ab8cb5b5d07d394cc2bcfec9b0dbf`. Retrieved 2026-09-22; the response reported Last-Modified 2026-09-14 02:00:14 UTC. That is publication metadata, not a review date for each domain. The signature has not yet been verified, and the API artifact must not be assigned the source repository's latest commit without evidence that they correspond.

The data contains 3,362 distinct declared main/additional hostnames. Three map to multiple entries: `comed.com`, `nordaccount.com`, and `weltsparen.de`. The latter two represent multiple products or service names. Keep arrays of candidates even though normalized service names have no collisions in this snapshot.

The Apple entry declares `appleid.apple.com`. Google has ten named services but no exact `Google` entry. Microsoft has four but no exact `Microsoft` entry. `AWS` and `Bifrost Wallet` have no name-word match. Twenty-two explicit URLs have non-root paths. These observations rule out assuming that the declared domain is always a homepage, that every brand has one record, or that aliases are supplied.

## Algorithm comparison

[Princeton's symbol-table reference](https://algs4.cs.princeton.edu/31elementary/) describes sequential search and binary search over sorted keys; its [hash-table chapter](https://algs4.cs.princeton.edu/34hash/) describes indexed lookup. ECMAScript [requires Map access to be sublinear on average](https://tc39.es/ecma262/multipage/keyed-collections.html#sec-map-objects), not a universal worst-case constant-time bound.

I compared equivalent exact-name lookups on Node v24.15.0 using the downloaded rows. All three methods returned the same row IDs. The query set had 10,000 pre-normalized names, alternating existing entries and distinct misses. Times below are medians of nine warmed batches, with results consumed to prevent discarded work.

| Method | Time for 10,000 exact-name queries |
|---|---:|
| Linear scan | 143.253 ms |
| Sorted array with binary search | 2.790 ms |
| Map | 0.259 ms |

Building the name Map took a median 0.494 ms; sorting the already nearly ordered input took 0.117 ms. Parsing the JSON took 4.592 ms in the same warmed experiment. These are local microbenchmarks, not cold-start, memory, end-to-end assessment, or Workers measurements. Even linear lookup is small next to model latency; Map also avoids maintaining custom binary-search code.

For word matching, I indexed each distinct Unicode letter/mark/number token in each service name. The snapshot produced 2,875 token keys and 3,941 row references. Repeating ten representative queries 1,000 times gave 5.048 ms with postings versus 410.001 ms scanning every row, again with equal results. Token-index construction took 0.646 ms. The queries were Google, Microsoft, AWS, bank, PayPal, Bifrost Wallet, cloud, bank of america, cloud google, and x. Queries were normalized and tokenized before timing.

## Proposed lookup behavior

1. A name query first checks the complete normalized name. Normalize with NFC, lowercase, and collapsed whitespace; retain punctuation and the original spelling. This is a lookup convention, not full Unicode case folding or a confusable comparison.
2. If no exact name exists, split the query into distinct Unicode letter/mark/number tokens. Find the smallest token bucket and retain only records containing every query token. An absent token returns no candidates. An empty token set must not match the whole catalogue.
3. Report these as word matches, not exact identities. Google yields ten candidates; bank yields 84. Return at most eight, sorted by normalized full name and then declared domain using deterministic string ordering, with the total and an explicit truncation flag. Broad queries require refinement. Do not invent aliases, stem words, remove region suffixes from identity, or treat category keywords as brand names.
4. Hostname queries use the exact canonical hostname. Index declared main/additional hostnames and the hostname of an explicit HTTP(S) website URL only when its path is root and it has no query, fragment, or credentials. Return which source field matched and all relevant services up to the cap. No parent-domain fallback, registrable-domain collapse, or automatic subdomain authorization in v1. A hostname miss can still be compared against a reference obtained through a name query; it says nothing about resemblance.
5. Preserve the declared main domain, additional domains, regions, and optional full URL separately. A full URL with a path must not become a blanket hostname entry. Additional domains may also need bounded output; return their total and disclose truncation instead of claiming complete coverage.

Exact-name priority is explicit: an exact service result suppresses broader word candidates for that query. Duplicate exact names must all be retained. Word matching can suggest candidates across punctuation differences, so its weaker match kind stays visible. Prefix search, fuzzy spelling, skeleton candidate generation, and whole-body matching remain outside this increment.

## Proposed files and contract

```text
agent/reference-data/2fa-directory/v3.json       original public snapshot
agent/reference-data/2fa-directory/source.json   source URL, dates, SHA-256, attribution
agent/reference-data/2fa-directory/LICENSE      publisher's data licence notices
agent/reference-data/2fa-directory/v3.json.sig   detached signature, if verified
agent/src/brands/brand-directory.ts              schemas, private indexes, pure lookup
agent/src/brands/brand-directory.test.ts         offline behavior tests
agent/src/brands/tools.ts                       Flue tool binding
```

These are proposed locations, not files created by this research. Preserve the original snapshot bytes for digest/signature verification and discard irrelevant fields when constructing runtime records. Verify the publisher signature with an explicitly identified public-key fingerprint before accepting a snapshot; do not read or modify the operator's personal GPG keyring. A digest identifies bytes but does not authenticate their publisher. No signature verification is claimed yet.

The existing `agent/src/agents/phishing-triage.ts` already owns trusted file loading. It can load and validate this fixed public snapshot and construct the directory there, without a separate one-caller loader module. The pure module exposes a lookup operation, not its Maps. Local storage can then change without changing the matching algorithm.

Proposed public contract, with boundary schemas supplying the final validated types:

```ts
type BrandQuery =
  | { kind: 'name'; value: string }
  | { kind: 'hostname'; value: string };

// The runtime constructs this once from validated snapshot data.
directory.lookup({ kind: 'name', value: 'Google' });
directory.lookup({ kind: 'hostname', value: 'nordaccount.com' });
```

Each result carries source URL, snapshot digest, retrieval/publication dates, match kind, original service/domain fields, and coverage limits. A directory association is not independently verified ownership. Missing or invalid snapshot data is a load failure, not a no-match result.

Keep reviewed operator references in the existing prepared-evidence notes for this increment. That already supports missing brands and avoids introducing an override-file format, merge rules, and alias management before they are needed.

## Updating the snapshot

Keep the upstream locations in `agent/reference-data/2fa-directory/source.json`, alongside the installed snapshot's digest, retrieval date, reported publication date, signing-key fingerprint, and attribution. Record these public sources:

- Data: [v3/all.json](https://api.2fa.directory/v3/all.json).
- Detached signature: [v3/all.json.sig](https://api.2fa.directory/v3/all.json.sig).
- Format, supported versions, and signature instructions: [API documentation](https://2fa.directory/api).
- Source repository and licence: [2factorauth/twofactorauth](https://github.com/2factorauth/twofactorauth).

The implementation must ship an update guide with tested download and verification commands. A plain `wget` or `curl` download is the acquisition step, not the complete update. Download into a staging location, verify the signature against the recorded trusted key, validate the fields used by the directory, and inspect the additions, removals, and changed associations before replacing the installed files. Preserve the publisher's licence notices. A key change or unsupported format needs review rather than automatic acceptance.

Install the data and its metadata together between agent runs. The next process rebuilds its Maps from the new snapshot. Existing processes retain the snapshot they loaded, and earlier assessments retain their recorded snapshot identity. A failed download or validation leaves the installed snapshot unchanged. Identical downloaded bytes need no data replacement. Do not edit upstream rows locally; keep operator-supplied references separate so refreshes cannot overwrite them.

Start with manual updates. A weekly check for a new snapshot is a proposed maintenance cadence, not an implemented scheduler or a guarantee that the publisher has new data. Show snapshot dates in lookup results. Later automation can open a reviewed snapshot-update pull request using the same checks; scheduling, automatic activation, and deployment are separate increments. Keep the supported-version check in the guide: switching from v3 to v4 is a schema change that removes service names, not a routine URL substitution.

The intended user documentation is `docs/updating-reference-data.md`, linked from the local README once the snapshot and executable update steps exist. This section specifies that guide; it does not claim an updater is installed today.

## Integrate the reference boundary in one increment

The current `compare_domains` description permits only references supplied in operator notes. Adding a catalogue tool while leaving that instruction unchanged would make its output unusable for the intended next comparison.

Update `agent/src/lookalikes/tools.ts`, `docs/domain-lookalikes.md`, and the local README together to permit explicit directory candidates as well as operator-supplied references. The assessment must retain which source supplied the reference and whether anyone verified it. The comparison core already computes observations from supplied names without certifying ownership; it needs no parallel API or new verdict. These provenance rules remain tool instructions rather than a runtime guarantee that a model selected the correct reference.

Register the new lookup tool in that same reviewed increment, with offline tests for the complete lookup contract. No separate synthetic-agent trial or additional authentication stage is needed. Keep `phishing-triage.md` independent of the catalogue and Flue tool names, following ADR 0004.

Tests should cover duplicate names, shared hosts, exact-name priority, multi-word intersections, punctuation-only queries, deterministic truncation, negative region metadata, preserved URL paths, hostile hostname suffixes, and snapshot failures. They require no model call or candidate-site visit.

## Independent opinions and selected simplifications

Claude and Grok independently recommend Map-based lookup and preserving multi-entry matches. Claude measured the same data and added word matching after confirming that exact-only queries miss Google and Microsoft. Grok emphasizes keeping hostnames and full URLs rather than reducing them to registrable domains.

My proposal drops the extra skeleton/base-name indexes, automatic parent-host matching, new override-file system, and separate normalize/build/load modules from their initial designs. Word postings handle regional service-name discovery without deleting region markers from identity. Existing operator notes cover independently reviewed exceptions. A bounded result with its total avoids a new generic-query classifier with arbitrary thresholds.

Claude's follow-up accepts the reduced layout and a complete Flue increment. It emphasizes output caps, exact-host semantics, and the URL-host rule made explicit above. It also identifies a deliberate limit: the existing comparison result contains bare names, not reference provenance. The directory result retains the source metadata in the conversation, and the assessment instructions must name it when explaining a comparison. Adding a model-supplied `verified` flag would not enforce verification, so this proposal does not add one.

Grok proposes keeping catalogue comparisons inside the new lookup instead of changing the operator-only comparator instructions. I prefer one reusable name comparator and an explicit update of its caller contract. The lookup retrieves candidates; `compare_domains` compares a deliberately selected pair. Neither operation establishes ownership. This avoids a second comparison path and keeps ambiguous directory matches visible before comparison.

Workers deployment remains unverified. The pure directory needs JavaScript collections and the existing validation library; file loading and authentication stay in the local runtime. Node timing and raw JSON size do not establish Workers startup or memory compliance. Refresh remains an explicit snapshot replacement between runs, not network activity during assessment.
