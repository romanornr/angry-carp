# Choose the reporting identity for threat-feed submissions

Type: grilling
Status: resolved
Assignee: claude
Parent: ../map.md
Blocked by: 02

## Question

Which address becomes the configured reporting identity for threat-feed submissions, and how is it configured per operator?

The operator does not want to receive Netcraft's result emails. Verdicts come from the API by submission UUID, so the address need not be readable. It must still be controlled by the operator, for example a dedicated reporting domain whose mail is discarded, never an invented address at someone else's domain. The web form's undocumented `is_anonymous` field is not part of the v3 API.

## Answer

Decided with the operator on 2026-09-26.

- The reporting identity is an address the operator configures once in local, git-ignored configuration, such as `ANGRY_CARP_REPORTER_EMAIL` in `.env`. The repository only carries a placeholder in `.env.example`. Configuring it is the operator's standing consent for automatic submission.
- The operator may use their existing address. It is never inferred from mail, such as a phishing message's `To` header.
- With no address configured, nothing is submitted automatically.
- The address is never written into reports, logs or case exports. Submission UUIDs are treated as secrets, because anyone holding one can read the address through Netcraft's API.
- Netcraft's result emails are not read. The operator may switch them off through Netcraft's mail preferences.
- The undocumented `is_anonymous` field is not used. A dedicated reporting domain, for example with Cloudflare Email Routing discarding mail, remains a later configuration change for zero exposure; nothing else depends on the choice.
- Rejected: a default project-run Angry Carp address for operators who configure none. Every operator's result emails would reach the project maintainer, revealing which phishing each operator received, and all operators would share one reputation and rate limit. Configuring an address remains the operator's explicit permission; the API cannot submit without one.
