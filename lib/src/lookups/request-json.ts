const maxResponseBytes = 512 * 1024;

export type RequestFailure =
  | { kind: 'http_error'; status: number }
  | {
    kind: 'unavailable';
    reason: 'request_failed' | 'name_resolution' | 'connection_reset' | 'cancelled' | 'timeout' | 'invalid_response' | 'response_too_large' | 'redirected';
  };

export async function requestJson({ url, signal, accept }: {
  url: string;
  signal: AbortSignal;
  accept: string;
}): Promise<{ kind: 'received'; body: unknown; retrievedAt: string; freshUntil: number } | RequestFailure> {
  try {
    signal.throwIfAborted();
    const startedAt = Date.now();
    const response = await fetch(url, {
      headers: { accept },
      credentials: 'omit',
      redirect: 'manual',
      signal,
    });
    const receivedAt = Date.now();
    if (!response.ok) {
      await response.body?.cancel();
      if (response.status >= 300 && response.status < 400) {
        return { kind: 'unavailable', reason: 'redirected' };
      }
      return { kind: 'http_error', status: response.status };
    }
    if (!response.body) return { kind: 'unavailable', reason: 'invalid_response' };

    const decoder = new TextDecoder();
    let bytes = 0;
    let text = '';
    // Exiting iteration cancels the body, including when the byte limit is exceeded.
    for await (const chunk of response.body) {
      bytes += chunk.byteLength;
      if (bytes > maxResponseBytes) return { kind: 'unavailable', reason: 'response_too_large' };
      text += decoder.decode(chunk, { stream: true });
    }
    text += decoder.decode();
    let expiry = 0;
    if (response.status === 200) expiry = freshUntil(response.headers, startedAt, receivedAt);
    try {
      return { kind: 'received', body: JSON.parse(text), retrievedAt: new Date(receivedAt).toISOString(),
        freshUntil: expiry };
    } catch {
      return { kind: 'unavailable', reason: 'invalid_response' };
    }
  } catch (error) {
    if (signal.aborted) {
      let reason: 'timeout' | 'cancelled' = 'cancelled';
      if (signal.reason instanceof DOMException && signal.reason.name === 'TimeoutError') reason = 'timeout';
      return { kind: 'unavailable', reason };
    }
    const causes: unknown[] = [error];
    if (error instanceof Error) causes.push(error.cause);
    for (const cause of causes) {
      if (!cause || typeof cause !== 'object' || !('code' in cause)) continue;
      if (cause.code === 'ENOTFOUND' || cause.code === 'EAI_AGAIN') {
        return { kind: 'unavailable', reason: 'name_resolution' };
      }
      if (cause.code === 'ECONNRESET') return { kind: 'unavailable', reason: 'connection_reset' };
    }
    // Never forward server bodies, fetch exceptions, or ambient runtime details to the model.
    return { kind: 'unavailable', reason: 'request_failed' };
  }
}

// Conservative private-cache subset of RFC 9111 sections 4.2.1 and 4.2.3.
// Only the fixed request's Accept/Accept-Encoding variants can be reused by the bootstrap loader.
// Unknown directives, missing freshness and malformed values disable reuse, not the lookup.
function freshUntil(headers: Headers, startedAt: number, receivedAt: number): number {
  if (headers.has('pragma')) return 0;
  if (headers.get('vary')?.split(',').some((name) => !['accept', 'accept-encoding'].includes(name.trim().toLowerCase()))) return 0;
  const directives = new Map<string, string | undefined>();
  for (const field of (headers.get('cache-control') ?? '').split(',')) {
    if (!field.trim()) continue;
    const match = /^\s*([a-z-]+)(?:\s*=\s*(\d+|"\d+"))?\s*$/i.exec(field);
    if (!match) return 0;
    const name = match[1].toLowerCase();
    if (directives.has(name) || !['max-age', 'public', 'private', 'must-revalidate', 'no-transform'].includes(name)) return 0;
    if (name !== 'max-age' && match[2] !== undefined) return 0;
    directives.set(name, match[2]?.replaceAll('"', ''));
  }
  const date = Date.parse(headers.get('date') ?? '');
  const age = headers.get('age') ?? '0';
  if (!Number.isFinite(date) || !/^\d+$/.test(age) || !Number.isSafeInteger(Number(age))) return 0;
  let lifetime: number;
  if (directives.has('max-age')) {
    const seconds = Number(directives.get('max-age'));
    if (!Number.isSafeInteger(seconds)) return 0;
    lifetime = seconds * 1000;
  } else {
    lifetime = Date.parse(headers.get('expires') ?? '') - date;
  }
  if (!Number.isSafeInteger(lifetime) || lifetime <= 0) return 0;
  const currentAge = Math.max(0, receivedAt - date, Number(age) * 1000 + receivedAt - startedAt);
  return receivedAt + lifetime - currentAge;
}
