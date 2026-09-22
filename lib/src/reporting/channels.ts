import * as v from 'valibot';

// Service roles describe the reported resource, not RFC 9083 entity roles.
export const serviceRoleSchema = v.picklist([
  'email-delivery', 'sending-platform', 'reverse-proxy', 'dns', 'hosting', 'registrar',
]);

export const reportingQuerySchema = v.object({
  provider: v.pipe(v.string(), v.maxLength(80), v.trim(), v.toLowerCase(), v.minLength(1),
    v.transform((name) => name.replace(/\s+/gu, '-')), v.brand('ReportingProvider')),
  serviceRole: serviceRoleSchema,
});

export const reportingBatchSchema = v.object({
  queries: v.pipe(v.array(reportingQuerySchema), v.minLength(1), v.maxLength(10)),
});

type ServiceRole = v.InferOutput<typeof serviceRoleSchema>;
type ReportingQuery = v.InferOutput<typeof reportingQuerySchema>;

type Channel = Readonly<{
  condition: string;
} & (
  | { kind: 'email'; address: string }
  | { kind: 'form'; url: string }
  | { kind: 'instructions'; url: string }
)>;

type ChannelRecord = Readonly<{
  provider: string;
  name: string;
  serviceRoles: readonly [ServiceRole, ...ServiceRole[]];
  channels: readonly [Channel, ...Channel[]];
  evidence: readonly string[];
  sources: readonly [Readonly<{ label: string; url: string }>, ...Readonly<{ label: string; url: string }>[]];
  checkedAt: string;
}>;

