import { mkdir, readFile, writeFile, copyFile } from 'node:fs/promises';

const output = new URL('./resources/', import.meta.url);
await mkdir(output, { recursive: true });
await copyFile(new URL('./agent-workflow.md', import.meta.url), new URL('workflow.md', output));
await copyFile(new URL('../skills/angry-carp/SKILL.md', import.meta.url), new URL('skill.md', output));
const reporting = (await readFile(new URL('../provider-abuse-reporting.md', import.meta.url), 'utf8'))
  .replace('](docs/report-preparation.md)', '](#prepare-a-report-with-your-ai-host)')
  .replace('](phishing-triage.md)', '](#phishing-triage)');
const preparation = (await readFile(new URL('../docs/report-preparation.md', import.meta.url), 'utf8'))
  .replaceAll('npm --silent run report --', 'angry-carp report')
  .replace('](../provider-abuse-reporting.md)', '](#provider-abuse-reporting)')
  .replace('[ADR 0015](adr/0015-attribute-host-report-research.md)', 'ADR 0015');
const triage = await readFile(new URL('../phishing-triage.md', import.meta.url), 'utf8');
await writeFile(new URL('reporting.md', output), reporting + '\n' + preparation + '\n' + triage);
