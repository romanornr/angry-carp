import { writeFile } from 'node:fs/promises';
import { extractEmailLinks, summarizeEmailLinks, MAX_HTML_BYTES } from '@angry-carp/checks/email-links';
import { readInput } from '@angry-carp/checks/node/read-input';

async function main(): Promise<void> {
  const [input, output, ...extra] = process.argv.slice(2);
  if (!input || !output || extra.length > 0) {
    process.stderr.write('Usage: npm run extract:links -- <body.html> <evidence.json>\n');
    process.exitCode = 2;
    return;
  }
  const bytes = await readInput(input, MAX_HTML_BYTES);
  const extraction = extractEmailLinks(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
  await writeFile(output, JSON.stringify({ extraction, modelSummary: summarizeEmailLinks(extraction) }, null, 2) + '\n',
    { flag: 'wx', mode: 0o600 });
  process.stderr.write('Wrote private link evidence and its model summary. No network requests made.\n');
}

main().catch(() => {
  process.stderr.write('Link extraction failed. Check the UTF-8 HTML input, size limit and unused output path.\n');
  process.exitCode = 1;
});
