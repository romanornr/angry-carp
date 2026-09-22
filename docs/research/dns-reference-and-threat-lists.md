# DNS reference catalogues and threat lists

Research date: 2026-09-22. This extends [offline brand lookup](offline-brand-lookup.md) with AdGuard, NextDNS, Control D, and public threat feeds. It records primary-source checks and independent Claude and Grok reviews. No runtime integration is selected or implemented.

Follow-up: [MetaMask phishing-list reuse](metamask-phishing-list.md) evaluates a focused crypto-threat source, its separate data and detector licences, path-aware matching requirements, and overlap with HaGeZi. It is an additional candidate, not a brand directory or an adopted dependency.

## The useful combination

These sources can contribute three different observations:

- A directory lists a website for a named company or service.
- A DNS catalogue associates a hostname with a service, including its infrastructure.
- A threat feed lists a domain or URL as a threat.

Keep that meaning and the source in every result. Combining observations can improve an assessment without turning them into a single allowlist or counting repeated upstream data as independent confirmation. None supplies the current product announcements needed for the Bifrost desktop-app contradiction.

## What is available offline

Counts are observations from the fetched files or repository trees, not claims about coverage of our mail.

| Source | Public artifact and observed scope | Licence or access | Proposed use |
|---|---|---|---|
| [AdGuard HostlistsRegistry services](https://github.com/AdguardTeam/HostlistsRegistry#services-meta) | Generated JSON with 142 services and 2,402 domain rules. Includes names and groups. | Repository has [GPL-3.0](https://github.com/AdguardTeam/HostlistsRegistry/blob/main/LICENSE). Public download. | Service and infrastructure association. Not an approved-domain list. |
| [AdGuard companiesdb](https://github.com/AdguardTeam/companiesdb) | Separate company, tracker, and VPN-service datasets. Company records have names and website URLs. | [CC-BY-SA-4.0](https://github.com/AdguardTeam/companiesdb/blob/main/LICENSE). Public JSON. | Additional company-reference candidates and tracker attribution, with their source relation preserved. |
| [NextDNS services](https://github.com/nextdns/services) | 43 files, one service identifier per file with newline-separated hostnames. | [MIT](https://github.com/nextdns/services/blob/main/LICENSE). Public download. | Small alternative service-association source. |
| [NextDNS metadata](https://github.com/nextdns/metadata) | Migration index pointing to surviving public lists. Its threat-intelligence feed and several categories are marked internalized. | No current public threat-feed export identified here. | Use linked public repositories where relevant; do not import the historical security list as current data. |
| [Control D](https://docs.controld.com/docs/filters) | Native security filters and third-party filters. [Services](https://docs.controld.com/docs/services) group related domains. | Service API routes tested by Claude required authentication. No offline catalogue export or redistribution grant verified. | A possible later online reputation source. Obtain public third-party lists from their publishers for offline use. |
| [HaGeZi Threat Intelligence Feeds](https://github.com/hagezi/dns-blocklists#tif) | Aggregate threat-domain lists in several formats. Full list was about 2.7 million entries; smaller editions omit data. | Repository has [GPL-3.0](https://github.com/hagezi/dns-blocklists/blob/main/LICENSE). Public downloads. | First candidate for a separate offline threat-list observation. |
| [OpenPhish Community](https://www.openphish.com/phishing_feeds.html) | Limited phishing-URL text feed, published every 12 hours. | [Service terms](https://www.openphish.com/terms.html) restrict organizational use and redistribution. | Optional personal lookup only under applicable terms; not a default redistributed snapshot. |
| [URLhaus](https://urlhaus.abuse.ch/api/) | Malware-distribution URL exports and derived hostname lists. | Auth-Key required for downloads; community fair-use and commercial terms apply. | Later malware-specific evidence source. It does not collect ordinary credential-phishing URLs. |
| [2FA Directory v3](https://2fa.directory/api/) | Names, main domains, additional domains, and regions for listed account services. | MIT with notices and attribution. Public cached JSON. | Retain as the simplest first source of named-service references. |

Repository licences are not interchangeable with licences of third-party feeds or artwork. GPL and share-alike terms do not prohibit reuse; preserve applicable notices and decide how any redistributed snapshot and modifications will be packaged. No dataset was added to the repository in this investigation.

## What the AdGuard files actually contain

The public [services.json](https://adguardteam.github.io/HostlistsRegistry/assets/services.json) response was 264,197 bytes. Of its 2,402 rules, 51 did not match the deliberately narrow syntax `^\|\|[a-zA-Z0-9.-]+\^$`. This is a parser-scope count, not a count of invalid rules. Examples include wildcards, single-pipe forms, and a DNS-record-type condition. Treating every string as a hostname would lose meaning.

A concrete example is the [Cloudflare service entry](https://github.com/AdguardTeam/HostlistsRegistry/blob/e06cc2c3bd1928056e05bae533764f152b2af4a3/services/cloudflare.yml), which includes `pages.dev` and `workers.dev`. That can identify a hosting-platform association. It cannot establish who operates a tenant, that Cloudflare sent the email, or that tenant content is safe. The [Discord entry](https://github.com/AdguardTeam/HostlistsRegistry/blob/e06cc2c3bd1928056e05bae533764f152b2af4a3/services/discord.yml) also includes an exact-host rule on Zendesk infrastructure.

Companies DB needs a separate reading. It originated from WhoTracks.Me with AdGuard additions, but its README describes company website metadata separately from tracker hostnames. The fetched [companies.json](https://raw.githubusercontent.com/AdguardTeam/companiesdb/main/dist/companies.json) contained 2,368 companies, 2,366 with a nonempty `websiteUrl`, and reported an update time of 2026-09-21. Nonempty is not a validity or ownership check. The [VPN-service file](https://raw.githubusercontent.com/AdguardTeam/companiesdb/main/dist/vpn_services.json) contained 87 records with service names, domain arrays, and modification times. Its network-exclusion purpose still makes those domains associations rather than login-role declarations.

These are reusable candidates. We have not measured their brand coverage, correctness, or incremental value over 2FA Directory. Automatic import must not invent missing aliases, domain roles, or a current verification date.

## Freshness and matching semantics

The NextDNS services tree was measured at commit [4b73ad9](https://github.com/nextdns/services/commit/4b73ad9798dc4f75842c9e21c1c45b04be524412), dated 2025-11-15. It was not archived. That quiet period does not prove abandonment or match the freshness of NextDNS's hosted service. AdGuard's service directory had a [change on 2026-09-22](https://github.com/AdguardTeam/HostlistsRegistry/commit/c91afde740ff7a0312776318e2dd1b48994fec5c). Repository activity alone does not prove every entry was rechecked.

For a future importer, preserve exact-host, hostname-plus-subdomains, wildcard, and exact-URL distinctions. `||host^` can name a subdomain; it is not necessarily a registrable domain. DNS-type conditions cannot be evaluated from a bare hostname without stating what query context is assumed. Unsupported rules must produce an explicit coverage limitation rather than silently become approximate matches.

An exact index or reversed-label trie can avoid scanning the entire list on each lookup. A small documented rule subset may need little code; full Adblock support is a different scope. No parser package or runtime dependency was selected or benchmarked.

## Threat evidence has different limits

HaGeZi TIF combines phishing with other threats. Its plain domain output does not give each entry a specific threat category or originating feed. A result should report membership in TIF at a snapshot time, without inventing a phishing-specific diagnosis. Its [source documentation](https://github.com/hagezi/dns-blocklists/blob/main/sources.md) describes transformations and multiple upstreams. Multiple downstream lists can repeat one report.

A URL-feed hit and a hostname-feed hit have different scope. Removing the path from a listed URL can wrongly implicate unrelated content on the same host. A shared infrastructure domain can appear in a service catalogue while one tenant is also reported for abuse; both observations can be true. Service association must not suppress threat evidence.

No hit means no match in the checked snapshot. It does not mean safe. Offline snapshots also cannot catch newly reported threats until refreshed. A failed update should leave the last valid snapshot usable with its age visible. A filtered DNS response alone does not reliably explain which category, rule, or user policy caused a block.

## Recommendation for the next increment

Use a combination of separately labelled evidence sources, introduced one increment at a time:

1. Keep 2FA Directory v3 as the first named-service reference candidate, with reviewed operator references for missing or ambiguous brands. AdGuard companiesdb is a real alternative or supplement, not merely a tracker list, but its added value remains unmeasured.
2. Propose one HaGeZi TIF snapshot lookup for known-threat corroboration. This answers a question that the current domain comparator cannot. The concrete proposal must select an edition and preserve its matching semantics and licence notices.
3. Add AdGuard service associations when those observations are needed. Prefer it over loading both AdGuard and NextDNS catalogues initially, because it offers names, groups, and a larger observed service set. This is a usability judgment, not a measured accuracy advantage.

Do not subscribe to Control D, NextDNS, or another resolver solely to copy a public list. Their proprietary filtering may be useful later, but authenticated catalogue access, export rights, and online query disclosure remain separate decisions. An authorized authenticated export could still support offline assessments; authentication does not inherently require online lookup each time.

Keep snapshots and file loading in the trusted runtime, with only relevant observations returned to Flue. No catalogue belongs in `phishing-triage.md`. Separate pure matching from local storage and refresh so Workers can use different storage later. The full TIF is much larger than the service catalogues; parsed memory use, startup cost, and Workers execution remain untested. Do not assume a compressed download fits a Worker bundle or memory limit.

## Review and verification

Claude checked NextDNS and Control D; Grok checked AdGuard and threat feeds. Both warned against treating service association as brand ownership. Their initial recommendations were more restrictive than this note: the fact that threat and service lists answer different questions is a reason to label their results, not to discard their evidence.

Corrections from this review include preserving hostname rather than only registrable-domain semantics, recognizing AdGuard's actual name-and-domain mappings, and treating GPL as reuse terms rather than a blanket prohibition. Direct inspection also established the separate company and VPN datasets and the stricter 51-rule parser-scope count.

Context7 and first-party documentation were used for service/API behavior. Public GitHub trees, licence files, small source samples, and the modest AdGuard JSON catalogues were read. No candidate sites, private emails, credentials, authenticated provider accounts, or large threat-feed bodies were accessed. No model assessment was run and no implementation dependencies were installed. No accuracy comparison was performed.
