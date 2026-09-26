import assert from 'node:assert/strict';
import { test } from 'node:test';
import { reduceUrlForDisclosure, type RecipientIdentity, type ReducedUrl, type UrlCut } from './reduce-url-for-disclosure.ts';

const recipients: readonly RecipientIdentity[] = [{ address: 'jane.doe@example.com', displayName: 'Jane Doe' }];

for (const segment of [
  'jane.doe@example.com', 'JANE.DOE@EXAMPLE.COM', 'jane.doe%40example.com',
  'jane.doe%2540example.com', '%256a%2561%256e%2565%252e%2564%256f%2565%2540example.com',
  'jane.doe', 'prefix-jane.doe-suffix', 'jane-doe', 'JaneDoe', 'jane_doe', 'jane+doe', 'jane%20doe',
  'jane%2520doe', 'bad%escape-%6a%61%6e%65.doe', '%ff%6a%61%6e%65.doe',
]) {
  test(`cuts the first identifying path segment: ${segment}`, () => {
    assert.deepEqual(reduceUrlForDisclosure(`https://phish.example/login/${segment}/next`, recipients), {
      kind: 'disclosable', url: 'https://phish.example/login/',
      cuts: [{ kind: 'path_cut', cause: 'identifier', segmentIndex: 1 }],
    });
  });
}

for (const segment of [
  'amFuZS5kb2VAZXhhbXBsZS5jb20=', // Standard base64 of jane.doe@example.com.
  'amFuZS5kb2VAZXhhbXBsZS5jb20', // URL-safe base64 without padding.
  '6a616e652e646f65406578616d706c652e636f6d',
  'xICcxSqs', '%78%49%43%63%78%53%71%73',
  'abcdefab-abcd-abcd-abcd-abcdefabcdef', 'abcdefabcdefabcd', 'ABCDEFABCDEFABCD',
  '123456', 'invoice-123456-paid', 'abcdefg1', 'aBcDefgh', 'abcde_1=', 'ab-cd+1~',
]) {
  test(`cuts the first random-looking path segment: ${segment}`, () => {
    assert.deepEqual(reduceUrlForDisclosure(`https://phish.example/login/${segment}/next`, recipients), {
      kind: 'disclosable', url: 'https://phish.example/login/',
      cuts: [{ kind: 'path_cut', cause: 'random', segmentIndex: 1 }],
    });
  });
}

test('recognizes both base64 alphabets when the encodings differ', () => {
  for (const segment of ['Pz8/QGV4YW1wbGUuY29t', 'Pz8_QGV4YW1wbGUuY29t', 'Pj4+QGV4YW1wbGUuY29t', 'Pj4-QGV4YW1wbGUuY29t']) {
    assert.deepEqual(reduceUrlForDisclosure(`https://phish.example/${encodeURIComponent(segment)}/next`, []), {
      kind: 'disclosable', url: 'https://phish.example/',
      cuts: [{ kind: 'path_cut', cause: 'random', segmentIndex: 0 }],
    });
  }
});

test('removes userinfo, query, and fragment in order without retaining their values', () => {
  assert.deepEqual(reduceUrlForDisclosure('http://jane.doe%40example.com:secret@phish.example:8080/login?x=encrypted#jane.doe@example.com', recipients), {
    kind: 'disclosable', url: 'http://phish.example:8080/login',
    cuts: [{ kind: 'userinfo_removed' }, { kind: 'query_removed' }, { kind: 'fragment_removed' }],
  });
  for (const [suffix, cuts] of [
    ['?email=jane.doe@example.com', [{ kind: 'query_removed' }]],
    ['#jane.doe@example.com', [{ kind: 'fragment_removed' }]],
    ['?', [{ kind: 'query_removed' }]], ['#', [{ kind: 'fragment_removed' }]],
    ['?#', [{ kind: 'query_removed' }, { kind: 'fragment_removed' }]],
    ['#fragment?not-a-query', [{ kind: 'fragment_removed' }]],
  ] satisfies [string, UrlCut[]][]) {
    assert.deepEqual(reduceUrlForDisclosure(`https://phish.example/login${suffix}`, recipients), {
      kind: 'disclosable', url: 'https://phish.example/login', cuts,
    });
  }
  assert.deepEqual(reduceUrlForDisclosure('https://:secret@phish.example/', []), {
    kind: 'disclosable', url: 'https://phish.example/', cuts: [{ kind: 'userinfo_removed' }],
  });
});

