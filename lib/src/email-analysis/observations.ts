import { domainToASCII } from 'node:url';
import { parse as parseDomain } from 'tldts';
import * as v from 'valibot';
import addresses from 'email-addresses';
import { extractEmailLinks, type EmailLinks } from '../email-links/extract-links.ts';
import { domainSchema } from '../lookups/rdap.ts';
import { ipAddressSchema } from '../lookups/ip-rdap.ts';
import type { ParsedMessage } from './parse-message.ts';

// IDNA conversion uses a URL host parser, which would otherwise discard a slash and its suffix.
const observedDomainSchema = v.pipe(v.string(), v.maxLength(1024),
  v.regex(/^[^/\\:@?#%\s]+$/u), v.transform(domainToASCII), domainSchema);

export type HostObservation = {
  id: string;
  sourceId: string;
  messageId: string;
  role: 'action' | 'text-reference' | 'image' | 'from' | 'sender' | 'reply-to' | 'return-path' | 'authentication' | 'mail-from' | 'signature';
  context: 'marked_quote' | 'unmarked' | 'embedded_message';
  host: string;
  enclosingActionId: string | null;
};
export type CoverageGap = { sourceId: string; reason: string };

const priority: Record<HostObservation['role'], number> = {
  action: 0, 'mail-from': 1, 'return-path': 2, from: 3, sender: 4, 'reply-to': 5,
  authentication: 6, signature: 7, 'text-reference': 8, image: 9,
};

/** Shared selection order for lookup and disclosure budgets; never mutates source occurrences. */
export function prioritizeHosts(hosts: HostObservation[]): HostObservation[] {
  return hosts.toSorted((a, b) => {
    if (a.context === 'unmarked' && b.context !== 'unmarked') return -1;
    if (b.context === 'unmarked' && a.context !== 'unmarked') return 1;
    return priority[a.role] - priority[b.role];
  });
}

/** Retains exact hosts and part ownership. Quote markers indicate syntax, not verified authorship. */
export function observeMessage(message: ParsedMessage) {
  const hosts: HostObservation[] = [];
  const html: { sourceId: string; result: EmailLinks }[] = [];
  const names: { sourceId: string; value: string; context: HostObservation['context'] }[] = [];
  const gaps: CoverageGap[] = [...message.limitations];
  function add(observation: Omit<HostObservation, 'host'>, host: string) {
    if (hosts.length >= 512) {
      if (!gaps.some(({ reason }) => reason === 'host_occurrence_limit')) gaps.push({ sourceId: 'message', reason: 'host_occurrence_limit' });
      return;
    }
    hosts.push({ ...observation, host });
  }
  for (const part of message.parts) {
    if (part.content.kind !== 'text') continue;
    if (part.contentType === 'text/html') {
      let result: EmailLinks;
      try { result = extractEmailLinks(part.content.text); }
      catch { gaps.push({ sourceId: part.id, reason: 'html_extraction_failed_or_limited' }); continue; }
      html.push({ sourceId: part.id, result });
      gaps.push({ sourceId: part.id, reason: 'html_quote_boundaries_heuristic' });
      for (const reason of result.coverage.limits) gaps.push({ sourceId: part.id, reason });
      for (const [feature, count] of Object.entries(result.coverage.unsupported)) {
        if (count) gaps.push({ sourceId: part.id, reason: `unsupported_html_${feature}:${count}` });
      }
      for (const occurrence of result.occurrences) {
        const reference = occurrence.reference;
        if ((reference.kind !== 'web' && reference.kind !== 'scheme_relative') || !reference.hostname) {
          gaps.push({ sourceId: `${part.id}/html${occurrence.id}`, reason: `unresolved_reference:${reference.kind}:${occurrence.kind}` });
          continue;
        }
        let role: HostObservation['role'] = 'action';
        let enclosingActionId: string | null = null;
        if (occurrence.kind === 'image') {
          role = 'image';
          if (occurrence.enclosingAnchorId !== null) enclosingActionId = `${part.id}/html${occurrence.enclosingAnchorId}`;
        }
        let context: HostObservation['context'] = occurrence.quoteContext;
        if (part.messageId !== 'message') context = 'embedded_message';
        if (occurrence.kind === 'image' && occurrence.alt) names.push({ sourceId: `${part.id}/html${occurrence.id}`, value: occurrence.alt, context });
        add({ id: `${part.id}/html${occurrence.id}`, sourceId: part.id, messageId: part.messageId,
          role, context, enclosingActionId }, reference.hostname);
      }
    } else {
      // Syntactic HTTP(S) references only; punctuation, defanging and prose forwarding boundaries remain ambiguous.
      let count = 0;
      for (const match of part.content.text.matchAll(/https?:\/\/[^\s<>"']+/giu)) {
        if (count++ >= 200) { gaps.push({ sourceId: part.id, reason: 'plain_link_limit' }); break; }
        const url = URL.parse(match[0]);
        if (!url || !url.hostname) continue;
        const lineStart = part.content.text.lastIndexOf('\n', match.index) + 1;
        let context: HostObservation['context'] = 'unmarked';
        if (/^\s*>/.test(part.content.text.slice(lineStart, match.index))) context = 'marked_quote';
        if (part.messageId !== 'message') context = 'embedded_message';
        add({ id: `${part.id}/text${match.index}`, sourceId: part.id, messageId: part.messageId,
          role: 'text-reference', context, enclosingActionId: null }, url.hostname);
      }
      gaps.push({ sourceId: part.id, reason: 'plain_text_link_and_quote_boundaries_heuristic' });
    }
  }
  for (const observed of message.messages) {
    let context: HostObservation['context'] = 'unmarked';
    if (observed.id !== 'message') context = 'embedded_message';
    for (const field of observed.addresses) {
      const sourceId = `${observed.rootPartId}/header${field.headerIndex}`;
      if (field.result.kind === 'null_reverse_path') continue;
      if (field.result.kind !== 'parsed') { gaps.push({ sourceId, reason: field.result.reason }); continue; }
      const role = v.safeParse(v.picklist(['from', 'sender', 'reply-to', 'return-path']), field.field);
      if (!role.success) continue;
      field.result.addresses.forEach((mailbox, index) => {
        add({ id: `${sourceId}/address${index}`, sourceId, messageId: observed.id, role: role.output, context, enclosingActionId: null }, mailbox.domain);
        if (field.field === 'from' && mailbox.name) names.push({ sourceId, value: mailbox.name, context });
      });
    }
    for (const field of observed.authentication) {
      const sourceId = `${observed.rootPartId}/header${field.headerIndex}`;
      if (field.result.kind !== 'reported_results') { gaps.push({ sourceId, reason: field.result.reason }); continue; }
      for (const [index, claim] of field.result.results.entries()) {
        if (claim.interpretation !== 'supported') { gaps.push({ sourceId, reason: 'unsupported_authentication_method_version' }); continue; }
        if (!['spf', 'dkim', 'dmarc'].includes(claim.method)) continue;
        for (const [propertyIndex, property] of claim.properties.entries()) {
          if (!['header.d', 'header.i', 'smtp.mailfrom', 'smtp.helo'].includes(`${property.type}.${property.name}`)) continue;
          const host = authenticationIdentity(property.rawValue);
          if (!host) { gaps.push({ sourceId, reason: 'invalid_authentication_identity' }); continue; }
          let role: HostObservation['role'] = 'authentication';
          if (property.type === 'smtp' && property.name === 'mailfrom') role = 'mail-from';
          add({ id: `${sourceId}/claim${index}/property${propertyIndex}`, sourceId, messageId: observed.id,
            role, context, enclosingActionId: null }, host);
        }
      }
    }
    for (const field of observed.signatures) {
      const sourceId = `${observed.rootPartId}/header${field.headerIndex}`;
      if (field.result.kind !== 'signature_tags' || field.result.duplicateTags.length) {
        gaps.push({ sourceId, reason: 'unusable_signature_tags' }); continue;
      }
      const domain = field.result.tags.find(({ name }) => name === 'd')?.value;
      if (domain) add({ id: `${sourceId}/d`, sourceId, messageId: observed.id, role: 'signature', context, enclosingActionId: null }, domain);
    }
  }
  return { hosts, html, names, gaps };
}

// RFC 8601 property values are opaque until interpreted for a particular identity.
export function authenticationIdentity(raw: string): string | null {
  const domain = v.safeParse(observedDomainSchema, raw);
  if (domain.success) return domain.output;
  let mailbox = raw;
  if (raw.startsWith('@')) mailbox = `identity${raw}`;
  let parsed: ReturnType<typeof addresses.parseOneAddress>;
  try { parsed = addresses.parseOneAddress(mailbox); }
  catch { return null; }
  if (!parsed || parsed.type !== 'mailbox') return null;
  const validated = v.safeParse(observedDomainSchema, parsed.domain);
  if (validated.success) return validated.output;
  return null;
}

export function classifyHost(input: string) {
  const ip = v.safeParse(ipAddressSchema, input.replace(/^\[|\]$/g, ''));
  if (ip.success) return { kind: 'ip_literal', address: ip.output } as const;
  const host = v.safeParse(observedDomainSchema, input.toLowerCase().replace(/\.$/, ''));
  if (!host.success) return { kind: 'invalid_host' } as const;
  const parsed = parseDomain(host.output, { allowPrivateDomains: false });
  const registration = v.safeParse(domainSchema, parsed.domain);
  if (!parsed.isIcann || !registration.success || host.output === 'home.arpa' || host.output.endsWith('.home.arpa')) {
    return { kind: 'unknown_or_special_suffix', host: host.output } as const;
  }
  return { kind: 'dns', host: host.output, registration: registration.output } as const;
}
