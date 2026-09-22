# Angry Carp documentation

Angry Carp currently provides a local command for assessing prepared email evidence and separate instructions for preparing provider reports. The local agent does not acquire mail, perform external lookups, manage cases, or send reports.

## Start here

- [Run a local assessment](../agent/README.md#assess-prepared-email-evidence): sign in, prepare the input, run the command, and interpret the output.
- [Sign in and disconnect](../agent/README.md#sign-in-and-disconnect): browser authentication and local logout.
- [Credential and evidence storage](../agent/README.md#credential-storage-and-access): file locations, permissions, and what the conversation database stores.

## Understand an assessment

- [Read the four assessment sections](../agent/README.md#read-the-assessment): conclusion, evidence, checks and gaps, and next action.
- [Domain glossary](../CONTEXT.md): evidence, observations, inference, concern, confidence, reporting readiness, and approval.
- [Standards and reporting guidance](standards-and-reporting.md): relevant RFCs, ICANN guidance, provider instructions, and the limits of their application.

## Agent instructions

- [Phishing triage](../phishing-triage.md) is the instruction file loaded by the local assessment agent.
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

The [manual workflow specification](manual-workflow.md) describes broader acquisition, case-management, and reporting requirements. The [planning map](planning/map.md) records implementation decisions and outstanding work. [Research notes](research/) preserve supporting investigations; their proposals and historical findings are not automatically current product behavior.
