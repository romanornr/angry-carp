import * as v from 'valibot';
import { requestJson, type RequestFailure } from './request-json.ts';

const dnsNameSchema = v.pipe(
  v.string(),
  v.toLowerCase(),
  v.maxLength(253),
  v.regex(/^(?:_?[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+(?:[a-z]{2,63}|xn--[a-z0-9-]{1,59})$/),
  v.check((name) => name.split('.').every((label) => label.length <= 63)),
  v.brand('DnsName'),
);

export const dnsQuerySchema = v.object({
  name: dnsNameSchema,
  type: v.picklist(['A', 'AAAA', 'NS', 'MX', 'TXT', 'CNAME']),
});

type DnsQuery = v.InferOutput<typeof dnsQuerySchema>;

const recordTypes = { A: 1, AAAA: 28, NS: 2, MX: 15, TXT: 16, CNAME: 5 };
const recordTypeNames: Readonly<Record<number, string>> = Object.fromEntries(
  Object.entries(recordTypes).map(([name, code]) => [code, name]),
);
const responseCodes: Readonly<Record<number, string>> = {
  0: 'NOERROR', 1: 'FORMERR', 2: 'SERVFAIL', 3: 'NXDOMAIN', 4: 'NOTIMP', 5: 'REFUSED',
};
const recordTypeSchema = v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(65535));
const nameSchema = v.pipe(v.string(), v.maxLength(254));
const responseSchema = v.object({
  Status: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(4095)),
  TC: v.boolean(),
  Question: v.tuple([v.object({ name: nameSchema, type: recordTypeSchema })]),
  Answer: v.optional(v.array(v.object({
    name: nameSchema,
    type: recordTypeSchema,
    TTL: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(4294967295)),
    data: v.string(),
  })), []),
});

type DnsLookup = {
  query: DnsQuery;
  sourceUrl: string;
  retrievedAt: string;
} & (
  | RequestFailure
  | {
    kind: 'answered';
    rcode: string;
    truncated: boolean;
    answers: { name: string; type: string; ttl: number; data: string }[];
  }
);

/** Queries a public resolver; cache misses can reach the name's authoritative DNS servers. */
export async function lookupDns(query: DnsQuery): Promise<DnsLookup> {
  // Cloudflare's public resolver does not forward EDNS Client Subnet to authoritative servers.
  const url = new URL('https://cloudflare-dns.com/dns-query');
  url.searchParams.set('name', query.name);
  url.searchParams.set('type', query.type);
  const sourceUrl = url.href;
  const response = await requestJson({
    url: sourceUrl,
    signal: AbortSignal.timeout(15_000),
    accept: 'application/dns-json',
  });
  const source = { query, sourceUrl, retrievedAt: new Date().toISOString() };
  if (response.kind !== 'received') return { ...source, ...response };

  const record = v.safeParse(responseSchema, response.body);
  if (!record.success) return { ...source, kind: 'unavailable', reason: 'invalid_response' };
  const question = record.output.Question[0];
  if (question.name.toLowerCase().replace(/\.$/, '') !== query.name
    || question.type !== recordTypes[query.type]) {
    return { ...source, kind: 'unavailable', reason: 'invalid_response' };
  }
  // Bound model context without silently dropping valid records or shortening TXT data.
  if (record.output.Answer.length > 20 || record.output.Answer.some(({ data }) => data.length > 4096)) {
    return { ...source, kind: 'unavailable', reason: 'response_too_large' };
  }

  return {
    ...source,
    kind: 'answered',
    rcode: responseCodes[record.output.Status] ?? `RCODE_${record.output.Status}`,
    truncated: record.output.TC,
    answers: record.output.Answer.map(({ name, type, TTL, data }) => ({
      name, type: recordTypeNames[type] ?? `TYPE${type}`, ttl: TTL, data,
    })),
  };
}
