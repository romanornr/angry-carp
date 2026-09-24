/**
 * Runs shared analysis before deciding whether to start a Flue assessment.
 *
 * Lifecycle:
 * 1. Return before importing the agent if completed checks find no concerns.
 * 2. Stop on cancellation or invalid source notes.
 * 3. Require separately reviewed text before starting an assessment.
 * 4. Dispose Flue before cleaning up Pi's provider sessions, including when assessment fails.
 *
 * Other input failures may still be assessed from reviewed text.
 * A parsing failure never authorizes sending original message bytes to the model.
 * See docs/adr/0013-route-assessment-by-concerns-and-coverage.md for the routing policy.
 */
import { randomUUID } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import { parseArgs } from 'node:util';
import { cleanupSessionResources } from '@earendil-works/pi-ai';
import { analyzeEmail, MAX_MESSAGE_BYTES } from '@angry-carp/checks/email-analysis';
import { loadBrandDirectory } from '@angry-carp/checks/brands/local';
import { readInput } from '@angry-carp/checks/node/read-input';
import { analysisForModel, assessmentEvidence, formatAnalysis, formatAssessment } from '@angry-carp/checks/email-analysis/output';

async function main(): Promise<void> {
  const { positionals, values } = parseArgs({ allowPositionals: true, options: {
    'reference-domain': { type: 'string', multiple: true }, 'reviewed-text': { type: 'string' }, 'source-notes': { type: 'string' }, json: { type: 'string' },
  } });
  const [filePath] = positionals;
  if (!filePath || positionals.length !== 1) {
    process.stderr.write('Usage: npm run triage -- <original.eml> [--reviewed-text <reviewed-email.txt>] [--source-notes <reviewed-notes.json>] [--json <private-output.json>] [--reference-domain <domain>]...\n');
    process.exitCode = 2;
    return;
  }
  const directory = await loadBrandDirectory();
  let sourceNotes: unknown = [];
  if (values['source-notes']) sourceNotes = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(await readInput(values['source-notes'], 128 * 1024)));
  process.stderr.write('Analyzing email…\n');
  const analysis = await analyzeEmail(await readInput(filePath, MAX_MESSAGE_BYTES), { directory, sourceNotes, referenceDomains: values['reference-domain'] });
  process.stdout.write(formatAnalysis(analysis));
  if (values.json) await writeFile(values.json, JSON.stringify(analysis, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
  if (analysis.kind === 'analyzed' && analysis.routing.kind === 'no_concerns_detected') return;
  if (analysis.kind === 'input_failure') process.exitCode = 1;
  // Invalid reviewed evidence and explicit cancellation cannot authorize a fallback disclosure.
  if (analysis.kind === 'input_failure' && ['invalid_source_notes', 'cancelled'].includes(analysis.reason)) {
    process.exitCode = 1;
    return;
  }
  if (!values['reviewed-text']) {
    process.stderr.write('AI assessment required. Supply --reviewed-text with text approved for model disclosure.\n');
    process.exitCode = 2;
    return;
  }
  const reviewedText = new TextDecoder('utf-8', { fatal: true }).decode(await readInput(values['reviewed-text'], 512 * 1024));
  const evidence = assessmentEvidence(analysis);
  const message = JSON.stringify({
    analysis: analysisForModel(analysis),
    assessmentEvidence: evidence,
    reviewedText,
    textAssociation: 'The operator supplied this reviewed text for this message. The association is not independently verified.',
  });
  const { PhishingTriage } = await import('./agents/phishing-triage.ts');
  const { init } = await import('@flue/runtime');
  const { start } = await import('@flue/runtime/node');
  const { default: db } = await import('./db.ts');

  await using flue = await start({
    agents: [PhishingTriage],
    db,
  });

  const agent = init(PhishingTriage, { id: randomUUID() });

  process.stderr.write('Assessing analyzed email…\n');

  const receipt = await agent.dispatch(message);
  const reply = await agent.read(receipt);

  const selections = reply.data.assessment;
  let assessment: string;
  try {
    if (!selections || selections.length !== 1) throw new Error('No single structured assessment returned.');
    assessment = formatAssessment(selections[0], evidence);
  } catch {
    process.stderr.write('AI assessment unavailable: missing or invalid structured result.\n');
    process.exitCode = 1;
    return;
  }
  process.stdout.write(`\nAI assessment\n${assessment}`);
}

// main's async disposal finishes first. This standalone command owns every Pi session in the process.
main().catch(() => {
  process.stderr.write(
    'Assessment failed. Check the input, authentication and optional output path. Existing output files are not replaced.\n',
  );
  process.exitCode = 1;
}).finally(cleanupSessionResources).catch(() => {
  process.stderr.write('Provider session cleanup failed.\n');
  process.exitCode = 1;
});
