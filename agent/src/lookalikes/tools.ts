import { defineTool } from '@flue/runtime';
import { compareDomains, domainComparisonSchema } from './compare-domains.ts';

export const compareDomainsTool = defineTool({
  name: 'compare_domains',
  description:
    'Compare an observed domain with an official reference explicitly supplied in operator notes. ' +
    'Do not infer the reference from email claims or model memory. Supply bare Unicode or punycode names. ' +
    'Runs locally without network requests. Returns domain boundaries, Unicode skeleton equality, ' +
    'literal and skeleton reference-label containment, script inventories, and IDNA changes. ' +
    'Skeleton prefixes/suffixes are comparison text, not original domain spelling. ' +
    'changedByIdna excludes case, a trailing dot, and ordinary punycode decoding. ' +
    'These are name observations, not verification of ownership, phishing, or safety. ' +
    'Common, Inherited, and Unknown script values are not suspicious by themselves. ' +
    'A missing match or an unavailable comparison does not establish safety.',
  input: domainComparisonSchema,
  async run({ data }) {
    return { output: compareDomains(data) };
  },
});
