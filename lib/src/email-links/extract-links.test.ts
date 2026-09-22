import assert from 'node:assert/strict';
import { test } from 'node:test';
import { extractEmailLinks, summarizeEmailLinks, MAX_HTML_BYTES } from './extract-links.ts';

test('retains separate image and action roles, repeated occurrences and enclosing links', () => {
  const result = extractEmailLinks('<a href="https://download.example/setup">Get <b>app</b>' +
    '<img src="https://brand.example/logo.png" alt="Brand"></a>' +
    '<img src="https://brand.example/logo.png">');
  assert.deepEqual(result.occurrences.map((item) => ({
    id: item.id, kind: item.kind, reference: item.reference,
    ...('enclosingAnchorId' in item && { enclosingAnchorId: item.enclosingAnchorId }),
    ...('text' in item && { text: item.text }),
  })), [
    { id: 0, kind: 'anchor', reference: { kind: 'web', value: 'https://download.example/setup',
      url: 'https://download.example/setup', hostname: 'download.example' }, text: 'Get app' },
    { id: 1, kind: 'image', reference: { kind: 'web', value: 'https://brand.example/logo.png',
      url: 'https://brand.example/logo.png', hostname: 'brand.example' }, enclosingAnchorId: 0 },
    { id: 2, kind: 'image', reference: { kind: 'web', value: 'https://brand.example/logo.png',
      url: 'https://brand.example/logo.png', hostname: 'brand.example' }, enclosingAnchorId: null },
  ]);
  assert.equal(result.embeddedResourceResolution, 'unavailable');
});

test('retains marked quote occurrences without marking siblings or similarly named classes', () => {
  const result = extractEmailLinks('<blockquote><img src="https://quoted.example/a"></blockquote>' +
    '<div class="history\tgmail_quote"><a href="https://quoted.example/b"><img src="https://quoted.example/c"></a></div>' +
    '<div class="not_gmail_quote"><a href="https://current.example/d">Current</a></div>' +
    '<a href="https://current.example/e">After quote</a>');
  assert.deepEqual(result.occurrences.map(({ quoteContext }) => quoteContext),
    ['marked_quote', 'marked_quote', 'marked_quote', 'unmarked', 'unmarked']);
});

test('decodes HTML entities but keeps UTF-16 spans into the supplied source', () => {
  const html = '💡<a href="https://example.test/?a=1&amp;b=2">A &amp; B</a>';
  const [anchor] = extractEmailLinks(html).occurrences;
  assert.equal(anchor.kind, 'anchor');
  assert.deepEqual(anchor.reference, { kind: 'web', value: 'https://example.test/?a=1&b=2',
    url: 'https://example.test/?a=1&b=2', hostname: 'example.test' });
  assert.ok(anchor.attributeSpan);
  assert.equal(html.slice(anchor.attributeSpan.start, anchor.attributeSpan.end),
    'href="https://example.test/?a=1&amp;b=2"');
  if (anchor.kind === 'anchor') assert.equal(anchor.text, 'A & B');
});

test('recovers nested anchors and preserves non-web references without guessing a base or MIME part', () => {
  const result = extractEmailLinks('<base href="https://base.example/">' +
    '<a href="/relative"><a href="cid:part"><img src="data:image/png;base64,AA=="></a>' +
    '<img src="https://192.0.2.1/logo"><img src="https://[2001:db8::1]/logo">' +
    '<a href="https://["></a><a href="mailto:a@example.test"></a><img src="">');
  assert.deepEqual(result.occurrences.map((item) => item.reference.kind),
    ['relative', 'cid', 'data', 'web', 'web', 'invalid', 'other', 'empty']);
  const image = result.occurrences[2];
  assert.ok(image.kind === 'image');
  assert.equal(image.enclosingAnchorId, 1);
  assert.equal(result.coverage.unsupported.base, 1);
});

