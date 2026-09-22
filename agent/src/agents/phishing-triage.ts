'use agent';

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { setProvider, useModel } from '@flue/runtime';
import { openAuth } from '../auth.ts';

// The npm command runs from agent/.
const triage = await readFile('../phishing-triage.md', 'utf8');

const auth = await openAuth({
  authPath: resolve('auth.json'),
});

setProvider(auth.provider);

export function PhishingTriage() {
  useModel('openai-codex/gpt-5.6-sol');

  return triage;
}
