# Reporting-channel lookup

The catalogue returns reviewed reporting routes for a named provider and service role. It runs offline through `@angry-carp/checks/reporting`. It does not determine who operates a resource or verify that a report satisfies a channel's conditions.

`lib/src/reporting/channels.ts` owns the records and matching rules. The standalone [reporting reference](../reporting-channels.md) is generated from those records. Flue loads a short tool description instead of the full reference, then receives only matching records through `lookup_reporting_channels`.

## Inputs and results

Parse external input with `reportingQuerySchema` before calling `findReportingChannels`. Its provider type is branded, so TypeScript rejects an unparsed string. Provider IDs are `amazon-ses`, `resend`, `cloudflare`, `trustname`, and `hostinger`. Name normalization trims surrounding whitespace, lowercases text and replaces whitespace runs with hyphens: `Amazon SES` becomes `amazon-ses`. There is no fuzzy, domain-suffix, company-name, or alias matching. `amazon` and `cloudflare-inc` return a gap.

`serviceRole` is one of `email-delivery`, `sending-platform`, `reverse-proxy`, `dns`, `hosting`, or `registrar`. These describe the reported service, independently of RDAP entity roles. Cloudflare's reverse proxy, DNS, and hosting routes share a form, but a DNS result does not establish hosting.

```ts
import * as v from 'valibot';
import { findReportingChannels, reportingQuerySchema } from '@angry-carp/checks/reporting';

const query = v.parse(reportingQuerySchema, {
	provider: 'Cloudflare',
	serviceRole: 'registrar',
});
const result = findReportingChannels(query);
```

| Result | Meaning |
| --- | --- |
| `listed` | References for the requested role, with channel conditions, evidence requirements, source links and check dates. Conditions remain unevaluated. |
| `provider_not_listed` | The normalized name is absent. This says nothing about whether the provider has a reporting route. |
| `role_not_listed` | The provider is present, but the requested role is not covered. `listedServiceRoles` describes catalogue coverage, not the provider's role in this case. |

Every result retains its normalized query. Returned records are independent copies. Channel kinds distinguish an email address, a form URL, and an instructions page that explains how to reach a form. Alternatives and RDAP requirements remain in each channel's `condition`.

The Flue adapter accepts `queries`, an array of 1 to 10 provider-and-role pairs. It preserves request order and returns one result per pair; repeated pairs produce repeated results. This bounds one tool response and permits one call for several recipients. The function scans the six records, matching provider and role together. No search index or network discovery is needed.

## Evidence and limits

Registrar queries without a catalogue route return guidance to use the registrar abuse contact from case RDAP, with its registrar relationship and source. The catalogue does not ingest that contact or overwrite it. Other misses identify an official-channel gap. A returned contact is neither permission to send nor evidence of deception.

Flue may look up channels for an evidence-backed plausible recipient while its involvement remains unconfirmed. The assessment must retain that distinction and state the evidence. The query and returned references do not encode attribution confidence. This guidance makes a lead eligible for investigation; it does not satisfy the returned channel conditions or authorize sending. No automatic provider-pattern classifier is installed.

The Resend reference distinguishes preparing an investigation request from asserting platform involvement. Its published terms supply the contact, and its DNS documentation supplies the configuration reference. Our policy permits asking Resend to check an evidence-backed possible connection; that is an operator workflow choice, not a provider promise or proof of attribution. Sender-chosen selectors and shared SES records remain qualified evidence.

`checkedAt` records the reference review date. It is not the assessment time, a live verification, or a guarantee of delivery. The first records carry forward the existing reference's 2026-09-22 dates. Resend, Hostinger, and Cloudflare's registrar instructions were also inspected during implementation; failed fetches of the AWS and Trustname pages did not establish a new review. An older date is a reason to recheck, not a blanket reporting hold.

The lookup and renderer use no filesystem, network, credentials, or Flue runtime. The maintenance command writes the public Markdown file. Workers execution is unverified. A tool call can add a model round trip; no reduction in total tokens, latency, or hallucination rate has been measured. The design reduces initial reference context and makes channel selection deterministic. It does not constrain what the model can write in its final answer.

See [the update procedure](updating-reporting-channels.md), [standards and existing implementations](research/reporting-channel-catalogue.md), and [ADR 0009](adr/0009-maintain-reporting-channels-as-data.md).
