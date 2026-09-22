# Look up reference domains

The local Flue agent has `lookup_brand`, an offline lookup against a pinned 2FA Directory v3 snapshot. Ask for a service name or an exact hostname in your assessment request. You do not need to paste the directory into the message.

For example, ask it to look up Google Cloud before comparing a link domain. `Google Cloud` finds Google Cloud Platform by matching both words. `Google` finds several products and may need a more specific query. Acronyms such as `AWS` are not automatically expanded. You can supply the full service name or an independently sourced reference in operator notes.

## What a result means

An entry means that 2FA Directory recorded the service/domain association. It does not verify ownership, authorize a download, or establish that an email is legitimate. The directory is crowdsourced, incomplete, and may be outdated. It is not a threat blocklist.

Each result includes the source URLs, snapshot SHA-256, retrieval and signing dates, and attribution. Signature verification during installation authenticates the snapshot against the pinned publisher key; runtime startup checks only its checksum and schema. Neither check verifies each domain association. The signing date is not an individual entry's review date.

- Names match exactly after NFC normalization, lowercase conversion, and whitespace normalization. An exact match suppresses word matches: `Amazon` returns that entry, not Amazon Pay or Amazon Web Services. If no exact name exists, the entry must contain every query word. Totals describe the selected matching stage, not all related products. Original names, punctuation, and region labels remain in results.
- Hostnames match exactly, including declared additional domains. A root website URL can also supply a hostname. URLs with paths, queries, credentials, fragments, or non-default ports do not add blanket hostname entries. Full source URLs remain visible.
- A shared hostname can return several services. Parent domains and subdomains are not expanded automatically. `www` is not stripped: some services explicitly list a `www` host and others do not, so a `www` miss carries no information. `paypal.com.attacker.test` cannot match `paypal.com`.
- Results contain at most eight services and twelve additional domains per service. Totals and truncation flags disclose omitted results. Refine broad queries rather than treating the first page as exhaustive.
- No match says nothing about safety, resemblance, or whether the sender is impersonating a brand. Use separately sourced evidence when the directory lacks the needed reference.

The model can pass a selected candidate to `compare_domains`. The assessment must identify the directory and snapshot date as the reference source. The comparison result itself contains names and observations, not a verification claim or an embedded provenance record. The earlier `lookup_brand` result remains in the Flue conversation.

## Storage and execution

The public snapshot is in `lib/reference-data/2fa-directory/`. It includes original JSON, the signed message, publisher public key, licence, and `source.json` metadata. These are public reference files intended for Git, separate from credentials and private email evidence.

The trusted agent module calls the library's `loadBrandDirectory` once to read public JSON and metadata, validate their checksum and schema, and build private `Map` indexes. A corrupt or missing snapshot prevents initialization; it is not reported as an empty directory. Runtime startup checks the pinned digest; it does not run GPG or download data. The pure lookup and Flue binding contain no file-loading or credential access. The local loader is a separate export used by trusted setup.

See [updating reference data](updating-reference-data.md) for manual refresh and rollback. No scheduler or automatic refresh is installed. The [implementation research](research/brand-directory-implementation.md) explains the algorithm comparison. The pure lookup uses Web Crypto, JavaScript collections, and Valibot; actual Workers execution remains unverified.

Data sourced from [2FA Directory](https://2fa.directory/) by [2factorauth](https://github.com/2factorauth), under the [included MIT licence](../lib/reference-data/2fa-directory/LICENSE).
