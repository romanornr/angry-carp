import assert from 'node:assert/strict';
import { test } from 'node:test';
import { classifyScriptMixing } from './script-mixing.ts';

test('detects incompatible scripts using extensions instead of primary-script counts', () => {
  for (const label of ['pаypäl', 'pаypal', 'payραl', 'аα', 'aհ', 'a𐓘', 'a\u{11f02}',
    'a\u0342', 'αー', 'カ한', 'é東京а', '漢ㄅカ']) {
    assert.equal(classifyScriptMixing(label), 'mixed_script', label);
  }
  for (const label of ['paypal', '123-456', 'päypal', 'cafe\u0301', 'παράδειγμα', 'пример',
    'ひらカナー', '〆切', '漢ㄅ', '한漢', 'α\u0342', '\u{11f02}\u{11f04}', '𓀀𓀁']) {
    assert.equal(classifyScriptMixing(label), 'single_script', label);
  }
  for (const label of ['aー', 'a東京', 'aひらカナー', 'a한漢', 'a漢ㄅ']) {
    assert.equal(classifyScriptMixing(label), 'allowed_mixture', label);
  }
  assert.equal(classifyScriptMixing('a\u0378'), 'unavailable');
});
