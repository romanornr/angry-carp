#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { readInput } from '@angry-carp/checks/node/read-input';
import { formatSavedAssessment } from '@angry-carp/checks/email-analysis/output';
import { runAnalyze, analyzeHelp } from './analyze.ts';
import { runReport } from './report.ts';
import { runExtractLinks } from './extract-links.ts';

const help = `Usage: angry-carp <command>
  analyze <original.eml>   Run deterministic analysis; use analyze --help for output options.
  assess <packet.json> <selection.json>   Validate and render a host assessment offline.
  extract-links <body.html> <evidence.json>   Extract private HTML link evidence offline.
  report start|check ...   Prepare and check a report; see instructions reporting.
  instructions [workflow|assessment|reporting|skill]   Read bundled guidance; default: workflow.

Exit: 0 completed, 1 input/file/validation failure, 2 usage/output conflict, 3 report held,
4 analysis result available but saving failed.
An exit of 0 is not a safety verdict or report approval. No command sends reports.
`;

async function main() {
  const [command, ...args] = process.argv.slice(2);
  if (command === undefined || command === '--help') {
    process.stdout.write(help);
    return;
  }
  switch (command) {
    case 'analyze':
      if (args.includes('--help')) process.stdout.write(analyzeHelp);
      else await runAnalyze(args);
      return;
    case 'report': await runReport(args); return;
    case 'extract-links': await runExtractLinks(args); return;
    case 'assess': {
      const [packet, selection] = args;
      if (args.length !== 2 || !packet || !selection) break;
      const decoder = new TextDecoder('utf-8', { fatal: true });
      const input: unknown = JSON.parse(decoder.decode(await readInput(packet, 4 * 1024 * 1024)));
      const conclusion: unknown = JSON.parse(decoder.decode(await readInput(selection, 16 * 1024)));
      process.stdout.write(formatSavedAssessment(input, conclusion));
      return;
    }
    case 'instructions': {
      const [topic = 'workflow'] = args;
      if (args.length > 1) break;
      // Like agent-browser's skills get, read instructions from the installed package, not the caller's cwd.
      // https://github.com/vercel-labs/agent-browser/blob/d01253d9db28d75080e36da3c1c31ef89454731e/cli/src/skills.rs
      if (topic === 'assessment') {
        process.stdout.write(await readFile(new URL(import.meta.resolve('@angry-carp/checks/assessment-instructions')), 'utf8'));
      } else if (topic === 'reporting' || topic === 'workflow' || topic === 'skill') {
        process.stdout.write(await readFile(new URL(`../resources/${topic}.md`, import.meta.url), 'utf8'));
      } else break;
      return;
    }
  }
  process.stderr.write(help);
  process.exitCode = 2;
}

// Data stays on stdout; sanitized diagnostics stay on stderr, as in gh's command boundary.
// https://github.com/cli/cli/blob/b6770c8bc54c72e74e785c307850446b8e10be9d/internal/ghcmd/cmd.go
main().catch((error: unknown) => {
  if (error instanceof Error && 'code' in error && typeof error.code === 'string' && error.code.startsWith('ERR_PARSE_ARGS_')) {
    process.stderr.write(help);
    process.exitCode = 2;
    return;
  }
  const failures: Record<string, string> = {
    analyze: 'Analysis failed. Check the input, reference data and optional output path. Existing output files are not replaced.',
    'extract-links': 'Link extraction failed. Check the UTF-8 HTML input, size limit and unused output path.',
    report: 'Report preparation failed. Check input shapes, source-host policy and paths. Existing output files are not replaced.',
    assess: 'Assessment rejected. Check the unchanged packet, required routing, selection shape and evidence IDs.',
    instructions: 'Instructions unavailable. Rebuild or reinstall the CLI and matching checks package.',
  };
  process.stderr.write((failures[process.argv[2]] ?? 'Command failed.') + '\n');
  process.exitCode = 1;
});
