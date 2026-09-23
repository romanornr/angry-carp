import { writeFile } from 'node:fs/promises';
import { parseArgs } from 'node:util';
import { readInput } from '@angry-carp/checks/node/read-input';
import { startReportPreparation, checkReportPreparation, reportDigest,
  MAX_REPORT_BYTES, MAX_ANALYSIS_BYTES } from '@angry-carp/checks/reporting/preparation';

async function main() {
  const { positionals, values } = parseArgs({ allowPositionals: true, options: {
    analysis: { type: 'string' }, output: { type: 'string' },
  } });
  const [command, first, researchPath, draftPath] = positionals;
  if (!values.analysis || !first || !['start', 'check'].includes(command) ||
      (command === 'start' && (positionals.length !== 2 || !values.output)) ||
      (command === 'check' && (positionals.length !== 4 || !researchPath || !draftPath))) {
    process.stderr.write('Usage: npm run report -- start <reviewed-request.json> --analysis <analysis.json> --output <new-preparation.json>\n' +
      '       npm run report -- check <preparation.json> <host-research.json> <draft.json> --analysis <analysis.json> [--output <new-review.json>]\n');
    process.exitCode = 2;
    return;
  }
  const analysis = await readInput(values.analysis, MAX_ANALYSIS_BYTES);
  if (command === 'start') {
    const request: unknown = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(await readInput(first, MAX_REPORT_BYTES)));
    const preparation = await startReportPreparation(request, analysis);
    const bytes = new TextEncoder().encode(JSON.stringify(preparation, null, 2) + '\n');
    // The start branch above requires output; avoid a cast across the CLI boundary.
    if (!values.output) return;
    await writeFile(values.output, bytes, { flag: 'wx', mode: 0o600 });
    process.stdout.write(`Preparation created. SHA-256: ${await reportDigest(bytes)}\n` +
      'Give the preparation to your AI host and follow docs/report-preparation.md. Research has not run.\n');
    return;
  }
  const result = await checkReportPreparation({ analysis,
    preparation: await readInput(first, MAX_REPORT_BYTES),
    research: await readInput(researchPath, MAX_REPORT_BYTES),
    draft: await readInput(draftPath, MAX_REPORT_BYTES),
  });
  if (values.output) await writeFile(values.output, JSON.stringify(result, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
  if (result.kind === 'held') {
    process.stdout.write(`Report held: ${result.reasons.join(', ')}.\n`);
    process.exitCode = 3;
  } else {
    process.stdout.write('Ready for operator review, based on host-supplied research. Retrievals, claims and draft wording are not independently verified. Nothing is approved or sent.\n');
  }
}

main().catch(() => {
  process.stderr.write('Report preparation failed. Check input shapes, source-host policy and paths. Existing output files are not replaced.\n');
  process.exitCode = 1;
});
