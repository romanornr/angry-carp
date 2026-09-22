import { BlockList } from 'node:net';
import * as v from 'valibot';
import { parseMessage, MAX_MESSAGE_BYTES, type ParsedMessage } from './parse-message.ts';
import { observeMessage, classifyHost, prioritizeHosts, type CoverageGap } from './observations.ts';
import { brandQuerySchema, type BrandDirectory } from '../brands/brand-directory.ts';
import { compareDomains, domainComparisonSchema } from '../lookalikes/compare-domains.ts';
import { lookupDns, dnsQuerySchema } from '../lookups/dns.ts';
import { lookupRdap, domainSchema } from '../lookups/rdap.ts';
import { lookupIpRdap, ipAddressSchema } from '../lookups/ip-rdap.ts';
import { deriveFindings } from './findings.ts';
import { sourceNotesSchema, type SourceNote } from './source-notes.ts';
import { routeAnalysis } from './routing.ts';

export { MAX_MESSAGE_BYTES } from './parse-message.ts';
export { sourceNotesSchema } from './source-notes.ts';

const DNS_LIMIT = 12;
const DOMAIN_LIMIT = 3;
const IP_LIMIT = 3;
const COMPARISON_LIMIT = 32;
const DIRECTORY_LIMIT = 24;
const DEADLINE_MS = 45_000;

type Skipped = { kind: 'skipped'; reason: 'budget' | 'cancelled' | 'missing_comparison_message' };
type DnsQuery = v.InferOutput<typeof dnsQuerySchema>;
type LookupResult = Awaited<ReturnType<typeof lookupDns>> | Awaited<ReturnType<typeof lookupRdap>>
  | Awaited<ReturnType<typeof lookupIpRdap>> | Skipped;
export type AnalysisEvidence = {
  message: ParsedMessage;
  observations: ReturnType<typeof observeMessage>;
  dns: { id: string; query: DnsQuery; sourceIds: string[]; result: Awaited<ReturnType<typeof lookupDns>> | Skipped }[];
  rdap: { id: string; domain: v.InferOutput<typeof domainSchema>; sourceIds: string[]; result: Awaited<ReturnType<typeof lookupRdap>> | Skipped }[];
  ipRdap: { id: string; address: v.InferOutput<typeof ipAddressSchema>; sourceIds: string[]; result: Awaited<ReturnType<typeof lookupIpRdap>> | Skipped }[];
  directory: { id: string; sourceIds: string[]; result: ReturnType<BrandDirectory['lookup']> }[];
  comparisons: { id: string; sourceIds: string[]; referenceSource: 'operator' | 'directory_candidate' | 'message_image'; result: ReturnType<typeof compareDomains> }[];
  coverage: CoverageGap[];
  sourceNotes: SourceNote[];
  retries: { checkId: string; previousResult: LookupResult; retryResult: LookupResult }[];
};

