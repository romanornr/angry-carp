import assert from 'node:assert/strict';
import { test } from 'node:test';
import * as v from 'valibot';
import { compareDomains, domainComparisonSchema, inspectDomain, domainNameSchema } from './compare-domains.ts';

test('inspects Unicode and punycode labels independently of comparison references', () => {
  for (const input of ['pаypäl.com', 'xn--pypl-noa571c.com']) {
    const result = inspectDomain(v.parse(domainNameSchema, input));
    if (result.kind !== 'parsed') assert.fail('Expected a parsed domain');
    assert.equal(result.ascii, 'xn--pypl-noa571c.com');
    assert.deepEqual(result.labels, [
      { text: 'pаypäl', scripts: ['Cyrillic', 'Latin'], scriptMixing: 'mixed_script' },
      { text: 'com', scripts: ['Latin'], scriptMixing: 'single_script' },
    ]);
    assert.match(result.scriptUnicodeVersion ?? '', /^\d+\.\d+/);
  }

  assert.equal(inspectDomain(v.parse(domainNameSchema, 'bad..com')).kind, 'invalid');
  assert.equal(v.safeParse(domainNameSchema, 'https://example.com').success, false);
});

test('records embedded reference domains at dot and hyphen boundaries', () => {
  for (const [referenceDomain, observedDomain, text, utf16Index] of [
    ['paypal.com', 'paypal.com.attacker.net', 'paypal.com', 0],
    ['paypal.com', 'secure.paypal-com.attacker.net', 'paypal-com', 7],
    ['paypal.com', '𐐨.paypal.com.attacker.net', 'paypal.com', 3],
    ['paypal.com', 'paypal-com.paypal.com.attacker.net', 'paypal-com', 0],
    ['paypal.com', 'paypal.com-login.net', 'paypal.com', 0],
    ['paypal.com', 'pаypal.com.attacker.net', 'pаypal.com', 0],
    ['paypal.com', 'xn--pypal-4ve.com.attacker.net', 'pаypal.com', 0],
    ['PayPal.COM.', 'PAYPAL.COM.ATTACKER.NET.', 'paypal.com', 0],
    ['ing.com', 'ing.com.attacker.net', 'ing.com', 0],
    ['example.co.uk', 'example-co-uk.attacker.net', 'example-co-uk', 0],
    ['my-brand.com', 'my-brand.com.attacker.net', 'my-brand.com', 0],
    ['my-brand.com', 'my.brand-com.attacker.net', 'my.brand-com', 0],
    ['paypal.github.io', 'paypal-github-io.attacker.net', 'paypal-github-io', 0],
  ] satisfies [string, string, string, number][]) {
    const result = compareDomains(v.parse(domainComparisonSchema, { referenceDomain, observedDomain }));
    if (result.kind !== 'compared' || result.relationship !== 'different_domain') assert.fail('Expected different domains');
    assert.deepEqual(result.resemblance, [{ kind: 'registrable_domain_embedded', text, utf16Index }]);
  }
});

test('embedding requires the whole reference domain and preserves genuine relationships', () => {
  for (const observedDomain of ['paypal.attacker.net', 'paypal.zendesk.com', 'paypal.okta.com',
    'paypal.my.salesforce.com', 'paypal.atlassian.net', 'notpaypal.com.attacker.net',
    'paypal.company.attacker.net', 'paypal--com.attacker.net', 'com.paypal.attacker.net',
    'paypal.com', 'mail.paypal.com']) {
    const result = compareDomains(v.parse(domainComparisonSchema, { referenceDomain: 'paypal.com', observedDomain }));
    if (result.kind !== 'compared') assert.fail('Expected a comparison');
    if (result.relationship === 'different_domain') assert.deepEqual(result.resemblance, [], observedDomain);
    else assert.equal('resemblance' in result, false);
  }
});

