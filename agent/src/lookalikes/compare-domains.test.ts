import assert from 'node:assert/strict';
import { test } from 'node:test';
import * as v from 'valibot';
import { compareDomains, domainComparisonSchema } from './compare-domains.ts';

test('identifies reference labels with extra text without assigning a verdict', () => {
  for (const [referenceDomain, observedDomain, prefix, suffix] of [
    ['bifrostwallet.com', 'bifrostwalletapps.download', '', 'apps'],
    ['apple.com', 'applebees.com', '', 'bees'],
    ['paypal.com', 'my-paypal-support.com', 'my-', '-support'],
    ['hp.com', 'php.com', 'p', ''],
  ]) {
    const result = compareDomains(v.parse(domainComparisonSchema, { referenceDomain, observedDomain }));
    if (result.kind !== 'compared') assert.fail('Expected a domain comparison');
    assert.deepEqual({
      relationship: result.relationship,
      skeletonEqual: result.skeletonEqual,
      referenceLabelContained: result.referenceLabelContained,
    }, {
      relationship: 'different_domain', skeletonEqual: false,
      referenceLabelContained: { prefix, suffix },
    });
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
    if (result.kind !== 'compared') assert.fail('Expected a domain comparison');
    assert.equal(result.skeletonEqual, true);
    assert.equal(result.relationship, 'different_domain');
    assert.deepEqual(result.observed.labels[0], { text: label, scripts });
    assert.equal(result.confusablesUnicodeVersion, '17.0.0');
  }
});

test('distinguishes literal and confusable containment in a combined lookalike', () => {
  const result = compareDomains(v.parse(domainComparisonSchema, {
    referenceDomain: 'bifrostwallet.com', observedDomain: 'b\u0456frostwalletapps.download',
  }));
  if (result.kind !== 'compared') assert.fail('Expected combined lookalike comparison');
  assert.deepEqual({
    skeletonEqual: result.skeletonEqual,
    literal: result.referenceLabelContained,
    skeleton: result.referenceSkeletonContained,
  }, { skeletonEqual: false, literal: null, skeleton: { prefix: '', suffix: 'apps' } });
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
    assert.deepEqual({ domain: result.observed.registrableDomain, label: result.observedLabel, relationship: result.relationship }, {
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
    if (result.kind !== 'compared') assert.fail('Expected multilingual domain comparison');
    assert.equal(result.skeletonEqual, false);
    assert.equal(result.referenceLabelContained, null);
    assert.deepEqual(result.observed.labels[0], { text: label, scripts });
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