/** Analyzes private bytes and queries DNS/RDAP automatically. Never fetches message URLs or calls a model. */
export async function analyzeEmail(bytes: Uint8Array, options: {
  directory: BrandDirectory;
  referenceDomains?: string[];
  sourceNotes?: unknown;
  signal?: AbortSignal;
}) {
  let signal = AbortSignal.timeout(DEADLINE_MS);
  if (options.signal) signal = AbortSignal.any([signal, options.signal]);
  const parsed = await parseMessage(bytes, signal);
  let sha256: string | null = null;
  if (bytes.byteLength <= MAX_MESSAGE_BYTES) {
    const digest = await crypto.subtle.digest('SHA-256', new Uint8Array(bytes));
    sha256 = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
  }
  const source = { byteLength: bytes.byteLength, sha256, acquisition: 'caller_supplied_bytes' };
  const notes = v.safeParse(sourceNotesSchema, options.sourceNotes ?? []);
  if (!notes.success) return { kind: 'input_failure', reason: 'invalid_source_notes', source } as const;
  if (parsed.kind === 'input_failure') return { ...parsed, source };
  const observations = observeMessage(parsed.message);
  const evidence: AnalysisEvidence = { message: parsed.message, observations,
    dns: [], rdap: [], ipRdap: [], directory: [], comparisons: [], coverage: [...observations.gaps],
    retries: [], sourceNotes: notes.output.map((note, index) => ({ ...note, id: `note${index}`,
      acquisition: 'caller_supplied_note', verification: 'not_performed' })) };
  const dns = new Map<string, AnalysisEvidence['dns'][number]>();
  const registrations = new Map<string, AnalysisEvidence['rdap'][number]>();
  const ips = new Map<string, AnalysisEvidence['ipRdap'][number]>();
  const directoryQueries = new Map<string, { query: v.InferOutput<typeof brandQuerySchema>; sourceIds: string[] }>();

  function addDns(name: string, type: DnsQuery['type'], sourceId: string) {
    const query = v.safeParse(dnsQuerySchema, { name, type });
    if (!query.success) { evidence.coverage.push({ sourceId, reason: 'invalid_dns_target' }); return; }
    const key = `${query.output.name}/${type}`;
    const existing = dns.get(key);
    if (existing) { existing.sourceIds.push(sourceId); return; }
    dns.set(key, { id: `dns${dns.size}`, query: query.output, sourceIds: [sourceId], result: { kind: 'skipped', reason: 'budget' } });
  }
  function addIp(address: v.InferOutput<typeof ipAddressSchema>, sourceId: string) {
    if (!eligibleIp(address)) { evidence.coverage.push({ sourceId, reason: 'non_public_ip_not_queried' }); return; }
    const existing = ips.get(address);
    if (existing) { existing.sourceIds.push(sourceId); return; }
    ips.set(address, { id: `ip${ips.size}`, address, sourceIds: [sourceId], result: { kind: 'skipped', reason: 'budget' } });
  }
  function addDirectory(kind: 'name' | 'hostname', value: string, sourceId: string) {
    const query = v.safeParse(brandQuerySchema, { kind, value });
    if (!query.success) { evidence.coverage.push({ sourceId, reason: 'invalid_directory_query' }); return; }
    const key = `${kind}/${query.output.value}`;
    const existing = directoryQueries.get(key);
    if (existing) existing.sourceIds.push(sourceId);
    else directoryQueries.set(key, { query: query.output, sourceIds: [sourceId] });
  }

  // Build the entire plan before dispatch. Stable role priority prevents completion order from choosing targets.
  const hosts = prioritizeHosts(observations.hosts);
  const importantIds = new Set(hosts.filter((host) => host.context === 'unmarked' && host.role !== 'image').map(({ id }) => id));
  for (const observed of hosts) {
    const target = classifyHost(observed.host);
    if (observed.context !== 'unmarked') {
      evidence.coverage.push({ sourceId: observed.id, reason: `${observed.context}_not_queried` });
      continue;
    }
    if (target.kind === 'ip_literal') { addIp(target.address, observed.id); continue; }
    if (target.kind !== 'dns') { evidence.coverage.push({ sourceId: observed.id, reason: target.kind }); continue; }
    const previous = registrations.get(target.registration);
    if (previous) previous.sourceIds.push(observed.id);
    else registrations.set(target.registration, { id: `rdap${registrations.size}`, domain: target.registration,
      sourceIds: [observed.id], result: { kind: 'skipped', reason: 'budget' } });
    addDirectory('hostname', target.host, observed.id);
    if (observed.role === 'action' || observed.role === 'text-reference' || observed.role === 'image') {
      addDns(target.host, 'A', observed.id);
      addDns(target.host, 'AAAA', observed.id);
      addDns(target.registration, 'NS', observed.id);
    } else {
      addDns(target.host, 'MX', observed.id);
      addDns(target.host, 'TXT', observed.id);
    }
  }
  // Names are bounded candidates from the message, never a claim that the directory verified the sender.
  for (const name of observations.names) {
    if (name.context === 'unmarked') addDirectory('name', name.value, name.sourceId);
  }
  for (const [index, query] of [...directoryQueries.values()].entries()) {
    if (index >= DIRECTORY_LIMIT) {
      evidence.coverage.push({ sourceId: query.sourceIds[0], reason: 'directory_query_budget' });
      continue;
    }
    evidence.directory.push({ id: `brand${index}`, sourceIds: query.sourceIds, result: options.directory.lookup(query.query) });
  }

  const references: { domain: string; source: AnalysisEvidence['comparisons'][number]['referenceSource']; sourceId: string }[] = [];
  for (const [index, domain] of (options.referenceDomains ?? []).entries()) {
    if (index >= 16) { evidence.coverage.push({ sourceId: 'operator', reason: 'reference_limit' }); break; }
    references.push({ domain, source: 'operator', sourceId: `operator${index}` });
  }
  for (const entry of evidence.directory) {
    for (const match of entry.result.matches) references.push({ domain: match.domain, source: 'directory_candidate', sourceId: entry.id });
  }
  for (const image of hosts.filter((host) => host.role === 'image' && host.context === 'unmarked')) {
    references.push({ domain: image.host, source: 'message_image', sourceId: image.id });
  }
  const compared = new Set<string>();
  let comparisonBudgetReached = false;
  comparisons: for (const observed of hosts.filter((host) => host.role !== 'image' && host.context === 'unmarked')) {
    for (const reference of references) {
      const key = `${observed.host}/${reference.domain}/${reference.source}`;
      if (compared.has(key)) continue;
      if (compared.size >= COMPARISON_LIMIT) { comparisonBudgetReached = true; break comparisons; }
      compared.add(key);
      const input = v.safeParse(domainComparisonSchema, { observedDomain: observed.host, referenceDomain: reference.domain });
      if (!input.success) { evidence.coverage.push({ sourceId: observed.id, reason: 'unsupported_comparison_input' }); continue; }
      evidence.comparisons.push({ id: `comparison${evidence.comparisons.length}`, sourceIds: [observed.id, reference.sourceId],
        referenceSource: reference.source, result: compareDomains(input.output) });
    }
  }
  if (comparisonBudgetReached) evidence.coverage.push({ sourceId: 'message', reason: 'comparison_budget' });
  if (!references.length) evidence.coverage.push({ sourceId: 'message', reason: 'no_comparison_reference' });
  evidence.dns = [...dns.values()];
  evidence.rdap = [...registrations.values()];
  const importantDns = evidence.dns.filter((check) => check.sourceIds.some((id) => importantIds.has(id)));
  for (const check of importantDns) importantIds.add(check.id);
  // Keep MAIL FROM/return-path prerequisites reachable even when the body contains many action hosts.
  const mailIds = new Set(hosts.filter((host) => host.context === 'unmarked'
    && (host.role === 'mail-from' || host.role === 'return-path')).map(({ id }) => id));
  const selectedDns = new Set(evidence.dns.filter((check) => check.sourceIds.some((id) => mailIds.has(id))).slice(0, 4));
  for (const check of evidence.dns) {
    if (selectedDns.size === DNS_LIMIT) break;
    selectedDns.add(check);
  }
  evidence.retries.push(...await runWithRetry(importantDns, [...selectedDns], signal, async (check) => {
    if (signal.aborted) { check.result = { kind: 'skipped', reason: 'cancelled' }; return; }
    check.result = await lookupDns(check.query, signal);
  }));
  const fromIds = new Set(hosts.filter((host) => host.role === 'from' && host.context === 'unmarked').map(({ id }) => id));
  const selectedRdap = new Set(evidence.rdap.filter((check) => check.sourceIds.some((id) => fromIds.has(id))).slice(0, 1));
  for (const check of evidence.rdap) {
    if (selectedRdap.size === DOMAIN_LIMIT) break;
    selectedRdap.add(check);
  }
  evidence.retries.push(...await runWithRetry(evidence.rdap.filter((check) => check.sourceIds.some((id) => importantIds.has(id))), [...selectedRdap], signal, async (check) => {
    if (signal.aborted) { check.result = { kind: 'skipped', reason: 'cancelled' }; return; }
    check.result = await lookupRdap(check.domain, signal);
  }));
  for (const check of evidence.dns) {
    if (check.result.kind !== 'answered') continue;
    const owners = new Set<string>([check.query.name]);
    for (let pass = 0; pass < check.result.answers.length; pass++) {
      for (const answer of check.result.answers) {
        if (answer.type === 'CNAME' && owners.has(answer.name.toLowerCase().replace(/\.$/, ''))) {
          owners.add(answer.data.toLowerCase().replace(/\.$/, ''));
        }
      }
    }
    for (const answer of check.result.answers) {
      if (!owners.has(answer.name.toLowerCase().replace(/\.$/, ''))) continue;
      if (answer.type !== 'A' && answer.type !== 'AAAA') continue;
      const address = v.safeParse(ipAddressSchema, answer.data);
      if (address.success) addIp(address.output, check.id);
    }
  }
  evidence.ipRdap = [...ips.values()];
  evidence.retries.push(...await runWithRetry(evidence.ipRdap.filter((check) => check.sourceIds.some((id) => importantIds.has(id))), evidence.ipRdap.slice(0, IP_LIMIT), signal, async (check) => {
    if (signal.aborted) { check.result = { kind: 'skipped', reason: 'cancelled' }; return; }
    check.result = await lookupIpRdap(check.address, signal);
  }));
  const derived = deriveFindings(evidence);
  return { kind: 'analyzed', version: 1, source, ...evidence, ...derived, routing: routeAnalysis(evidence, derived.findings),
    textReuse: { kind: 'skipped', reason: 'missing_comparison_message' } satisfies Skipped,
    limits: { dns: DNS_LIMIT, domainRdap: DOMAIN_LIMIT, ipRdap: IP_LIMIT,
      retryBatches: 1, httpRequests: 2 * (DNS_LIMIT + 2 * (DOMAIN_LIMIT + IP_LIMIT)), deadlineMs: DEADLINE_MS },
  } as const;
}