export const reportingChannels: readonly ChannelRecord[] = [
  {
    provider: 'amazon-ses', name: 'Amazon SES', serviceRoles: ['email-delivery'],
    channels: [{ kind: 'email', address: 'email-abuse@amazon.com',
      condition: 'Case evidence connects the message to Amazon SES email delivery.' }],
    evidence: ['Delivery headers, message identifiers and receipt time, deceptive content.'],
    sources: [{ label: 'AWS reporting instructions', url: 'https://repost.aws/knowledge-center/report-aws-abuse' }],
    checkedAt: '2026-09-22',
  },
  {
    provider: 'resend', name: 'Resend', serviceRoles: ['sending-platform'],
    channels: [{ kind: 'email', address: 'support@resend.com',
      condition: 'Its terms designate this support mailbox for violation reports. Our workflow permits preparing an investigation request on an evidence-backed possible connection. Lead with the supported abuse finding and ask Resend to check message identifiers and act on any associated abusive account. State the attribution limitation in the supporting evidence; proof of platform involvement is not required to prepare this request.' }],
    evidence: [
      'Receiver headers, message identifiers and deceptive content, with the observations supporting the connection.',
      'A resend DKIM selector used in supplied receiver authentication results, together with DNS matching the documented Resend setup, is a reporting lead. The selector is sender-chosen and SES MX/SPF records are shared; these do not prove Resend handled the message or held the signing key.',
    ],
    sources: [
      { label: 'Resend violation reporting', url: 'https://resend.com/legal/terms-of-service' },
      { label: 'Resend DNS configuration', url: 'https://resend.com/docs/knowledge-base/what-if-my-domain-is-not-verifying' },
    ],
    checkedAt: '2026-09-22',
  },
  {
    provider: 'cloudflare', name: 'Cloudflare', serviceRoles: ['reverse-proxy', 'dns', 'hosting'],
    channels: [{ kind: 'form', url: 'https://abuse.cloudflare.com/',
      condition: 'Select Phishing & Malware when evidence connects the resource to Cloudflare. State the supported role; DNS or reverse-proxy evidence alone does not establish Workers/Pages hosting.' }],
    evidence: ['Exact URL, evidence of deception, and the supported service relationship. Identify email evidence and unvisited pages accurately.'],
    sources: [
      { label: 'Submission routes', url: 'https://developers.cloudflare.com/fundamentals/reference/report-abuse/submit-report/' },
      { label: 'Service roles', url: 'https://www.cloudflare.com/trust-hub/abuse-approach/' },
    ],
    checkedAt: '2026-09-22',
  },
  {
    provider: 'cloudflare', name: 'Cloudflare', serviceRoles: ['registrar'],
    channels: [
      { kind: 'form', url: 'https://abuse.cloudflare.com/',
        condition: 'Select Registrar when case RDAP identifies Cloudflare as the registrar.' },
      { kind: 'email', address: 'registrar-abuse@cloudflare.com',
        condition: 'Use only when case RDAP identifies Cloudflare as the registrar.' },
    ],
    evidence: ['Domain registration attribution and domain-abuse evidence.'],
    sources: [{ label: 'Registrar reporting', url: 'https://www.cloudflare.com/trust-hub/reporting-abuse/' }],
    checkedAt: '2026-09-22',
  },
  {
    provider: 'trustname', name: 'Trustname', serviceRoles: ['registrar'],
    channels: [
      { kind: 'email', address: 'abuse@trustname.com',
        condition: 'Use when this address is returned as the registrar abuse contact by case RDAP.' },
      { kind: 'instructions', url: 'https://trustname.com/article/202000025104',
        condition: 'The helpdesk form is an alternative and may be requested in a reply. Follow its category support-code instructions. This link is the instructions page, not the form endpoint.' },
    ],
    evidence: ['Domain, exact abusive URL, email or other abuse evidence.'],
    sources: [{ label: 'Trustname instructions', url: 'https://trustname.com/article/202000025104' }],
    checkedAt: '2026-09-22',
  },
  {
    provider: 'hostinger', name: 'Hostinger', serviceRoles: ['registrar', 'hosting'],
    channels: [
      { kind: 'email', address: 'abuse@hostinger.com',
        condition: 'Request action within the registrar or hosting role established by case evidence.' },
      { kind: 'instructions', url: 'https://www.hostinger.com/legal/abuse-policy',
        condition: 'Use the Report Abuse page linked by this policy as an alternative. Request action within the established role. This is separate from vulnerability disclosure.' },
    ],
    evidence: ['Exact resource, evidence, relevant time, reporter contact.'],
    sources: [{ label: 'Hostinger policy', url: 'https://www.hostinger.com/legal/abuse-policy' }],
    checkedAt: '2026-09-22',
  },
];

type PublishedRoutes = Omit<ChannelRecord, 'serviceRoles'>;
type ChannelLookup = { query: ReportingQuery } & (
  | { kind: 'listed'; references: PublishedRoutes[] }
  | { kind: 'provider_not_listed'; guidance: string }
  | { kind: 'role_not_listed'; listedServiceRoles: ServiceRole[]; guidance: string }
);

/** Returns reviewed references, not case attribution or permission to send. Parse external queries first. */
export function findReportingChannels(query: ReportingQuery): ChannelLookup {
  const providerRecords = reportingChannels.filter((record) => record.provider === query.provider);
  const matches = providerRecords.filter((record) => record.serviceRoles.includes(query.serviceRole));
  if (matches.length > 0) {
    return {
      query: { ...query }, kind: 'listed',
      references: matches.map(({ serviceRoles, ...record }) => structuredClone(record)),
    };
  }

  let guidance = 'No reviewed route for this query. Record the official-channel gap; do not construct a contact.';
  if (query.serviceRole === 'registrar') {
    guidance = 'Use the registrar abuse contact from case RDAP, retaining its registrar relationship and source. If absent, record the channel gap; do not construct an address.';
  }
  if (providerRecords.length === 0) return { query: { ...query }, kind: 'provider_not_listed', guidance };
  return {
    query: { ...query }, kind: 'role_not_listed', guidance,
    listedServiceRoles: [...new Set(providerRecords.flatMap((record) => record.serviceRoles))],
  };
}
