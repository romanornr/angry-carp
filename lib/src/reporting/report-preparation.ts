import * as v from 'valibot';
import { domainSchema } from '../lookups/rdap.ts';
import { reportingQuerySchema } from './channels.ts';

export const MAX_REPORT_BYTES = 256 * 1024;
export const MAX_ANALYSIS_BYTES = 32 * 1024 * 1024;
const text = v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(4000));
const digest = v.pipe(v.string(), v.regex(/^[a-f0-9]{64}$/));
const timestamp = v.pipe(v.string(), v.isoTimestamp(), v.check((value) => Number.isFinite(Date.parse(value))));
const sourceId = v.pipe(v.string(), v.regex(/^[a-zA-Z0-9_-]{1,40}$/));
const sourceIds = v.pipe(v.array(sourceId), v.maxLength(16));
const httpsUrl = v.pipe(v.string(), v.maxLength(4096), v.url(), v.check((value) => {
  const url = URL.parse(value);
  return url !== null && url.protocol === 'https:' && !url.username && !url.password && !url.hash && !url.port;
}));
const destinationSchema = v.variant('kind', [
  v.strictObject({ kind: v.literal('email'), address: v.pipe(v.string(), v.maxLength(320), v.email()) }),
  v.strictObject({ kind: v.literal('form'), url: httpsUrl }),
]);
const analysisSchema = v.object({ kind: v.literal('analyzed'), observations: v.object({
  hosts: v.array(v.object({ role: v.string(), context: v.string(), host: v.pipe(v.string(), v.maxLength(4096)) })),
}) });

export const reportRequestSchema = v.strictObject({
  target: reportingQuerySchema,
  destination: destinationSchema,
  resource: v.variant('kind', [
    v.strictObject({ kind: v.literal('domain'), name: domainSchema }),
    v.strictObject({ kind: v.literal('message') }),
  ]),
  allegation: text,
  requestedAction: text,
  reviewedEvidence: v.pipe(v.string(), v.minLength(1), v.maxLength(32_000)),
  permittedSourceHosts: v.pipe(v.array(domainSchema), v.minLength(1), v.maxLength(16)),
  candidateHosts: v.pipe(v.array(domainSchema), v.maxLength(64)),
});

export const reportPreparationSchema = v.strictObject({
  kind: v.literal('report_preparation'),
  id: v.pipe(v.string(), v.uuid()),
  startedAt: timestamp,
  analysisSha256: digest,
  request: reportRequestSchema,
});

const researchCheck = v.variant('kind', [
  v.strictObject({ kind: v.literal('supported'), explanation: text, sourceIds: v.pipe(sourceIds, v.minLength(1)) }),
  v.strictObject({ kind: v.picklist(['unresolved', 'contradicted', 'failed']), explanation: text, sourceIds }),
]);

export const reportResearchSchema = v.strictObject({
  provenance: v.literal('host_supplied'),
  host: v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(120)),
  preparationSha256: digest,
  draftSha256: digest,
  startedAt: timestamp,
  finishedAt: timestamp,
  sources: v.pipe(v.array(v.strictObject({
    id: sourceId, url: httpsUrl, retrievedAt: timestamp, claim: text,
    sourceAuthority: v.picklist(['claimed_official', 'registry', 'other', 'unknown']),
  })), v.maxLength(16)),
  checks: v.strictObject({ allegation: researchCheck, providerRelationship: researchCheck, reportingChannel: researchCheck }),
});

// Limit each reviewed draft to one destination and body so it cannot disclose unreviewed attachments or recipients.
export const reportDraftSchema = v.strictObject({
  destination: destinationSchema,
  subject: v.pipe(v.string(), v.minLength(1), v.maxLength(200), v.regex(/^[^\r\n]+$/)),
  body: v.pipe(v.string(), v.minLength(1), v.maxLength(32_000)),
});

export type ReportPreparation = v.InferOutput<typeof reportPreparationSchema>;
type CheckName = keyof v.InferOutput<typeof reportResearchSchema>['checks'];
type CheckKind = v.InferOutput<typeof researchCheck>['kind'];
export type ReportHoldReason = 'invalid_preparation' | 'invalid_analysis' | 'invalid_research' | 'invalid_draft'
  | 'analysis_changed' | 'preparation_changed' | 'draft_changed' | 'destination_changed' | 'candidate_destination'
  | 'research_time_outside_preparation' | 'duplicate_source_id' | 'source_host_not_permitted' | 'source_time_outside_research'
  | `${CheckName}:${Exclude<CheckKind, 'supported'> | 'missing_source'}`;
export type ReportReview = { kind: 'held'; reasons: ReportHoldReason[] } | {
  kind: 'ready_for_review'; preparationSha256: string; analysisSha256: string; researchSha256: string; draftSha256: string;
  checkedAt: string; provenance: 'host_supplied'; host: string;
};

