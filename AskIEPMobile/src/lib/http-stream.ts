import { secureStore } from './secure-store';

const MAX_RETRIES = 3;
const BACKOFF_BASE_MS = 1000;

export interface StreamCallbacks<T = any> {
  onData: (chunk: T) => void;
  onError: (error: Error) => void;
  onComplete: () => void;
}

/**
 * NDJSON streaming utility for real-time server events.
 * Used by IEP analysis, Advocacy Lab, and Legal Support.
 * Handles cellular network resilience (NFR21) and retry with exponential backoff.
 */
export async function streamNDJSON<T = any>(
  url: string,
  callbacks: StreamCallbacks<T>,
  options: RequestInit = {},
): Promise<AbortController> {
  const controller = new AbortController();
  let retryCount = 0;

  const connect = async (): Promise<void> => {
    const token = await secureStore.getToken();

    const headers: Record<string, string> = {
      Accept: 'application/x-ndjson',
      'X-Stream-Capabilities': 'keepalive',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Stream failed (${response.status})`);
      }

      if (!response.body) {
        throw new Error('No response body for stream');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      retryCount = 0; // Reset on successful connection

      while (true) {
        const {done, value} = await reader.read();

        if (done) {
          if (buffer.trim()) {
            tryParseChunk(buffer.trim(), callbacks.onData);
          }
          callbacks.onComplete();
          return;
        }

        buffer += decoder.decode(value, {stream: true});
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          tryParseChunk(trimmed, callbacks.onData);
        }
      }
    } catch (error: any) {
      if (controller.signal.aborted) {
        return;
      }

      if (retryCount < MAX_RETRIES) {
        retryCount++;
        const delay = BACKOFF_BASE_MS * Math.pow(2, retryCount - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
        return connect();
      }

      callbacks.onError(new Error('Connection lost. Tap to retry.'));
    }
  };

  connect();
  return controller;
}

function tryParseChunk<T>(line: string, onData: (chunk: T) => void): void {
  try {
    const parsed = JSON.parse(line);
    onData(parsed);
  } catch {
    // Skip unparseable lines (e.g., keepalive pings)
  }
}
