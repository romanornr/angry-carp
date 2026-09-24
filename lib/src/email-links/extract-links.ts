/**
 * Extracts image and link occurrences while preserving which anchor encloses an image.
 * Uses parse5's recovered HTML tree, including its repairs to malformed markup.
 *
 * Steps:
 * 1. Parse the supplied HTML without rendering it or fetching resources.
 * 2. Walk the tree once, carrying the enclosing anchor and quote context.
 * 3. Record each occurrence's source spans, reference, and relationship to its enclosing link.
 * 4. Count unsupported features and limits so unexamined content remains visible.
 *
 * Implementation choices:
 * - Relationships follow the recovered tree, which can differ from a mail client's display.
 * - Talon also recognizes div.gmail_quote, as linked below.
 *   Here the marker labels content for inspection instead of removing it.
 *
 * See docs/email-links.md for the extraction contract.
 */
import { parse, type DefaultTreeAdapterMap } from 'parse5';
import * as v from 'valibot';

export const MAX_HTML_BYTES = 512 * 1024;
const MAX_OCCURRENCES = 200;
const MAX_NODES = 20_000;
const MAX_REFERENCE_LENGTH = 4096;
const MAX_TEXT_LENGTH = 256;

const htmlSchema = v.pipe(v.string(), v.maxLength(MAX_HTML_BYTES), v.check(
  (html) => new TextEncoder().encode(html).byteLength <= MAX_HTML_BYTES,
  'HTML exceeds the byte limit.',
));

type Span = { start: number; end: number };
type Reference =
  | { kind: 'web'; value: string | null; url: string | null; hostname: string | null }
  | { kind: 'scheme_relative'; value: string | null; hostname: string | null }
  | { kind: 'empty' | 'relative' | 'cid' | 'data' | 'other' | 'invalid'; value: string }
  | { kind: 'omitted'; reason: 'reference_limit' };
type OccurrenceSource = {
  id: number;
  quoteContext: 'marked_quote' | 'unmarked';
  reference: Reference;
  attributeSpan: Span | null;
  elementSpan: Span | null;
};
type Anchor = OccurrenceSource & { kind: 'anchor'; text: string; textTruncated: boolean };
type Image = OccurrenceSource & {
  kind: 'image'; alt: string; altTruncated: boolean; enclosingAnchorId: number | null;
};
type Occurrence = Anchor | Image;
type Node = DefaultTreeAdapterMap['node'];
type Element = DefaultTreeAdapterMap['element'];

/** Extracts inert HTML references. Source spans address the supplied string, not MIME bytes. */
export function extractEmailLinks(input: string) {
  const html = v.parse(htmlSchema, input);
  const occurrences: Occurrence[] = [];
  const limits = new Set<'node_limit' | 'occurrence_limit' | 'reference_limit' | 'text_limit'>();
  const unsupported = {
    base: 0, srcset: 0, style: 0, svg: 0, form: 0, script: 0,
    template: 0, comment: 0, foreign: 0, otherUrlAttribute: 0,
  };
  const parseErrors = new Map<string, number>();
  // WHATWG tree construction recovers malformed HTML: https://html.spec.whatwg.org/multipage/parsing.html
  // Enclosure follows that tree, not lexical nesting or a particular mail client's rendering.
  const document = parse(html, {
    sourceCodeLocationInfo: true,
    scriptingEnabled: false,
    onParseError(error) {
      parseErrors.set(error.code, (parseErrors.get(error.code) ?? 0) + 1);
    },
  });
  // Carry the enclosing link through one depth-first walk to avoid comparing every image with every link.
  const stack: { node: Node; anchor: Anchor | null; quoted: boolean }[] = [{ node: document, anchor: null, quoted: false }];
  let visitedNodes = 0;

  while (stack.length > 0) {
    const frame = stack.pop();
    if (!frame) break;
    if (++visitedNodes > MAX_NODES) {
      limits.add('node_limit');
      break;
    }
    const { node } = frame;
    let anchor = frame.anchor;
    let quoted = frame.quoted;
    if ('value' in node && anchor) {
      const text = anchor.text + node.value;
      anchor.text = clip(text, MAX_TEXT_LENGTH);
      if (text.length > MAX_TEXT_LENGTH) {
        anchor.textTruncated = true;
        limits.add('text_limit');
      }
    }
    if ('data' in node) unsupported.comment++;
    if ('tagName' in node) {
      const attrs = new Map(node.attrs.map(({ name, value }) => [name, value]));
      // gmail_quote is a client marker, not proof of authorship. Keep its contents as observations.
      // Talon's cut_gmail_quote: https://github.com/mailgun/talon/blob/9703f59b197846a624bc96ca3c0dbe00ccb51047/talon/html_quotations.py#L155-L165
      if (node.tagName === 'blockquote' || (node.tagName === 'div' &&
          attrs.get('class')?.split(/[\t\n\f\r ]+/).includes('gmail_quote'))) quoted = true;
      if (attrs.has('srcset')) unsupported.srcset++;
      if (attrs.has('style') || node.tagName === 'style') unsupported.style++;
      if (node.tagName === 'base') unsupported.base++;
      if (node.tagName === 'form') unsupported.form++;
      if (attrs.has('formaction') || attrs.has('background') || attrs.has('poster') ||
          (node.tagName === 'meta' && attrs.get('http-equiv')?.toLowerCase() === 'refresh')) {
        unsupported.otherUrlAttribute++;
      }
      // Skip subtrees outside the supported HTML content and record that they remain unexamined.
      if (node.tagName === 'svg') { unsupported.svg++; continue; }
      if (node.tagName === 'template') { unsupported.template++; continue; }
      if (node.tagName === 'script') { unsupported.script++; continue; }
      if (node.tagName === 'style') continue;
      if (node.namespaceURI !== 'http://www.w3.org/1999/xhtml') {
        unsupported.foreign++;
        continue;
      }

      let attribute: 'href' | 'src' | null = null;
      if (node.tagName === 'a' && attrs.has('href')) attribute = 'href';
      if (node.tagName === 'img' && attrs.has('src')) attribute = 'src';
      if (attribute) {
        if (occurrences.length === MAX_OCCURRENCES) {
          limits.add('occurrence_limit');
          break;
        }
        const reference = parseReference(attrs.get(attribute) ?? '');
        if (reference.kind === 'omitted' || reference.value === null ||
            (reference.kind === 'web' && reference.url === null)) limits.add('reference_limit');
        let quoteContext: OccurrenceSource['quoteContext'] = 'unmarked';
        if (quoted) quoteContext = 'marked_quote';
        const source = {
          quoteContext,
          id: occurrences.length,
          reference,
          attributeSpan: span(node.sourceCodeLocation?.attrs?.[attribute]),
          elementSpan: span(node.sourceCodeLocation),
        };
        if (attribute === 'href') {
          anchor = { ...source, kind: 'anchor', text: '', textTruncated: false };
          occurrences.push(anchor);
        } else {
          const alt = attrs.get('alt') ?? '';
          const altTruncated = alt.length > MAX_TEXT_LENGTH;
          if (altTruncated) limits.add('text_limit');
          occurrences.push({ ...source, kind: 'image', alt: clip(alt, MAX_TEXT_LENGTH),
            altTruncated, enclosingAnchorId: anchor?.id ?? null });
        }
      } else if ((attrs.has('href') && node.tagName !== 'base') || attrs.has('src')) {
        unsupported.otherUrlAttribute++;
      }
    }
    if ('childNodes' in node) {
      for (let index = node.childNodes.length - 1; index >= 0; index--) {
        stack.push({ node: node.childNodes[index], anchor, quoted });
      }
    }
  }

  return {
    parser: { name: 'parse5', version: '8.0.1', scriptingEnabled: false },
    source: { kind: 'supplied_html', offsetUnit: 'utf16', enclosure: 'recovered_tree' },
    embeddedResourceResolution: 'unavailable',
    occurrences,
    coverage: { limits: [...limits], unsupported, visitedNodes: Math.min(visitedNodes, MAX_NODES) },
    parseErrors: [...parseErrors].map(([code, count]) => ({ code, count })),
  };
}

