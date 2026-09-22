'use agent';

import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { setProvider, useModel, useTool } from '@flue/runtime';
import { openAuth } from '../auth.ts';
import { lookupDnsTool, lookupRdapTool } from '../lookups/tools.ts';
import { compareDomainsTool } from '../lookalikes/tools.ts';
import { findSharedPassagesTool } from '../text-reuse/tools.ts';

const triage = await readFile(new URL('../../../phishing-triage.md', import.meta.url), 'utf8');
const channels = await readFile(new URL('../../../reporting-channels.md', import.meta.url), 'utf8');

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

  return `${triage}\n\n${channels}`;
}
