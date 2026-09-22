import * as v from 'valibot';
import { requestJson, type RequestFailure } from './request-json.ts';

const bootstrapUrl = 'https://data.iana.org/rdap/dns.json';
const accept = 'application/rdap+json, application/json';

export const domainSchema = v.pipe(
  v.string(),
  v.toLowerCase(),
  v.maxLength(253),
  v.regex(/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9-]+$/),
  v.regex(/\.(?:[a-z]{2,63}|xn--[a-z0-9-]{1,59})$/),
  v.brand('Domain'),
);

const bootstrapSchema = v.object({
  services: v.array(v.tuple([v.array(v.string()), v.array(v.string())])),
});

const contactSchema = v.object({
  roles: v.optional(v.array(v.string()), []),
  vcardArray: v.optional(v.tuple([
    v.literal('vcard'),
    v.array(v.tupleWithRest([v.string(), v.unknown(), v.string(), v.unknown()], v.unknown())),
  ])),
});

const recordSchema = v.object({
  objectClassName: v.literal('domain'),
  ldhName: v.string(),
  status: v.optional(v.array(v.string()), []),
  events: v.optional(v.array(v.object({
    eventAction: v.string(),
    eventDate: v.pipe(v.string(), v.maxLength(64)),
  })), []),
  entities: v.optional(v.array(v.object({
    ...contactSchema.entries,
    publicIds: v.optional(v.array(v.object({ type: v.string(), identifier: v.string() })), []),
    entities: v.optional(v.array(contactSchema), []),
  })), []),
});

type Domain = v.InferOutput<typeof domainSchema>;

type RdapLookup = {
  queriedDomain: Domain;
  sourceUrl: string;
  retrievedAt: string;
} & (
  | RequestFailure
  | { kind: 'not_found' }
  | { kind: 'no_service' }
  | {
    kind: 'found';
    status: string[];
    events: v.InferOutput<typeof recordSchema>['events'];
    registrars: { name: string | null; ianaId: string | null; abuseEmails: string[] }[];
  }
);

/** Queries public RDAP services, without authentication, redirects, or referral requests. */
export async function lookupRdap(queriedDomain: Domain): Promise<RdapLookup> {
  const signal = AbortSignal.timeout(15_000);
  const bootstrap = await requestJson({ url: bootstrapUrl, signal, accept });
  const discovery = { queriedDomain, sourceUrl: bootstrapUrl, retrievedAt: new Date().toISOString() };
  if (bootstrap.kind !== 'received') return { ...discovery, ...bootstrap };

  const directory = v.safeParse(bootstrapSchema, bootstrap.body);
  if (!directory.success) return { ...discovery, kind: 'unavailable', reason: 'invalid_response' };

  // RFC 9224 selects the longest matching label suffix, not the website's URL.
  const service = directory.output.services
    .flatMap(([suffixes, urls]) => suffixes.map((suffix) => ({ suffix, urls })))
    .filter(({ suffix }) => queriedDomain.endsWith(`.${suffix}`))
    .sort((a, b) => b.suffix.length - a.suffix.length)[0];
  const baseUrl = service?.urls.find(isHttpsService);
  if (!baseUrl) return { ...discovery, kind: 'no_service' };

  const sourceUrl = `${baseUrl.replace(/\/$/, '')}/domain/${queriedDomain}`;
  const response = await requestJson({ url: sourceUrl, signal, accept });
  const source = { queriedDomain, sourceUrl, retrievedAt: new Date().toISOString() };
  if (response.kind === 'http_error' && response.status === 404) return { ...source, kind: 'not_found' };
  if (response.kind !== 'received') return { ...source, ...response };

  const record = v.safeParse(recordSchema, response.body);
  if (!record.success || record.output.ldhName.toLowerCase() !== queriedDomain) {
    return { ...source, kind: 'unavailable', reason: 'invalid_response' };
  }

  const registrars = record.output.entities
    .filter((entity) => entity.roles.includes('registrar'))
    .slice(0, 5)
    .map((registrar) => ({
      name: cardValues(registrar, 'fn')[0] ?? null,
      ianaId: registrar.publicIds.find((id) => id.type === 'IANA Registrar ID')?.identifier.slice(0, 32) ?? null,
      // Keep the registrar relationship; top-level abuse contacts may belong to someone else.
      abuseEmails: registrar.entities
        .filter((entity) => entity.roles.includes('abuse'))
        .flatMap((entity) => cardValues(entity, 'email'))
        .filter((email) => v.is(v.pipe(v.string(), v.email()), email))
        .slice(0, 5),
    }));

  return {
    ...source,
    kind: 'found',
    status: record.output.status.slice(0, 20).map((status) => status.slice(0, 100)),
    events: record.output.events
      .filter((event) => ['registration', 'expiration', 'last changed'].includes(event.eventAction))
      .slice(0, 10),
    registrars,
  };
}

function isHttpsService(input: string): boolean {
  const url = URL.parse(input);
  return url !== null && url.protocol === 'https:' && !url.username && !url.password
    && !url.port && !url.search && !url.hash && v.is(domainSchema, url.hostname);
}

function cardValues(contact: v.InferOutput<typeof contactSchema>, name: string): string[] {
  const values: string[] = [];
  for (const [property, , type, value] of contact.vcardArray?.[1] ?? []) {
    if (property === name && type === 'text' && typeof value === 'string' && value.length <= 320) {
      values.push(value);
    }
  }
  return values;
}
