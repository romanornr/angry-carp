/**
 * Interprets recorded checks and identifies possible reporting recipients.
 * The rules are project policy, applied after the checks describe what they found.
 *
 * Reference policy:
 * - Adjacent swaps and Latin-folded matches become concerns for operator-supplied references.
 * - For references selected using message content, those methods alone do not raise a concern.
 * - Other resemblance methods retain their concern policy regardless of reference source.
 *
 * Reporting policy:
 * - Associate a concern with the resource before proposing its registrar or provider.
 * - Preserve the evidence IDs so the relationship can be reviewed.
 * - A contact address alone does not justify a report.
 *
 * The reference rule below links to Sublime's organization-domain check, which informed that choice.
 * See docs/adr/0013-route-assessment-by-concerns-and-coverage.md for the project policy.
 */
import * as v from 'valibot';
import { findReportingChannels, reportingQuerySchema } from '../reporting/channels.ts';
import { authenticationIdentity, classifyHost } from './observations.ts';
import type { AnalysisEvidence } from './analyze-email.ts';

type Finding = { kind: 'observation' | 'concern'; code: string; text: string; evidenceIds: string[] };
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

/** Attaches evidence IDs to findings and reporting candidates without deciding an overall phishing verdict. */
export function deriveFindings(evidence: AnalysisEvidence) {
  const findings: Finding[] = [];
  const reportingCandidates: ReportingCandidate[] = [];
  const pairs = new Map<string, Finding>();
  const supportedHosts = new Map<string, string[]>();
  const actions = evidence.observations.hosts.filter((host) => host.role === 'action' && host.context === 'unmarked');
  for (const image of evidence.observations.hosts.filter((host) => host.role === 'image' && host.context === 'unmarked')) {
    const imageDomain = classifyHost(image.host);
    for (const action of actions) {
      if (image.sourceId !== action.sourceId) continue;
      if (image.enclosingActionId !== null && image.enclosingActionId !== action.id) continue;
      const actionDomain = classifyHost(action.host);
      if (imageDomain.kind !== 'dns' || actionDomain.kind !== 'dns' || imageDomain.registration === actionDomain.registration) continue;
      supportedHosts.set(action.id, [image.id, action.id]);
      const key = `${imageDomain.registration}/${actionDomain.registration}`;
      if (pairs.has(key)) continue;
      if (pairs.size === 32) {
        if (!evidence.coverage.some(({ reason }) => reason === 'image_action_finding_limit')) {
          evidence.coverage.push({ sourceId: 'message', reason: 'image_action_finding_limit' });
        }
        continue;
      }
      pairs.set(key, { kind: 'concern', code: 'image_action_domain_difference',
        text: `Image host ${image.host} and action host ${action.host} use different registration domains. This does not establish ownership or deception.`,
        evidenceIds: [image.id, action.id] });
    }
  }
  findings.push(...[...pairs.values()].slice(0, 32));
  for (const comparison of evidence.comparisons) {
    const result = comparison.result;
    if (result.kind !== 'compared' || result.relationship !== 'different_domain') continue;
    if (result.resemblance.length > 0) {
      const subject = comparison.sourceIds[0];
      let kind: Finding['kind'] = 'observation';
      // Only operator references turn swap or Latin-folded matches into concerns on their own.
      // Target-selection precedent, not the full Sublime policy: https://github.com/sublime-security/sublime-rules/blob/3f2b9a7f670ad1782575aca0516e91ec0ee155fc/detection-rules/lookalike_sender_domain.yml#L7-L13
      if (comparison.referenceSource === 'operator' || result.resemblance.some((match) =>
        match.kind === 'confusable_label' || match.kind === 'label_contained' || match.kind === 'registrable_domain_embedded')) kind = 'concern';
      if (kind === 'concern' && subject) supportedHosts.set(subject, [comparison.id]);
      const reasons = result.resemblance.map((match) => {
        switch (match.kind) {
          case 'folded_label': return 'matching label skeletons after Latin diacritic folding';
          case 'character_swap': return `one adjacent character swap in the ${match.form} labels`;
          case 'confusable_label': return 'matching Unicode label skeletons';
          case 'label_contained': return 'reference label inside a longer label';
          case 'registrable_domain_embedded': return 'reference domain embedded in the hostname';
          default: { const unhandled: never = match; return unhandled; }
        }
      });
      let text = `${result.observed.ascii} resembles ${result.reference.ascii}: ${[...new Set(reasons)].join('; ')}. Reference source: ${comparison.referenceSource}. This does not establish ownership or deception.`;
      if (kind === 'observation') text += ' This match is informational because the reference was selected using message evidence.';
      findings.push({ kind, code: 'domain_resemblance', text, evidenceIds: [comparison.id] });
    }
  }
  for (const note of evidence.sourceNotes) {
    if (note.relation !== 'context') findings.push({ kind: 'concern', code: 'supplied_source_requires_assessment',
      text: `Supplied source ${note.id}: ${note.relation}; applicability to the message date: ${note.messageDateApplicability}. Source authority and claim are not independently verified.`,
      evidenceIds: [note.id] });
    if (note.relation !== 'supports_concern' || note.messageDateApplicability === 'not_applicable') continue;
    for (const host of evidence.observations.hosts) {
      if (host.context === 'unmarked' && note.subjectHosts.some((subject) => subject === host.host)) supportedHosts.set(host.id, [note.id]);
    }
  }
  for (const message of evidence.message.messages) {
    for (const header of message.authentication) {
      if (header.result.kind !== 'reported_results') continue;
      const sourceId = `${message.rootPartId}/header${header.headerIndex}`;
      for (const [claimIndex, claim] of header.result.results.entries()) {
        if (claim.interpretation !== 'supported' || !['spf', 'dkim', 'dmarc'].includes(claim.method)) continue;
        let reported = claim.result;
        if (!['none', 'pass', 'fail', 'policy', 'neutral', 'softfail', 'temperror', 'permerror'].includes(reported)) reported = 'unrecognized_result';
        if (['temperror', 'permerror', 'unrecognized_result'].includes(reported)) {
          evidence.coverage.push({ sourceId, reason: 'inconclusive_authentication_claim' });
        }
        const identities: string[] = [];
        for (const property of claim.properties) {
          const name = `${property.type}.${property.name}`;
          if (!['header.d', 'header.i', 'header.from', 'smtp.mailfrom', 'smtp.helo'].includes(name)) continue;
          const domain = authenticationIdentity(property.rawValue);
          if (domain) identities.push(`${name} domain=${domain}`);
        }
        let details = '';
        if (identities.length) details = ` (${[...new Set(identities)].slice(0, 4).join(', ')})`;
        let kind: Finding['kind'] = 'observation';
        if (['fail', 'softfail', 'policy'].includes(reported)) kind = 'concern';
        findings.push({ kind, code: 'reported_authentication',
          text: `${claim.method.toUpperCase()}=${reported}${details} [${sourceId}/claim${claimIndex}] is a supplied header claim. Receiver provenance is unknown; fresh verification was not performed.`, evidenceIds: [sourceId] });
      }
    }
  }
  const concernIds = findings.filter(({ kind }) => kind === 'concern').flatMap(({ evidenceIds }) => evidenceIds);
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
  if (sesHeaders.length && concernIds.length) reportingCandidates.push({ provider: 'amazon-ses', serviceRole: 'email-delivery', basis: 'reported_lead',
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
  if (selectorClaims.length && resendDns.length && concernIds.length) reportingCandidates.push({ provider: 'resend', serviceRole: 'sending-platform', basis: 'reported_lead',
    resource: { kind: 'message', id: 'message' },
    evidenceIds: [...selectorClaims, ...resendDns],
    limitation: 'Reported resend selector plus current SES MX/SPF configuration supports an investigation request, not proof of Resend handling or key custody.',
    channel: findReportingChannels(v.parse(reportingQuerySchema, { provider: 'resend', serviceRole: 'sending-platform' })) });
  if (findings.length > 128) {
    evidence.coverage.push({ sourceId: 'message', reason: `finding_limit:${findings.length - 128}` });
    findings.length = 128;
  }
  return { findings, reportingCandidates };
}
