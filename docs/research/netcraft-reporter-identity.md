# Netcraft reporter address and non-personal mailboxes

Researched 2026-09-26 for [the Netcraft map](../planning/netcraft/map.md). Read-only: public pages and one unauthenticated GET; nothing was submitted and no account was created. Specification facts refer to the v3 OpenAPI document pinned in [Netcraft Report API and reference designs](netcraft-report-api.md); web-application facts come from report.netcraft.com's Angular bundles read on the same date.

## How Netcraft uses the address

- **Exposure.** `GET /submission/{uuid}` returns `submitter.email` without authentication, and the submission page shows it as "Submitter". Netcraft's FAQ relies on the UUID being secret: "the link contains the submission's UUID, which only you are provided with". Any stored, logged or shared submission link therefore discloses the reporting address.
- **Verification.** No confirmation or click-through step is documented or visible in the web application. Whether the server treats unknown reporters differently is unknown. No rule against role or alias addresses was found.
- **Free-mail delay.** The [FAQ](https://report.netcraft.com/faqs) says reporters using free providers "may not receive result emails until you have made more than one submission". The web application hardcodes 18 such domains, including gmail.com, outlook.com, icloud.com, proton.me and yahoo.com. Alias domains and fastmail.com are not on that list; whether the server uses the same list is unknown.
- **Anonymous reports.** Since 11 May 2023 the web form can send `is_anonymous: true` instead of an address; such reports earn no credit but are analysed the same ([release notes](https://report.netcraft.com/release-notes)). The v3 API specification does not include that field and still requires `email`.
- **Leaderboard.** `GET /stats/leaderboard` shows generated nicknames, not addresses. Nicknames are changed through a preferences link in result emails.
- **Result emails.** `MailPreferences` names `submission_thanks` (on a new submission) and `finished_processing` (when processed); the web application adds monthly `periodic_report_stats`. Emails also report credited counts, warnings, takedown status and issue responses, and carry a preferences link containing the address and a token. Whether they contain the submission UUID is unconfirmed and needs one live submission to establish. Whether the `/api/v3/test` sandbox sends email is unknown.
- **Recovery.** The documented API cannot list submissions by address, so a lost UUID can only be recovered from a result email, if it carries one.
- **Sharing.** The [privacy policy](https://www.netcraft.com/privacy/) allows sharing threat indicators with hosts, registrars and law enforcement; whether the reporter address is included is unknown.

## Mailbox options

| Option | Cost | Own domain needed | Readable by code | Discloses |
| --- | --- | --- | --- | --- |
| [Cloudflare Email Routing](https://developers.cloudflare.com/email-routing/email-workers/) with an Email Worker | Free inbound; Workers Free allows 100,000 requests per day | Yes, on Cloudflare DNS | Yes; the Worker receives raw MIME and must store it itself (KV, D1 or R2); 25 MiB limit | The operator's domain and its registration data |
| [AgentMail](https://docs.agentmail.to/) | Free: 3 inboxes, 3,000 emails per month | No (`@agentmail.to`); custom domain from $20 per month | Yes; API, SDKs, webhooks, IMAP | An automated-agent mail domain |
| [Fastmail](https://www.fastmail.com/dev/) dedicated account | About €5–6 per month; API tokens exclude the Basic plan | Optional | Yes; JMAP, IMAP | fastmail.com or the operator's domain |
| Gmail dedicated account | Free | No | Yes via Gmail API; `gmail.readonly` is a restricted scope | gmail.com, which is on Netcraft's free-mail delay list |
| [addy.io](https://addy.io/), [SimpleLogin](https://simplelogin.io/pricing/), [Firefox Relay](https://relay.firefox.com/faq/), [DuckDuckGo](https://duckduckgo.com/duckduckgo-help-pages/email-protection/what-is-duckduckgo-email-protection) | Free tiers available | No | No; forwarders into another mailbox that code must still read | A recognisable forwarding domain |

Forwarding aliases hide the destination mailbox but do not solve programmatic reading on their own.
