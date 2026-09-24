import { Readable, Writable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { Splitter, type SplitterChunk } from '@zone-eu/mailsplit';
import addresses from 'email-addresses';
import { parseAuthenticationResults, parseDkimSignature } from './authentication.ts';

export const MAX_MESSAGE_BYTES = 10 * 1024 * 1024;
const MAX_TEXT_BYTES = 512 * 1024;
const MAX_PARTS = 128;
const MAX_HEADERS_BYTES = 512 * 1024;

type MimeNode = Extract<SplitterChunk, { type: 'node' }>;
type Header = { name: string; value: string };

type AddressFields = {
  headerIndex: number;
  field: string;
  result: { kind: 'parsed'; addresses: { name: string | null; domain: string; address: string }[] }
    | { kind: 'null_reverse_path' }
    | { kind: 'unparsed'; reason: 'header_limit' | 'invalid_address' };
}[];

type PartContent =
  | { kind: 'multipart' }
  | { kind: 'text'; text: string; decodedBytes: number; flowed: boolean }
  | { kind: 'attachment'; decodedBytes: number }
  | { kind: 'embedded'; messageId: string; decodedBytes: number }
  | { kind: 'unavailable'; reason: string };

export type MessagePart = {
  id: string;
  messageId: string;
  parentId: string | null;
  contentType: string;
  disposition: string | null;
  filename: string | null;
  headers: Header[];
  content: PartContent;
};

export type ParsedMessage = {
  parts: MessagePart[];
  messages: {
    id: string;
    rootPartId: string;
    addresses: AddressFields;
    authentication: { headerIndex: number; result: ReturnType<typeof parseAuthenticationResults> }[];
    signatures: { headerIndex: number; result: ReturnType<typeof parseDkimSignature> }[];
  }[];
  limitations: { sourceId: string; reason: string }[];
  authenticationProvenance: 'unverified';
  verification: 'not_performed';
};

/** Parses private message bytes. Tolerant MIME decoding is not strict MIME validation or authentication. */
export async function parseMessage(bytes: Uint8Array, signal: AbortSignal): Promise<
  { kind: 'parsed'; message: ParsedMessage } | { kind: 'input_failure'; reason: string }
> {
  if (!bytes.length || bytes.byteLength > MAX_MESSAGE_BYTES) return { kind: 'input_failure', reason: 'input_limit' };
  const message: ParsedMessage = { parts: [], messages: [], limitations: [],
    authenticationProvenance: 'unverified', verification: 'not_performed' };
  let headerBytes = 0;
  let decodedBytes = 0;
  let partCount = 0;

  async function parse(bytes: Uint8Array, messageId: string, depth: number): Promise<void> {
    signal.throwIfAborted();
    const splitter = new Splitter({ ignoreEmbedded: true, maxHeadSize: 64 * 1024, maxChildNodes: MAX_PARTS });
    const collected: { node: MimeNode; id: string; chunks: Buffer[] }[] = [];
    const byNode = new Map<MimeNode, typeof collected[number]>();
    splitter.on('data', (chunk) => {
      if (chunk.type === 'node') {
        headerBytes += Buffer.byteLength((chunk.headers && chunk.headers.getList().map(({ line }) => line).join('\r\n')) || '');
        if (++partCount > MAX_PARTS || headerBytes > MAX_HEADERS_BYTES) {
          splitter.destroy(new Error('MIME resource limit.'));
          return;
        }
        const item = { node: chunk, id: `${messageId}/p${collected.length}`, chunks: new Array<Buffer>() };
        collected.push(item);
        byNode.set(chunk, item);
      } else if (chunk.type === 'body') {
        const item = byNode.get(chunk.node);
        if (!item) { splitter.destroy(new Error('Missing MIME owner.')); return; }
        item.chunks.push(chunk.value);
      }
    });

    // The complete input is already bounded. Collect first, then own and settle one decoder at a time.
    // Mailsplit public node/body contract: https://github.com/zone-eu/mailsplit/tree/23e2d737ba59017bd9c8bc46aecf68ef551658e5
    await pipeline(Readable.from([Buffer.from(bytes)]), splitter, { signal });
    const root = collected[0];
    if (!root || !root.node.headers || !root.node.headers.getList().length) throw new Error('Missing message headers.');

    for (const { node, id, chunks } of collected) {
      const headers = ((node.headers && node.headers.getList()) || []).map(({ key, line }) => ({
        name: key, value: line.slice(line.indexOf(':') + 1).trimStart(),
      }));

      const part: MessagePart = { id, messageId, parentId: null, headers,
        contentType: node.contentType || 'application/octet-stream', disposition: node.disposition || null,
        filename: node.filename || null, content: { kind: 'multipart' } };

      if (node.parentNode) part.parentId = byNode.get(node.parentNode)?.id ?? null;
      message.parts.push(part);

      if (node.root) message.messages.push({ id: messageId, rootPartId: id, addresses: readAddresses(headers),
        authentication: headers.flatMap((header, headerIndex) => {
          if (header.name !== 'authentication-results') return [];
          return [{ headerIndex, result: parseAuthenticationResults(header.value) }];
        }),

        signatures: headers.flatMap((header, headerIndex) => {
          if (header.name !== 'dkim-signature') return [];
          return [{ headerIndex, result: parseDkimSignature(header.value) }];
        }),
      });

      if (node.multipart) continue;
      if (signal.aborted) { part.content = { kind: 'unavailable', reason: 'cancelled' }; continue; }
      if (node.encoding && !['7bit', '8bit', 'binary', 'base64', 'quoted-printable'].includes(node.encoding)) {
        part.content = { kind: 'unavailable', reason: 'unsupported_transfer_encoding' };
        continue;
      }

      const embedded = part.contentType === 'message/rfc822';
      if (embedded && depth >= 2) {
        part.content = { kind: 'unavailable', reason: 'embedded_depth_limit' };
        continue;
      }

      const text = ['text/plain', 'text/html'].includes(part.contentType) && part.disposition !== 'attachment' && !part.filename;
      let size = 0;
      const decoded: Buffer[] = [];

      try {
        await pipeline(Readable.from(chunks), node.getDecoder(), new Writable({
          write(chunk: Buffer, _encoding, done) {
            size += chunk.length;
            decodedBytes += chunk.length;
            if (decodedBytes > MAX_MESSAGE_BYTES || (text && size > MAX_TEXT_BYTES)) {
              done(new Error('Decoded content limit.'));
              return;
            }
            if (text || embedded) decoded.push(chunk);
            done();
          },
        }), { signal });
      } catch {
        let reason = 'decode_failed_or_limited';
        if (signal.aborted) reason = 'cancelled';
        part.content = { kind: 'unavailable', reason };
        continue;
      }

      if (embedded) {
        const nestedId = `${id}/message`;
        const partStart = message.parts.length;
        const messageStart = message.messages.length;

        try {
          await parse(Buffer.concat(decoded), nestedId, depth + 1);
          part.content = { kind: 'embedded', messageId: nestedId, decodedBytes: size };
        } catch {
          message.parts.length = partStart;
          message.messages.length = messageStart;
          let reason = 'embedded_parse_failed';
          if (signal.aborted) reason = 'cancelled';
          part.content = { kind: 'unavailable', reason };
        }
      } else if (text) {
        try {
          const charset = node.charset || 'us-ascii';
          const body = Buffer.concat(decoded);
          if (charset.toLowerCase() === 'us-ascii' && body.some((byte) => byte > 127)) throw new Error('Invalid ASCII');
          part.content = { kind: 'text', text: new TextDecoder(charset, { fatal: true }).decode(body), decodedBytes: size, flowed: node.flowed };
        } catch {
          part.content = { kind: 'unavailable', reason: 'invalid_or_unsupported_charset' };
        }
      } else part.content = { kind: 'attachment', decodedBytes: size };
    }
  }

  try { await parse(bytes, 'message', 0); }
  catch {
    if (signal.aborted) return { kind: 'input_failure', reason: 'cancelled' };
    return { kind: 'input_failure', reason: 'malformed_message_or_limit' };
  }

  for (const part of message.parts) {
    if (part.content.kind === 'unavailable') message.limitations.push({ sourceId: part.id, reason: part.content.reason });
    if (part.content.kind === 'text' && part.content.flowed) message.limitations.push({ sourceId: part.id, reason: 'flowed_text_not_reassembled' });
  }

  return { kind: 'parsed', message };
}

function readAddresses(headers: Header[]): AddressFields {
  return headers.flatMap((header, headerIndex): AddressFields => {
    if (!['from', 'sender', 'reply-to', 'return-path'].includes(header.name)) return [];
    if (Buffer.byteLength(header.value) > 16 * 1024) {
      return [{ headerIndex, field: header.name, result: { kind: 'unparsed', reason: 'header_limit' } }];
    }
    if (header.name === 'return-path' && header.value.trim() === '<>') {
      return [{ headerIndex, field: header.name, result: { kind: 'null_reverse_path' } }];
    }

    try {
      let parsed: ReturnType<typeof addresses.parseFrom>;
      if (header.name === 'from') parsed = addresses.parseFrom(header.value);
      else if (header.name === 'reply-to') parsed = addresses.parseReplyTo(header.value);
      else {
        const mailbox = addresses.parseSender(header.value);
        parsed = null;
        if (mailbox) parsed = [mailbox];
      }

      if (!parsed) return [{ headerIndex, field: header.name, result: { kind: 'unparsed', reason: 'invalid_address' } }];

      const mailboxes = parsed.flatMap((entry) => {
        if (entry.type === 'group') return entry.addresses;
        return [entry];
      });

      return [{ headerIndex, field: header.name, result: { kind: 'parsed', addresses: mailboxes.map(({ name, domain, address }) => ({ name, domain, address })) } }];
    } catch {
      return [{ headerIndex, field: header.name, result: { kind: 'unparsed', reason: 'invalid_address' } }];
    }
  });
}
