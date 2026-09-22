# Reusable checks

`@angry-carp/checks` provides the reusable checks and reporting-channel lookup used by the Flue agent, with no Flue or Pi dependency. Call the functions directly; they do not require a model, subscription, or HTTP service. Checks return observations; the channel lookup returns reviewed references. Neither assigns a phishing verdict.

## Use a module

Install from the repository root with Node.js 24 and `npm ci`. This builds JavaScript and type declarations in `lib/dist/` and links the workspace package. Import the module you need:

| Import | Function and input schema | I/O |
| --- | --- | --- |
| `@angry-carp/checks/email-analysis/output` | `formatAnalysis(result)`, `analysisForModel(result)` | None |
| `@angry-carp/checks/node/read-input` | `readInput(path, maxBytes)` | Bounded regular-file read in Node |
| `@angry-carp/checks/email-analysis` | `analyzeEmail(bytes, { directory, referenceDomains, sourceNotes, signal })` | Bounded Node MIME analysis plus public DNS/RDAP |
| `@angry-carp/checks/brands` | `buildBrandDirectory(json, metadata)`, then `directory.lookup(query)`; `brandQuerySchema` | None |
| `@angry-carp/checks/brands/local` | `loadBrandDirectory(directoryUrl?)` | Reads public snapshot files in Node |
| `@angry-carp/checks/lookalikes` | `compareDomains(input)`; `domainComparisonSchema` | None; uses Node IDNA |
| `@angry-carp/checks/dns` | `lookupDns(query, signal?)`; `dnsQuerySchema` | Public DNS resolver |
| `@angry-carp/checks/rdap` | `lookupRdap(domain, signal?)`; `domainSchema` | IANA bootstrap and registry RDAP |
| `@angry-carp/checks/ip-rdap` | `lookupIpRdap(address, signal?)`; `ipAddressSchema` | IANA address bootstrap and registry RDAP |
| `@angry-carp/checks/reporting` | `findReportingChannels(query)`; `reportingQuerySchema`, `reportingBatchSchema` | None |
| `@angry-carp/checks/text-reuse` | `findSharedPassages(input)`; `passageComparisonSchema` | None |
| `@angry-carp/checks/email-links` | `extractEmailLinks(html)`, `summarizeEmailLinks(result)`; extraction validates string and byte limit internally | None |

`analysisForModel` selects deception evidence and coverage for assessment. Provider candidates, channel references and IP network records remain in the complete result and deterministic display, outside that projection. It is not a report-preparation interface or general-purpose anonymizer.

Parse external input with the corresponding schema before calling a function. The schemas deliberately differ: a DNS selector name, a registered domain, and a Unicode comparison input are not interchangeable. This example runs locally after installation:

```js
import * as v from 'valibot';
import { brandQuerySchema } from '@angry-carp/checks/brands';
import { loadBrandDirectory } from '@angry-carp/checks/brands/local';

const directory = await loadBrandDirectory();
const query = v.parse(brandQuerySchema, { kind: 'name', value: 'Google Cloud' });
const result = directory.lookup(query);
console.log(result.matches);
```

A separate application using this example declares both `@angry-carp/checks` and Valibot as dependencies. The package is private and is not published. `npm pack --workspace @angry-carp/checks --pack-destination /tmp` builds a local installable archive containing JavaScript, declarations, and public reference data. Source tests and agent files are excluded from the archive.

## Build and verify

From the repository root:

```sh
npm run build
npm test
npm run check:types
npm --silent run brands:check
```

The test and typecheck commands build first, then run all workspaces. Direct `npm test --workspace @angry-carp/checks` runs the library tests only. Flue's `pretriage` command rebuilds the library before an assessment so source edits are reflected in the run. Consumers import compiled exports; after editing the library, rebuild before calling those exports from another entry point.

Use root test/typecheck commands for a clean checkout. Direct CLI/agent workspace checks require a current root build; they intentionally do not rebuild dependencies on every invocation.

`analysisForModel` applies Angry Carp's disclosure policy, not a general-purpose summarizer or anonymizer. It excludes email bodies, raw headers and extracted URL paths, while retaining selected hostnames and provider text that can contain identifiers. Explicitly reviewed source notes are a separate disclosure input: their claim and full source URL are retained. A caller must review whether that policy suits its recipient; the function neither authorizes disclosure nor sends anything. Reviewed email text is supplied separately by the caller.

## Data and runtime boundaries

The public [2FA Directory snapshot](reference-data/2fa-directory/source.json), signature, public key, and licence live under `lib/reference-data/2fa-directory/`. The local loader works from both source and compiled locations. It verifies checksum and schema; signature verification remains the separate [maintenance procedure](../docs/updating-reference-data.md). It runs during trusted setup, never as a model-callable file loader.

The library does not load agent credentials or conversation storage on its own. The Node file reader accepts a caller-supplied path and must stay in trusted acquisition code, never a model-facing file tool. DNS and RDAP make the public requests described above; they do not visit candidate websites. Text comparison processes the strings supplied by its caller and does not redact them. A caller must establish disclosure and storage rules before accepting private email evidence. A workspace package is not a process sandbox.

The directory and text-reuse cores use standard JavaScript and Valibot. [HTML link extraction](../docs/email-links.md) also uses parse5. Domain comparison uses `node:url`, the pinned Unicode data package, and `tldts`. Workers execution has not been verified; keep local file loading separate when choosing another host.

See [reporting channels](../docs/reporting-catalogue.md), [brand lookup](../docs/brand-references.md), [domain lookalikes](../docs/domain-lookalikes.md), [Winnowing](../docs/text-reuse.md), and [ADR 0008](../docs/adr/0008-extract-reusable-checks.md) for semantics and design choices.

See [email analysis](../docs/email-analysis.md) for the composing API, private result, automatic lookup budgets, parser limits and separate model disclosure. Its Node MIME adapter is not verified for Workers. Other exports remain independently callable.

The standalone [CLI](../cli/README.md) and [Flue integration](../agent/README.md) are separate consumers. [ADR 0012](../docs/adr/0012-separate-cli-from-flue.md) records their dependency ownership.

The analyzer returns an attention/coverage route as documented in [ADR 0013](../docs/adr/0013-route-assessment-by-concerns-and-coverage.md). No model is called by this package. The standalone CLI reports the route; Flue performs required assessments with reviewed input.
