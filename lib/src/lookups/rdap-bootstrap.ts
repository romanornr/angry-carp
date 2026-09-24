/**
 * Shares IANA service-discovery downloads within one analysis run.
 * The file format is defined in RFC 9224:
 * https://www.rfc-editor.org/rfc/rfc9224.html#section-3
 *
 * Lifecycle:
 * - Lookups can share a pending download and reuse its result while HTTP freshness permits.
 * - The run's signal cancels the shared request.
 * - Each caller's signal cancels only its wait, because other callers may still need the download.
 * - Failed responses are removed, and expired responses cannot satisfy a later caller.
 *
 * The domain and IP modules select a service from the downloaded data.
 * requestJson calculates how long the response can be reused.
 */
import * as v from 'valibot';
import { requestJson, type RequestFailure } from './request-json.ts';

type BootstrapUrl = `https://data.iana.org/rdap/${'dns' | 'ipv4' | 'ipv6'}.json`;
type Response = Awaited<ReturnType<typeof requestJson>>;
const accept = 'application/rdap+json, application/json';

/**
 * Creates a loader tied to ownerSignal, which cancels its shared requests.
 * Each read accepts a separate signal that cancels only that caller's wait.
 */
export function createRdapBootstrap(ownerSignal: AbortSignal) {
  const entries = new Map<BootstrapUrl, Promise<Response>>();

  function start(url: BootstrapUrl, schema: v.GenericSchema) {
    const signal = AbortSignal.any([ownerSignal, AbortSignal.timeout(15_000)]);
    const pending = requestJson({ url, signal, accept }).then((response) => {
      // Validate even if every caller has cancelled its wait.
      // Retain raw JSON so reused responses can pass through the caller's schema transformation.
      if (response.kind === 'received' && !v.is(schema, response.body)) {
        return { kind: 'unavailable', reason: 'invalid_response' } satisfies RequestFailure;
      }
      return response;
    });
    entries.set(url, pending);
    // Remove failed downloads even if no caller is still waiting for them.
    void pending.then((response) => {
      if (response.kind !== 'received' && entries.get(url) === pending) entries.delete(url);
    });
    return pending;
  }

  return async function read<T extends v.GenericSchema>(url: BootstrapUrl, schema: T, callerSignal: AbortSignal) {
    const signal = AbortSignal.any([ownerSignal, callerSignal]);
    if (signal.aborted) return cancelled(signal);
    let pending = entries.get(url);
    const reused = pending !== undefined;
    pending ??= start(url, schema);
    let response = await waitFor(pending, signal);
    // Sharing a pending download does not override the response's restrictions on reuse.
    if (reused && response.kind === 'received' && response.freshUntil <= Date.now() && !signal.aborted) {
      pending = start(url, schema);
      response = await waitFor(pending, signal);
    }
    if (response.kind !== 'received') return response;
    const parsed = v.safeParse(schema, response.body);
    if ((!parsed.success || response.freshUntil <= Date.now()) && entries.get(url) === pending) entries.delete(url);
    if (!parsed.success) return { kind: 'unavailable', reason: 'invalid_response' } satisfies RequestFailure;
    return { ...response, body: parsed.output };
  };
}

export type RdapOptions = { signal?: AbortSignal; bootstrap?: ReturnType<typeof createRdapBootstrap> };
export type RdapDiscovery = { sourceUrl: string; retrievedAt: string } | null;

function cancelled(signal: AbortSignal): RequestFailure {
  if (signal.reason instanceof DOMException && signal.reason.name === 'TimeoutError') {
    return { kind: 'unavailable', reason: 'timeout' };
  }
  return { kind: 'unavailable', reason: 'cancelled' };
}

function waitFor(pending: Promise<Response>, signal: AbortSignal): Promise<Response> {
  return new Promise((resolve) => {
    const abort = () => resolve(cancelled(signal));
    if (signal.aborted) { abort(); return; }
    signal.addEventListener('abort', abort, { once: true });
    void pending.then((response) => {
      signal.removeEventListener('abort', abort);
      if (signal.aborted) resolve(cancelled(signal));
      else resolve(response);
    });
  });
}
