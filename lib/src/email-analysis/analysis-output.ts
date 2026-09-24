/**
 * Prepares analysis for a model and renders assessments from recorded evidence.
 * This replaced free-text explanations after they introduced unsupported factual claims.
 *
 * Steps:
 * 1. Select the analysis fields needed by the model, excluding bodies, raw headers, and extracted URL paths.
 * 2. Give the model evidence records with IDs it can cite alongside its judgment.
 * 3. Validate its selection and render the stored text for each selected ID.
 *
 * Behavior:
 * - Unknown evidence IDs and unexpected free-text fields are rejected.
 * - Reviewed source notes retain their URLs and claims, so the model input can still identify people.
 * - The model can misinterpret evidence, but the displayed records come from the analyzer.
 *
 * See docs/adr/0016-render-recorded-assessment-evidence.md for the design history.
 */
import * as v from 'valibot';
import { domainSchema } from '../lookups/rdap.ts';
import { ipAddressSchema } from '../lookups/ip-rdap.ts';
import type { EmailAnalysis } from './analyze-email.ts';
import { prioritizeHosts } from './observations.ts';

export const assessmentSchema = v.strictObject({
  concern: v.picklist(['high', 'medium', 'low']),
  confidence: v.picklist(['high', 'moderate', 'low']),
  hypothesis: v.picklist(['impersonation', 'credential_theft', 'deceptive_software_delivery', 'payment_fraud', 'other_deception', 'no_specific_deception']),
  evidence: v.pipe(v.array(v.strictObject({
    id: v.pipe(v.string(), v.maxLength(64)),
    role: v.picklist(['supports', 'contrary', 'context']),
  })), v.minLength(1), v.maxLength(8)),
});

/** Lists records the model can cite. Reviewed text is represented by a label, not copied into the records. */
export function assessmentEvidence(result: EmailAnalysis) {
  const evidence = [{ id: 'reviewed_text', text: 'Operator-reviewed email text.' }];
  if (result.kind === 'input_failure') return evidence;
  for (const [index, finding] of result.findings.entries()) evidence.push({ id: `finding${index}`, text: finding.text });
  for (const { id, domain, result: lookup } of result.rdap) {
    if (lookup.kind !== 'found') continue;
    evidence.push({ id, text: `Registration record for ${domain}: ${lookup.events.map((event) => `${event.eventAction}: ${event.eventDate}`).join('; ')}. Source: ${lookup.sourceUrl}; retrieved ${lookup.retrievedAt}.` });
  }
  for (const note of result.sourceNotes) evidence.push({ id: note.id,
    text: `Supplied source claim: ${note.claim} Source: ${note.url}; retrieved ${note.retrievedAt}. Applicability to the message date: ${note.messageDateApplicability}. Not independently verified.` });
  if (result.routing.kind === 'assessment_required' && result.routing.gaps.length > 0) {
    const gaps = result.routing.gaps;
    evidence.push({ id: 'coverage', text: `${gaps.length} material coverage gaps. First ${Math.min(gaps.length, 32)}: ` +
      gaps.slice(0, 32).map(({ sourceId, reason }) => `${sourceId}: ${reason}`).join('; ') + '. Missing checks do not establish deception or safety.' });
  }
  return evidence;
}

/** Renders recorded evidence for a validated selection. Unknown IDs and extra fields are rejected. */
export function formatAssessment(value: unknown, evidence: ReturnType<typeof assessmentEvidence>): string {
  const parsed = v.safeParse(assessmentSchema, value);
  if (!parsed.success) throw new Error('Invalid structured assessment.');
  const assessment = parsed.output;
  const records = new Map(evidence.map((record) => [record.id, record.text]));
  const lines = [`Concern: ${assessment.concern}; confidence: ${assessment.confidence}.`,
    `AI hypothesis: ${assessment.hypothesis.replaceAll('_', ' ')}.`, 'Selected evidence:'];
  for (const selection of assessment.evidence) {
    const text = records.get(selection.id);
    if (text === undefined) throw new Error('Assessment selected an unknown evidence record.');
    lines.push(`- ${selection.role} [${selection.id}]: ${text}`);
  }
  lines.push('The AI selected the conclusion and evidence. Refer to the recorded findings and coverage for the complete analysis.');
  return terminalLines(lines);
}

/**
 * Selects evidence for phishing assessment without performing I/O.
 * - Excludes bodies, raw headers, and extracted URL paths.
 * - Retains reviewed source notes, including their full URLs and claims.
 * - Leaves disclosure and any separately reviewed text to the caller.
 * Retained hosts and notes can still identify people.
 */
