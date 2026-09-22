# Email address parser artifact review

Review date: 2026-09-22. This review covers the published `email-addresses@5.0.0` archive, its public address-field APIs, and current advisory records. The package was downloaded and read without installation or execution. No private messages, credentials, candidate URLs, or model requests were used.

Context7 resolution was attempted for `email-addresses` and `jackbearheart/email-addresses`. Neither search returned the package. The evidence below therefore uses npm metadata, the published archive, and matching pinned upstream files.

## Published artifact and dependency graph

The [npm registry record](https://registry.npmjs.org/email-addresses) identifies `5.0.0` as `dist-tags.latest`, published at `2021-08-17T18:38:34.280Z`. It is more than five years old and exceeds the requested two-week minimum age. Repository version text does not establish a newer published release. The [version-specific metadata](https://registry.npmjs.org/email-addresses/5.0.0) and downloaded manifest both identify version `5.0.0`.

The [published archive](https://registry.npmjs.org/email-addresses/-/email-addresses-5.0.0.tgz) contains 12 regular files totaling 129,872 unpacked bytes. It contains no symlinks. The reviewed artifact hashes are:

| Digest | Value |
|---|---|
| SHA-256 | `efc6d787108e3eb7b0ad5b65357ebf83ab40f3eed91dceefd40c6fec76f64318` |
| SHA-512 integrity | `sha512-4OIPYlA6JXqtVn8zpHpGiI7vE6EQOAg16aGnDMIAlZVinnoZ8208tW1hAbjWydgN/4PLTT9q+O1K6AH/vALJGw==` |
| Registry SHA-1 | `7ae9e7f58eef7d5e3e2c2c2d3ea49b78dc854fa6` |

The independently computed SHA-512 and SHA-1 match registry metadata. The archive's two runtime JavaScript files, declarations, manifest, README, and license each match the files at upstream tag `v5.0.0`, commit [`35e28805503ed71899a4bea09bde41cb86380e43`](https://github.com/jackbearheart/email-addresses/tree/35e28805503ed71899a4bea09bde41cb86380e43). The registry record does not supply `gitHead`. This comparison establishes correspondence for those six files, not a reproducible build or ownership audit.

The [manifest](https://github.com/jackbearheart/email-addresses/blob/35e28805503ed71899a4bea09bde41cb86380e43/package.json) declares MIT licensing and no runtime, optional, or peer dependencies. Its production dependency graph is the package alone. It declares only a `test` script, with no `preinstall`, `install`, `postinstall`, or `prepare` hook. `tap` and `libxmljs` are development dependencies and were not installed or reviewed. The package includes its [MIT license](https://github.com/jackbearheart/email-addresses/blob/35e28805503ed71899a4bea09bde41cb86380e43/LICENSE).

## Registry signature

Metadata contains both a legacy PGP signature and an ECDSA signature. The ECDSA signature verifies with OpenSSL against the matching key from [npm's public keys endpoint](https://registry.npmjs.org/-/npm/v1/keys), using the [documented signed message](https://docs.npmjs.com/about-registry-signatures/) `email-addresses@5.0.0:<dist.integrity>`.

The key ID is `SHA256:jl3bwswu80PjjokCgh0o2w5c2U4LhQAE57gj9cz1kzA`. The endpoint records its expiry as `2025-01-29T00:00:00.000Z`. The cryptographic verification succeeded, but this review does not claim that the key is currently unexpired or that npm's current CLI policy accepts it. The PGP signature was not verified. Metadata contains no provenance attestation. Hashes and registry signatures establish artifact identity and integrity, not benign behavior.

## Public header-field API

The published [implementation, lines 604–630](https://github.com/jackbearheart/email-addresses/blob/35e28805503ed71899a4bea09bde41cb86380e43/lib/email-addresses.js#L604), parses field bodies without the `From:`, `Sender:`, or `Reply-To:` prefix. It includes the RFC 6854 group extensions to originator fields.

| Function | Successful result | Grammar |
|---|---|---|
| `parseFrom` | Array of mailboxes or groups | Mailbox list or address list |
| `parseSender` | One mailbox or group | Mailbox or address |
| `parseReplyTo` | Array of mailboxes or groups | Address list |
| `parseAddressList` | Array of mailboxes or groups | Address list |

The wrappers and exports exist in the published [JavaScript, lines 1008–1090](https://github.com/jackbearheart/email-addresses/blob/35e28805503ed71899a4bea09bde41cb86380e43/lib/email-addresses.js#L1008), and the bundled [declarations, lines 1–72](https://github.com/jackbearheart/email-addresses/blob/35e28805503ed71899a4bea09bde41cb86380e43/lib/email-addresses.d.ts#L1). Results use the `type` discriminator, either `mailbox` or `group`. Mailboxes have `name`, `address`, `local`, and `domain`; groups retain a name and mailbox array. A group is not proof of a single author mailbox.

The wrappers default to `rfc6532: true` and `simple: true`. General defaults include `partial: false`, `strict: false`, and disabled display-name extensions. With partial parsing disabled, unconsumed input causes a null result. With `partial: true`, a successful prefix may be returned without full-input consumption. `strict: false` permits obsolete grammar, after a strict attempt. These are syntax outcomes, not address deliverability or sender authentication. [Implementation, lines 953–1083](https://github.com/jackbearheart/email-addresses/blob/35e28805503ed71899a4bea09bde41cb86380e43/lib/email-addresses.js#L953)

The parser preserves AST token strings and separate semantic values. It removes quoted-string delimiters and some whitespace from semantic output. It does not decode MIME encoded words, perform IDNA conversion, or verify domain literals as network addresses. Original field text remains separate evidence. The declaration for the directly callable module does not describe every option-dependent return shape; the named wrappers provide the relevant typed entry points. [Parsing and normalization, lines 434–600](https://github.com/jackbearheart/email-addresses/blob/35e28805503ed71899a4bea09bde41cb86380e43/lib/email-addresses.js#L434), [result construction, lines 843–950](https://github.com/jackbearheart/email-addresses/blob/35e28805503ed71899a4bea09bde41cb86380e43/lib/email-addresses.js#L843)

## Static behavior and limitations

The runtime entry is `lib/email-addresses.js`; the archive also contains a minified browser variant. Inspection of the unminified implementation and targeted checks of both runtime files found no package imports, network requests, filesystem access, process execution, `eval`, or dynamic `Function` construction. Import-time behavior defines the parser and exports it through CommonJS, or assigns the browser global. This is a scoped static observation, not a malware certification.

The parser uses recursive grammar functions and builds AST strings. Nested comments recurse, and the API supplies no maximum input length, nesting limit, deadline, or cancellation option. Runtime resource behavior remains unmeasured. A bounded header adapter must preserve an explicit failed outcome if parsing throws, rather than assuming every invalid value returns null. [Comment recursion, lines 320–335](https://github.com/jackbearheart/email-addresses/blob/35e28805503ed71899a4bea09bde41cb86380e43/lib/email-addresses.js#L320), [options, lines 1041–1083](https://github.com/jackbearheart/email-addresses/blob/35e28805503ed71899a4bea09bde41cb86380e43/lib/email-addresses.js#L1041)

## Advisory checks and verification status

On 2026-09-22, an unauthenticated POST to [OSV's query API](https://api.osv.dev/v1/query) with `{"package":{"ecosystem":"npm","name":"email-addresses"},"version":"5.0.0"}` returned HTTP 200 and `{}`. GitHub's public advisory API returned HTTP 200 and `[]` for each exact-version query: [reviewed](https://api.github.com/advisories?ecosystem=npm&affects=email-addresses%405.0.0&type=reviewed&per_page=100), [unreviewed](https://api.github.com/advisories?ecosystem=npm&affects=email-addresses%405.0.0&type=unreviewed&per_page=100), and [malware](https://api.github.com/advisories?ecosystem=npm&affects=email-addresses%405.0.0&type=malware&per_page=100). These database results do not establish the absence of undisclosed defects.

Downloaded metadata, advisory responses, archive contents, signature inputs, and key material are retained locally in `/tmp/angry-carp-email-addresses-review`. Nothing from the archive was executed. No package manifest or lockfile was changed. Synthetic parsing behavior, TypeScript integration, resource limits, and deployment compatibility remain unverified by this artifact review.

## Approved installation and isolated behavior

The operator approved email-addresses 5.0.0 together with Mailsplit 5.4.17 on 2026-09-22. Before installation, a network-isolated process using the reviewed artifact passed synthetic display-name, group, SMTPUTF8, quoted-local-part/CFWS, malformed-address and trailing-junk checks. Bounded oversized/nested inputs completed in that probe. The project installed the exact pins with npm scripts disabled. This is a bounded behavior and artifact review, not a malware guarantee.
