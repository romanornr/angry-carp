// Offline analyzer evaluation. Never fetch message destinations or send mail to a model.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createReadStream, readFileSync, readdirSync } from 'node:fs';
import { createInterface } from 'node:readline';
import { mock } from 'node:test';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');
const sourceRoot = pathToFileURL(`${resolve(process.argv[2] ?? 'lib/src')}/`);
const { analyzeEmail } = await import(new URL('email-analysis/analyze-email.ts', sourceRoot));
const { loadBrandDirectory } = await import(new URL('brands/load-directory.ts', sourceRoot));
const directory = await loadBrandDirectory();
const input = new URL('./generated/corpora/messages.jsonl', import.meta.url);
const sources = readdirSync(sourceRoot, { recursive: true }).filter((name) => name.endsWith('.ts') && !name.endsWith('.test.ts')).sort();
const output = { runtime: { node: process.version, icu: process.versions.icu },
  inputs: { messages: sha256(readFileSync(input)), directory: sha256(readFileSync(new URL('../reference-data/2fa-directory/v3.json', sourceRoot))),
    dependencies: sha256(readFileSync(new URL('../../package-lock.json', import.meta.url))),
    implementation: sha256(sources.map((name) => `${name}\0${sha256(readFileSync(new URL(name, sourceRoot)))}`).join('\n')) },
  lookupMode: 'offline_http_503', profiles: [] };
const profiles = [
  { name: 'message_references', referenceDomains: [] },
  { name: 'six_operator_references', referenceDomains: ['coinbase.com', 'paypal.com', 'ledger.com', 'metamask.io', 'microsoft.com', 'binance.com'] },
];

// HTTP failure keeps unavailable checks visible. Healthy fabricated answers would overstate coverage.
let requests = 0;
mock.method(globalThis, 'fetch', async () => {
  requests++;
  return new Response(null, { status: 503 });
});
const increment = (counts, key) => { counts[key] = (counts[key] ?? 0) + 1; };
try {
  for (const profile of profiles) {
    const corpora = {};
    const seen = new Set();
    const rows = [];
    for await (const line of createInterface({ input: createReadStream(input), crlfDelay: Infinity })) {
      const sample = JSON.parse(line);
      const bytes = Buffer.from(sample.base64, 'base64');
      assert.equal(sha256(bytes), sample.sha256, 'Prepared message hash mismatch');
      const counts = corpora[sample.corpus] ??= { input: 0, duplicates: 0, analyzed: 0, inputFailures: {},
        withConcerns: 0, withComparisons: 0, withoutReferences: 0, routing: {}, concernCodes: {}, resemblanceBySource: {}, coverage: {} };
      counts.input++;
      const key = `${sample.corpus}/${sample.sha256}`;
      if (seen.has(key)) { counts.duplicates++; continue; }
      seen.add(key);
      const result = await analyzeEmail(bytes, { directory, referenceDomains: profile.referenceDomains });
      if (result.kind !== 'analyzed') {
        increment(counts.inputFailures, result.reason);
        rows.push({ corpus: sample.corpus, sha256: sample.sha256, failure: result.reason });
        continue;
      }
      counts.analyzed++;
      const concerns = result.findings.filter(({ kind }) => kind === 'concern');
      if (concerns.length) counts.withConcerns++;
      if (result.comparisons.length) counts.withComparisons++;
      if (result.coverage.some(({ reason }) => reason === 'no_comparison_reference')) counts.withoutReferences++;
      const route = result.routing.kind === 'assessment_required' ? result.routing.reason : result.routing.kind;
      increment(counts.routing, route);
      const codes = [...new Set(concerns.map(({ code }) => code))].sort();
      for (const code of codes) increment(counts.concernCodes, code);
      const matches = new Set();
      for (const comparison of result.comparisons) {
        if (comparison.result.kind !== 'compared' || comparison.result.relationship !== 'different_domain') continue;
        for (const match of comparison.result.resemblance) matches.add(`${comparison.referenceSource}/${match.kind}`);
      }
      for (const match of [...matches].sort()) increment(counts.resemblanceBySource, match);
      for (const reason of new Set(result.coverage.map(({ reason }) => reason))) increment(counts.coverage, reason);
      rows.push({ corpus: sample.corpus, sha256: sample.sha256, concerns: codes, resemblance: [...matches].sort(), route });
    }
    output.profiles.push({ ...profile, corpora, rows });
  }
} finally {
  mock.restoreAll();
}
output.interceptedHttpRequests = requests;
console.log(JSON.stringify(output, null, 2));
