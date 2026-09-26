/**
 * Identifies possible reporting recipients from resource concerns and recorded provider evidence.
 * These are project reporting rules, applied after findings have been derived.
 *
 * Rules:
 * - Registrar and DNS candidates require a concern tied to the specific host.
 * - SES and Resend leads require a message concern and supporting header or DNS evidence.
 * - Preserve evidence IDs so each proposed relationship can be reviewed.
 * - A contact address alone does not justify a report or authorize sending one.
 *
 * The Resend rule below links to the provider configuration it recognizes.
 * See docs/email-analysis.md for reporting limits and evidence requirements.
 */
import * as v from 'valibot';
import { findReportingChannels, reportingQuerySchema } from '../reporting/channels.ts';
import { authenticationIdentity } from './observations.ts';
import type { AnalysisEvidence } from './analyze-email.ts';

type ReportingCandidate = {
  provider: string;
  serviceRole: 'dns' | 'registrar' | 'email-delivery' | 'sending-platform';
  basis: 'registration' | 'dns_observation' | 'reported_lead';
  evidenceIds: string[];
  limitation: string;
  resource: { kind: 'domain'; name: string; subjectIds: [string, ...string[]] } | { kind: 'message'; id: 'message' };
  channel: ReturnType<typeof findReportingChannels> | {
    kind: 'rdap_contact'; addresses: string[]; sourceUrl: string; retrievedAt: string;
  };
};

/**
 * Returns reporting candidates with their supporting evidence IDs.
 * Appends a coverage note when a domain registration has no associated resource concern.
 */
