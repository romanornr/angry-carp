# Offline raw-mail benchmark

This measures local concerns, comparison coverage, and routing through the real analyzer. It does not measure phishing classification accuracy. Every DNS/RDAP fetch receives a synthetic HTTP 503; failures remain visible. There are no live lookups, candidate-site visits, model calls, or mail submissions.

## Reproduce

From the repository root with workspace dependencies, Node 24, and Python 3:

```sh
python3 experiments/domain-lookalikes/prepare-mail-corpus.py
mkdir -p experiments/domain-lookalikes/generated/baseline-9364211
git archive 9364211 lib/src lib/reference-data | tar -x -C experiments/domain-lookalikes/generated/baseline-9364211
node experiments/domain-lookalikes/benchmark-mail.mjs experiments/domain-lookalikes/generated/baseline-9364211/lib/src > experiments/domain-lookalikes/generated/mail-baseline.json
node experiments/domain-lookalikes/benchmark-mail.mjs > experiments/domain-lookalikes/generated/mail-current.json
```

Preparation downloads three public archives and verifies pinned SHA-256 hashes before reading them. It uses Python's `tarfile` and `mailbox.mbox`; no custom mailbox parser or archive filesystem extraction is needed. Mbox conversion removes envelope separator lines and normalizes line endings. Message headers and bodies remain available to the MIME parser. All raw mail and per-message results stay in ignored `generated/`.

The runner records runtime versions, implementation and dependency hashes, message hashes, input failures, duplicate counts, concerns by code and reference source, and routing and coverage counts. Both profiles analyze the same messages. One uses only message-derived references. The other adds Coinbase, PayPal, Ledger, MetaMask, Microsoft, and Binance as fixed operator references, chosen for the earlier synthetic experiment rather than ranked by phishing frequency. No per-message reference labels are injected.

Run `evaluate-current.mjs` after generating the dnstwist input described in [README.md](README.md). It compares the shipping comparator with the hash-checked `9364211` snapshot. The older `evaluate.mjs` remains a historical experiment with different guards, not a second product implementation.

## Recorded result

Recorded with Node 24.15.0, ICU 78.2 and the repository lockfile. All 3,231 messages parsed, with zero byte-identical duplicates within each corpus. The prepared message file has SHA-256 `fce3f3e2f57f81c86f623fbc0a4e021d3cfef0208ded25f59fa68a6c32c38664`.

| Corpus | Messages | Concerns, message references, before → after | No references | Concerns, six operator references, before → after |
| --- | ---: | ---: | ---: | ---: |
| SpamAssassin easy ham, 2003 archive | 2,500 | 2 → 2 | 2,284 | 2 → 2 |
| SpamAssassin hard ham, 2003 archive | 250 | 153 → 153 | 90 | 151 → 151 |
| Nazario phishing, 2025 | 481 | 171 → 171 | 304 | 172 → 172 |

Compare the aggregate counters and per-message rows with:

```sh
node --input-type=module - <<'JS'
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = (name) => JSON.parse(readFileSync(`experiments/domain-lookalikes/generated/mail-${name}.json`));
assert.deepEqual(read('baseline').profiles, read('current').profiles);
console.log('Both profiles and every message row are identical.');
JS
```

The per-message concern codes, resemblance kinds, and routing results are identical before and after. No message gains either new resemblance kind in either configuration. These corpora therefore provide no evidence that the new rules improve real-mail detection. They also contain no contemporary ham cohort matched to the phishing collection. Legitimate accented names and swaps require the synthetic controls in the comparator and analyzer tests.

All messages route to assessment, either for concerns or incomplete checks. Counting those routes as successful phishing detection would be invalid. The concern counts exclude coverage-only assessment. They show attention demand on these corpus labels, not false phishing accusations. The modern directory and suffix/Unicode data also differ from those available when old messages arrived.

Adding six operator references changes some baseline counts because they consume the existing 32-comparison budget and can displace image or directory comparisons. More references can therefore lose useful comparisons. Reference discovery and sibling-domain concerns remain open in issues [27](../../docs/planning/issues/27-evaluate-reference-coverage.md) and [28](../../docs/planning/issues/28-evaluate-sibling-reference-policy.md).

Separately, the 19,626 dnstwist variants yield 11,342 comparator matches versus 865 before, with zero lost matches. All 37 transpositions match. The new kinds appear 41 times for character swaps and 10,730 times for folded labels; these counts can overlap older observations. Generated lookalikes are mechanism controls, not verified malicious domains or a representative accuracy benchmark.

## Sources and handling

- [SpamAssassin public corpus](https://spamassassin.apache.org/old/publiccorpus/readme.html): easy and hard ham from the `20030228` archives. Some addresses and hosts were changed by the publisher. Copyright remains with the original senders. The mail stays local and is not redistributed. The publisher explicitly warns against live-system replay and present-day blacklist lookups.
- [José Nazario's phishing corpus](https://monkey.org/~jose/phishing/README.txt), `phishing-2025`: hand-classified mail from one personal inbox. The publisher states [CC BY 4.0](https://monkey.org/~jose/phishing/LICENSE.txt), possible classification errors, and that newer mailboxes are not anonymized. Attribute José Nazario; keep message contents local.
- [MeAJOR](https://arxiv.org/html/2507.17978v2) was not used. Its transformed text data cannot replace preserved MIME, HTML links, and original Unicode for this evaluation.

The Nazario URL is mutable. A changed upstream archive must fail the pinned hash check. Preserve the verified local archive to reproduce this run later. Do not substitute a newer mailbox under the old results, and do not redistribute SpamAssassin message contents.