export type EmailAnalysis = Awaited<ReturnType<typeof analyzeEmail>>;

// One additional bounded batch retries transient failures or work skipped for budget.
// Never repeat complete successes, deterministic rejections or HTTP 429 without a server-directed wait.
async function runWithRetry<T extends { id: string; result: LookupResult }>(
  plan: T[], initial: T[], signal: AbortSignal, run: (item: T) => Promise<void>,
) {
  await runBounded(initial, run);
  if (signal.aborted) return [];
  const retry = plan.filter(({ result }) => {
    switch (result.kind) {
      case 'skipped': return result.reason === 'budget';
      case 'http_error': return result.status >= 500;
      case 'unavailable': return result.reason === 'request_failed' || result.reason === 'timeout';
      case 'answered': return result.rcode === 'SERVFAIL' || result.truncated;
      case 'found': case 'not_found': case 'no_service': return false;
      default: { const unhandled: never = result; return unhandled; }
    }
  }).slice(0, initial.length);
  const previous = retry.map(({ id, result }) => ({ checkId: id, previousResult: result }));
  await runBounded(retry, run);
  return retry.map((check, index) => {
    const attempt = { ...previous[index], retryResult: check.result };
    // Preserve partial observations when the retry fails or supplies less evidence; both attempts remain recorded.
    if (attempt.previousResult.kind === 'answered' && (check.result.kind !== 'answered'
      || check.result.rcode !== 'NOERROR' || check.result.answers.length < attempt.previousResult.answers.length)) {
      check.result = attempt.previousResult;
    }
    return attempt;
  });
}

