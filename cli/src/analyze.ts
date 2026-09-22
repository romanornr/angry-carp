import { writeFile } from 'node:fs/promises';
import { parseArgs } from 'node:util';
import { analyzeEmail, MAX_MESSAGE_BYTES } from '@angry-carp/checks/email-analysis';
import { loadBrandDirectory } from '@angry-carp/checks/brands/local';
import { readInput } from '@angry-carp/checks/node/read-input';
import { formatAnalysis } from '@angry-carp/checks/email-analysis/output';

async function main() {
  const { positionals, values } = parseArgs({ allowPositionals: true,
    options: { json: { type: 'string' }, 'source-notes': { type: 'string' } } });
  const [filePath] = positionals;
  if (!filePath || positionals.length !== 1) {
    process.stderr.write('Usage: npm run analyze -- <original.eml> [--source-notes <reviewed-notes.json>] [--json <private-output.json>]\n');
    process.exitCode = 2;
    return;
  }
  const directory = await loadBrandDirectory();
  let sourceNotes: unknown = [];
  if (values['source-notes']) sourceNotes = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(await readInput(values['source-notes'], 128 * 1024)));
  process.stderr.write('Analyzing email…\n');
  const result = await analyzeEmail(await readInput(filePath, MAX_MESSAGE_BYTES), { directory, sourceNotes });
  process.stdout.write(formatAnalysis(result));
  if (values.json) await writeFile(values.json, JSON.stringify(result, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
  if (result.kind === 'input_failure') process.exitCode = 1;
}

main().catch(() => {
  process.stderr.write('Analysis failed. Check the input, reference data and optional output path. Existing output files are not replaced.\n');
  process.exitCode = 1;
});
