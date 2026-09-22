# Angry Carp documentation

Angry Carp provides deterministic original-email analysis with optional AI assessment, domain and IP registration lookups, DNS lookups, local domain-name comparisons, shared-passage comparisons using Winnowing, and separate instructions for preparing provider reports. The local agent does not acquire mail, browse websites, manage cases, or send reports.

## Start here

- [Analyze an original without a model](email-analysis.md): input, optional private JSON, lookup budgets and AI disclosure.

- [Standalone CLI](../cli/README.md): commands and file paths without Flue dependencies.
- [Run a local assessment](../agent/README.md#assess-analyzed-email-evidence): sign in, prepare the input, run the command, and interpret the output.
- [Sign in and disconnect](../agent/README.md#sign-in-and-disconnect): browser authentication and local logout.
- [Credential and evidence storage](../agent/README.md#credential-storage-and-access): file locations, permissions, and what the conversation database stores.

## Understand an assessment

- [Read the local assessment](../agent/README.md#read-the-assessment): model interpretation of deception evidence alongside deterministic findings and reporting routes.
- [Domain registration lookups](../agent/README.md#lookups-and-reporting): RDAP operation, returned evidence, privacy, and current limits.
- [IP registration lookups](../agent/README.md#lookups-and-reporting): IPv4 and IPv6 discovery, network evidence and hosting limits.
- [DNS lookups](../agent/README.md#lookups-and-reporting): resolver, privacy, returned records, and limits.
- [Domain lookalikes](domain-lookalikes.md): local comparisons, explicit reference domains, Unicode behavior, and limits.
- [Brand references](brand-references.md): local 2FA Directory candidates, source metadata, and matching limits.
- [Update reference data](updating-reference-data.md): verified snapshot replacement, rollback, and update policy.
- [Reused email passages](text-reuse.md): local Winnowing comparisons, input preparation, source positions, and limits.
- [Email images and action links](email-links.md): offline HTML extraction, optional hostname summaries, and coverage limits.
- [Reporting-channel catalogue](reporting-catalogue.md): offline selection, service roles, conditional routes, and [maintenance](updating-reporting-channels.md).
- [Reporting recipients](../agent/README.md#lookups-and-reporting): attribution, channels, and recipient-specific readiness.
- [Domain glossary](../CONTEXT.md): evidence, observations, inference, concern, confidence, reporting readiness, and approval.
- [Standards and reporting guidance](standards-and-reporting.md): relevant RFCs, ICANN guidance, provider instructions, and the limits of their application.

- [Shared TypeScript library](../lib/README.md): package exports, direct use, dependency ownership, and local builds.

## Agent instructions

- [Phishing triage](../phishing-triage.md) is portable investigation and assessment guidance, usable without Flue or the TypeScript tools. [Local assessment instructions](../agent/phishing-assessment.md) give Flue the narrower evidence-interpretation task.
- [Reporting channels](../reporting-channels.md) is the generated, portable channel reference. The deterministic analyzer selects matching routes before Flue assessment.
- [Provider abuse reporting](../provider-abuse-reporting.md) is for separately directed report preparation and review. It is not loaded into the local assessment prompt.

## Design decisions

Accepted decisions describe the chosen direction. They do not imply that every capability is implemented.

- [0001: Prohibit direct candidate fetches](adr/0001-prohibit-direct-candidate-fetches.md)
- [0002: Limit scanner disclosure](adr/0002-limit-scanner-disclosure.md)
- [0003: Preserve original messages](adr/0003-preserve-original-messages.md)
- [0004: Distribute workflow instructions independently](adr/0004-distribute-workflow-independently.md)
- [0005: Keep report authority in case operations](adr/0005-keep-report-authority-in-case-operations.md)
- [0006: Use SQLite for local case storage](adr/0006-use-sqlite-for-local-case-storage.md)
- [0007: Separate assessment from reporting](adr/0007-separate-assessment-from-reporting.md)
- [0008: Extract reusable checks](adr/0008-extract-reusable-checks.md)
- [0009: Maintain reporting channels as data](adr/0009-maintain-reporting-channels-as-data.md)
- [0010: Extract email link roles](adr/0010-extract-email-link-roles.md)
- [0011: Analyze email before optional assessment](adr/0011-analyze-email-before-assessment.md)
- [0012: Separate standalone commands from Flue](adr/0012-separate-cli-from-flue.md)

The [manual workflow specification](manual-workflow.md) describes broader acquisition, case-management, and reporting requirements. The [planning map](planning/map.md) records implementation decisions and outstanding work. [Research notes](research/) preserve supporting investigations; their proposals and historical findings are not automatically current product behavior.

The local agent now uses a pinned 2FA Directory snapshot for candidate reference domains. Service catalogues and threat feeds remain research candidates. Updates are manual; no scheduler is installed. Directory results supplement operator-supplied references without certifying ownership.

- [Email similarity and campaign linking](research/email-similarity-and-campaign-linking.md): Eclat, Winnowing, MinHash, and CUSUM for repeated phishing or unwanted mail, with proposed comparisons and their limits.
- [Offline brand lookup](research/offline-brand-lookup.md): reusable reference data, matching algorithms, source quality, and a proposed Flue lookup that keeps the catalogue outside the prompt.
- [Brand-directory implementation research](research/brand-directory-implementation.md): measured Map/binary-search/scan comparisons, name-word retrieval, proposed files, and reference provenance.
- [DNS catalogues and threat lists](research/dns-reference-and-threat-lists.md): AdGuard, NextDNS, Control D, and public feeds compared with 2FA Directory, including offline access, licences, and distinct evidence roles.
- [MetaMask phishing list](research/metamask-phishing-list.md): crypto-threat observations, data versus detector reuse, matching scope, and HaGeZi overlap.
- [Email image and action-link extraction](research/email-link-extraction.md): established scanner behavior, HTML and MIME standards, parser candidates, dependency review and a proposed offline extractor.
- [Model-independent email analysis](research/model-independent-email-analysis.md): proposed structured analysis before optional AI assessment, library reuse, missing capabilities and migration.
- [Email analysis precedents](research/email-analysis-precedents.md): Rspamd and SpamAssassin result/lifecycle patterns, completeness limits, and possible future export conventions.
- [MIME parser fidelity](research/mime-parser-contract.md): public part/recovery contracts, quoted-message limits, and the reviewed and approved Mailsplit adapter.

[ADR 0013: Route AI assessment by concerns and coverage](adr/0013-route-assessment-by-concerns-and-coverage.md) records the no-concerns skip, bounded recovery, supplied notes and mandatory research during report preparation.

[ADR 0014: Keep provider routing outside AI assessment](adr/0014-keep-provider-routing-outside-ai-assessment.md) records the smaller model input and deterministic presentation of provider roles and reporting routes.
