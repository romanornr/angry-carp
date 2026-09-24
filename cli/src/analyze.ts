import { lstat, writeFile } from 'node:fs/promises';
import { parseArgs } from 'node:util';
import { analyzeEmail, MAX_MESSAGE_BYTES } from '@angry-carp/checks/email-analysis';
import { loadBrandDirectory } from '@angry-carp/checks/brands/local';
import { readInput } from '@angry-carp/checks/node/read-input';
import { formatAnalysis, assessmentPacket } from '@angry-carp/checks/email-analysis/output';

export const analyzeHelp = `Usage: angry-carp analyze <original.eml> [--format text|json] [--output <packet.json>]
       [--source-notes <reviewed-notes.json>] [--json <private-analysis.json>]

JSON stdout: {version: 1, analysis, assessmentEvidence}. Analysis is the reduced assessment view.
--output saves that same packet privately, without overwriting. --json saves the FULL private analysis.
No body or raw headers in the packet. Reviewed source notes retain their URLs and claims.
Exit: 0 completed (consult analysis.routing), 1 input/read failure, 2 usage/output conflict,
4 result available but saving failed (reuse stdout; do not repeat lookups).
DNS/RDAP run automatically. Candidate websites are never fetched. No model is called.
`;

export async function runAnalyze(args: string[]) {
  const { positionals, values } = parseArgs({ args, allowPositionals: true,
    options: { format: { type: 'string', default: 'text' }, output: { type: 'string' }, json: { type: 'string' }, 'source-notes': { type: 'string' } } });
  const [filePath] = positionals;
  if (!filePath || positionals.length !== 1 || !['text', 'json'].includes(values.format)) {
    process.stderr.write(analyzeHelp);
    process.exitCode = 2;
    return;
  }
  for (const path of [values.output, values.json]) {
    if (!path) continue;
    try { await lstat(path); } catch (error: unknown) {
      if (error instanceof Error && 'code' in error && error.code === 'ENOENT') continue;
      throw error;
    }
    process.stderr.write('Output already exists. Choose a new path or reuse the saved result. No lookups ran.\n');
    process.exitCode = 2;
    return;
  }
  const directory = await loadBrandDirectory();
  let sourceNotes: unknown = [];
  if (values['source-notes']) sourceNotes = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(await readInput(values['source-notes'], 128 * 1024)));
  process.stderr.write('Analyzing email…\n');
  const result = await analyzeEmail(await readInput(filePath, MAX_MESSAGE_BYTES), { directory, sourceNotes });
  if (values.format === 'text') process.stdout.write(formatAnalysis(result));
  if (values.format === 'json' || values.output) {
    const packet = JSON.stringify(assessmentPacket(result)) + '\n';
    if (values.format === 'json') process.stdout.write(packet);
    if (values.output) {
      try { await writeFile(values.output, packet, { flag: 'wx', mode: 0o600 }); }
      catch { return savingFailed(); }
    }
  }
  if (values.json) {
    try { await writeFile(values.json, JSON.stringify(result, null, 2) + '\n', { flag: 'wx', mode: 0o600 }); }
    catch { return savingFailed(); }
  }
  if (result.kind === 'input_failure') process.exitCode = 1;
}

function savingFailed() {
  process.stderr.write('Analysis result is available on stdout, but saving failed. Reuse the result; do not repeat lookups to recover an output file.\n');
  process.exitCode = 4;
}
