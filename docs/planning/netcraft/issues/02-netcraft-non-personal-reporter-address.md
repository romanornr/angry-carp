# How Netcraft handles a non-personal reporter address

Type: research
Status: resolved
Assignee: claude
Parent: ../map.md

## Question

The Report API requires an `email` for every submission. What does Netcraft do with it, and which non-personal mailboxes could serve as the reporting identity?

- Does Netcraft verify the address, reject role or alias addresses, or treat unverified reporters differently?
- Is the address shown on the public submission page, the leaderboard or anywhere else?
- What do Netcraft's result emails contain, in particular the submission UUID, and when are they sent? They are the only recovery route for a submission whose response was lost.
- Which options give a non-personal address that Angry Carp can read programmatically, such as Cloudflare Email Routing with an Email Worker, alias services, or agent mailbox services? Record cost, setup, domain requirements and what each discloses.

## Answer

Recorded in [Netcraft reporter address and non-personal mailboxes](../../../research/netcraft-reporter-identity.md), researched 2026-09-26.

- No verification step exists, and no rule against alias or role addresses was found.
- The address is readable by anyone holding the submission UUID, through the unauthenticated API and the submission page. The leaderboard shows nicknames only.
- Result emails are delayed for 18 hardcoded free-mail domains, including gmail.com and proton.me, until a second submission.
- Whether result emails carry the submission UUID is unconfirmed; one live submission would establish it. The API cannot list submissions by address.
- Cloudflare Email Routing with an Email Worker, AgentMail, Fastmail and a dedicated Gmail account can be read by code. Forwarding aliases cannot on their own.
