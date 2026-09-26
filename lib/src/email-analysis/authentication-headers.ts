/**
 * Parses supplied Authentication-Results claims and DKIM-Signature tags.
 * The grammars come from RFC 8601 section 2.2 and RFC 6376 section 3.2:
 * https://www.rfc-editor.org/rfc/rfc8601.html#section-2.2
 * https://www.rfc-editor.org/rfc/rfc6376.html#section-3.2
 *
 * Parsing rules:
 * - Track quoted values and nested comments so their separators do not become field boundaries.
 * - Preserve repeated claims as separate entries.
 * - Bound header size, entry count, and comment depth to limit work on malformed input.
 *
 * The result describes what the headers claim.
 * Signature verification and trust in the receiving server require separate checks.
 */
export const MAX_AUTH_HEADER_BYTES = 64 * 1024;
const MAX_ENTRIES = 128;
const MAX_COMMENT_DEPTH = 32;

type ParseFailure = {
  kind: 'unparsed';
  reason: 'header_limit' | 'invalid_syntax' | 'nesting_limit' | 'entry_limit' | 'unsupported_version';
};
type ReportedResult = {
  method: string;
  version: string | null;
  interpretation: 'supported' | 'unsupported_version';
  result: string;
  reason: string | null;
  properties: { type: string; name: string; rawValue: string }[];
};
type AuthenticationResults = ParseFailure | {
  kind: 'reported_results';
  authservId: string;
  version: '1';
  results: ReportedResult[];
};
type DkimFailure = { kind: 'unparsed'; reason: 'header_limit' | 'invalid_syntax' | 'entry_limit' };
type DkimTags = DkimFailure | {
  kind: 'signature_tags';
  tags: { name: string; value: string }[];
  duplicateTags: string[];
};

/** Extracts claims, not authentication. Neither the authserv-id nor a reported pass establishes trust. */
export function parseAuthenticationResults(value: string): AuthenticationResults {
  if (exceedsHeaderLimit(value)) return { kind: 'unparsed', reason: 'header_limit' };
  const reader = new HeaderReader(value);
  try {
    reader.space();
    const authservId = reader.value(false);
    const separated = reader.space();
    if (!reader.at(';')) {
      if (!separated) reader.fail();
      const version = reader.take(/^[0-9]+/);
      if (version !== '1') return { kind: 'unparsed', reason: 'unsupported_version' };
      reader.space();
    }
    const results: ReportedResult[] = [];
    while (!reader.done()) {
      if (results.length >= MAX_ENTRIES) reader.fail('entry_limit');
      reader.expect(';');
      reader.space();
      const method = reader.take(/^[A-Za-z0-9][A-Za-z0-9-]*/).toLowerCase();
      reader.space();
      if (method === 'none') {
        if (results.length || !reader.done()) reader.fail();
        return { kind: 'reported_results', authservId, version: '1', results: [] };
      }
      let version: string | null = null;
      if (reader.at('/')) {
        reader.expect('/');
        reader.space();
        version = reader.take(/^[0-9]+/);
        reader.space();
      }
      reader.expect('=');
      reader.space();
      const result = reader.take(/^[A-Za-z0-9][A-Za-z0-9-]*/).toLowerCase();
      let reason: string | null = null;
      const properties: ReportedResult['properties'] = [];
      while (!reader.done() && !reader.at(';')) {
        if (!reader.space()) reader.fail();
        if (reader.done() || reader.at(';')) break;
        if (properties.length >= MAX_ENTRIES) reader.fail('entry_limit');
        const name = reader.take(/^[A-Za-z0-9][A-Za-z0-9-]*/).toLowerCase();
        reader.space();
        if (name === 'reason' && reader.at('=')) {
          if (reason !== null || properties.length) reader.fail();
          reader.expect('=');
          reader.space();
          reason = reader.value(false);
        } else {
          reader.expect('.');
          reader.space();
          const property = reader.take(/^[A-Za-z0-9][A-Za-z0-9-]*/).toLowerCase();
          reader.space();
          reader.expect('=');
          reader.space();
          properties.push({ type: name, name: property, rawValue: reader.value(true) });
        }
      }
      let interpretation: ReportedResult['interpretation'] = 'supported';
      if (version !== null && version !== '1') interpretation = 'unsupported_version';
      results.push({ method, version, interpretation, result, reason, properties });
    }
    if (!results.length) reader.fail();
    return { kind: 'reported_results', authservId, version: '1', results };
  } catch (error) {
    if (error instanceof HeaderSyntaxError) return { kind: 'unparsed', reason: error.reason };
    throw error;
  }
}

