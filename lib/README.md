# Reusable checks

`@angry-carp/checks` provides the same five capabilities used by the Flue agent, with no Flue or Pi dependency. Call the functions directly; they do not require a model, subscription, or HTTP service. Results are observations, not phishing verdicts.

## Use a module

Install from the repository root with Node.js 24 and `npm ci`. This builds JavaScript and type declarations in `lib/dist/` and links the workspace package. Import the module you need:

| Import | Function and input schema | I/O |
| --- | --- | --- |
| `@angry-carp/checks/brands` | `buildBrandDirectory(json, metadata)`, then `directory.lookup(query)`; `brandQuerySchema` | None |
| `@angry-carp/checks/brands/local` | `loadBrandDirectory(directoryUrl?)` | Reads public snapshot files in Node |
| `@angry-carp/checks/lookalikes` | `compareDomains(input)`; `domainComparisonSchema` | None; uses Node IDNA |
| `@angry-carp/checks/dns` | `lookupDns(query)`; `dnsQuerySchema` | Public DNS resolver |
| `@angry-carp/checks/rdap` | `lookupRdap(domain)`; `domainSchema` | IANA bootstrap and registry RDAP |
| `@angry-carp/checks/text-reuse` | `findSharedPassages(input)`; `passageComparisonSchema` | None |

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

The test and typecheck commands build first, then run both workspaces. Direct `npm test --workspace @angry-carp/checks` runs the library tests only. Flue's `pretriage` command rebuilds the library before an assessment so source edits are reflected in the run. Consumers import compiled exports; after editing the library, rebuild before calling those exports from another entry point.

## Data and runtime boundaries

The public [2FA Directory snapshot](reference-data/2fa-directory/source.json), signature, public key, and licence live under `lib/reference-data/2fa-directory/`. The local loader works from both source and compiled locations. It verifies checksum and schema; signature verification remains the separate [maintenance procedure](../docs/updating-reference-data.md). It runs during trusted setup, never as a model-callable file loader.

The library does not read agent credentials or conversation storage. DNS and RDAP make the public requests described above; they do not visit candidate websites. Text comparison processes the strings supplied by its caller and does not redact them. A caller must establish disclosure and storage rules before accepting private email evidence. A workspace package is not a process sandbox.

The directory and text-reuse cores use standard JavaScript and Valibot. Domain comparison also uses `node:url`, the pinned Unicode data package, and `tldts`. Workers execution has not been verified; keep local file loading separate when choosing another host.

See [brand lookup](../docs/brand-references.md), [domain lookalikes](../docs/domain-lookalikes.md), [Winnowing](../docs/text-reuse.md), and [ADR 0008](../docs/adr/0008-extract-reusable-checks.md) for semantics and design choices.
