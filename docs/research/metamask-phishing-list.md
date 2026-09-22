# MetaMask phishing-list reuse

Research date: 2026-09-22. This extends the [DNS catalogue and threat-list comparison](dns-reference-and-threat-lists.md). Research only; no dataset, dependency, or runtime integration was added.

## Recommendation

Consider MetaMask's current list as a source of crypto-focused threat observations. It complements the proposed named-service directory and can be evaluated alongside HaGeZi TIF. It does not replace either a brand directory or independent verification of a product announcement. For the wallet-themed mail examined so far, I would consider this focused snapshot before implementing a broad service-association catalogue.

Prefer a pinned data snapshot and a small local matcher over installing MetaMask's wallet controller. Keep existing domain-confusable observations separate from MetaMask's fuzzy-detection policy. This is an engineering recommendation, not an accuracy result or approval to implement.

## Verified artifacts

The [repository README](https://github.com/MetaMask/eth-phishing-detect/blob/f2c0876d3103d6a5e47a526b48bcfef5ac877ae5/README.md) describes a list targeting Web3 threats, including impersonation and key theft. Detection code has moved to `MetaMask/core/packages/phishing-controller`.

I parsed the complete [config.json snapshot](https://github.com/MetaMask/eth-phishing-detect/blob/f2c0876d3103d6a5e47a526b48bcfef5ac877ae5/src/config.json) at commit `f2c0876d3103d6a5e47a526b48bcfef5ac877ae5`, whose commit date is 2026-09-21. The file is 2,898,965 bytes, with SHA-256 `65a5aefa85d45699ec8bf3ccd1a031a328f7219b0480af1963a8a9ff2563e051`.

| Field | Observed value | Meaning for reuse |
|---|---|---|
| `blacklist` | 101,564 strings | Source block entries, including 500 containing `/`. |
| `whitelist` | 58 strings | Exceptions in the detector's policy, not brand ownership evidence. |
| `fuzzylist` | 8 strings | Targets for the detector's approximate-name comparisons. |
| `tolerance` | 1 | Levenshtein threshold for that policy. |
| `version` | 2 | Config value; use the commit and digest to identify the actual snapshot. |

The block entries were ASCII strings with no duplicates. These counts describe this snapshot, not detection coverage or memory consumption. Entries are plain strings without individual evidence, discovery dates, or threat-category records. The [false-positive policy](https://github.com/MetaMask/eth-phishing-detect/blob/f2c0876d3103d6a5e47a526b48bcfef5ac877ae5/doc/fp-policy.md) describes external contributors, bots, review, and corrective action for false positives. Git history can support a later investigation of an addition; a snapshot retrieval date is not an entry's discovery date.

## Matching semantics matter

The examined [detector](https://github.com/MetaMask/core/blob/2ace29733affc706d8dcfd894d249cb5bdf6ec66/packages/phishing-controller/src/PhishingDetector.ts) distinguishes blocklist, allowlist, fuzzy, and no-match results. Its [hostname matcher](https://github.com/MetaMask/core/blob/2ace29733affc706d8dcfd894d249cb5bdf6ec66/packages/phishing-controller/src/utils.ts) compares complete reversed DNS labels. A hostname entry also matches its subdomains, without matching an unrelated suffix such as `example.com.attacker.test`.

The detector checks supported IPFS identifiers and configured path entries before hostname allowlists. Hostname allowlists precede hostname blocklists and fuzzy checks. Importing its final boolean would therefore import a blocking policy that can hide observations we want to preserve separately.

Path entries require separate treatment. The [path trie](https://github.com/MetaMask/core/blob/2ace29733affc706d8dcfd894d249cb5bdf6ec66/packages/phishing-controller/src/PathTrie.ts) matches an exact hostname and a prefix of decoded path components. It does not simply promote a listed path to a blocked hostname. The legacy JSON constructor does not itself turn slash-containing entries into this trie. A consumer must prepare the data correctly. A domain-only first increment must disclose unsupported path coverage rather than strip the paths or silently claim a complete check.

Fuzzy matching removes the final DNS label, strips a leading `www.` from the candidate form, and applies ordinary Levenshtein distance. It is not Unicode-confusable matching or public-suffix-aware brand discovery. We already have explicit-reference domain observations; importing this separate fuzzy verdict is unnecessary for list membership.

The [maintainer guidance](https://github.com/MetaMask/eth-phishing-detect/blob/f2c0876d3103d6a5e47a526b48bcfef5ac877ae5/doc/lists-ref.md) discourages expanding the fuzzylist because of false positives. Some technical references on that page are stale, including its tolerance example; the current config and code take precedence. Our skeleton and containment checks are not a strict replacement for edit distance: ordinary spelling edits can trigger Levenshtein without triggering either check. No comparative test establishes one detector as universally better.

For Angry Carp, return the source, snapshot identity and date, matched entry, and match scope. Keep an allowlist observation separate from other threat evidence. No match provides no assurance of safety. A listed service can still host malicious content on one path or tenant.

## Relationship to HaGeZi and the Bifrost case

[HaGeZi's source list](https://github.com/hagezi/dns-blocklists/blob/af0eec10c0f5738a93a361cc91b3e9141c3cb97d/sources.md) names `MetaMask/eth-phishing-detect/master/src/hosts.txt`. It also states that inputs are transformed rather than copied wholesale. The cited file still returns data, but `master` was at commit [09467d0](https://github.com/MetaMask/eth-phishing-detect/commit/09467d0f492713954db80da58a82bb41f49aa8a4), dated 2024-12-13, while the current JSON is on `main`. This prevents claiming that HaGeZi already contains the current MetaMask snapshot. Two hits may still share upstream evidence.

I independently reproduced Claude's overlap counts using [full TIF's hostname file](https://github.com/hagezi/dns-blocklists/blob/af0eec10c0f5738a93a361cc91b3e9141c3cb97d/wildcard/tif-onlydomains.txt) at commit `af0eec10c0f5738a93a361cc91b3e9141c3cb97d`, dated 2026-09-22. That file is 48,278,783 bytes with SHA-256 `5a177772e9bec82cd04bdaf100fdc479bf64f481fd30c3a455be1fbd02ad4161`.

| Comparison | Count |
|---|---|
| TIF entries after removing blank and comment lines | 2,770,932 |
| MetaMask entries without `/` | 101,064 |
| Exact matches between those sets | 47,423 |
| MetaMask names matching TIF exactly or through a DNS-label ancestor | 48,325 |
| MetaMask names without either TIF match | 52,739 |

The calculation uses complete label boundaries and excludes all 500 slash-containing MetaMask entries. About 52% of the hostname-only MetaMask set has no exact or ancestor match in this TIF snapshot. That establishes additional entries, not additional confirmed phishing detections or unique upstream reports. Smaller TIF editions and later snapshots can differ. No candidate websites were requested by this comparison.

A local exact-host/ancestor check found no match for either `bifrostwalletapps.download` or `songbirdsoftware.ltd` in the three JSON lists. The supplied reference domain also had no such match. No candidate URL was visited. This check does not replace a complete URL/path evaluation or establish safety; it shows why registration, domain comparison, and official-source contradictions remain useful when lists miss a case.

## Licensing and runtime fit

The data repository's [license](https://github.com/MetaMask/eth-phishing-detect/blob/f2c0876d3103d6a5e47a526b48bcfef5ac877ae5/LICENSE) is the Don't Be a Dick Public License, version 1.2. Its package identifies the license as `DBAD`. The separate [controller package](https://github.com/MetaMask/core/blob/2ace29733affc706d8dcfd894d249cb5bdf6ec66/packages/phishing-controller/package.json) declares MIT. Using MIT detector code does not change the data's license. Preserve the source and license text in a concrete snapshot-packaging proposal; do not label this dataset MIT.

The controller package also depends on wallet-specific address-book, transaction, base-controller, and messenger packages. We need none of those operations for offline membership checks. A data-only implementation can keep file loading and updates in the trusted runtime and give Flue only relevant observations. No credentials, candidate-site requests, or per-domain external query are necessary for such a lookup.

Raw file size is not parsed memory use or bundle size. Workers compatibility, load time, and matching performance have not been tested. `phishing-triage.md` remains portable; any integration belongs under `agent/`.

## Independent opinions

Claude and Grok independently recommend reusing list data, keeping source-labelled observations, and avoiding the controller dependency and allowlist-as-brand-data interpretation. Both support a bounded local matcher. Claude additionally compared the current hostname entries with full TIF.

The synthesis corrects several overstatements in the initial opinions. A stale declared upstream does not prove absence from HaGeZi. Co-listing does not reveal which upstream supplied an entry. Unicode skeleton checks do not subsume edit distance. Moving a snapshot outside the repository does not settle its licensing terms. DBAD's legal effect has not been established by this technical review.

## Verification limits

Context7 returned general MetaMask documentation rather than the detector API, so the analysis above uses pinned first-party source files. The JSON and full TIF text were downloaded from their publishers and parsed in memory for counts, overlap, and the bounded case check. No packages were installed or executed. No private email, credential, candidate website, or wallet account was accessed. The repository does not contain either downloaded list.
