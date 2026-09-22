import { defineTool } from '@flue/runtime';
import * as v from 'valibot';
import { domainSchema, lookupRdap } from '@angry-carp/checks/rdap';
import { dnsQuerySchema, lookupDns } from '@angry-carp/checks/dns';
import { ipAddressSchema, lookupIpRdap } from '@angry-carp/checks/ip-rdap';

export const lookupRdapTool = defineTool({
  name: 'lookup_rdap',
  description:
    'Query public domain registration and registrar abuse contacts through RDAP. ' +
    'Supply a registered domain in ASCII or punycode, not a URL. Does not visit its website.',
  input: v.object({ domain: domainSchema }),
  async run({ data }) {
    return { output: await lookupRdap(data.domain) };
  },
});

export const lookupDnsTool = defineTool({
  name: 'lookup_dns',
  description:
    'Query public DNS records for a name from supplied evidence. ' +
    'Supports A, AAAA, NS, MX, TXT, and CNAME, including DKIM selector names. Does not visit websites.',
  input: dnsQuerySchema,
  async run({ data }) {
    return { output: await lookupDns(data) };
  },
});

export const lookupIpRdapTool = defineTool({
  name: 'lookup_ip_rdap',
  description:
    'Query IP network registration through IANA and registry RDAP, never the queried address. ' +
    'Use a bare IPv4 or IPv6 address from supplied evidence or DNS answers when its registered network resolves an attribution gap. ' +
    'At most 3 distinct addresses once each. Return sources and times; network registration does not identify the origin host, ' +
    'prove current routing, or establish Workers/Pages hosting. URLs, ports, CIDRs and zone IDs are not accepted.',
  input: v.object({ address: ipAddressSchema }),
  async run({ data }) {
    return { output: await lookupIpRdap(data.address) };
  },
});
