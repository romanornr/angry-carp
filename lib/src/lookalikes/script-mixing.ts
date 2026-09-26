/**
 * Checks script compatibility within one Unicode hostname label, without a reference name.
 * Uses UTS #39's augmented script-set intersection and Chromium's highly restrictive
 * script combinations. This does not implement its allowed-character profile or display policy.
 * https://github.com/chromium/chromium/blob/fcd1720dfbc767af07055b27f303207fab09c45d/components/url_formatter/spoof_checks/idn_spoof_checker.cc#L193-L214
 *
 * ICU's getAugmentedScriptSet/getResolvedScriptSetWithout/getRestrictionLevel provide the precedent:
 * https://github.com/unicode-org/icu/blob/049e0d6a420629ac7db77256987d083a563287b5/icu4c/source/i18n/uspoof_impl.cpp#L238-L372
 * Independently implemented with JavaScript property escapes and sets. Common/Inherited
 * Script_Extensions are unrestricted; a primary-script inventory cannot substitute for them.
 */
import aliases from 'unicode-property-value-aliases-ecmascript';
import * as v from 'valibot';

// The dependency supplies complete Unicode 17 script names; the runtime supplies character membership.
// https://github.com/mathiasbynens/unicode-property-value-aliases-ecmascript/blob/8ba88a915d394c4738fdf0582a2aa7bf5c6fe47f/index.js
const properties = v.parse(v.map(v.string(), v.unknown()), aliases);
const names = new Set(v.parse(v.map(v.string(), v.string()), properties.get('Script')).values());
const scripts = new Map<string, RegExp>();
for (const name of names) {
  if (['Common', 'Inherited', 'Unknown'].includes(name)) continue;
  try { scripts.set(name, new RegExp(`^\\p{Script_Extensions=${name}}$`, 'u')); }
  catch (error) {
    // Node versions can predate a script name. Unrecognized characters yield unavailable below.
    if (!(error instanceof SyntaxError)) throw error;
  }
}
const writingSystems = new Map([
  ['Jpan', ['Han', 'Hiragana', 'Katakana']],
  ['Kore', ['Han', 'Hangul']],
  ['Hanb', ['Han', 'Bopomofo']],
]);

export function classifyScriptMixing(label: string): 'single_script' | 'allowed_mixture' | 'mixed_script' | 'unavailable' {
  let resolved = new Set([...scripts.keys(), ...writingSystems.keys()]);
  let withoutLatin = new Set(resolved);
  for (const character of label) {
    if (/[\p{Script_Extensions=Common}\p{Script_Extensions=Inherited}]/u.test(character)) continue;
    const augmented = new Set<string>();
    for (const [name, pattern] of scripts) {
      if (pattern.test(character)) augmented.add(name);
    }
    if (augmented.size === 0) return 'unavailable';
    for (const [system, members] of writingSystems) {
      if (members.some((script) => augmented.has(script))) augmented.add(system);
    }
    resolved = resolved.intersection(augmented);
    if (!augmented.has('Latin')) withoutLatin = withoutLatin.intersection(augmented);
  }
  if (resolved.size > 0) return 'single_script';
  if ([...writingSystems.keys()].some((system) => withoutLatin.has(system))) return 'allowed_mixture';
  return 'mixed_script';
}