/** Hashes the exact retained bytes so changes to a saved file also change its digest. */
export async function reportDigest(bytes: Uint8Array): Promise<string> {
  // Inspired by in-toto's subject digests, this binds a record to specific bytes without attesting to its claims.
  // https://github.com/in-toto/attestation/blob/fd2609c16bcb0ac53443e2b4612977f997e8f9a5/spec/v1/statement.md
  const hash = await crypto.subtle.digest('SHA-256', new Uint8Array(bytes));
  return Array.from(new Uint8Array(hash), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/** Creates a preparation containing the reviewed request and a digest of the private analysis. */
export async function startReportPreparation(request: unknown, analysis: Uint8Array): Promise<ReportPreparation> {
  const parsed = v.safeParse(reportRequestSchema, request);
  const analyzed = v.safeParse(analysisSchema, readJson(analysis, MAX_ANALYSIS_BYTES));
  if (!parsed.success || !analyzed.success) throw new Error('Invalid report request or analysis.');
  const actions = actionHosts(analyzed.output);
  if (isCandidate(destinationHost(parsed.output.destination), parsed.output, actions)) {
    throw new Error('A candidate host cannot be a report destination.');
  }
  for (const host of parsed.output.permittedSourceHosts) {
    if (isCandidate(host, parsed.output, actions)) throw new Error('A candidate host cannot be a research source.');
  }
  return { kind: 'report_preparation', id: crypto.randomUUID(), startedAt: new Date().toISOString(),
    analysisSha256: await reportDigest(analysis), request: parsed.output };
}

/** Checks supplied research and file digests locally without fetching sources or sending a report. */
export async function checkReportPreparation(input: {
  preparation: Uint8Array; analysis: Uint8Array; research: Uint8Array; draft: Uint8Array;
}): Promise<ReportReview> {
  const preparation = v.safeParse(reportPreparationSchema, readJson(input.preparation, MAX_REPORT_BYTES));
  if (!preparation.success) return { kind: 'held', reasons: ['invalid_preparation'] };
  const research = v.safeParse(reportResearchSchema, readJson(input.research, MAX_REPORT_BYTES));
  if (!research.success) return { kind: 'held', reasons: ['invalid_research'] };
  const draft = v.safeParse(reportDraftSchema, readJson(input.draft, MAX_REPORT_BYTES));
  if (!draft.success) return { kind: 'held', reasons: ['invalid_draft'] };
  const analyzed = v.safeParse(analysisSchema, readJson(input.analysis, MAX_ANALYSIS_BYTES));
  if (!analyzed.success) return { kind: 'held', reasons: ['invalid_analysis'] };
  const [preparationSha256, analysisSha256, researchSha256, draftSha256] = await Promise.all([
    reportDigest(input.preparation), reportDigest(input.analysis), reportDigest(input.research), reportDigest(input.draft),
  ]);
  const record = preparation.output;
  const supplied = research.output;
  const reasons: ReportHoldReason[] = [];
  if (analysisSha256 !== record.analysisSha256) reasons.push('analysis_changed');
  if (preparationSha256 !== supplied.preparationSha256) reasons.push('preparation_changed');
  if (draftSha256 !== supplied.draftSha256) reasons.push('draft_changed');
  const actual = draft.output.destination;
  const expected = record.request.destination;
  const matches = (actual.kind === 'email' && expected.kind === 'email' && actual.address === expected.address)
    || (actual.kind === 'form' && expected.kind === 'form' && actual.url === expected.url);
  if (!matches) reasons.push('destination_changed');
  const actions = actionHosts(analyzed.output);
  if (isCandidate(destinationHost(actual), record.request, actions)) reasons.push('candidate_destination');
  const start = Date.parse(supplied.startedAt);
  const finish = Date.parse(supplied.finishedAt);
  if (start < Date.parse(record.startedAt) || finish < start || finish > Date.now()) reasons.push('research_time_outside_preparation');
  const sources = new Map(supplied.sources.map((source) => [source.id, source]));
  if (sources.size !== supplied.sources.length) reasons.push('duplicate_source_id');
  for (const source of supplied.sources) {
    const host = new URL(source.url).hostname;
    if (!record.request.permittedSourceHosts.some((allowed) => allowed === host) || isCandidate(host, record.request, actions)) {
      reasons.push('source_host_not_permitted');
    }
    const retrieved = Date.parse(source.retrievedAt);
    if (retrieved < start || retrieved > finish) reasons.push('source_time_outside_research');
  }
  for (const subject of ['allegation', 'providerRelationship', 'reportingChannel'] as const) {
    const check = supplied.checks[subject];
    if (check.kind !== 'supported') reasons.push(`${subject}:${check.kind}`);
    if (check.sourceIds.some((id) => !sources.has(id))) reasons.push(`${subject}:missing_source`);
  }
  if (reasons.length > 0) return { kind: 'held', reasons: [...new Set(reasons)] };
  return { kind: 'ready_for_review', preparationSha256, analysisSha256, researchSha256, draftSha256,
    checkedAt: new Date().toISOString(), provenance: supplied.provenance, host: supplied.host };
}

function isCandidate(host: string, request: v.InferOutput<typeof reportRequestSchema>, actions: string[]): boolean {
  const candidates = [...request.candidateHosts, ...actions];
  if (request.resource.kind === 'domain') candidates.push(request.resource.name);
  return candidates.some((candidate) => host === candidate || host.endsWith(`.${candidate}`));
}

function actionHosts(analysis: v.InferOutput<typeof analysisSchema>): string[] {
  // Keep observed hosts out of the request because they may contain private tracking identifiers.
  return analysis.observations.hosts.filter((host) => host.role === 'action' || host.role === 'text-reference')
    .map(({ host }) => host.toLowerCase().replace(/\.$/, ''));
}

function destinationHost(destination: v.InferOutput<typeof destinationSchema>): string {
  if (destination.kind === 'form') return new URL(destination.url).hostname;
  return destination.address.slice(destination.address.lastIndexOf('@') + 1).toLowerCase();
}

function readJson(bytes: Uint8Array, limit: number): unknown {
  if (bytes.byteLength > limit) return undefined;
  try { return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)); }
  catch { return undefined; }
}
