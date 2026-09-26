import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseAuthenticationResults, parseDkimSignature, MAX_AUTH_HEADER_BYTES } from './authentication-headers.ts';

test('preserves reported methods, duplicate properties and quoted delimiters', () => {
  const result = parseAuthenticationResults('mx.example (outer (inner;)); dkim=pass reason="good; signature" ' +
    'header.d=one.example header.d=two.example; dkim=fail header.s=selector; spf=pass smtp.mailfrom=example.com');
  assert.equal(result.kind, 'reported_results');
  if (result.kind !== 'reported_results') assert.fail('Expected claims');
  assert.deepEqual(result.results.map(({ method, result, reason, properties }) => ({ method, result, reason, properties })), [
    { method: 'dkim', result: 'pass', reason: 'good; signature', properties: [
      { type: 'header', name: 'd', rawValue: 'one.example' }, { type: 'header', name: 'd', rawValue: 'two.example' },
    ] },
    { method: 'dkim', result: 'fail', reason: null, properties: [{ type: 'header', name: 's', rawValue: 'selector' }] },
    { method: 'spf', result: 'pass', reason: null, properties: [{ type: 'smtp', name: 'mailfrom', rawValue: 'example.com' }] },
  ]);
});

test('retains SMTPUTF8, quoted local parts with CFWS and opaque invalid identities', () => {
  for (const rawValue of ['δοκιμή@example.com', '"a b" (comment) @example.com', 'a@@example.com']) {
    const result = parseAuthenticationResults(`"mx.exämple.com"; spf=pass smtp.mailfrom=${rawValue}`);
    if (result.kind !== 'reported_results') assert.fail('Expected reported claim');
    assert.equal(result.authservId, 'mx.exämple.com');
    assert.deepEqual(result.results[0].properties, [{ type: 'smtp', name: 'mailfrom', rawValue }]);
  }
});

test('distinguishes none, unsupported versions and parse limitations', () => {
  assert.deepEqual(parseAuthenticationResults('mx.example; none'), {
    kind: 'reported_results', authservId: 'mx.example', version: '1', results: [],
  });
  assert.deepEqual(parseAuthenticationResults('mx.example 2; dkim=pass'), { kind: 'unparsed', reason: 'unsupported_version' });
  const result = parseAuthenticationResults('mx.example; dkim/2=pass; spf=fail');
  if (result.kind !== 'reported_results') assert.fail('Expected claims');
  assert.deepEqual(result.results.map(({ interpretation }) => interpretation), ['unsupported_version', 'supported']);

  for (const value of ['mx.example; dkim=pass (unterminated', 'mx.example; dkim=pass reason="unfinished',
    'mx.example; none; spf=pass', 'mx.example; dkim=pass\nInjected: bad']) {
    assert.deepEqual(parseAuthenticationResults(value), { kind: 'unparsed', reason: 'invalid_syntax' });
  }

  assert.deepEqual(parseAuthenticationResults('x'.repeat(MAX_AUTH_HEADER_BYTES + 1)), { kind: 'unparsed', reason: 'header_limit' });
  assert.deepEqual(parseAuthenticationResults('mx.example' + '('.repeat(33)), { kind: 'unparsed', reason: 'nesting_limit' });
});

test('DKIM tags retain case, empty values, folding and duplicate names without verifying signatures', () => {
  assert.deepEqual(parseDkimSignature('v=1; d=one.example;\r\n\ts=selector; d=two.example; b=; X=a b;'), {
    kind: 'signature_tags', tags: [
      { name: 'v', value: '1' }, { name: 'd', value: 'one.example' }, { name: 's', value: 'selector' },
      { name: 'd', value: 'two.example' }, { name: 'b', value: '' }, { name: 'X', value: 'a b' },
    ], duplicateTags: ['d'],
  });
  assert.deepEqual(parseDkimSignature('d=example.com;;s=a'), { kind: 'unparsed', reason: 'invalid_syntax' });
});

test('folded production values, strict vendor-extension policy and both readers enforce bounds', () => {
  const folded = parseAuthenticationResults('mx.example;\r\n\tdkim=pass header.d=example.com;\r\n spf=pass smtp.mailfrom="alice" (note) @ example.com');
  assert.equal(folded.kind, 'reported_results');
  if (folded.kind === 'reported_results') assert.equal(folded.results[1].properties[0].rawValue, '"alice" (note) @ example.com');
  assert.deepEqual(parseAuthenticationResults('mx.example; dmarc=pass action=none'), { kind: 'unparsed', reason: 'invalid_syntax' });
  assert.deepEqual(parseAuthenticationResults('mx.example; dkim=pass;'), { kind: 'unparsed', reason: 'invalid_syntax' });
  assert.deepEqual(parseAuthenticationResults('x' + ';d=p'.repeat(129)), { kind: 'unparsed', reason: 'entry_limit' });
  assert.deepEqual(parseDkimSignature('a=b;'.repeat(129)), { kind: 'unparsed', reason: 'entry_limit' });
  assert.deepEqual(parseDkimSignature('a=' + 'b'.repeat(65536)), { kind: 'unparsed', reason: 'header_limit' });
});