test('same-registration siblings and parents do not gain embedding observations', () => {
  for (const observedDomain of ['www.paypal.com', 'paypal.com']) {
    const result = compareDomains(v.parse(domainComparisonSchema, { referenceDomain: 'images.paypal.com', observedDomain }));
    if (result.kind !== 'compared' || result.relationship !== 'different_domain') assert.fail('Expected different hostnames');
    assert.deepEqual(result.resemblance, [{ kind: 'confusable_label' }]);
  }
});

test('identifies reference labels with extra text without assigning a verdict', () => {
  for (const [referenceDomain, observedDomain, prefix, suffix] of [
    ['bifrostwallet.com', 'bifrostwalletapps.download', '', 'apps'],
    ['apple.com', 'applebees.com', '', 'bees'],
    ['paypal.com', 'my-paypal-support.com', 'my-', '-support'],
    ['hp.com', 'php.com', 'p', ''],
  ]) {
    const result = compareDomains(v.parse(domainComparisonSchema, { referenceDomain, observedDomain }));
    if (result.kind !== 'compared' || result.relationship !== 'different_domain') assert.fail('Expected different domains');
    assert.deepEqual(result.resemblance.filter((match) => match.kind === 'label_contained' && match.form === 'literal'),
      [{ kind: 'label_contained', form: 'literal', prefix, suffix }]);
  }
});

test('recognizes Unicode, whole-script and ASCII lookalikes using the real mapping data', () => {
  for (const [referenceDomain, observedDomain, label, scripts] of [
    ['paypal.com', 'xn--pypal-4ve.com', 'p\u0430ypal', ['Cyrillic', 'Latin']],
    ['apple.com', 'xn--80ak6aa92e.com', '\u0430\u0440\u0440\u04cf\u0435', ['Cyrillic']],
    ['microsoft.com', 'rnicrosoft.com', 'rnicrosoft', ['Latin']],
    ['paypal.com', 'paypa1.com', 'paypa1', ['Common', 'Latin']],
  ] satisfies [string, string, string, string[]][]) {
    const result = compareDomains(v.parse(domainComparisonSchema, { referenceDomain, observedDomain }));
    if (result.kind !== 'compared' || result.relationship !== 'different_domain') assert.fail('Expected different domains');
    assert.deepEqual(result.resemblance, [{ kind: 'confusable_label' }]);
    assert.partialDeepStrictEqual(result.observed.labels[0], { text: label, scripts });
    assert.equal(result.confusablesUnicodeVersion, '17.0.0');
  }
});

test('distinguishes literal and confusable containment in a combined lookalike', () => {
  const result = compareDomains(v.parse(domainComparisonSchema, {
    referenceDomain: 'bifrostwallet.com', observedDomain: 'b\u0456frostwalletapps.download',
  }));
  if (result.kind !== 'compared' || result.relationship !== 'different_domain') assert.fail('Expected different domains');
  assert.deepEqual(result.resemblance, [{ kind: 'label_contained', form: 'skeleton', prefix: '', suffix: 'apps' }]);
});

test('distinguishes IDNA mapping from ordinary domain representations', () => {
  for (const [observedDomain, changedByIdna] of [
    ['xn--pypal-4ve.com', false], ['PayPal.COM.', false],
    ['münchen.de', false], ['ｐａｙｐａｌ.com', true],
  ] satisfies [string, boolean][]) {
    const result = compareDomains(v.parse(domainComparisonSchema, { referenceDomain: 'paypal.com', observedDomain }));
    if (result.kind !== 'compared') assert.fail('Expected IDNA comparison');
    assert.equal(result.observed.changedByIdna, changedByIdna);
    assert.equal(result.observed.escapedInput, observedDomain);
  }
});

