import { writeFile } from 'node:fs/promises';
import { renderReportingChannels } from './render-channels.ts';

// Repository maintenance only. The lookup itself has no filesystem access.
await writeFile(new URL('../../../reporting-channels.md', import.meta.url), renderReportingChannels());
process.stdout.write('Updated reporting-channels.md from lib/src/reporting/channels.ts.\n');
