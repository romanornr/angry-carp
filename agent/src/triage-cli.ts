import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { basename } from 'node:path';
import { init } from '@flue/runtime';
import { start } from '@flue/runtime/node';
import { cleanupSessionResources } from '@earendil-works/pi-ai';
import db from './db.ts';

async function main(): Promise<void> {
  const [filePath, ...extraArgs] = process.argv.slice(2);

  if (!filePath || extraArgs.length > 0) {
    process.stderr.write(
      'Usage: npm run triage -- <prepared-email.txt>\n',
    );
    process.exitCode = 2;
    return;
  }

  const message = await readFile(filePath, 'utf8');
  const { PhishingTriage } = await import(
    './agents/phishing-triage.ts'
  );

  await using flue = await start({
    agents: [PhishingTriage],
    db,
  });

  const agent = init(PhishingTriage, { id: randomUUID() });

  process.stderr.write(`Assessing ${basename(filePath)}…\n`);

  const receipt = await agent.dispatch(message);
  const reply = await agent.read(receipt);

  process.stdout.write(`${reply.text}\n`);
}

// main's async disposal finishes first. This standalone command owns every Pi session in the process.
main().catch(() => {
  process.stderr.write(
    'Assessment failed. Check the input file and authentication.\n',
  );
  process.exitCode = 1;
}).finally(cleanupSessionResources).catch(() => {
  process.stderr.write('Provider session cleanup failed.\n');
  process.exitCode = 1;
});