test('uses public and private suffix boundaries without confusing embedded official names', () => {
  for (const [referenceDomain, observedDomain, domain, label, relationship] of [
    ['example.com', 'login.example.co.uk', 'example.co.uk', 'example', 'different_domain'],
    ['123.com', '123.net', '123.net', '123', 'different_domain'],
    ['bifrostwallet.com', 'bifrostwallet.github.io', 'bifrostwallet.github.io', 'bifrostwallet', 'different_domain'],
    ['paypal.com', 'paypal.com.attacker.net', 'attacker.net', 'attacker', 'different_domain'],
    ['paypal.com', 'mail.paypal.com', 'paypal.com', 'paypal', 'subdomain_of_reference'],
    ['paypal.com', 'notpaypal.com', 'notpaypal.com', 'notpaypal', 'different_domain'],
    ['paypal.com', 'PayPal.COM.', 'paypal.com', 'paypal', 'same_domain'],
  ]) {
    const result = compareDomains(v.parse(domainComparisonSchema, { referenceDomain, observedDomain }));
    if (result.kind !== 'compared') assert.fail('Expected a domain comparison');
    assert.deepEqual({ domain: result.observed.registrableDomain, label: result.observed.label, relationship: result.relationship }, {
      domain, label, relationship,
    });
  }
});

test('preserves invisible character evidence before IDNA removes or rejects it', () => {
  const result = compareDomains(v.parse(domainComparisonSchema, {
    referenceDomain: 'paypal.com', observedDomain: 'pay\u200bpal.com',
  }));
  if (result.kind !== 'compared') assert.fail('Expected IDNA-normalized comparison');
  assert.deepEqual({
    escapedInput: result.observed.escapedInput,
    formatCharacters: result.observed.formatCharacters,
    ascii: result.observed.ascii,
    changedByIdna: result.observed.changedByIdna,
    relationship: result.relationship,
  }, {
    escapedInput: 'pay\\u200bpal.com',
    formatCharacters: [{ utf16Index: 3, escaped: '\\u200b' }],
    ascii: 'paypal.com', changedByIdna: true, relationship: 'same_domain',
  });
  const invalid = compareDomains(v.parse(domainComparisonSchema, {
    referenceDomain: 'paypal.com', observedDomain: 'pay\u202epal.com',
  }));
  assert.equal(invalid.kind, 'unavailable');
  assert.deepEqual(invalid.observed, {
    escapedInput: 'pay\\u202epal.com',
    formatCharacters: [{ utf16Index: 3, escaped: '\\u202e' }],
    kind: 'invalid', reason: 'invalid_domain',
  });
});

test('retains legitimate multilingual names and unknown scripts without a mixed-script verdict', () => {
  for (const [referenceDomain, observedDomain, label, scripts] of [
    ['muenchen.de', 'xn--mnchen-3ya.de', 'münchen', ['Latin']],
    ['example.com', 'ひらカナー.jp', 'ひらカナー', ['Common', 'Hiragana', 'Katakana']],
    ['example.com', '\u{1e4d0}.com', '\u{1e4d0}', ['Unknown']],
  ] satisfies [string, string, string, string[]][]) {
    const result = compareDomains(v.parse(domainComparisonSchema, { referenceDomain, observedDomain }));
    if (result.kind !== 'compared' || result.relationship !== 'different_domain') assert.fail('Expected different domains');
    assert.deepEqual(result.resemblance, []);
    assert.partialDeepStrictEqual(result.observed.labels[0], { text: label, scripts });
  }
});

test('rejects non-domain tool inputs and distinguishes failed domain interpretation', () => {
  const invalidReference = compareDomains(v.parse(domainComparisonSchema, {
    referenceDomain: 'xn--invalid-.com', observedDomain: 'paypal.com',
  }));
  assert.equal(invalidReference.kind, 'unavailable');
  assert.deepEqual(invalidReference.reference, {
    escapedInput: 'xn--invalid-.com', formatCharacters: [], kind: 'invalid', reason: 'invalid_domain',
  });

  for (const observedDomain of ['https://example.com', 'me@example.com', '../auth.json', 'example.com:443', 'example.com?x', 'example.com#x', 'a%2eb.com', '', 'a'.repeat(1025)]) {
    assert.equal(v.safeParse(domainComparisonSchema, { referenceDomain: 'example.com', observedDomain }).success, false);
  }

  for (const [observedDomain, reason] of [
    ['127.0.0.1', 'invalid_domain'], ['localhost', 'invalid_domain'],
    ['-bad.com', 'invalid_domain'], ['xn--invalid-.com', 'invalid_domain'],
    ['a'.repeat(64) + '.com', 'invalid_domain'], ['example.invalid', 'unknown_suffix'],
  ]) {
    const result = compareDomains(v.parse(domainComparisonSchema, { referenceDomain: 'example.com', observedDomain }));
    assert.equal(result.kind, 'unavailable');
    assert.deepEqual(result.observed, { escapedInput: observedDomain, formatCharacters: [], kind: 'invalid', reason });
  }
});

