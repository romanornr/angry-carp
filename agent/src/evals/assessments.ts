import { createHash, randomUUID } from 'node:crypto';
import { readFile, open } from 'node:fs/promises';
import { parseArgs } from 'node:util';
import { cleanupSessionResources } from '@earendil-works/pi-ai';
import { init } from '@flue/runtime';
import { sqlite, start } from '@flue/runtime/node';
import { PhishingTriage, assessmentModel } from '../agents/phishing-triage.ts';
import { formatAssessment } from '@angry-carp/checks/email-analysis/output';

const cases = [
  {
    id: 'documented-multidomain',
    evidence: 'Synthetic email: Northbank announces an expected monthly statement. From statements@northbank.example; DKIM pass for dispatch.example is a copied receiver claim. Image host assets.example; action https://accounts.example/statement. Reviewed source note: https://northbank.example/services, retrieved 2026-09-23T00:00:00Z, explicitly identifies dispatch.example as its mailing provider, assets.example as its image service, and accounts.example as its account portal. These are synthetic supplied observations, not live retrieval. No other concern is supplied.',
  },
  {
    id: 'contradicted-product',
    evidence: 'Synthetic email: Vale Wallet Desktop download. From release@mailer.example. Image https://valewallet.example/logo.png; action https://valewalletapps.example/download. Save ZIP, extract, run Windows setup. Download domain registered one day before trusted receipt; sender domain registered that morning. Reviewed official-source note: https://valewallet.example/platforms, retrieved 2026-09-23T00:00:00Z, says mobile only, no desktop application. Historical wording on the receipt date is unknown. Copied receiver claims SPF and DKIM pass for mailer.example. No page or installer examined. These are synthetic observations, not live retrieval.',
  },
];

async function main() {
  const { values } = parseArgs({ options: { output: { type: 'string' } } });
  if (!values.output) throw new Error('Missing evaluation output path.');
  const records = [{ id: 'reviewed_text', text: 'Supplied synthetic reviewed evidence.' }];
  const currentInstructions = await readFile(new URL('../../phishing-assessment.md', import.meta.url), 'utf8');
  // Use Flue's ordinary dispatch/read eval pattern, with fresh conversations and no persistent DB.
  // https://github.com/withastro/flue/blob/main/apps/docs/src/content/docs/guide/evals.md
  await using output = await open(values.output, 'wx', 0o600);
  await using flue = await start({ agents: [PhishingTriage], db: sqlite() });
  for (const example of cases) {
    process.stderr.write(`Evaluating ${example.id}…\n`);
    const instance = init(PhishingTriage, { id: randomUUID() });
    const receipt = await instance.dispatch(JSON.stringify({ reviewedText: example.evidence,
      assessmentEvidence: records, textAssociation: 'Synthetic reviewed evidence; no original message was analyzed.' }));
    const reply = await instance.read(receipt);
    const selections = reply.data.assessment;
    if (!selections || selections.length !== 1) throw new Error('Missing structured assessment.');
    const rendered = formatAssessment(selections[0], records);
    await output.write(JSON.stringify({ model: assessmentModel,
      promptSha256: createHash('sha256').update(currentInstructions).digest('hex'),
      ...example, assessment: selections[0], rendered }) + '\n');
  }
}

main().catch(() => {
  process.stderr.write('Assessment evaluation failed. Check authentication and evaluation paths.\n');
  process.exitCode = 1;
}).finally(cleanupSessionResources).catch(() => {
  process.stderr.write('Provider session cleanup failed.\n');
  process.exitCode = 1;
});
