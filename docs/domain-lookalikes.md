# Domain lookalike observations

The local Flue agent can call `compare_domains` to compare one observed domain with an explicitly supplied reference. It computes name observations without DNS requests, website visits, filesystem access, or another model call. This tool does not verify brand ownership or classify phishing.

## Supply a reference

Include the official domain in a separate operator note in your prepared evidence. Identify the independent source and retrieval date supporting that reference. An image URL or brand claim inside the email is not sufficient verification.

Run the existing triage command:

```sh
npm --silent --prefix agent run triage -- ../evidence/emails/example.prepared.txt
```

The model chooses whether the comparison helps. Its tool instructions require a reference from operator notes; this provenance rule is not enforced by the input schema. The function treats both names as supplied inputs and does not label the reference as independently verified. Tool-specific instructions live in `agent/src/lookalikes/tools.ts`, outside the shared triage Markdown.

## Results

| Field | Meaning |
| --- | --- |
| `reference`, `observed` | Parsed name details or an explicit interpretation failure. |
| `escapedInput`, `formatCharacters` | Original spelling with invisible/format characters escaped, plus their UTF-16 offsets. Captured before IDNA conversion. |
| `ascii`, `unicode`, `changedByIdna` | Canonical domain forms and whether IDNA maps the input beyond case, one trailing dot, and ordinary punycode decoding. The escaped original remains available for comparison. |
| `registrableDomain`, `label` | Domain boundary and identifying label under the bundled public-suffix list, including its private section. These do not establish actual registration or common ownership. |
| `labels[].scripts` | Primary-script inventory for each Unicode label. `Common`, `Inherited`, and `Unknown` remain visible. |
| `relationship` | Exact canonical name, a subdomain of the reference at a dot boundary, or a different name. None means that a website is safe. |
| `skeletonEqual` | Equality of the identifying labels' Unicode comparison forms. It ignores their suffixes and does not compare website content. Identical names also have equal skeletons. |
| `referenceLabelContained` | First literal occurrence of the reference label inside a longer observed label, with its prefix and suffix. Otherwise `null`. |
| `referenceSkeletonContained` | The same containment comparison on skeletons. Prefix and suffix are comparison text, not original domain spelling. |
| `confusablesUnicodeVersion` | Unicode version of the confusable mapping data used for that comparison. |

For example, `bifrostwalletapps.download` compared with `bifrostwallet.com` returns different domains, unequal skeletons, and the suffix `apps` after the reference label. `applebees.com` compared with `apple.com` also returns containment. That observation alone says nothing about authorization or maliciousness.

The tool accepts one pair of bare Unicode or punycode domain names. It rejects URL and email-address syntax and limits each input to 1,024 UTF-16 code units. Canonical names must fit DNS hostname syntax and its 253-character limit. Unknown suffixes, IP addresses, and invalid IDNs produce an unavailable comparison, not a negative match. Defanged names need their dots restored before comparison.

## Design and limits

Reviewed 2026-09-22. The implementation pins [`@moderation-api/unicode-spoofing` 0.4.0](https://github.com/moderation-api/unicode-spoofing) and [`tldts` 7.4.14](https://github.com/remusao/tldts). Both use MIT licenses; `tldts-core` is a transitive dependency. Pinning and the lockfile keep data updates deliberate.

The Unicode package supplies `skeleton` and `primaryScript`; its `spoofed` flag and moderation policies are unused. Skeletons use Unicode 17 data. The current [UTS #39 revision 34](https://www.unicode.org/reports/tr39/tr39-34.html) describes Unicode 18, so this is not a claim of current, complete UTS #39 conformance. Script properties depend on the JavaScript runtime and the package's supported-script list. The inventory does not compute Script_Extensions, augmented script sets, restriction levels, or bidirectional display equivalence. `Unknown` means the classifier cannot name that script.

`tldts` locates the identifying label correctly for suffixes such as `co.uk` and private suffixes such as `github.io`. It avoids a last-two-label assumption and a separately maintained suffix table. A suffix-list update can change those boundaries. Node's IDNA conversion supplies ASCII and Unicode forms; original invisible characters are recorded because conversion can remove them.

Literal containment and skeleton containment are separate. The latter catches combinations such as a confusable brand spelling followed by `apps`; neither performs word segmentation. There is no short-name threshold, edit-distance score, brand list, or scan of every subdomain for brand tokens. Full-name boundaries remain in the result so an embedded reference such as `paypal.com.attacker.net` is not mistaken for a subdomain of `paypal.com`. No match means only that these particular comparisons found no match.

The core imports `node:url` for IDNA conversion. [Cloudflare Workers documents these functions](https://developers.cloudflare.com/workers/runtime-apis/nodejs/url/) with Node compatibility. The dependencies bundle without additional Node built-ins; actual Workers execution remains untested. No deployment or credential-storage changes are included.

## Verification

From the repository root:

```sh
node --test agent/src/lookalikes/compare-domains.test.ts
npm --prefix agent run check:types
```

The eight tests use the real libraries and synthetic names. They cover Cyrillic and ASCII lookalikes, whole-script matches, public/private suffixes, exact/subdomain boundaries, invisible characters, valid multilingual names, unknown scripts, and malformed input. They verify the mechanism, not real-world phishing detection accuracy. Earlier [Unicode experiments](research/unicode-confusable-evaluation.md) and [detection research](research/phishing-detection-methods.md) explain the broader evaluation needs.
