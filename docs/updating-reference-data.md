# Update the brand directory

Run these steps from the repository root with Node.js 24, curl, and GnuPG installed. This updates public reference data only. It does not sign in, read email, or make a model call.

## Download and verify a replacement

The upstream URLs and pinned signing-key fingerprint are in [source.json](../lib/reference-data/2fa-directory/source.json). The current trusted public key was obtained from the publisher's `security.2fa.directory` DNS CERT record over Cloudflare DoH on 2026-09-22. Its fingerprint is `0D504141CE290061BD4F95A4AD8483C1CBABC36D`. This initial trust decision relies on that publisher-controlled DNS source; it is not a separate identity certification.

Despite the name, the observed `all.json.sig` is a signed compressed message containing its own JSON, not a detached signature for the plain `all.json` response. Extract and verify the signed payload. The unsigned endpoint has served older cached bytes. The publisher's [API instructions](https://2fa.directory/api) currently describe detached verification, which did not work for this artifact.

The following block downloads to a temporary directory and validates the replacement without changing the installed snapshot. It uses an isolated GPG keyring. Stop if signature verification, fingerprint checking, or schema validation fails.

```sh
(
  set -eu
  brand_update_dir=$(mktemp -d)
  curl --fail --location --proto '=https' --proto-redir '=https' \
    --max-time 60 --max-filesize 4194304 \
    https://api.2fa.directory/v3/all.json.sig \
    --output "$brand_update_dir/v3.json.sig"
  gpg --no-options --homedir "$brand_update_dir" --batch \
    --import lib/reference-data/2fa-directory/signing-key.gpg
  gpg --no-options --homedir "$brand_update_dir" --batch --max-output 2097152 --status-fd 1 \
    --output "$brand_update_dir/v3.json" --decrypt "$brand_update_dir/v3.json.sig" \
    > "$brand_update_dir/signature-status.txt"
  node --input-type=module - "$brand_update_dir" <<'JS'
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
const stage = process.argv[2];
const previous = JSON.parse(readFileSync('lib/reference-data/2fa-directory/source.json', 'utf8'));
const status = readFileSync(join(stage, 'signature-status.txt'), 'utf8');
if (!status.includes('[GNUPG:] GOODSIG ') || /\[GNUPG:\] (BADSIG|ERRSIG|EXPSIG|EXPKEYSIG|REVKEYSIG) /u.test(status)) throw Error('Signature is invalid, expired, or revoked');
const valid = status.split('\n').find(line => line.startsWith('[GNUPG:] VALIDSIG '))?.split(' ');
// VALIDSIG ends with the primary-key fingerprint; its authorized signing subkeys are accepted.
if (!valid || valid.at(-1) !== previous.signingKeyFingerprint) throw Error('Unexpected signing key');
const signedAt = new Date(Number(valid[4]) * 1000).toISOString();
if (Date.parse(signedAt) < Date.parse(previous.signedAt)) throw Error('Replacement signature predates installed snapshot');
const bytes = readFileSync(join(stage, 'v3.json'));
const metadata = { ...previous, signedAt, retrievedAt: new Date().toISOString(),
  sha256: createHash('sha256').update(bytes).digest('hex') };
writeFileSync(join(stage, 'source.json'), JSON.stringify(metadata, null, 2) + '\n');
JS
  npm --silent run brands:check -- "$brand_update_dir"
  printf 'Validated replacement: %s\n' "$brand_update_dir"
)
```

The verified initial signed payload has 2,570 entries and SHA-256 `e09405bff4ea4f0ce5628371f89e69cea2a553cca95db48c4d39e423618c66d4`. A later valid replacement will generally have a different digest. If the bytes are unchanged, retain the existing snapshot. A new retrieval date does not make unchanged entries newly reviewed.

## Review and install

Use the printed temporary directory to inspect differences between its `v3.json` and the installed file. Review added and removed services, changed domains, unusual shared hosts, and path changes. Preserve the licence notices and check the publisher's supported-version guidance. V4 removes service names, so changing the URL to v4 is not a routine update.

Stop running triage processes before replacing files. Copy only the validated `v3.json`, `v3.json.sig`, and `source.json` into `lib/reference-data/2fa-directory/`. Keep the public key and licence. Do not copy the temporary GPG keyring. The copy is a manual maintenance operation, not an atomic updater; finish all three files before restarting triage. A mismatched JSON/metadata pair fails the startup checksum. Startup does not read the signature, so also run the installed-signature check below to catch a leftover signature file.

```sh
npm --silent run brands:check
npm test
git diff --stat -- lib/reference-data/2fa-directory
```

Review and commit the public-data update. Use Git to restore all three snapshot files together if rollback is needed. Do not overwrite unrelated working-tree changes. Validation failures in the staging block leave the installed snapshot untouched.

Existing processes retain the directory they loaded. The next process rebuilds the Maps; previous assessments retain their recorded snapshot identity. Keep independently reviewed operator references in prepared notes so a dataset refresh cannot overwrite them.

## Recheck the installed signature offline

This checks the installed signed message against the pinned primary key, then compares its payload and signing date with the installed JSON and metadata. It uses the local public key without downloading current revocation information. `brands:check` alone checks only the JSON checksum and schema.

```sh
(
  set -eu
  brand_verify_dir=$(mktemp -d)
  gpg --no-options --homedir "$brand_verify_dir" --batch \
    --import lib/reference-data/2fa-directory/signing-key.gpg
  gpg --no-options --homedir "$brand_verify_dir" --batch --max-output 2097152 --status-fd 1 \
    --output "$brand_verify_dir/v3.json" --decrypt lib/reference-data/2fa-directory/v3.json.sig \
    > "$brand_verify_dir/signature-status.txt"
  node --input-type=module - "$brand_verify_dir" <<'JS'
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
const stage = process.argv[2];
const base = 'lib/reference-data/2fa-directory';
const source = JSON.parse(readFileSync(join(base, 'source.json'), 'utf8'));
const status = readFileSync(join(stage, 'signature-status.txt'), 'utf8');
if (!status.includes('[GNUPG:] GOODSIG ') || /\[GNUPG:\] (BADSIG|ERRSIG|EXPSIG|EXPKEYSIG|REVKEYSIG) /u.test(status)) throw Error('Signature is invalid, expired, or revoked');
const valid = status.split('\n').find(line => line.startsWith('[GNUPG:] VALIDSIG '))?.split(' ');
// The final fingerprint identifies the primary key, including its authorized signing subkeys.
if (!valid || valid.at(-1) !== source.signingKeyFingerprint) throw Error('Unexpected signing key');
if (Number(valid[4]) * 1000 !== Date.parse(source.signedAt)) throw Error('Signing date mismatch');
for (const dir of [stage, base]) {
  const hash = createHash('sha256').update(readFileSync(join(dir, 'v3.json'))).digest('hex');
  if (hash !== source.sha256) throw Error('Signed payload, installed JSON, and metadata do not agree');
}
console.log('Installed signature, payload, and metadata agree.');
JS
)
```

## Update policy

Updates are manual. A weekly upstream check is the recommended starting cadence, with an earlier check when coverage appears stale. There is no scheduled task or automatic activation. Lookup results show retrieval and signing dates rather than claiming current verification.

A future scheduled job can prepare a snapshot-update pull request using the same signature, schema, and diff checks. Signing-key changes and incompatible formats need explicit review. Do not silently accept a new key because a downloaded artifact names it.
