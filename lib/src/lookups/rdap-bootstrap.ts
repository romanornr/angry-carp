import * as v from 'valibot';
import { requestJson, type RequestFailure } from './request-json.ts';

type BootstrapUrl = `https://data.iana.org/rdap/${'dns' | 'ipv4' | 'ipv6'}.json`;
type Response = Awaited<ReturnType<typeof requestJson>>;
const accept = 'application/rdap+json, application/json';

/** Run-owned discovery only. Callers cancel their wait; the owner cancels the shared request. */
export function createRdapBootstrap(ownerSignal: AbortSignal) {
  const entries = new Map<BootstrapUrl, Promise<Response>>();

  function start(url: BootstrapUrl, schema: v.GenericSchema) {
    const signal = AbortSignal.any([ownerSignal, AbortSignal.timeout(15_000)]);
    const pending = requestJson({ url, signal, accept }).then((response) => {
      // Validate under the owner even if no waiter survives. Keep raw input for transformed schemas on reuse.
      if (response.kind === 'received' && !v.is(schema, response.body)) {
        return { kind: 'unavailable', reason: 'invalid_response' } satisfies RequestFailure;
      }
      return response;
    });
    entries.set(url, pending);
    // The owner evicts failures even if every waiter has already cancelled.
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
    // A collapsed request may only satisfy another caller when its response permits reuse.
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