test('records skipped constructs and observed unsupported attributes, without parsing their contents', () => {
  const result = extractEmailLinks('<style>body{background:url(https://hidden.example)}</style>' +
    '<script>"<img src=x>"</script><template><img src=x></template>' +
    '<svg><image href="x"/></svg><!-- <img src=x> -->' +
    '<form action="/post"><img srcset="/a 1x" style="color:red"><button formaction="/other">Go</button></form>');
  assert.deepEqual(result.occurrences, []);
  assert.deepEqual(result.coverage.unsupported, { base: 0, srcset: 1, style: 2, svg: 1,
    form: 1, script: 1, template: 1, comment: 1, foreign: 0, otherUrlAttribute: 1 });
});

test('retains hosts from padded and scheme-relative URLs without inventing a final destination', () => {
  const result = extractEmailLinks('<a href="https://action.example/login?' + 'a'.repeat(4100) + '"></a>' +
    '<img src="//cdn.example/logo"><a href="/local"></a>' +
    '<img src="https://' + 'a'.repeat(4100) + '.example/image">');
  assert.deepEqual(result.occurrences.map((item) => item.reference), [
    { kind: 'web', value: null, url: null, hostname: 'action.example' },
    { kind: 'scheme_relative', value: '//cdn.example/logo', hostname: 'cdn.example' },
    { kind: 'relative', value: '/local' },
    { kind: 'web', value: null, url: null, hostname: null },
  ]);
  assert.deepEqual(result.coverage.limits, ['reference_limit']);
});

test('rejects oversized HTML and marks bounded traversal and output as partial', () => {
  assert.throws(() => extractEmailLinks('é'.repeat(MAX_HTML_BYTES / 2 + 1)));
  assert.equal(extractEmailLinks('x'.repeat(MAX_HTML_BYTES)).occurrences.length, 0);
  const many = extractEmailLinks('<img src="/x">'.repeat(201));
  assert.equal(many.occurrences.length, 200);
  assert.deepEqual(many.coverage.limits, ['occurrence_limit']);
  assert.deepEqual(extractEmailLinks('<b></b>'.repeat(20_001)).coverage.limits, ['node_limit']);
  const bounded = extractEmailLinks('<a href="' + 'x'.repeat(4097) + '">' +
    'a'.repeat(255) + '💡</a>');
  assert.deepEqual(bounded.occurrences[0].reference, { kind: 'omitted', reason: 'reference_limit' });
  const anchor = bounded.occurrences[0];
  assert.ok(anchor.kind === 'anchor');
  assert.equal(anchor.text, 'a'.repeat(255));
  assert.equal(anchor.textTruncated, true);
  assert.deepEqual(bounded.coverage.limits, ['reference_limit', 'text_limit']);
});

test('model summary contains only selected hosts, roles, relationships and coverage', () => {
  const result = extractEmailLinks('<a href="https://private-user:private-password@action.example/private-path?private-query#private-fragment">' +
    'private-text<img src="https://image.example/private-image" alt="private-alt"></a>' +
    '<a href="cid:private-part"><img src="/private-relative"></a>' +
    '<a href="https://padded.example/private-path?' + 'a'.repeat(4100) + '"></a>' +
    '<img src="//cdn.example/private-image">');
  const summary = summarizeEmailLinks(result);
  assert.deepEqual(summary.occurrences, [
    { id: 0, role: 'anchor', referenceKind: 'web', hostname: 'action.example', enclosingAnchorId: null },
    { id: 1, role: 'image', referenceKind: 'web', hostname: 'image.example', enclosingAnchorId: 0 },
    { id: 2, role: 'anchor', referenceKind: 'cid', hostname: null, enclosingAnchorId: null },
    { id: 3, role: 'image', referenceKind: 'relative', hostname: null, enclosingAnchorId: 2 },
    { id: 4, role: 'anchor', referenceKind: 'web', hostname: 'padded.example', enclosingAnchorId: null },
    { id: 5, role: 'image', referenceKind: 'scheme_relative', hostname: 'cdn.example', enclosingAnchorId: null },
  ]);
  assert.doesNotMatch(JSON.stringify(summary), /private-|[/?#@]/);
});