export type EmailLinks = ReturnType<typeof extractEmailLinks>;

function span(location: Element['sourceCodeLocation']): Span | null {
  if (!location) return null;
  return { start: location.startOffset, end: location.endOffset };
}

function clip(text: string, length: number): string {
  if (text.length <= length) return text;
  let end = length;
  const last = text.charCodeAt(end - 1);
  if (last >= 0xd800 && last <= 0xdbff) end--;
  return text.slice(0, end);
}

function parseReference(value: string): Reference {
  // Classify the full attribute before shortening retained text so padding cannot hide a hostname.
  const retained = retain(value);
  const schemeRelative = value.trim().startsWith('//');
  if (!value.trim()) {
    if (retained === null) return { kind: 'omitted', reason: 'reference_limit' };
    return { kind: 'empty', value };
  }
  let url: URL;
  try {
    if (schemeRelative) {
      // Supply a temporary scheme to parse the hostname while retaining the scheme-relative classification.
      url = new URL('https:' + value.trim());
    } else {
      url = new URL(value);
    }
  } catch {
    if (retained === null) return { kind: 'omitted', reason: 'reference_limit' };
    if (schemeRelative || /^[a-z][a-z\d+.-]*:/i.test(value.trim())) return { kind: 'invalid', value };
    return { kind: 'relative', value };
  }
  if (schemeRelative) return { kind: 'scheme_relative', value: retained, hostname: retain(url.hostname) };
  if (url.protocol === 'http:' || url.protocol === 'https:') {
    return { kind: 'web', value: retained, url: retain(url.href), hostname: retain(url.hostname) };
  }
  if (retained === null) return { kind: 'omitted', reason: 'reference_limit' };
  if (url.protocol === 'cid:') return { kind: 'cid', value };
  if (url.protocol === 'data:') return { kind: 'data', value };
  return { kind: 'other', value };
}

function retain(value: string): string | null {
  if (value.length > MAX_REFERENCE_LENGTH) return null;
  return value;
}

// Explicit field selection keeps raw URLs and sender-written text out of the added evidence.
export function summarizeEmailLinks(result: EmailLinks) {
  return {
    source: 'separately_operator_supplied_html',
    enclosure: 'parse5_recovered_tree',
    relativeReferences: 'unresolved',
    embeddedResourceResolution: 'unavailable',
    occurrences: result.occurrences.map((occurrence) => {
      let hostname: string | null = null;
      if (occurrence.reference.kind === 'web' || occurrence.reference.kind === 'scheme_relative') {
        hostname = occurrence.reference.hostname;
      }
      let enclosingAnchorId: number | null = null;
      if (occurrence.kind === 'image') enclosingAnchorId = occurrence.enclosingAnchorId;
      return { id: occurrence.id, role: occurrence.kind, referenceKind: occurrence.reference.kind,
        hostname, enclosingAnchorId };
    }),
    coverage: {
      limits: [...result.coverage.limits],
      unsupported: { ...result.coverage.unsupported },
    },
  };
}