export function analysisForModel(result: EmailAnalysis) {
  if (result.kind === 'input_failure') return { kind: result.kind, reason: result.reason };
  const checks = [...result.dns, ...result.rdap, ...result.ipRdap];
  const skipped = new Map<string, number>();
  for (const { result } of checks) {
    if (result.kind === 'skipped') skipped.set(result.reason, (skipped.get(result.reason) ?? 0) + 1);
  }
  const hosts = prioritizeHosts(result.observations.hosts).filter(({ host }) => v.is(domainSchema, host) || v.is(ipAddressSchema, host));
  const representatives = new Map<string, typeof hosts[number]>();
  for (const host of hosts) if (!representatives.has(host.role)) representatives.set(host.role, host);
  const selectedHosts = new Set(representatives.values());
  for (const host of hosts) {
    if (selectedHosts.size === 64) break;
    selectedHosts.add(host);
  }
  const routing = { ...result.routing, gapsOmitted: 0 };
  if (routing.kind === 'assessment_required') {
    routing.gapsOmitted = Math.max(0, routing.gaps.length - 32);
    routing.gaps = routing.gaps.slice(0, 32);
  }
  return {
    kind: result.kind,
    routing,
    authenticationProvenance: result.message.authenticationProvenance,
    verification: result.message.verification,
    findings: result.findings,
    sourceNotes: result.sourceNotes,
    hosts: [...selectedHosts],
    hostsOmitted: { invalid: result.observations.hosts.length - hosts.length, budget: hosts.length - selectedHosts.size },
    comparisons: result.comparisons.map((comparison) => {
      const result = comparison.result;
      if (result.kind !== 'compared') return { id: comparison.id, kind: result.kind, referenceSource: comparison.referenceSource };
      return { id: comparison.id, kind: result.kind, sourceIds: comparison.sourceIds, referenceSource: comparison.referenceSource,
        observed: result.observed.ascii, reference: result.reference.ascii, relationship: result.relationship,
        ...result.relationship === 'different_domain' && { resemblance: result.resemblance },
        confusablesUnicodeVersion: result.confusablesUnicodeVersion };
    }),
    directory: result.directory.map(({ id, result }) => ({ id, source: result.source, matchedBy: result.matchedBy,
      totalMatches: result.totalMatches, truncated: result.truncated,
      matches: result.matches.map(({ name, domain }) => ({ name, domain })) })),
    registrations: result.rdap.filter(({ result }) => result.kind !== 'skipped').map(({ id, domain, result }) => {
      if (result.kind !== 'found') return { id, domain, kind: result.kind };
      return { id, domain, kind: result.kind, events: result.events, sourceUrl: result.sourceUrl, retrievedAt: result.retrievedAt };
    }),
    skippedChecks: [...skipped].map(([reason, count]) => ({ reason, count })),
    retries: result.retries.map(({ checkId, previousResult, retryResult }) => ({ checkId, previousKind: previousResult.kind, retryKind: retryResult.kind })),
    checks: checks.filter(({ result }) => result.kind !== 'skipped').map((check) => {
      const { id, result } = check;
      let reason: string | null = null;
      if ('reason' in result) reason = result.reason;
      let dns: { rcode: string; truncated: boolean; answerCount: number } | null = null;
      if (result.kind === 'answered') dns = { rcode: result.rcode, truncated: result.truncated, answerCount: result.answers.length };
      let query: { name: string; type: string } | null = null;
      if ('query' in check) query = check.query;
      let httpStatus: number | null = null;
      if (result.kind === 'http_error') httpStatus = result.status;
      return { id, sourceIds: check.sourceIds.slice(0, 8), sourceIdsOmitted: Math.max(0, check.sourceIds.length - 8),
        query, kind: result.kind, reason, httpStatus, dns };
    }),
    coverage: result.coverage.slice(0, 64),
    coverageOmitted: Math.max(0, result.coverage.length - 64),
    textReuse: result.textReuse,
  };
}

/** Builds a saved assessment packet. Omits the reviewed-text label because no body is included. */
export function assessmentPacket(result: EmailAnalysis) {
  return { version: assessmentPacketVersion, analysis: analysisForModel(result),
    assessmentEvidence: assessmentEvidence(result).filter(({ id }) => id !== 'reviewed_text') };
}

// Validate only the fields consumed by the renderer. The rest of the analysis stays opaque here.
// Version 1 packets differ in comparison fields, which rendering does not read.
const assessmentPacketVersion = 2;
const savedAssessmentSchema = v.object({
  version: v.picklist([1, assessmentPacketVersion]),
  analysis: v.object({ kind: v.literal('analyzed'), routing: v.object({ kind: v.literal('assessment_required') }) }),
  assessmentEvidence: v.pipe(v.array(v.strictObject({
    id: v.pipe(v.string(), v.minLength(1), v.maxLength(64)),
    text: v.pipe(v.string(), v.maxLength(128_000)),
  })), v.check((records) => new Set(records.map(({ id }) => id)).size === records.length)),
});

/** Renders a selection against saved records without authenticating the file or repeating lookups. */
export function formatSavedAssessment(packet: unknown, selection: unknown): string {
  const parsed = v.safeParse(savedAssessmentSchema, packet);
  if (!parsed.success) throw new Error('Invalid packet or assessment not required.');
  return formatAssessment(selection, parsed.output.assessmentEvidence);
}

