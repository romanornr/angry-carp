import { defineTool } from '@flue/runtime';
import * as v from 'valibot';
import { domainSchema, lookupRdap } from '../rdap.ts';

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