/** Reads RFC 6376 §3.2 tag syntax. Required tags, tag semantics and signature verification are separate. */
export function parseDkimSignature(value: string): DkimTags {
  if (exceedsHeaderLimit(value)) return { kind: 'unparsed', reason: 'header_limit' };
  // RFC 6376 §3.2 excludes semicolons from tag values and makes names case-sensitive.
  // https://www.rfc-editor.org/rfc/rfc6376#section-3.2
  const unfolded = value.replace(/\r\n(?=[ \t])/g, '');
  if (/[^\x09\x20-\x7e]/.test(unfolded)) return { kind: 'unparsed', reason: 'invalid_syntax' };
  const segments = unfolded.trim().split(';');
  if (segments.at(-1)?.trim() === '') segments.pop();
  if (!segments.length) return { kind: 'unparsed', reason: 'invalid_syntax' };
  if (segments.length > MAX_ENTRIES) return { kind: 'unparsed', reason: 'entry_limit' };
  const tags: { name: string; value: string }[] = [];
  const seen = new Set<string>();
  const duplicateTags = new Set<string>();
  for (const segment of segments) {
    const match = /^[ \t]*([A-Za-z][A-Za-z0-9_]*)[ \t]*=[ \t]*([^;]*?)[ \t]*$/.exec(segment);
    if (!match) return { kind: 'unparsed', reason: 'invalid_syntax' };
    const [, name, tagValue] = match;
    if (seen.has(name)) duplicateTags.add(name);
    seen.add(name);
    tags.push({ name, value: tagValue });
  }
  return { kind: 'signature_tags', tags, duplicateTags: [...duplicateTags] };
}

function exceedsHeaderLimit(value: string): boolean {
  return value.length > MAX_AUTH_HEADER_BYTES || new TextEncoder().encode(value).length > MAX_AUTH_HEADER_BYTES;
}

class HeaderSyntaxError extends Error {
  reason: ParseFailure['reason'];
  constructor(reason: ParseFailure['reason']) {
    super('Authentication header could not be parsed.');
    this.reason = reason;
  }
}

// https://www.rfc-editor.org/rfc/rfc8601#section-2.2
// RFC 8601 allows comments, folding whitespace, and quoted values.
// The cursor distinguishes separators inside those values from separators between fields.
class HeaderReader {
  private offset = 0;
  private input: string;
  constructor(input: string) { this.input = input.replace(/\r\n(?=[ \t])/g, ''); }
  fail(reason: ParseFailure['reason'] = 'invalid_syntax'): never { throw new HeaderSyntaxError(reason); }
  done(): boolean { return this.offset === this.input.length; }
  at(text: string): boolean { return this.input.startsWith(text, this.offset); }
  expect(text: string): void {
    if (!this.at(text)) this.fail();
    this.offset += text.length;
  }
  take(pattern: RegExp): string {
    const match = pattern.exec(this.input.slice(this.offset));
    if (!match) this.fail();
    this.offset += match[0].length;
    return match[0];
  }
  space(): boolean {
    const start = this.offset;
    while (!this.done()) {
      if (this.at(' ') || this.at('\t')) { this.offset++; continue; }
      if (!this.at('(')) break;
      this.offset++;
      let depth = 1;
      while (depth) {
        if (this.done()) this.fail();
        const char = this.input[this.offset++];
        if (char === '\\') this.escaped();
        else if (char === '(') depth++;
        else if (char === ')') depth--;
        else if (/[\x00-\x08\x0a-\x1f\x7f]/.test(char)) this.fail();
        if (depth > MAX_COMMENT_DEPTH) this.fail('nesting_limit');
      }
    }
    return this.offset > start;
  }
  value(address: boolean): string {
    const start = this.offset;
    let decoded: string;
    if (this.at('"')) {
      this.offset++;
      decoded = '';
      while (!this.at('"')) {
        if (this.done()) this.fail();
        const char = this.input[this.offset++];
        if (char === '\\') decoded += this.escaped();
        else {
          if (/[\x00-\x08\x0a-\x1f\x7f]/.test(char)) this.fail();
          decoded += char;
        }
      }
      this.offset++;
    } else if (address) {
      decoded = this.take(/^[^\x00-\x20\x7f()<> ,;:\\"/[\]?=]+/u);
    } else {
      decoded = this.take(/^[!#$%&'*+\-.0-9A-Z^_`a-z{|}~]+/);
    }
    if (!address) return decoded;
    // Keep quoted local parts, comments, and whitespace for the parser that interprets this identity.
    // RFC 8601 pvalue includes RFC 5322 local-part extended by RFC 6531 (SMTPUTF8).
    const end = this.offset;
    this.space();
    if (this.at('@')) {
      this.expect('@');
      this.space();
      this.take(/^[^\x00-\x20\x7f()<> ,;:\\"/[\]?=@]+/u);
    }
    else this.offset = end;
    return this.input.slice(start, this.offset);
  }
  private escaped(): string {
    if (this.done()) this.fail();
    const char = this.input[this.offset++];
    if (/[\x00-\x08\x0a-\x1f\x7f]/.test(char)) this.fail();
    return char;
  }
}
