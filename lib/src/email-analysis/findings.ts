/**
 * Derives findings from recorded checks, then uses them to identify possible reporting recipients.
 * The rules are project policy, applied after the checks describe what they found.
 *
 * Reference policy:
 * - Adjacent swaps and diacritic-folded matches become concerns for operator-supplied references.
 * - For references selected using message content, those methods alone do not raise a concern.
 * - Other resemblance methods retain their concern policy regardless of reference source.
 *
 * The reference rule below links to Sublime's organization-domain check, which informed that choice.
 * See docs/adr/0013-route-assessment-by-concerns-and-coverage.md for the project policy.
 */
import * as v from 'valibot';
import { inspectDomain, domainNameSchema } from '../lookalikes/compare-domains.ts';
import { deriveReportingCandidates } from './reporting-candidates.ts';
import { authenticationIdentity, classifyHost, prioritizeHosts } from './observations.ts';
import type { AnalysisEvidence } from './analyze-email.ts';

type Finding = { kind: 'observation' | 'concern'; code: string; text: string; evidenceIds: string[] };

/** Derives findings and reporting candidates, adding coverage notes when evidence or output is limited. */
export function deriveFindings(evidence: AnalysisEvidence) {
  const findings: Finding[] = [];
  // Inspect every recorded occurrence independently of reference selection and comparison budgets.
  // Chromium applies script checks per label, not across the full hostname:
  // https://github.com/chromium/chromium/blob/fcd1720dfbc767af07055b27f303207fab09c45d/components/url_formatter/url_formatter.cc#L325-L350
  for (const host of prioritizeHosts(evidence.observations.hosts)) {
    const input = v.safeParse(domainNameSchema, host.host);
    if (!input.success) continue;
    const domain = inspectDomain(input.output);
    if (domain.kind !== 'parsed') continue;
    if (domain.labels.some(({ scriptMixing }) => scriptMixing === 'unavailable')) {
      evidence.coverage.push({ sourceId: host.id, reason: 'script_mixing_unavailable' });
    }
    const mixed = domain.labels.filter(({ scriptMixing }) => scriptMixing === 'mixed_script');
    if (mixed.length === 0) continue;
    let kind: Finding['kind'] = 'observation';
    if (host.context === 'unmarked' && host.role !== 'image') kind = 'concern';
    findings.push({ kind, code: 'mixed_script_label', evidenceIds: [host.id],
      text: `${domain.ascii} contains labels with incompatible script combinations: ${mixed.map(({ text }) => text).join(', ')}. This does not establish impersonation or malicious ownership.` });
  }
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
      // Only operator references turn swap or diacritic-folded matches into concerns on their own.
      // Target-selection precedent, not the full Sublime policy: https://github.com/sublime-security/sublime-rules/blob/3f2b9a7f670ad1782575aca0516e91ec0ee155fc/detection-rules/lookalike_sender_domain.yml#L7-L13
      if (comparison.referenceSource === 'operator' || result.resemblance.some((match) =>
        match.kind === 'confusable_label' || match.kind === 'label_contained' || match.kind === 'registrable_domain_embedded')) kind = 'concern';
      if (kind === 'concern' && subject) supportedHosts.set(subject, [comparison.id]);
      const reasons = result.resemblance.map((match) => {
        switch (match.kind) {
          case 'folded_label': return 'matching label skeletons after Latin/Greek/Cyrillic diacritic folding';
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
  // Reporting uses the full findings list before findings are capped at 128.
  const reportingCandidates = deriveReportingCandidates(evidence, {
    supportedHosts,
    // Script mixing alone requests assessment, without attributing abuse to a reporting recipient.
    hasConcern: findings.some(({ kind, code, evidenceIds }) => kind === 'concern' && code !== 'mixed_script_label' && evidenceIds.length > 0),
  });
  if (findings.length > 128) {
    evidence.coverage.push({ sourceId: 'message', reason: `finding_limit:${findings.length - 128}` });
    findings.length = 128;
  }
  return { findings, reportingCandidates };
}
