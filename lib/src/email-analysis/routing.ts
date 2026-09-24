import type { AnalysisEvidence } from './analyze-email.ts';
import type { deriveFindings } from './findings.ts';
import type { CoverageGap } from './observations.ts';

export type AnalysisRouting =
  | { kind: 'no_concerns_detected' }
  | { kind: 'assessment_required'; reason: 'concerns_detected' | 'incomplete_checks'; gaps: CoverageGap[] };

/** Routing is a coverage/attention decision, not a phishing verdict or a calibrated classifier. */
export function routeAnalysis(evidence: AnalysisEvidence, findings: ReturnType<typeof deriveFindings>['findings']): AnalysisRouting {
  const informative = new Set([
    'html_quote_boundaries_heuristic', 'plain_text_link_and_quote_boundaries_heuristic',
    'no_comparison_reference', 'registrar_contact_without_resource_concern',
    'unresolved_reference:cid:image', 'unresolved_reference:data:image',
  ]);

  const gaps = evidence.coverage.filter(({ reason }) => !informative.has(reason));

  // Passive image lookups are supplementary. Limits hiding unclassified content remain material above.
  const important = new Set(evidence.observations.hosts.filter((host) =>
    host.context === 'unmarked' && host.role !== 'image').map(({ id }) => id));

  for (const check of [...evidence.dns, ...evidence.rdap, ...evidence.ipRdap]) {
    if (!check.sourceIds.some((id) => important.has(id))) continue;
    important.add(check.id);
    const result = check.result;
    if (result.kind === 'found' || result.kind === 'not_found') continue;
    if (result.kind === 'answered' && !result.truncated && ['NOERROR', 'NXDOMAIN'].includes(result.rcode)) continue;
    let reason: string = result.kind;
    if ('reason' in result) reason += `:${result.reason}`;
    gaps.push({ sourceId: check.id, reason });
  }

  if (findings.some(({ kind }) => kind === 'concern')) return { kind: 'assessment_required', reason: 'concerns_detected', gaps };
  if (gaps.length) return { kind: 'assessment_required', reason: 'incomplete_checks', gaps };

  return { kind: 'no_concerns_detected' };
}
