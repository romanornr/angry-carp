import * as v from 'valibot';
import { domainSchema } from './rdap.ts';
import { requestJson, type RequestFailure } from './request-json.ts';
export type { RequestFailure } from './request-json.ts';

export const ipAddressSchema = v.pipe(
  v.string(),
  v.maxLength(45),
  v.regex(/^[0-9a-fA-F:.]+$/),
  v.ip(),
  v.transform((address) => {
    if (address.includes(':')) return new URL(`https://[${address}]/`).hostname.slice(1, -1);
    return address;
  }),
  v.brand('IpAddress'),
);

type IpAddress = v.InferOutput<typeof ipAddressSchema>;

const prefixSchema = v.pipe(
  v.string(),
  v.transform((prefix) => prefix.split('/')),
  v.tuple([ipAddressSchema, v.pipe(v.string(), v.regex(/^(?:0|[1-9]\d{0,2})$/), v.toNumber())]),
  v.check(([address, length]) => length <= addressBits(address).bits),
);

const bootstrapSchema = v.object({
  services: v.array(v.tuple([v.array(prefixSchema), v.array(v.string())])),
});

const optionalText = v.nullish(v.pipe(v.string(), v.maxLength(200)), null);
const recordSchema = v.object({
  objectClassName: v.literal('ip network'),
  startAddress: ipAddressSchema,
  endAddress: ipAddressSchema,
  ipVersion: v.picklist(['v4', 'v6']),
  handle: optionalText,
  name: optionalText,
  type: optionalText,
  country: optionalText,
});

type IpRdapLookup = {
  queriedAddress: IpAddress;
  sourceUrl: string;
  retrievedAt: string;
} & (
  | RequestFailure
  | { kind: 'not_found' }
  | { kind: 'no_service' }
  | { kind: 'found'; network: Omit<v.InferOutput<typeof recordSchema>, 'objectClassName'> }
);

/** Retrieves network registration, not origin-host attribution; never contacts the queried address. */
export async function lookupIpRdap(queriedAddress: IpAddress, callerSignal?: AbortSignal): Promise<IpRdapLookup> {
  const target = addressBits(queriedAddress);
  let bootstrapUrl = 'https://data.iana.org/rdap/ipv4.json';
  if (target.ipVersion === 'v6') bootstrapUrl = 'https://data.iana.org/rdap/ipv6.json';
  let signal = AbortSignal.timeout(15_000);
  if (callerSignal) signal = AbortSignal.any([signal, callerSignal]);
  const accept = 'application/rdap+json, application/json';
  const bootstrap = await requestJson({ url: bootstrapUrl, signal, accept });
  const discovery = { queriedAddress, sourceUrl: bootstrapUrl, retrievedAt: new Date().toISOString() };
  if (bootstrap.kind !== 'received') return { ...discovery, ...bootstrap };
  const directory = v.safeParse(bootstrapSchema, bootstrap.body);
  if (!directory.success) return { ...discovery, kind: 'unavailable', reason: 'invalid_response' };

  // RFC 9224 uses the longest binary prefix, including prefixes between byte boundaries.
  let longest = -1;
  let serviceUrls: string[] = [];
  for (const [prefixes, urls] of directory.output.services) {
    for (const [address, length] of prefixes) {
      const network = addressBits(address);
      if (network.ipVersion !== target.ipVersion) {
        return { ...discovery, kind: 'unavailable', reason: 'invalid_response' };
      }
      const shift = BigInt(target.bits - length);
      if (length >= longest && (target.value >> shift) === (network.value >> shift)) {
        if (length > longest) serviceUrls = [];
        longest = length;
        serviceUrls.push(...urls);
      }
    }
  }
  const baseUrl = serviceUrls.find(isHttpsService);
  if (!baseUrl) return { ...discovery, kind: 'no_service' };

  const sourceUrl = `${baseUrl.replace(/\/$/, '')}/ip/${queriedAddress}`;
  const response = await requestJson({ url: sourceUrl, signal, accept });
  const source = { queriedAddress, sourceUrl, retrievedAt: new Date().toISOString() };
  if (response.kind === 'http_error' && response.status === 404) return { ...source, kind: 'not_found' };
  if (response.kind !== 'received') return { ...source, ...response };
  const record = v.safeParse(recordSchema, response.body);
  if (!record.success) return { ...source, kind: 'unavailable', reason: 'invalid_response' };
  const start = addressBits(record.output.startAddress);
  const end = addressBits(record.output.endAddress);
  if (record.output.ipVersion !== target.ipVersion || start.ipVersion !== target.ipVersion
    || end.ipVersion !== target.ipVersion || start.value > target.value || end.value < target.value) {
    return { ...source, kind: 'unavailable', reason: 'invalid_response' };
  }

  const { objectClassName, ...network } = record.output;
  return { ...source, kind: 'found', network };
}

function addressBits(address: IpAddress):
  | { ipVersion: 'v4'; bits: 32; value: bigint }
  | { ipVersion: 'v6'; bits: 128; value: bigint } {
  if (!address.includes(':')) {
    return { ipVersion: 'v4', bits: 32,
      value: address.split('.').reduce((value, byte) => (value << 8n) | BigInt(byte), 0n) };
  }
  // URL canonicalization converts embedded IPv4 to hex; expand the remaining zero compression.
  const [left, right = ''] = address.split('::');
  const head = left.split(':').filter(Boolean);
  const tail = right.split(':').filter(Boolean);
  const words: string[] = [...head, ...Array<string>(8 - head.length - tail.length).fill('0'), ...tail];
  return { ipVersion: 'v6', bits: 128,
    value: words.reduce((value, word) => (value << 16n) | BigInt(`0x${word}`), 0n) };
}

function isHttpsService(input: string): boolean {
  const url = URL.parse(input);
  return url !== null && url.protocol === 'https:' && !url.username && !url.password
    && !url.port && !url.search && !url.hash && v.is(domainSchema, url.hostname);
}
