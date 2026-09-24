"""Download pinned public corpora and write local-only JSONL for benchmark-mail.mjs."""
import base64
from contextlib import closing
import hashlib
import json
import mailbox
from pathlib import Path
import tarfile
import urllib.request

root = Path(__file__).resolve().parent / 'generated' / 'corpora'
root.mkdir(parents=True, exist_ok=True)
sources = [
    ('easy_ham', 'https://spamassassin.apache.org/old/publiccorpus/20030228_easy_ham.tar.bz2', 'easy_ham.tar.bz2', '2b7b65904bcfcc31d2b5f51946f2d261370b257402cbbd62930b46ab83367438'),
    ('hard_ham', 'https://spamassassin.apache.org/old/publiccorpus/20030228_hard_ham.tar.bz2', 'hard_ham.tar.bz2', 'ce2ce67880643dbde65ea7f85bffbfe4417349c4bd80b6b0de56262ae6b0a9c9'),
    ('phishing_2025', 'https://monkey.org/~jose/phishing/phishing-2025', 'phishing-2025.mbox', 'f1fa7e0fe35c9a16f36d9aa20ade7e1d3908d1d0c1d917b8c53c8aa799ec1c8f'),
]

prepared = root / 'messages.jsonl.tmp'
with prepared.open('w') as output:
    for corpus, url, name, expected in sources:
        archive = root / name
        if not archive.exists():
            urllib.request.urlretrieve(url, archive)
        actual = hashlib.sha256(archive.read_bytes()).hexdigest()
        if actual != expected:
            raise ValueError(f'{name}: expected {expected}, got {actual}')
        if name.endswith('.mbox'):
            # Standard-library mbox framing excludes the envelope separator and normalizes line endings.
            with closing(mailbox.mbox(archive, create=False)) as messages:
                bodies = [messages.get_bytes(key) for key in messages.iterkeys()]
        else:
            with tarfile.open(archive) as messages:
                bodies = [messages.extractfile(member).read() for member in sorted(messages.getmembers(), key=lambda m: m.name)
                          if member.isfile() and Path(member.name).name[:1].isdigit()]
        for body in bodies:
            output.write(json.dumps({'corpus': corpus, 'sha256': hashlib.sha256(body).hexdigest(),
                                     'base64': base64.b64encode(body).decode('ascii')}, separators=(',', ':')) + '\n')
        print(f'{corpus}: {len(bodies)} messages, archive sha256 {actual}')
prepared.replace(root / 'messages.jsonl')
