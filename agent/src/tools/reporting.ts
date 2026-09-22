import { defineTool } from '@flue/runtime';
import { findReportingChannels, reportingBatchSchema, reportingChannels } from '@angry-carp/checks/reporting';

export const lookupReportingChannelsTool = defineTool({
  name: 'lookup_reporting_channels',
  description:
    'Find reviewed reporting routes offline once case evidence supports a provider and service role. ' +
    `Batch up to 10 pairs. Provider IDs: ${[...new Set(reportingChannels.map((record) => record.provider))].join(', ')}; other names return a gap. ` +
    'Use returned conditions, sources and check dates. Results do not verify attribution, satisfy conditions or approve sending. ' +
    'For other registrars use case RDAP registrar abuse contacts. Record other channel gaps rather than inventing addresses.',
  input: reportingBatchSchema,
  run({ data }) {
    return { output: { results: data.queries.map(findReportingChannels) } };
  },
});
