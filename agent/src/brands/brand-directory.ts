import * as v from 'valibot';

const textSchema = v.pipe(v.string(), v.minLength(1), v.maxLength(1024));
const hostnameSchema = v.pipe(
  v.string(), v.maxLength(254), v.toLowerCase(),
  v.transform((value) => value.replace(/\.$/u, '')),
  v.regex(/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+(?:[a-z]{2,63}|xn--[a-z0-9-]{1,59})$/u),
  v.maxLength(253), v.brand('DirectoryHostname'),
);

export const brandQuerySchema = v.variant('kind', [
  v.object({ kind: v.literal('name'), value: v.pipe(textSchema, v.trim(), v.minLength(1)) }),
  v.object({ kind: v.literal('hostname'), value: hostnameSchema }),
]);

export const directorySourceSchema = v.object({
  name: v.literal('2FA Directory'),
  dataUrl: v.literal('https://api.2fa.directory/v3/all.json'),
  signedUrl: v.literal('https://api.2fa.directory/v3/all.json.sig'),
  retrievedAt: v.pipe(v.string(), v.isoTimestamp()),
  signedAt: v.pipe(v.string(), v.isoTimestamp()),
  sha256: v.pipe(v.string(), v.regex(/^[a-f0-9]{64}$/u)),
  signingKeyFingerprint: v.pipe(v.string(), v.regex(/^[A-F0-9]{40}$/u)),
  attribution: v.literal('Data sourced from 2FA Directory by 2factorauth'),
});

const rowsSchema = v.pipe(v.array(v.tuple([textSchema, v.object({
  domain: hostnameSchema,
  'additional-domains': v.optional(v.pipe(v.array(hostnameSchema), v.maxLength(256)), []),
  url: v.optional(v.pipe(v.string(), v.maxLength(4096), v.url())),
  regions: v.optional(v.pipe(v.array(v.pipe(v.string(), v.regex(/^-?[a-z]{2}$/u))), v.maxLength(256)), []),
})])), v.minLength(1), v.maxLength(20_000));

type BrandQuery = v.InferOutput<typeof brandQuerySchema>;
type HostField = 'domain' | 'additional-domain' | 'url';
type Entry = {
  name: string;
  key: string;
  tokens: Set<string>;
  domain: string;
  additionalDomains: string[];
  url: string | null;
  regions: string[];
  hosts: Map<string, HostField[]>;
};

/** Validates snapshot integrity and builds private indexes. Does not perform I/O. */
export async function buildBrandDirectory(json: string, metadata: unknown) {
  const bytes = new TextEncoder().encode(json);
  if (bytes.byteLength > 2 * 1024 * 1024) throw new Error('Brand directory exceeds the size limit.');
  const source = v.parse(directorySourceSchema, metadata);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  const hash = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
  if (hash !== source.sha256) throw new Error('Brand directory checksum mismatch.');

  let data: unknown;
  try {
    data = JSON.parse(json);
  } catch {
    throw new Error('Invalid brand directory JSON.');
  }
  const entries = v.parse(rowsSchema, data).map(([name, row]): Entry => {
    const hosts = new Map<string, HostField[]>();
    append(hosts, row.domain, 'domain');
    for (const host of row['additional-domains']) append(hosts, host, 'additional-domain');
    if (row.url) {
      const url = new URL(row.url);
      if ((url.protocol === 'https:' || url.protocol === 'http:') && url.pathname === '/'
        && !url.search && !url.hash && !url.username && !url.password && !url.port) {
        const host = v.safeParse(hostnameSchema, url.hostname);
        if (host.success) append(hosts, host.output, 'url');
      }
    }
    return {
      name, key: normalizeName(name), tokens: new Set(nameTokens(name)), domain: row.domain,
      additionalDomains: [...new Set(row['additional-domains'])], url: row.url ?? null,
      regions: row.regions, hosts,
    };
  });
  entries.sort((a, b) => compareStrings(a.key, b.key) || compareStrings(a.domain, b.domain)
    || compareStrings(JSON.stringify(a), JSON.stringify(b)));

  const byName = new Map<string, Entry[]>();
  const byWord = new Map<string, Entry[]>();
  const byHost = new Map<string, Entry[]>();
  for (const entry of entries) {
    append(byName, entry.key, entry);
    for (const word of entry.tokens) append(byWord, word, entry);
    for (const host of entry.hosts.keys()) append(byHost, host, entry);
  }

  function lookup(query: BrandQuery) {
    let matchedBy: 'exact_name' | 'name_words' | 'exact_hostname';
    let found: Entry[];
    if (query.kind === 'hostname') {
      matchedBy = 'exact_hostname';
      found = byHost.get(query.value) ?? [];
    } else {
      const exact = byName.get(normalizeName(query.value));
      if (exact) {
        matchedBy = 'exact_name';
        found = exact;
      } else {
        matchedBy = 'name_words';
        const words = nameTokens(query.value);
        const buckets = words.map((word) => byWord.get(word) ?? []).sort((a, b) => a.length - b.length);
        found = (buckets[0] ?? []).filter((entry) => words.every((word) => entry.tokens.has(word)));
      }
    }
    return {
      query, source: { ...source }, matchedBy,
      totalMatches: found.length, truncated: found.length > 8,
      matches: found.slice(0, 8).map((entry) => {
        let matchedHostFields: HostField[] = [];
        if (query.kind === 'hostname') matchedHostFields = [...(entry.hosts.get(query.value) ?? [])];
        return {
          name: entry.name, domain: entry.domain, url: entry.url, regions: [...entry.regions],
          additionalDomains: entry.additionalDomains.slice(0, 12),
          totalAdditionalDomains: entry.additionalDomains.length,
          additionalDomainsTruncated: entry.additionalDomains.length > 12,
          matchedHostFields,
        };
      }),
    };
  }
  return { lookup };
}

export type BrandDirectory = Awaited<ReturnType<typeof buildBrandDirectory>>;

function normalizeName(value: string) {
  return value.normalize('NFC').toLowerCase().trim().replace(/\s+/gu, ' ');
}

function nameTokens(value: string) {
  return [...new Set(normalizeName(value).match(/[\p{L}\p{M}\p{N}]+/gu) ?? [])];
}

function append<T>(index: Map<string, T[]>, key: string, value: T) {
  const bucket = index.get(key);
  if (bucket) bucket.push(value);
  else index.set(key, [value]);
}

function compareStrings(a: string, b: string) {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}
