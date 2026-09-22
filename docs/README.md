# Angry Carp documentation

Angry Carp currently provides a local command for assessing prepared email evidence, domain registration and DNS lookup tools, local domain-name comparisons, shared-passage comparisons using Winnowing, and separate instructions for preparing provider reports. The local agent does not acquire mail, browse websites, manage cases, or send reports.

## Start here

- [Run a local assessment](../agent/README.md#assess-prepared-email-evidence): sign in, prepare the input, run the command, and interpret the output.
- [Sign in and disconnect](../agent/README.md#sign-in-and-disconnect): browser authentication and local logout.
- [Credential and evidence storage](../agent/README.md#credential-storage-and-access): file locations, permissions, and what the conversation database stores.

## Understand an assessment

- [Read the four assessment sections](../agent/README.md#read-the-assessment): conclusion, evidence, checks and gaps, and next action.
- [Domain registration lookups](../agent/README.md#domain-registration-lookups): RDAP operation, returned evidence, privacy, and current limits.
- [DNS lookups](../agent/README.md#dns-lookups): resolver, privacy, returned records, and limits.
- [Domain lookalikes](domain-lookalikes.md): local comparisons, explicit reference domains, Unicode behavior, and limits.
- [Brand references](brand-references.md): local 2FA Directory candidates, source metadata, and matching limits.
- [Update reference data](updating-reference-data.md): verified snapshot replacement, rollback, and update policy.
- [Reused email passages](text-reuse.md): local Winnowing comparisons, input preparation, source positions, and limits.
- [Reporting-channel catalogue](reporting-catalogue.md): offline selection, service roles, conditional routes, and [maintenance](updating-reporting-channels.md).
- [Reporting recipients](../agent/README.md#reporting-recipients): attribution, channels, and recipient-specific readiness.
- [Domain glossary](../CONTEXT.md): evidence, observations, inference, concern, confidence, reporting readiness, and approval.
- [Standards and reporting guidance](standards-and-reporting.md): relevant RFCs, ICANN guidance, provider instructions, and the limits of their application.

- [Shared TypeScript library](../lib/README.md): package exports, direct use, dependency ownership, and local builds.

## Agent instructions

- [Phishing triage](../phishing-triage.md) is portable assessment guidance, usable without Flue or the TypeScript tools. The local assessment agent loads the same file.
- [Reporting channels](../reporting-channels.md) is the generated, portable channel reference. Flue retrieves matching records through its offline reporting tool.
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

The [manual workflow specification](manual-workflow.md) describes broader acquisition, case-management, and reporting requirements. The [planning map](planning/map.md) records implementation decisions and outstanding work. [Research notes](research/) preserve supporting investigations; their proposals and historical findings are not automatically current product behavior.

The local agent now uses a pinned 2FA Directory snapshot for candidate reference domains. Service catalogues and threat feeds remain research candidates. Updates are manual; no scheduler is installed. Directory results supplement operator-supplied references without certifying ownership.

- [Email similarity and campaign linking](research/email-similarity-and-campaign-linking.md): Eclat, Winnowing, MinHash, and CUSUM for repeated phishing or unwanted mail, with proposed comparisons and their limits.
- [Offline brand lookup](research/offline-brand-lookup.md): reusable reference data, matching algorithms, source quality, and a proposed Flue lookup that keeps the catalogue outside the prompt.
- [Brand-directory implementation research](research/brand-directory-implementation.md): measured Map/binary-search/scan comparisons, name-word retrieval, proposed files, and reference provenance.
- [DNS catalogues and threat lists](research/dns-reference-and-threat-lists.md): AdGuard, NextDNS, Control D, and public feeds compared with 2FA Directory, including offline access, licences, and distinct evidence roles.
- [MetaMask phishing list](research/metamask-phishing-list.md): crypto-threat observations, data versus detector reuse, matching scope, and HaGeZi overlap.
