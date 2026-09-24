import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseMessage, MAX_MESSAGE_BYTES } from './parse-message.ts';

const signal = new AbortController().signal;
const encode = (text: string) => new TextEncoder().encode(text.replace(/\n/g, '\r\n'));

test('preserves alternatives, repeated headers and reported authentication without trusting them', async () => {
  const result = await parseMessage(encode(`From: "Wallet, Inc" <sender@example.com>
Authentication-Results: mx.example; dkim=pass header.d=example.com header.s=resend
Authentication-Results: broken
MIME-Version: 1.0
Content-Type: multipart/alternative; boundary=b

--b
Content-Type: text/plain; charset=utf-8

Plain body
--b
Content-Type: text/html; charset=utf-8

<img src="https://example.com/logo"><a href="https://other.com/">Open</a>
--b--
`), signal);
  assert.equal(result.kind, 'parsed');
  if (result.kind !== 'parsed') return;
  assert.deepEqual(result.message.messages[0].authentication.map(({ result }) => result.kind), ['reported_results', 'unparsed']);
  assert.equal(result.message.authenticationProvenance, 'unverified');
  assert.equal(result.message.verification, 'not_performed');
  assert.deepEqual(result.message.parts.map((part) => [part.id, part.parentId, part.content.kind]), [
    ['message/p0', null, 'multipart'], ['message/p1', 'message/p0', 'text'], ['message/p2', 'message/p0', 'text'],
  ]);
  assert.equal(result.message.messages[0].addresses[0].result.kind, 'parsed');
});

test('a failed text part does not erase attachment metadata or an embedded message boundary', async () => {
  const result = await parseMessage(encode(`MIME-Version: 1.0
Content-Type: multipart/mixed; boundary=b

--b
Content-Type: text/plain; charset=utf-8
Content-Transfer-Encoding: base64

/w==
--b
Content-Type: application/octet-stream
Content-Disposition: attachment; filename="test.bin"
Content-Transfer-Encoding: base64

YWJj
--b
Content-Type: message/rfc822

From: nested@example.org
Content-Type: text/plain

Nested text
--b--
`), signal);
  assert.equal(result.kind, 'parsed');
  if (result.kind !== 'parsed') return;
  assert.deepEqual(result.message.parts[1].content, { kind: 'unavailable', reason: 'invalid_or_unsupported_charset' });
  assert.deepEqual(result.message.parts[2].content, { kind: 'attachment', decodedBytes: 3 });
  assert.equal(result.message.parts[2].filename, 'test.bin');
  assert.equal(result.message.messages.length, 2);
  assert.equal(result.message.parts[3].content.kind, 'embedded');
  assert.equal(result.message.parts[4].messageId, 'message/p3/message');
});

test('input limits and cancellation fail explicitly before any usable parse', async () => {
  assert.deepEqual(await parseMessage(new Uint8Array(MAX_MESSAGE_BYTES + 1), signal), { kind: 'input_failure', reason: 'input_limit' });
  assert.deepEqual(await parseMessage(encode('Subject: x\n\nbody'), AbortSignal.abort()), { kind: 'input_failure', reason: 'cancelled' });
});

test('depth-limited content does not consume the independent attachment budget', async () => {
  const embedded = (body: string) => 'Content-Type: message/rfc822\n\n' + body;
  const nested = embedded(embedded(embedded('Content-Type: application/octet-stream\n\n' + 'x'.repeat(3 * 1024 * 1024))));
  const input = 'Content-Type: multipart/mixed; boundary=b\n\n--b\n' + nested +
    '\n--b\nContent-Type: application/octet-stream\nContent-Disposition: attachment; filename=sibling.bin\n\n' +
    'y'.repeat(2 * 1024 * 1024) + '\n--b--\n';
  const result = await parseMessage(encode(input), signal);
  assert.equal(result.kind, 'parsed');
  if (result.kind !== 'parsed') return;
  assert.ok(result.message.limitations.some(({ reason }) => reason === 'embedded_depth_limit'));
  assert.deepEqual(result.message.parts.find(({ filename }) => filename === 'sibling.bin')?.content,
    { kind: 'attachment', decodedBytes: 2 * 1024 * 1024 });
});

test('an empty reverse path is retained without a malformed-address claim', async () => {
  const result = await parseMessage(encode('Return-Path: <>\n\nbody'), signal);
  assert.equal(result.kind, 'parsed');
  if (result.kind === 'parsed') assert.deepEqual(result.message.messages[0].addresses[0].result, { kind: 'null_reverse_path' });
});

test('cancelling inside embedded parsing stays observable and settles owned streams', async (t) => {
  const { Splitter } = await import('@zone-eu/mailsplit');
  // oxlint-disable-next-line typescript/unbound-method -- The mock restores the receiver with apply(this, ...).
  const originalEmit = Splitter.prototype.emit;
  const controller = new AbortController();
  let roots = 0;
  const streams = new Set<InstanceType<typeof Splitter>>();
  t.mock.method(Splitter.prototype, 'emit', function (this: InstanceType<typeof Splitter>, event: string, ...args: unknown[]) {
    const chunk = args[0];
    if (event === 'data' && typeof chunk === 'object' && chunk !== null && 'type' in chunk && chunk.type === 'node') {
      streams.add(this);
      if (++roots === 2) controller.abort();
    }
    return Reflect.apply(originalEmit, this, [event, ...args]);
  });
  const result = await parseMessage(encode('Content-Type: message/rfc822\n\nFrom: nested@example.org\n\nbody'), controller.signal);
  assert.equal(result.kind, 'parsed');
  if (result.kind === 'parsed') assert.deepEqual(result.message.parts[0].content, { kind: 'unavailable', reason: 'cancelled' });
  assert.equal(streams.size, 2);
  assert.ok([...streams].every((stream) => stream.destroyed));
});
