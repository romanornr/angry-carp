# Email link extraction in established spam filters

Research date: 2026-09-22. This note examines primary documentation and source for local HTML link analysis. No scanners were installed or run, candidate websites fetched, or private messages read. Context7 resolved Rspamd documentation and Apache SpamAssassin documentation. SpamAssassin's indexed documentation returned no relevant material, so its official 4.0 documentation and source supplied the evidence.

Source snapshots are Rspamd commit [`8a829eeda2157e851dedca2f3706fc9e1f1dcbc3`](https://github.com/rspamd/rspamd/commit/8a829eeda2157e851dedca2f3706fc9e1f1dcbc3), dated September 20, and Apache SpamAssassin commit [`5e3ad4cfb07eba575b1082c0583d3744a9c360ea`](https://github.com/apache/spamassassin/commit/5e3ad4cfb07eba575b1082c0583d3744a9c360ea), dated September 22. These are development snapshots, not claims about every released version.

## Rspamd retains image roles and HTML relationships

Rspamd distinguishes URLs found in image `src` attributes through its `image` flag. It also records displayed HTML URLs, plain-text URLs, and subject URLs. `get_phished()` exposes the associated displayed URL when the parser marks a mismatch. These are extraction and classification fields, not evidence that a destination was visited. [Rspamd URL API](https://docs.rspamd.com/lua/rspamd_url/)

Its HTML API exposes tag types, attributes, parents, and children. Image records include `src`, dimensions, and whether the image is embedded. `get_content()` is explicitly approximate in some cases, and the parser reports broken or unbalanced tags. [Rspamd HTML API](https://docs.rspamd.com/lua/rspamd_html/)

Nested linked-image handling is implemented. `has_anchor_parent()` walks every ancestor until it finds an `a` element. The `HTML_SHORT_LINK_IMG_*` rules use that relationship with message length, image dimensions, and embedded-image status. This recognizes an image inside intermediate elements within an anchor. It is a spam heuristic, not brand recognition or a generic phishing verdict. [Pinned HTML rules](https://github.com/rspamd/rspamd/blob/8a829eeda2157e851dedca2f3706fc9e1f1dcbc3/rules/html.lua#L28-L95)

`task:get_html_urls()` separately returns HTML URL records grouped by MIME part with `url`, `attr`, and `tag` fields. Those records offer more source context than a flat list, but the documented fields do not include a complete image-to-anchor relationship. [Rspamd task API](https://docs.rspamd.com/lua/rspamd_task/)

## Rspamd compares displayed domains locally

`html_url_is_phished()` looks for a URL at the start of trimmed anchor text, normalizes internationalized hostnames, and compares hosts and effective registrable domains. It retains a link between the target and displayed URL when it marks a mismatch. Consequently, a label such as "Sign in" does not provide a displayed domain for this comparison. [Pinned URL comparison](https://github.com/rspamd/rspamd/blob/8a829eeda2157e851dedca2f3706fc9e1f1dcbc3/src/libserver/html/html_url.cxx#L196-L282)

The same source suppresses some mismatches when a wrapper query contains exactly one embedded target at each nesting level and the final target matches the displayed domain. The search has a depth limit and rejects ambiguous levels. This examines URL strings without following redirects. Our inference is that Angry Carp should preserve the wrapper and embedded target as separate observations. An attacker can place a legitimate URL in a query that the server ignores. [Pinned wrapper heuristic](https://github.com/rspamd/rspamd/blob/8a829eeda2157e851dedca2f3706fc9e1f1dcbc3/src/libserver/html/html_url.cxx#L144-L195)

Rspamd documents exceptions for legitimate redirectors and email service providers. This acknowledges a false-positive source. Its documentation's "top-level domain" wording is imprecise here: the URL API defines `get_tld()` as the effective registrable domain computed with the Public Suffix List. [Phishing module](https://docs.rspamd.com/modules/phishing/), [URL API](https://docs.rspamd.com/lua/rspamd_url/)

## SpamAssassin keeps tag types and anchor text

`get_uri_detail_list()` returns unique URI entries with tag types, cleaned variants, anchor text, domains, and hosts. One URI can have both `a` and `img` types. Therefore, deduplication does not require throwing away all roles. However, this summary does not preserve an occurrence-level tree. [SpamAssassin message API](https://spamassassin.apache.org/full/4.0.x/doc/Mail_SpamAssassin_PerMsgStatus.html)

The implementation reads `href` for anchors and `src` for images. An image inside an anchor appends an `<img>` marker to its anchor-text records. That preserves the presence of an enclosed image, not that image's specific `src` relationship. The parser subclasses Perl `HTML::Parser` and applies mail-specific repairs, including malformed attribute handling and quote normalization. Our inference is that its output requires evaluation against relevant mail clients rather than an assumption of browser-equivalent parsing. [Pinned HTML implementation](https://github.com/apache/spamassassin/blob/5e3ad4cfb07eba575b1082c0583d3744a9c360ea/lib/Mail/SpamAssassin/HTML.pm)

The `URIDetail` plugin can constrain a rule by tag type and compare anchor text with cleaned URI values. Its documented `FAKE_HTTPS` example detects an HTTPS claim in text without HTTPS in the cleaned target. This establishes reusable rule machinery, not a documented general brand-to-destination classifier. SpamAssassin's separately named `Phishing` plugin checks threat feeds. [URIDetail](https://spamassassin.apache.org/full/4.0.x/doc/Mail_SpamAssassin_Plugin_URIDetail.html), [Phishing](https://spamassassin.apache.org/full/4.0.x/doc/Mail_SpamAssassin_Plugin_Phishing.html)

## MIME references affect resource interpretation

An image `src` can identify another MIME body part through `cid:`. Its address-like identifier is not a web destination. RFC 2557 also permits references to embedded parts through `Content-Location`, including absolute URIs, and defines relative-reference resolution. Thus, an HTTP-shaped image URL does not alone prove that displaying the message requires a remote fetch. [RFC 2392](https://www.rfc-editor.org/rfc/rfc2392), [RFC 2557, section 8.2](https://www.rfc-editor.org/rfc/rfc2557#section-8.2)

## Proposed reuse for Angry Carp

These precedents support retaining each occurrence's MIME part, tag, attribute, parsed value, and enclosing anchor before producing domain summaries. A linked image contributes both an image source and an action target. Source roles alone cannot establish brand ownership, malicious intent, actual visibility, or a redirect destination.

Local extraction can use these ideas without fetching assets. A complete spam-filter invocation has a broader boundary: Rspamd's phishing implementation includes optional feed-map and DNS checks. Reusing parser behavior does not establish that an unchanged scanner configuration satisfies Angry Carp's network policy. [Pinned phishing implementation](https://github.com/rspamd/rspamd/blob/8a829eeda2157e851dedca2f3706fc9e1f1dcbc3/src/plugins/lua/phishing.lua)
