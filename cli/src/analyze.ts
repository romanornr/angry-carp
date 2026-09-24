/**
 * Reads an email file and runs the shared analyzer without calling a model.
 * It can save assessment JSON or the full private analysis, which includes message content.
 *
 * File handling:
 * - Check destinations before analysis to avoid lookups when an output file already exists.
 * - Use exclusive writes so a file created during analysis cannot be overwritten.
 * - If saving fails, retain any output already printed to stdout.
 *   Text output cannot reconstruct a failed JSON export.
 *
 * See cli/README.md for options and output formats.
 */
import { lstat, writeFile } from 'node:fs/promises';
import { parseArgs } from 'node:util';
import { analyzeEmail, MAX_MESSAGE_BYTES } from '@angry-carp/checks/email-analysis';
import { loadBrandDirectory } from '@angry-carp/checks/brands/local';
import { readInput } from '@angry-carp/checks/node/read-input';
import { formatAnalysis, assessmentPacket } from '@angry-carp/checks/email-analysis/output';

export const analyzeHelp = `Usage: angry-carp analyze <original.eml> [options]

Analyze an email using DNS and registration lookups. The command reports its
findings without opening links from the message or calling an AI model.

Options:
  --format text|json           Print readable text (default) or JSON for later assessment.
  --output <file.json>         Also save assessment JSON. Works with either output format.
  --json <file.json>           Save the full analysis, including private message content.
  --source-notes <file.json>   Include source notes you have reviewed for disclosure.
  --reference-domain <domain>  Compare against a domain you explicitly chose as a reference.
                              You can repeat this option. At most 16 references are used.

Assessment JSON leaves out message bodies, raw headers, and paths from extracted
links. Source notes retain their URLs and claims, so the JSON can still identify
the message or people involved. Output files are created privately and never
overwrite existing files.

Use only reference domains you explicitly chose independently of this email.
If you are running the command for someone else, use the domains they supplied.
Do not derive references from the email being analyzed. With these references,
matches involving swapped letters or Latin accents require further assessment.
A match alone does not prove phishing.

Exit status:
  0  Analysis completed. Read the findings to see whether further assessment is needed.
  1  Analysis failed, or an input, reference file, or output path could not be used.
  2  An option was invalid or an output file already exists.
  4  Analysis completed, but a requested file could not be saved.
     Output already printed to stdout is still available.
     Running analysis again repeats the network lookups.
`;

export async function runAnalyze(args: string[]) {
  const { positionals, values } = parseArgs({ args, allowPositionals: true,
    options: { format: { type: 'string', default: 'text' }, output: { type: 'string' }, json: { type: 'string' }, 'source-notes': { type: 'string' },
      'reference-domain': { type: 'string', multiple: true } } });
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
  const result = await analyzeEmail(await readInput(filePath, MAX_MESSAGE_BYTES), { directory, sourceNotes, referenceDomains: values['reference-domain'] });
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
