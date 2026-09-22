const maxResponseBytes = 512 * 1024;

export type RequestFailure =
  | { kind: 'http_error'; status: number }
  | {
    kind: 'unavailable';
    reason: 'request_failed' | 'cancelled' | 'timeout' | 'invalid_response' | 'response_too_large' | 'redirected';
  };

export async function requestJson({ url, signal, accept }: {
  url: string;
  signal: AbortSignal;
  accept: string;
}): Promise<{ kind: 'received'; body: unknown } | RequestFailure> {
  try {
    signal.throwIfAborted();
    const response = await fetch(url, {
      headers: { accept },
      credentials: 'omit',
      redirect: 'manual',
      signal,
    });
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
    try {
      return { kind: 'received', body: JSON.parse(text) };
    } catch {
      return { kind: 'unavailable', reason: 'invalid_response' };
    }
  } catch {
    if (signal.aborted) {
      let reason: 'timeout' | 'cancelled' = 'cancelled';
      if (signal.reason instanceof DOMException && signal.reason.name === 'TimeoutError') reason = 'timeout';
      return { kind: 'unavailable', reason };
    }
    // Never forward server bodies, fetch exceptions, or ambient runtime details to the model.
    return { kind: 'unavailable', reason: 'request_failed' };
  }
}