test('removes all subdomains when any label matches, preserving private tenants and ports', () => {
  for (const [input, url, cause] of [
    ['https://jane-doe.phish.example/', 'https://phish.example/', 'identifier'],
    ['https://www.jane-doe.phish.example:8443/login', 'https://phish.example:8443/login', 'identifier'],
    ['https://ab12cdef.phish.example/', 'https://phish.example/', 'random'],
    ['https://ab12cdef.phish.example./', 'https://phish.example./', 'random'],
    ['https://jane-doe.tenant.pages.dev/', 'https://tenant.pages.dev/', 'identifier'],
    ['https://ab12cdef.tenant.github.io/', 'https://tenant.github.io/', 'random'],
  ] satisfies [string, string, 'identifier' | 'random'][]) {
    assert.deepEqual(reduceUrlForDisclosure(input, recipients), {
      kind: 'disclosable', url, cuts: [{ kind: 'subdomain_removed', cause }],
    });
  }
  assert.deepEqual(reduceUrlForDisclosure('https://jane-doe.pages.dev/', []), {
    kind: 'disclosable', url: 'https://jane-doe.pages.dev/', cuts: [],
  });
});

test('withholds identifiers that survive in registrable domains, private tenants, or across components', () => {
  for (const input of [
    'https://jane-doe.pages.dev/', 'https://jane-doe.com/', 'https://www.jane-doe.com/?secret',
    'https://jane.doe.phish.example/', 'https://jane-doe/',
  ]) {
    assert.deepEqual(reduceUrlForDisclosure(input, recipients), { kind: 'withheld', reason: 'identifier_remains' });
  }
  assert.deepEqual(reduceUrlForDisclosure('https://phish.example/abc/def', [{ address: 'abc/def@example.com' }]), {
    kind: 'withheld', reason: 'identifier_remains',
  });
});

test('preserves ordinary paths, IP literals, suffix-only hosts, IDNs, and WHATWG serialization', () => {
  for (const [input, url] of [
    ['https://phish.example/index.html', 'https://phish.example/index.html'],
    ['https://phish.example/wp-content/login', 'https://phish.example/wp-content/login'],
    ['http://192.0.2.1:8080/login', 'http://192.0.2.1:8080/login'],
    ['https://[2001:db8::1]:8443/login', 'https://[2001:db8::1]:8443/login'],
    ['https://münchen.de/login', 'https://xn--mnchen-3ya.de/login'],
    ['HTTPS://PHISH.EXAMPLE:443', 'https://phish.example/'],
    ['https://host/login', 'https://host/login'], ['https://co.uk/', 'https://co.uk/'],
    ['https://pages.dev/', 'https://pages.dev/'],
    ['https://phish.example/%77p-content//%69ndex.html', 'https://phish.example/%77p-content//%69ndex.html'],
    ['https://phish.example/bad%escape', 'https://phish.example/bad%escape'],
  ]) {
    assert.deepEqual(reduceUrlForDisclosure(input, recipients), { kind: 'disclosable', url, cuts: [] });
  }
});

test('returns the root when the first segment is cut and retains only original prefix segments', () => {
  for (const [input, url, segmentIndex] of [
    ['http://host:8080/jane.doe/next', 'http://host:8080/', 0],
    ['https://phish.example/%77p-content//jane.doe/next', 'https://phish.example/%77p-content//', 2],
    ['https://phish.example/safe%2Fjane.doe/next', 'https://phish.example/', 0],
    ['https://phish.example/%6cogin/jane.doe/xICcxSqs', 'https://phish.example/%6cogin/', 1],
  ] satisfies [string, string, number][]) {
    assert.deepEqual(reduceUrlForDisclosure(input, recipients), {
      kind: 'disclosable', url, cuts: [{ kind: 'path_cut', cause: 'identifier', segmentIndex }],
    });
  }
});

test('matches full names with mixed separators and treats recipient text literally', () => {
  for (const [segment, recipient] of [
    ['jane_mary-doe', { address: 'user@example.com', displayName: ' Jane  Mary\tDoe ' }],
    ['A(B)C', { address: 'a(b)c@example.com' }],
    ['%C3%A9lodie-martin', { address: 'user@example.com', displayName: 'Élodie Martin' }],
    ['SECOND', { address: 'SECOND@example.com' }],
  ] satisfies [string, RecipientIdentity][]) {
    assert.deepEqual(reduceUrlForDisclosure(`https://phish.example/${segment}`, [...recipients, recipient]), {
      kind: 'disclosable', url: 'https://phish.example/',
      cuts: [{ kind: 'path_cut', cause: 'identifier', segmentIndex: 0 }],
    });
  }
});

