import { defineTool } from '@flue/runtime';
import * as v from 'valibot';
import { domainSchema, lookupRdap } from './rdap.ts';
import { dnsQuerySchema, lookupDns } from './dns.ts';

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
