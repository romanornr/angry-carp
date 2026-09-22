# Offline brand lookup

Research and retrieval date: 2026-09-22. This note combines primary-source research with independent Claude and Grok investigations. It extends the [earlier detector review](url-and-visual-phishing-detection.md). It is a proposal, not an implemented capability or an accuracy benchmark.

The subsequent [DNS catalogue and threat-list comparison](dns-reference-and-threat-lists.md) expands these options with AdGuard, NextDNS, Control D, and public feeds. It recommends combining separately labelled reference and threat observations, while retaining 2FA Directory as the first named-service reference candidate. No source has been adopted yet.

## What is already solved

An offline index can find reference domains for a supplied brand without exposing the whole catalogue to the model. Exact lookup and multi-pattern matching are established techniques. The unresolved work is selecting and maintaining the reference data.

A catalogue entry establishes what its source recorded. It does not establish that every message using the domain is legitimate, that another domain is unauthorized, or that a particular product exists. The Bifrost case needed a dated support-page observation to contradict the desktop-app claim. A homepage directory cannot supply that fact.

## Existing sources and systems

| Source | What exists | Fit for Angry Carp |
|---|---|---|
| [2FA Directory](https://2fa.directory/api/) | Downloadable JSON about account services. Supported version 3 preserves service names, domains, additional domains, and regions. Version 4 removes service names. Data is MIT-licensed with attribution; local caching is encouraged. | A practical candidate source for a first snapshot. Its purpose and coverage are narrower than a general brand directory. |
| [Wikidata P856](https://www.wikidata.org/wiki/Property:P856) | Entity website claims, including current and former websites. [Aliases](https://www.wikidata.org/wiki/Help:Aliases) are language-specific and can belong to several entities. | Broad candidate data, with entity ambiguity and historical statements to preserve. It is not a ready-made list of approved login or download domains. |
| [Phishpedia](https://github.com/lindsey98/Phishpedia) | The README describes 181 reference brands in the paper, expanded to 277, and a `domain_map.pkl` beside logo references. The detector uses a URL and screenshot. | An established brand-to-domain comparison design. The research distribution is a poor first data dependency for our text-only workflow. |
| [KnowPhish, USENIX Security 2024](https://www.usenix.org/conference/usenixsecurity24/presentation/li-yuexin) | A knowledge base of about 20,000 brands, constructed using Wikidata and supplemented with other sources. | Closest research match, but the [authors currently withhold the code and knowledge base](https://github.com/imethanlee/KnowPhish). The downloadable evaluation dataset is a different artifact. |
| [PhishLLM, USENIX Security 2024](https://www.usenix.org/conference/usenixsecurity24/presentation/liu-ruofan) | Model-assisted brand identification with external validation, rather than a fixed reference list. | Relevant to later online discovery. It supplies no offline catalogue to import; the earlier review documents its browsing constraints. |

2FA Directory's [contribution rules](https://github.com/2factorauth/twofactorauth/blob/master/CONTRIBUTING.md) distinguish the service's main page from its login page. They also impose inclusion criteria and exclusions. Missing entries therefore cannot count against a sender. Its documentation links concern authentication features, not proof of every associated domain's ownership. The [licence](https://github.com/2factorauth/twofactorauth/blob/master/LICENSE.md) and attribution must accompany redistributed data. Images have separate rights and are unnecessary here.

Wikidata offers [CC0 structured data](https://www.wikidata.org/wiki/Wikidata:Licensing) and [offline dumps](https://www.wikidata.org/wiki/Wikidata:Database_download). A focused extract would need labels, aliases, website statements, references, and time qualifiers. Its [ranking documentation](https://www.wikidata.org/wiki/Help:Ranking) explicitly separates rank from references. Preferred rank is community preference, not independent verification of current ownership. Normal rank is neutral, not a marker that the website is former. Deprecated statements should not become current references, but can remain historical evidence.

Phishpedia's repository carries a [CC0 licence](https://github.com/lindsey98/Phishpedia/blob/main/LICENSE). That alone does not establish fresh, individually sourced domain associations. We did not download or deserialize its pickle, model weights, or logo archive. A Python model pipeline is unnecessary for a TypeScript directory lookup.

Two deployed approaches provide useful comparisons. [Chrome performs local skeleton comparisons](https://chromium.googlesource.com/chromium/src/+/HEAD/docs/idn.md) against popular or previously engaged domains. That detects resemblance, not brand ownership. [Rspamd compares displayed link URLs with destinations](https://docs.rspamd.com/modules/phishing/) and supports domain maps and exceptions. That is useful email evidence, but does not turn its maps into a universal brand directory.

## Algorithms that fit the question

| Question | Method | Recommendation |
|---|---|---|
| Which entries use this supplied brand name or alias? | Exact normalized-name index returning multiple records | Start here. Preserve the matched name and its language. |
| Which entries mention this hostname? | Exact hostname index | Preserve the full source URL and path. A shared-hosting domain can serve unrelated entities. |
| Which reference labels look like this domain? | Unicode skeleton index followed by the existing domain comparator | Reuse our installed confusable mapping. Record its version and return collisions as candidates. |
| Which of many brand names occur anywhere in this body? | Aho-Corasick multi-pattern matching | Appropriate if automatic body scanning becomes a requirement. It is unnecessary for one supplied name. |
| Which names are approximately similar? | Trigram retrieval or another bounded fuzzy search | Defer until exact matching has a demonstrated gap. Similarity does not resolve ambiguous entities. |

[Aho and Corasick's 1975 paper](https://www.researchgate.net/publication/220423622_Efficient_string_matching_An_aid_to_bibliographic_search), available through the author's upload, describes compiling many keywords into a machine that scans text in one pass. This addresses the repeated-loop concern. For an already supplied brand, an ordinary index is simpler. Index construction examines the catalogue once; each assessment retrieves relevant records rather than scanning or prompting with the whole list.

No fixed catalogue-size threshold or latency claim is justified by this research. We did not benchmark these options. Neither vector search nor a trained model is required for exact lookup.

## Proposed Flue integration

My recommendation is a snapshot-backed candidate lookup, with 2FA Directory v3 as the first reuse candidate and explicit operator references for missing brands. This avoids starting a general Wikidata import pipeline or making the operator type every entry. Coverage, download size, and suitability for the operator's actual brands remain unmeasured.

The proposed runtime behavior is:

1. Load a versioned data snapshot outside the model context. Dataset updates occur separately from assessments.
2. Look up the supplied brand or hostname and return a bounded set of matches. Preserve ambiguity and disclose truncated results.
3. Include the source, snapshot date, exact URL, matched name, and whether an operator independently verified the association. Record domain role only when supported; otherwise leave it unknown.
4. Feed relevant reference domains to the existing [domain comparator](../domain-lookalikes.md). A match remains an observation, not an allowlist decision.

Keep source claims separate from reviewed operator references. A source signature can authenticate a dataset publisher without proving every entry correct. Retain full URLs when deriving hostname or registrable-domain indexes: a page under a shared platform must not imply ownership of that platform. Unknown brands remain unknown and can use separately authorized online research.

Keep this integration under `agent/`. The standalone `phishing-triage.md` must not depend on our catalogue, TypeScript code, or tool names. Local snapshot loading must remain separate from pure lookup so future Workers storage can change without changing matching semantics. Snapshot size, memory cost, and Workers execution have not been verified; no cloud infrastructure is selected here.

## Independent opinions and remaining choice

Claude initially recommends a small operator-curated reference file, citing the uncertainty and entity mismatch in broad datasets. Grok initially recommends a pinned Wikidata extract used strictly for candidate generation. Both recommend exact indexes, bounded model results, reuse of the domain comparator, and no large prompt list.

After separately checking 2FA Directory, both reviewers agree that a pinned v3 snapshot is less integration work than a Wikidata importer or an entirely manual catalogue. Claude recommends source metadata and reviewed operator overrides. Grok emphasizes that the service's main domain is not necessarily its login host. Both retain the distinction between a directory claim and verified ownership.

I recommend that option, but do not adopt stronger claims from the reviews. We have not measured its accuracy against Wikidata, verified its signatures, or established the size of the parsed in-memory index. The publisher currently lists v3 as supported; v4's existence alone does not establish a v3 retirement date. Retain licence notices as well as visible attribution, and distinguish snapshot publication time from the last verification of each entry.

This research changed no runtime code, installed no dependencies, and made no assessment model calls. It inspected public documentation and a sample public directory record, but imported no catalogue and visited no candidate phishing website. Rspamd documentation was checked through Context7; Context7 returned no matching 2FA Directory library, so its API facts use the publisher's documentation directly.