test('matches UTF-8 identities whose bytes appear at different percent-encoding depths', () => {
  for (const segment of ['%C3%25A9lodie', '%25C3%A9lodie', '%25C3%2525A9lodie', '%C3%25A9lodie%2540example.com']) {
    assert.deepEqual(reduceUrlForDisclosure(`https://phish.example/${segment}/next`, [{ address: 'élodie@example.com' }]), {
      kind: 'disclosable', url: 'https://phish.example/',
      cuts: [{ kind: 'path_cut', cause: 'identifier', segmentIndex: 0 }],
    });
  }
  for (let firstDepth = 0; firstDepth < 4; firstDepth++) {
    for (let secondDepth = 0; secondDepth < 4; secondDepth++) {
      const segment = `%${'25'.repeat(firstDepth)}C3%${'25'.repeat(secondDepth)}A9lodie`;
      assert.deepEqual(reduceUrlForDisclosure(`https://phish.example/${segment}`, [{ address: 'élodie@example.com' }]), {
        kind: 'disclosable', url: 'https://phish.example/',
        cuts: [{ kind: 'path_cut', cause: 'identifier', segmentIndex: 0 }],
      });
    }
  }
});

test('decodes to stability even beyond the Safe Browsing implementation pass limit', () => {
  const input = `https://phish.example/%${'25'.repeat(1024)}6aane.doe/next`;
  assert.deepEqual(reduceUrlForDisclosure(input, recipients), {
    kind: 'disclosable', url: 'https://phish.example/',
    cuts: [{ kind: 'path_cut', cause: 'identifier', segmentIndex: 0 }],
  });
});

test('ignores short identifiers and a first name alone, retaining below-threshold tokens', () => {
  for (const path of ['jane', 'doe', 'ab', 'abcdef1', 'abcdefabcdefabc', '12345', 'abcdefgh', 'aBcdefgh', 'aBcD!efgh']) {
    const input = `https://phish.example/${path}`;
    assert.deepEqual(reduceUrlForDisclosure(input, [...recipients, { address: 'ab@example.com', displayName: 'Jane' }]), {
      kind: 'disclosable', url: input, cuts: [],
    });
  }
  assert.deepEqual(reduceUrlForDisclosure('https://phish.example/abc', [{ address: 'abc@example.com' }]), {
    kind: 'disclosable', url: 'https://phish.example/', cuts: [{ kind: 'path_cut', cause: 'identifier', segmentIndex: 0 }],
  });
});

test('withholds malformed URLs and unsupported schemes without disclosing the input', () => {
  for (const input of ['', 'not a url', '/relative', 'https://', 'https://[broken]/', 'https://host:99999/']) {
    assert.deepEqual(reduceUrlForDisclosure(input, recipients), { kind: 'withheld', reason: 'invalid_url' });
  }
  for (const input of ['mailto:jane.doe@example.com', 'ftp://phish.example/', 'data:text/plain,jane.doe']) {
    assert.deepEqual(reduceUrlForDisclosure(input, recipients), { kind: 'withheld', reason: 'unsupported_scheme' });
  }
});

test('records combined cuts in algorithm order and reducing the output again leaves the URL unchanged', () => {
  const input = 'https://user:password@jane-doe.phish.example/login/xICcxSqs/next?secret#private';
  const expected: ReducedUrl = {
    kind: 'disclosable', url: 'https://phish.example/login/', cuts: [
      { kind: 'userinfo_removed' }, { kind: 'query_removed' }, { kind: 'fragment_removed' },
      { kind: 'subdomain_removed', cause: 'identifier' }, { kind: 'path_cut', cause: 'random', segmentIndex: 1 },
    ],
  };
  assert.deepEqual(reduceUrlForDisclosure(input, recipients), expected);
  assert.deepEqual(reduceUrlForDisclosure(expected.url, recipients), {
    kind: 'disclosable', url: 'https://phish.example/login/', cuts: [],
  });
  assert.deepEqual(reduceUrlForDisclosure(input, recipients), expected);
});

test('generated recipient placements never retain an identifier in any returned string', () => {
  const identities = Object.freeze([Object.freeze({ address: 'jane.doe@example.com', displayName: 'Jane Doe' })]);
  const identifiers = ['jane.doe@example.com', 'jane.doe', 'janedoe', 'jane.doe', 'jane-doe', 'jane_doe', 'jane+doe', 'jane doe'];
  for (const identifier of identifiers) {
    let encoded = identifier.toUpperCase();
    for (let depth = 0; depth < 5; depth++) {
      for (const input of [
        `https://phish.example/login/${encoded}/next`, `https://phish.example/?email=${encoded}`,
        `https://phish.example/#${encoded}`, `https://${encodeURIComponent(encoded)}@phish.example/`,
        `https://${encoded}.phish.example/`, `https://${encoded}.com/`,
      ]) {
        const result = reduceUrlForDisclosure(input, identities);
        assert.ok(result.kind === 'disclosable' || result.kind === 'withheld');
        const serialized = decodeURIComponent(JSON.stringify(result)).toLowerCase();
        for (const needle of identifiers) assert.equal(serialized.includes(needle), false);
        if (result.kind === 'disclosable') {
          assert.deepEqual(reduceUrlForDisclosure(result.url, identities), { kind: 'disclosable', url: result.url, cuts: [] });
        }
      }
      encoded = encodeURIComponent(encoded);
    }
  }
});
