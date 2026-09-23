'use agent';

import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { setProvider, useDataWriter, useModel, useTool } from '@flue/runtime';
import { assessmentSchema } from '@angry-carp/checks/email-analysis/output';
import { openAuth } from '../auth.ts';
import { findSharedPassagesTool } from '../tools/text-reuse.ts';

const assessment = await readFile(new URL('../../phishing-assessment.md', import.meta.url), 'utf8');
export const assessmentModel = 'openai-codex/gpt-5.6-sol';

const auth = await openAuth({
  authPath: fileURLToPath(new URL('../../auth.json', import.meta.url)),
});

setProvider(auth.provider);

export function PhishingTriage() {
  useModel(assessmentModel);
  useTool(findSharedPassagesTool);

  // Flue's data channel carries the validated selection; terminate avoids a prose-generation turn.
  // https://github.com/withastro/flue/blob/main/apps/docs/src/content/docs/guide/agent-hooks.md
  const writeAssessment = useDataWriter('assessment', { schema: assessmentSchema });
  useTool({
    name: 'submit_assessment',
    description: 'Submit the conclusion with IDs from assessmentEvidence, then finish. Evidence roles describe your interpretation of those records.',
    input: assessmentSchema,
    run({ data }) {
      writeAssessment(data);
      return { output: 'Assessment recorded.', terminate: true };
    },
  });

  return assessment;
}
