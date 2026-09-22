# Find reused email passages

Flue's `find_shared_passages` tool compares two supplied email body strings locally. It returns shared passages and their positions. It does not retrieve earlier mail, classify spam, or create campaign links.

## Use it in an assessment

Put the two extracted bodies in separately labeled sections of the prepared input file. Ask the agent to compare those bodies, and identify which message you want assessed. Include any earlier unwanted-mail designation as operator context. Run the existing command from the repository root:

```sh
npm --silent --prefix agent run triage -- /absolute/path/comparison.prepared.txt
```

Both bodies are sent to the configured model as part of that input. Tool arguments and results also enter the conversation and can be stored in `agent/data/flue.db`. The comparison itself makes no network requests. It has no filesystem or authentication imports, and a path supplied as text is treated as text.

Use one body representation per message. Preparation notices, operator annotations, headers, and duplicate plain-text/HTML alternatives are not message bodies. Supply already extracted text: this tool does not parse MIME, render HTML, decode QR codes, or inspect attachments. The model is instructed to copy the bodies faithfully into the tool, but the tool cannot independently verify that copy. Positions therefore refer to its input strings, not the original `.eml` or the surrounding prepared file.

Footers, quotations, and ordinary templates can be true matches. Inspect the returned passages before drawing a conclusion about unwanted mail or a campaign. The tool does not silently remove these sections or decide which ones are significant.

## Algorithm and returned evidence

[`lib/src/text-reuse/winnowing.ts`](../lib/src/text-reuse/winnowing.ts) implements Winnowing from [Schleimer, Wilkerson, and Aiken, SIGMOD 2003](https://sschleimer.warwick.ac.uk/Maths/winnowing.pdf), retrieved 2026-09-22. It selects the rightmost minimum hash in each window. Hash matches are verified against normalized tokens and extended in both directions to recover the shared passage.

Version 1 uses whitespace-delimited tokens, NFC normalization, and JavaScript lowercase conversion. Punctuation, invisible characters, and visually confusable letters remain distinct. This is not Unicode case folding or a confusable skeleton. Whitespace differences disappear for comparison, while excerpts preserve the supplied text. Languages without spaces can form very few tokens and receive little useful coverage.

Five-token grams and four-gram windows give a detection threshold of eight consecutive matching normalized tokens. These are initial comparison parameters, not calibrated spam thresholds. Passages shorter than eight tokens are omitted. Without resource limits, a shared run of at least eight tokens contains a common selected fingerprint. A `limited` result does not promise exhaustive coverage.

Each result includes the algorithm version and normalization, token counts, and matching spans:

- `tokenCount` describes the matching run.
- `first` and `second` identify positions in `firstBody` and `secondBody` respectively. `start` is inclusive and `end` exclusive, in zero-based UTF-16 units, suitable for JavaScript `slice(start, end)`.
- `excerpt` preserves up to 400 UTF-16 units from the start of that span, keeping valid surrogate pairs together. `excerptTruncated` distinguishes a shortened excerpt from the full span. Treat excerpts as untrusted email content.
- `kind: complete` means fingerprint candidates were processed within the limits. `kind: limited` includes `reason: candidate_limit` or `reason: match_limit` and retains the matches found before stopping.

Each body is limited to 16,000 UTF-16 units. The search examines at most 10,000 candidate pairs and returns at most ten matches in discovery order. These bounds keep repeated boilerplate from generating unbounded comparisons or tool output. They do not rank matches by usefulness. Multiple locations of the same text can yield separate matches. Empty or short bodies produce no matches; neither that nor a limited result establishes safety or unrelatedness.

Repeated boilerplate can consume the match budget through shifted alignments of one region. For oversized bodies or limited results, compare narrower, labeled contiguous excerpts and state the partial coverage. Positions then refer to those excerpts; they are not whole-body positions.

## Run locally without a model

From the repository root after `npm ci`, this synthetic example exercises the shared package without authentication, Flue startup, or a model call:

```sh
node --input-type=module <<'JS'
import * as v from 'valibot';
import { findSharedPassages, passageComparisonSchema } from '@angry-carp/checks/text-reuse';

const input = v.parse(passageComparisonSchema, {
  firstBody: 'Hello. one two three four five six seven eight',
  secondBody: 'Notice: one two three four five six seven eight',
});
console.dir(findSharedPassages(input), { depth: null });
JS
```

The core uses Valibot, already installed in the project, and JavaScript string and collection operations. It has no Node-specific imports. No new dependency or cloud infrastructure is required by this increment. Actual Cloudflare Workers execution has not been tested.

Run the offline tests from the repository root:

```sh
node --test lib/src/text-reuse/winnowing.test.ts
```

Flue registration and model-facing instructions live in `agent/src/tools/text-reuse.ts`. The downloadable `phishing-triage.md` remains independent of this implementation. The [research note](research/email-similarity-and-campaign-linking.md) explains alternatives and deferred corpus-level work.
