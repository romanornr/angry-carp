/**
 * Retrieves a domain's registration record and registrar-associated abuse contacts.
 * Service discovery implements RFC 9224's longest matching domain suffix rule:
 * https://www.rfc-editor.org/rfc/rfc9224.html#section-4
 *
 * Steps:
 * 1. Find the registry service in IANA's bootstrap data and select an HTTPS endpoint.
 * 2. Request the domain record without following referrals.
 * 3. Verify that the response names the requested domain.
 * 4. Extract abuse contacts associated with a registrar entity.
 *
 * Other contacts in the record may belong to a different party.
 * The findings module decides whether a resource concern makes the registrar a reporting candidate.
 */
import * as v from 'valibot';
import { requestJson, type RequestFailure } from './request-json.ts';
import { createRdapBootstrap, type RdapOptions, type RdapDiscovery } from './rdap-bootstrap.ts';
export type { RequestFailure } from './request-json.ts';
export { createRdapBootstrap, type RdapOptions } from './rdap-bootstrap.ts';

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
  discovery: RdapDiscovery;
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
export async function lookupRdap(queriedDomain: Domain, options: RdapOptions = {}): Promise<RdapLookup> {
  let signal = AbortSignal.timeout(15_000);
  if (options.signal) signal = AbortSignal.any([signal, options.signal]);
  const readBootstrap = options.bootstrap ?? createRdapBootstrap(signal);
  const bootstrap = await readBootstrap(bootstrapUrl, bootstrapSchema, signal);
  const discovery = { queriedDomain, sourceUrl: bootstrapUrl, retrievedAt: new Date().toISOString(), discovery: null };
  if (bootstrap.kind !== 'received') return { ...discovery, ...bootstrap };
  const selectedDiscovery = { sourceUrl: bootstrapUrl, retrievedAt: bootstrap.retrievedAt };


  // RFC 9224 selects the longest matching label suffix, not the website's URL.
  const service = bootstrap.body.services
    .flatMap(([suffixes, urls]) => suffixes.map((suffix) => ({ suffix, urls })))
    .filter(({ suffix }) => queriedDomain.endsWith(`.${suffix}`))
    .sort((a, b) => b.suffix.length - a.suffix.length)[0];
  const baseUrl = service?.urls.find(isHttpsService);
  if (!baseUrl) return { ...discovery, ...selectedDiscovery, discovery: selectedDiscovery, kind: 'no_service' };

  const sourceUrl = `${baseUrl.replace(/\/$/, '')}/domain/${queriedDomain}`;
  const response = await requestJson({ url: sourceUrl, signal, accept });
  const source = { queriedDomain, sourceUrl, retrievedAt: new Date().toISOString(),
    discovery: selectedDiscovery };
  if (response.kind === 'http_error' && response.status === 404) return { ...source, kind: 'not_found' };
  if (response.kind !== 'received') return { ...source, ...response };

  const record = v.safeParse(recordSchema, response.body);
  if (!record.success || record.output.ldhName.toLowerCase() !== queriedDomain) {
    return { ...source, kind: 'unavailable', reason: 'invalid_response' };
  }

  const registrars = record.output.entities
    .filter((entity) => entity.roles.includes('registrar'))
    .map((registrar) => ({
      name: cardValues(registrar, 'fn')[0] ?? null,
      ianaId: registrar.publicIds.find((id) => id.type === 'IANA Registrar ID')?.identifier ?? null,
      // Keep contacts attached to this registrar because top-level abuse contacts may belong to someone else.
      abuseEmails: registrar.entities
        .filter((entity) => entity.roles.includes('abuse'))
        .flatMap((entity) => cardValues(entity, 'email'))
        .filter((email) => v.is(v.pipe(v.string(), v.email()), email)),
    }));

  if (registrars.length > 5 || registrars.some((registrar) =>
    (registrar.name?.length ?? 0) > 320 || (registrar.ianaId?.length ?? 0) > 32
    || registrar.abuseEmails.length > 5 || registrar.abuseEmails.some((email) => email.length > 320))
    || record.output.status.length > 20 || record.output.status.some((status) => status.length > 100)
    || record.output.events.length > 100) {
    return { ...source, kind: 'unavailable', reason: 'response_too_large' };
  }

  return {
    ...source,
    kind: 'found',
    status: record.output.status,
    events: record.output.events
      .filter((event) => ['registration', 'expiration', 'last changed'].includes(event.eventAction)),
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
    if (property === name && type === 'text' && typeof value === 'string') {
      values.push(value);
    }
  }
  return values;
}