async function runBounded<T>(items: T[], run: (item: T) => Promise<void>) {
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(3, items.length) }, async () => {
    while (next < items.length) await run(items[next++]);
  }));
}

// Conservative outbound-lookup eligibility, not an assertion that every allowed address is globally reachable.
// IANA special-purpose registries: https://www.iana.org/assignments/iana-ipv4-special-registry/
const excluded = new BlockList();
for (const [network, prefix] of [
  ['0.0.0.0', 8], ['10.0.0.0', 8], ['100.64.0.0', 10], ['127.0.0.0', 8], ['169.254.0.0', 16],
  ['172.16.0.0', 12], ['192.0.0.0', 24], ['192.0.2.0', 24], ['192.168.0.0', 16],
  ['198.18.0.0', 15], ['198.51.100.0', 24], ['203.0.113.0', 24], ['224.0.0.0', 3],
] satisfies [string, number][]) excluded.addSubnet(network, prefix, 'ipv4');
excluded.addSubnet('2001:db8::', 32, 'ipv6');
excluded.addSubnet('2002::', 16, 'ipv6');
function eligibleIp(address: string) {
  if (address.includes(':')) return /^[23][0-9a-f]{3}:/.test(address) && !excluded.check(address, 'ipv6');
  return !excluded.check(address, 'ipv4');
}
