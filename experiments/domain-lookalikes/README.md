# Domain-lookalike evaluation

These offline scripts support the [domain-impersonation research](../../docs/research/domain-impersonation.md). They compare mechanisms on synthetic and public inputs, not phishing accuracy or mailbox workload. The proposed rules in `evaluate.mjs` are historical research variants, not the shipping comparator.

## Reproduce current routing

From the repository root with installed workspace dependencies and Node 24:

```sh
node experiments/domain-lookalikes/reproduce-routing.mjs
```

This runs the current analyzer with synthetic DNS/RDAP responses. It checks embedded domains, a known confusable, a genuine child domain, directory reference selection, and absent references. No network or model call occurs. `--require-detection` intentionally fails while the `coinbsae.com` transposition remains undetected.

## Reproduce the historical comparison

The input corpus, frozen comparator, and output are generated under ignored `generated/`. The comparator comes from Git history, not a second maintained implementation. Run from the repository root:

```sh
mkdir -p experiments/domain-lookalikes/generated/baseline
git show 6b009476685fdb9b8accac6647f6ca75fe80102b:lib/src/lookalikes/compare-domains.ts > experiments/domain-lookalikes/generated/baseline/compare-domains-6b00947.ts
```

Create a temporary checkout of [dnstwist](https://github.com/elceef/dnstwist) and a Python environment for generation:

```sh
lookalike_tmp=$(mktemp -d)
git clone https://github.com/elceef/dnstwist.git "$lookalike_tmp/dnstwist"
git -C "$lookalike_tmp/dnstwist" checkout 341395377f40761fe4152f43fd18eea757b6069a
python3 -m venv "$lookalike_tmp/venv"
"$lookalike_tmp/venv/bin/python" -m pip install idna==3.20
"$lookalike_tmp/venv/bin/python" experiments/domain-lookalikes/generate-dnstwist.py "$lookalike_tmp/dnstwist" experiments/domain-lookalikes/generated/dnstwist-permutations.json
node experiments/domain-lookalikes/evaluate.mjs > experiments/domain-lookalikes/generated/results.json
sha256sum experiments/domain-lookalikes/generated/results.json
```

The checkout and dependency installation use the network. Generation and evaluation do not. The generator requires the pinned dnstwist revision. The optional `tld` package was absent in the recorded run; its fallback handles the six `.com` and `.io` references. Python 3.14.7 and `idna` 3.20 generated the recorded corpus. Evaluation takes about 25 seconds on the original machine.

## Recorded inputs and output

| Artifact | SHA-256 |
| --- | --- |
| Frozen comparator from `6b00947` | `9a531f9ba4da786f0d0b9aae66a0993a524a60d215cb483b0ca4929eece9e06d` |
| Generated corpus, 19,626 permutations | `11e2888b3ceba39b89264740ea8f5d7d69f10169936436cea534be22b9f8f50f` |
| Repository `package-lock.json` | `808ebe4987bbad318d741abb3809ce04e955b9ad67b6a39f0acc4f0a252f6fd1` |
| `lib/reference-data/2fa-directory/v3.json` | `e09405bff4ea4f0ce5628371f89e69cea2a553cca95db48c4d39e423618c66d4` |
| Generated results | `2805da2a544a80d4d06eabd8ec14ee676bef342cc28e91067cafca18bf1d338b` |

The recorded runtime was Node `v24.15.0`, ICU 78.2, `tldts` 7.4.14, `unicode-spoofing` 0.4.0 with Unicode 17 data, and Valibot 1.5.0. Runtime and dependency changes can change the output. The evaluator checks the baseline hash before use.

`dnstwistCoverage` reports mechanism matches by generator. `directoryPairs` counts ordered lexical collisions, not false-positive rates. `currentLogicCrossCheck` validates the optimized baseline calculation against real comparisons. `directoryEmbedding` tests primary and additional directory hosts. `cases` retains the named controls and corrected draft variants. The `current` fields always mean the frozen baseline, never the working tree.
