'use agent';

import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { setProvider, useDataWriter, useModel, useTool } from '@flue/runtime';
import { assessmentSchema } from '@angry-carp/checks/email-analysis/output';
import { openAuth } from '../auth.ts';
import { findSharedPassagesTool } from '../tools/text-reuse.ts';

export const assessmentInstructions = 'Call submit_assessment once with the structured conclusion, then finish.\n\n' + await readFile(new URL(import.meta.resolve('@angry-carp/checks/assessment-instructions')), 'utf8');
export const assessmentModel = 'openai-codex/gpt-5.6-sol';

const auth = await openAuth({
  authPath: fileURLToPath(new URL('../../auth.json', import.meta.url)),
});

setProvider(auth.provider);

export function PhishingTriage() {
  useModel(assessmentModel);
  useTool(findSharedPassagesTool);

  // Flue's data writer validates the selection before returning it to the caller.
  // The tool terminates after submission to avoid another prose-generation turn.
  // https://github.com/withastro/flue/blob/2663e507b52fc8b3b11b251314c5476d650116a1/apps/docs/src/content/docs/guide/agent-hooks.md#streaming-data-to-the-client
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

  return assessmentInstructions;
}
