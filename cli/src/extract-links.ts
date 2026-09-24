import { writeFile } from 'node:fs/promises';
import { extractEmailLinks, summarizeEmailLinks, MAX_HTML_BYTES } from '@angry-carp/checks/email-links';
import { readInput } from '@angry-carp/checks/node/read-input';

export async function runExtractLinks(args: string[]): Promise<void> {
  const [input, output, ...extra] = args;
  if (!input || !output || extra.length > 0) {
    process.stderr.write('Usage: angry-carp extract-links <body.html> <evidence.json>\n');
    process.exitCode = 2;
    return;
  }
  const bytes = await readInput(input, MAX_HTML_BYTES);
  const extraction = extractEmailLinks(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
  await writeFile(output, JSON.stringify({ extraction, modelSummary: summarizeEmailLinks(extraction) }, null, 2) + '\n',
    { flag: 'wx', mode: 0o600 });
  process.stderr.write('Wrote private link evidence and its model summary. No network requests made.\n');
}
