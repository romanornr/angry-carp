"""Generate dnstwist permutations for the lookalike evaluation.

Usage: python3 generate-dnstwist.py <dnstwist checkout> <output json>
The checkout must be at the pinned commit. Output is sorted so its hash is stable.
"""
import json
import subprocess
import sys

PINNED = '341395377f40761fe4152f43fd18eea757b6069a'
REFERENCES = ['coinbase.com', 'paypal.com', 'ledger.com', 'metamask.io', 'microsoft.com', 'binance.com']
DICTIONARY = ['login', 'secure', 'support', 'verify', 'app']

checkout, output = sys.argv[1], sys.argv[2]
head = subprocess.run(['git', '-C', checkout, 'rev-parse', 'HEAD'], capture_output=True, text=True, check=True).stdout.strip()
if head != PINNED:
    sys.exit(f'dnstwist checkout is at {head}, expected {PINNED}')
sys.path.insert(0, checkout)
import dnstwist  # noqa: E402

result = {}
for reference in REFERENCES:
    fuzzer = dnstwist.Fuzzer(reference, dictionary=DICTIONARY)
    fuzzer.generate()
    result[reference] = sorted((p['fuzzer'], p['domain']) for p in fuzzer.domains if p['fuzzer'] != '*original')

with open(output, 'w') as file:
    json.dump(result, file, indent=0, sort_keys=True)
    file.write('\n')