export function formatAnalysis(result: EmailAnalysis): string {
  if (result.kind === 'input_failure') return `Input failure: ${result.reason}\n`;
  const lines = ['Deterministic email analysis', ''];
  if (result.routing.kind === 'no_concerns_detected') lines.push('No concerns detected within completed applicable checks. No AI assessment required. This is not a safety verdict.', '');
  else lines.push(`AI assessment required: ${result.routing.reason}.`, '');
  const deferred = result.observations.hosts.filter(({ context }) => context !== 'unmarked').length;
  if (deferred) lines.push(`${deferred} hosts in quoted or embedded content were not examined; assessment is required.`, '');
  for (const finding of result.findings) lines.push(`- ${finding.text}`);
  if (!result.findings.length) lines.push('No findings from the completed checks. This is not a safety verdict.');
  lines.push('', 'Reporting candidates (no reports sent):');
  if (!result.reportingCandidates.length) lines.push('- No supported candidate found within this run.');
  for (const candidate of result.reportingCandidates) {
    let resource = 'this message';
    if (candidate.resource.kind === 'domain') resource = candidate.resource.name;
    lines.push(`- ${candidate.provider} (${candidate.serviceRole}, ${resource}): ${candidate.limitation}`,
      `  Basis: ${candidate.basis} [${candidate.evidenceIds.join(', ')}].`);
    const channel = candidate.channel;
    if (channel.kind === 'rdap_contact') {
      lines.push(`  Contact: ${channel.addresses.join(', ') || 'unavailable'}.`,
        `  Source: ${channel.sourceUrl}; retrieved ${channel.retrievedAt}.`);
    } else if (channel.kind === 'listed') {
      for (const row of channel.references) {
        for (const route of row.channels) {
          let destination = '';
          if (route.kind === 'email') destination = route.address;
          else destination = route.url;
          lines.push(`  ${destination}: ${route.condition}`);
        }
        for (const source of row.sources) lines.push(`  Source: ${source.url}; reviewed ${row.checkedAt}.`);
      }
    } else lines.push(`  Channel unavailable: ${channel.guidance}`);
  }
  lines.push('', 'Registrations (reported dates; no age or trusted receipt time inferred):');
  for (const lookup of result.rdap) {
    if (lookup.result.kind !== 'found') continue;
    const registrations = lookup.result.events.filter(({ eventAction }) => eventAction === 'registration');
    if (!registrations.length) lines.push(`- ${lookup.domain}: registration date unavailable [${lookup.id}].`);
    for (const event of registrations) {
      let validity = '';
      if (!Number.isFinite(Date.parse(event.eventDate))) validity = ' (unrecognized date)';
      lines.push(`- ${lookup.domain}: ${event.eventDate}${validity} [${lookup.id}].`);
    }
    lines.push(`  Source: ${lookup.result.sourceUrl}; retrieved ${lookup.result.retrievedAt}.`);
  }
  lines.push('', 'Network registrations (records, not verified service roles):');
  for (const lookup of result.ipRdap) {
    if (lookup.result.kind !== 'found') continue;
    const { network, sourceUrl, retrievedAt } = lookup.result;
    lines.push(`- ${lookup.address}: ${network.name ?? 'unnamed network'}; range ${network.startAddress} to ${network.endAddress} [${lookup.id}].`,
      `  Source: ${sourceUrl}; retrieved ${retrievedAt}.`);
  }
  lines.push('', 'Coverage:');
  const counts = new Map<string, number>();
  for (const gap of result.coverage) counts.set(gap.reason, (counts.get(gap.reason) ?? 0) + 1);
  for (const { id, result: check } of [...result.dns, ...result.rdap, ...result.ipRdap]) {
    if (check.kind === 'skipped') {
      const reason = `lookup_skipped:${check.reason}`;
      counts.set(reason, (counts.get(reason) ?? 0) + 1);
      continue;
    }
    if (check.kind === 'found') continue;
    if (check.kind === 'answered') {
      if (check.rcode !== 'NOERROR' || check.truncated) lines.push(`- ${id}: DNS ${check.rcode}, truncated=${check.truncated}`);
      continue;
    }
    let detail: string = check.kind;
    if ('reason' in check) detail += `/${check.reason}`;
    if ('status' in check) detail += `/${check.status}`;
    if ('queriedDomain' in check || 'queriedAddress' in check) detail += ` at ${check.sourceUrl}`;
    lines.push(`- ${id}: ${detail}`);
  }
  for (const [reason, count] of counts) lines.push(`- ${reason} (${count})`);
  lines.push('- Fresh authentication verification, payload scanning and official-site verification were not performed.',
    '- Text reuse comparison skipped: no second message supplied.');
  return terminalLines(lines);
}

// Escape control characters so untrusted text cannot alter the terminal or insert output lines.
function terminalLines(lines: string[]): string {
  return lines.map((line) => line.replace(/[\x00-\x1f\x7f-\x9f\p{Cf}]/gu, (char) => {
    const codePoint = char.codePointAt(0);
    return `\\u{${codePoint?.toString(16)}}`;
  })).join('\n') + '\n';
}