export function deriveReportingCandidates(evidence: AnalysisEvidence,
  { supportedHosts, hasConcern }: { supportedHosts: ReadonlyMap<string, readonly string[]>; hasConcern: boolean }) {
  const reportingCandidates: ReportingCandidate[] = [];

  function subjects(sourceIds: string[]) {
    return evidence.observations.hosts.filter((host) => host.context === 'unmarked'
      && sourceIds.includes(host.id) && supportedHosts.has(host.id));
  }

  for (const lookup of evidence.rdap) {
    if (lookup.result.kind !== 'found') continue;
    const [first, ...rest] = subjects(lookup.sourceIds);

    if (!first) {
      evidence.coverage.push({ sourceId: lookup.id, reason: 'registrar_contact_without_resource_concern' });
      continue;
    }

    for (const registrar of lookup.result.registrars) {
      reportingCandidates.push({ provider: registrar.name ?? 'Unnamed registrar', serviceRole: 'registrar', basis: 'registration',
        resource: { kind: 'domain', name: lookup.domain, subjectIds: [first.id, ...rest.map(({ id }) => id)] },
        evidenceIds: [lookup.id, ...new Set([first, ...rest].flatMap(({ id }) => supportedHosts.get(id) ?? []))],
        limitation: 'Investigate the identified resource concern. Registration identifies the registrar, not abuse or control of every host under the domain. No permission to send.',
        channel: { kind: 'rdap_contact', addresses: registrar.abuseEmails,
          sourceUrl: lookup.result.sourceUrl, retrievedAt: lookup.result.retrievedAt } });
    }
  }

  const cloudflareDns = evidence.dns.filter((lookup) => lookup.query.type === 'NS' && lookup.result.kind === 'answered'
    && lookup.result.answers.some((answer) => answer.type === 'NS' && answer.name.toLowerCase().replace(/\.$/, '') === lookup.query.name && /(?:^|\.)ns\.cloudflare\.com\.?$/i.test(answer.data)));

  for (const lookup of cloudflareDns) {
    const [first, ...rest] = subjects(lookup.sourceIds);
    if (!first) continue;
    reportingCandidates.push({ provider: 'cloudflare', serviceRole: 'dns', basis: 'dns_observation',
      resource: { kind: 'domain', name: lookup.query.name, subjectIds: [first.id, ...rest.map(({ id }) => id)] },
      evidenceIds: [lookup.id, ...new Set([first, ...rest].flatMap(({ id }) => supportedHosts.get(id) ?? []))],
      limitation: 'Nameservers support a DNS relationship, not origin hosting, Workers or Pages.',
      channel: findReportingChannels(v.parse(reportingQuerySchema, { provider: 'cloudflare', serviceRole: 'dns' })) });
  }

  const root = evidence.message.parts.find((part) => part.id === 'message/p0');
  const sesHeaders = root?.headers.flatMap((header, index) => {
    if (header.name === 'received' && /\bfrom\s+[a-z0-9.-]+\.amazonses\.com(?:[\s(]|$)/i.test(header.value)) return [`${root.id}/header${index}`];
    return [];
  }) ?? [];
  if (sesHeaders.length && hasConcern) reportingCandidates.push({ provider: 'amazon-ses', serviceRole: 'email-delivery', basis: 'reported_lead',
    resource: { kind: 'message', id: 'message' },
    evidenceIds: sesHeaders, limitation: 'Supplied Received header names SES. Header provenance has not been verified.',
    channel: findReportingChannels(v.parse(reportingQuerySchema, { provider: 'amazon-ses', serviceRole: 'email-delivery' })) });

  // Resend's documented older configuration requires both SES MX and SPF at the MAIL FROM host.
  // https://resend.com/docs/knowledge-base/what-if-my-domain-is-not-verifying
  // These shared records and a sender-chosen selector justify an inquiry without proving Resend handled the message.
  const rootMessage = evidence.message.messages.find((message) => message.id === 'message');
  const selectorClaims: string[] = [];
  const mailFromHosts = new Set<string>();

  for (const header of rootMessage?.authentication ?? []) {
    if (header.result.kind !== 'reported_results') continue;

    for (const claim of header.result.results) {
      if (claim.interpretation !== 'supported') continue;

      if (claim.method === 'dkim' && claim.properties.some((property) =>
        property.type === 'header' && property.name === 's' && ['resend', '"resend"'].includes(property.rawValue))) {
        selectorClaims.push(`${rootMessage?.rootPartId}/header${header.headerIndex}`);
      }
      if (claim.method === 'spf') for (const property of claim.properties) {
        if (property.type !== 'smtp' || property.name !== 'mailfrom') continue;
        const host = authenticationIdentity(property.rawValue);
        if (host) mailFromHosts.add(host);
      }
    }
  }

  const resendDns: string[] = [];

  for (const host of mailFromHosts) {
    const mx = evidence.dns.find((lookup) => lookup.query.name === host && lookup.query.type === 'MX'
      && lookup.result.kind === 'answered' && lookup.result.answers.some((answer) => answer.type === 'MX' && answer.name.toLowerCase().replace(/\.$/, '') === host
        && /^\d+\s+feedback-smtp\.[a-z0-9-]+\.amazonses\.com\.?$/i.test(answer.data)));
    const txt = evidence.dns.find((lookup) => lookup.query.name === host && lookup.query.type === 'TXT'
      && lookup.result.kind === 'answered' && lookup.result.answers.some((answer) => answer.type === 'TXT' && answer.name.toLowerCase().replace(/\.$/, '') === host
        && /^"?v=spf1(?:[\s"])/i.test(answer.data) && /(?:^|[\s"])include:amazonses\.com(?:[\s"]|$)/i.test(answer.data)));
    if (mx && txt) resendDns.push(mx.id, txt.id);
  }

  if (selectorClaims.length && resendDns.length && hasConcern) reportingCandidates.push({ provider: 'resend', serviceRole: 'sending-platform', basis: 'reported_lead',
    resource: { kind: 'message', id: 'message' },
    evidenceIds: [...selectorClaims, ...resendDns],
    limitation: 'Reported resend selector plus current SES MX/SPF configuration supports an investigation request, not proof of Resend handling or key custody.',
    channel: findReportingChannels(v.parse(reportingQuerySchema, { provider: 'resend', serviceRole: 'sending-platform' })) });

  return reportingCandidates;
}
