'use agent';

import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { setProvider, useModel, useTool } from '@flue/runtime';
import { openAuth } from '../auth.ts';
import { lookupDnsTool, lookupRdapTool } from '../lookups/tools.ts';
import { compareDomainsTool } from '../lookalikes/tools.ts';
import { findSharedPassagesTool } from '../text-reuse/tools.ts';
import { buildBrandDirectory } from '../brands/brand-directory.ts';
import { createBrandLookupTool } from '../brands/tools.ts';

const triage = await readFile(new URL('../../../phishing-triage.md', import.meta.url), 'utf8');
const channels = await readFile(new URL('../../../reporting-channels.md', import.meta.url), 'utf8');
const directoryPath = new URL('../../reference-data/2fa-directory/', import.meta.url);
const directory = await buildBrandDirectory(
  await readFile(new URL('v3.json', directoryPath), 'utf8'),
  JSON.parse(await readFile(new URL('source.json', directoryPath), 'utf8')),
);
const lookupBrandTool = createBrandLookupTool(directory);

const auth = await openAuth({
  authPath: fileURLToPath(new URL('../../auth.json', import.meta.url)),
});

setProvider(auth.provider);

export function PhishingTriage() {
  useModel('openai-codex/gpt-5.6-sol');
  useTool(lookupRdapTool);
  useTool(lookupDnsTool);
  useTool(compareDomainsTool);
  useTool(findSharedPassagesTool);
  useTool(lookupBrandTool);

  return `${triage}\n\n${channels}`;
}