test('distinguishes character swaps and Latin/Greek/Cyrillic diacritics from broader edits', () => {
  for (const [referenceDomain, observedDomain, expected] of [
    ['coinbase.com', 'coinbsae.com', [{ kind: 'character_swap', form: 'folded' }]],
    ['al1pha.com', 'a1lpha.com', [{ kind: 'confusable_label' }, { kind: 'character_swap', form: 'folded' }]],
    ['microsoft.com', 'imcrosoft.com', [{ kind: 'character_swap', form: 'folded' }]],
    ['example.com', 'exapmle.com', [{ kind: 'character_swap', form: 'folded' }]],
    ['coinbase.com', 'coіnbsae.com', [{ kind: 'character_swap', form: 'skeleton' }]],
    ['𐐨bcdef.com', 'b𐐨cdef.com', [{ kind: 'character_swap', form: 'folded' }]],
    ['café.fr', 'cafe.fr', [{ kind: 'folded_label' }]],
    ['paypal.com', 'päypal.com', [{ kind: 'folded_label' }]],
    ['paypal.com', 'xn--pypal-gra.com', [{ kind: 'folded_label' }]],
    ['caféine.fr', 'cafeine.fr', [{ kind: 'folded_label' }]],
    ['paypal.com', 'paypäl.net', [{ kind: 'folded_label' }]],
    ['paypal.com', 'pаypäl.com', [{ kind: 'folded_label' }]],
    ['paypal.com', 'pаypa\u0308l.com', [{ kind: 'folded_label' }]],
    ['пример.com', 'примёр.com', [{ kind: 'folded_label' }]],
    ['paypal.com', 'payp\u0339al.com', [{ kind: 'folded_label' }]],
    ['paypal.com', 'payp\u033aal.com', [{ kind: 'folded_label' }]],
    ['paypal.com', 'payp\u1ab0al.com', [{ kind: 'folded_label' }]],
    ['example.com', 'éxapmle.com', [{ kind: 'character_swap', form: 'folded' }]],
    ['paypal.com', 'paypal.com', null],
    ['paypal.com', 'mail.paypal.com', null],
    ['münchen.de', 'münchen.de', null],
    ['coinbase.com', 'coibnsae.com', []],
    ['paypal.com', 'paypol.com', []],
    ['paypal.com', 'paypl.com', []],
    ['paypal.com', 'pay-pal.com', []],
    ['meta.com', 'mtea.com', []],
    ['paypal12.com', 'paypal21.com', [{ kind: 'character_swap', form: 'folded' }]],
    ['münchen.de', 'munster.de', []],
    ['παραδειγμα.com', 'παράδειγμα.com', [{ kind: 'folded_label' }]],
  ] satisfies [string, string, unknown[] | null][]) {
    const input = v.parse(domainComparisonSchema, { referenceDomain, observedDomain });
    const result = compareDomains(input);
    if (result.kind !== 'compared') assert.fail('Expected compared domains');

    if (expected === null) {
      assert.equal('resemblance' in result, false);
    } else {
      if (result.relationship !== 'different_domain') assert.fail('Expected different domains');
      assert.deepEqual(result.resemblance, expected, `${referenceDomain} / ${observedDomain}`);
    }
  }
});
