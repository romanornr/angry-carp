'use agent';

import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { setProvider, useModel, useTool } from '@flue/runtime';
import { openAuth } from '../auth.ts';
import { lookupRdapTool } from '../tools/lookup-rdap.ts';

const triage = await readFile(new URL('../../../phishing-triage.md', import.meta.url), 'utf8');

const auth = await openAuth({
  authPath: fileURLToPath(new URL('../../auth.json', import.meta.url)),
});

setProvider(auth.provider);

export function PhishingTriage() {
  useModel('openai-codex/gpt-5.6-sol');
  useTool(lookupRdapTool);

  return triage;
}
