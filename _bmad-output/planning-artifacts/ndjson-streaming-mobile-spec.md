# NDJSON Streaming — Cross-Platform Spec (Web + React Native)

> **Status: Implementation Complete** — API changes done, 22/22 tests passing. Mobile client (`apps/mobile/src/lib/http.ts`) deferred — implement when mobile auth is ready.

## Problem Statement

The existing `NdjsonStream` and `apiLongRequest` work correctly on the web via `response.body.getReader()` (WHATWG Streams). React Native 0.72 does **not** support `response.body` streaming on `fetch` — the response is buffered entirely before resolving. SSE is rejected because it lacks support for custom request headers (e.g. `Authorization`).

**Solution:** Keep NDJSON as the wire format and the same endpoint for all clients. Behaviour is negotiated via the `X-Stream-Capabilities` request header. Default (no header) preserves the current web behaviour exactly. Mobile sends `keepalive` capability to opt into heartbeat pings. Services are refactored to accept an `emit` callback, decoupling transport from business logic.

---

## Stream Capability Negotiation

Single endpoint, client declares what it needs via header:

| Client | Header sent | Behaviour |
|---|---|---|
| Web (`apiLongRequest`) | *(none)* | Default NDJSON — no changes, backward-compatible |
| Mobile (`apiStreamRequest`) | `X-Stream-Capabilities: keepalive` | NDJSON + `ping` events every 15s |
| Future | `X-Stream-Capabilities: keepalive,compressed` | Comma-separated, additive |

**Rule:** If `X-Stream-Capabilities` header is absent or empty → current behaviour, no pings.

---

## Scope

| Area | Change |
|---|---|
| `apps/api/src/shared/streaming/ndjson-stream.ts` | Add `ping` event type + `startKeepAlive()` method + `write()` public method |
| `apps/api/src/modules/document/extraction.service.ts` | Refactor `analyzeDocument` to accept `emit` callback |
| `apps/api/src/modules/document/document.controller.ts` | Read `X-Stream-Capabilities` header; conditionally start keep-alive |
| `apps/mobile/src/lib/http.ts` | New file — XHR-based NDJSON stream client that sends `X-Stream-Capabilities: keepalive` |

**No changes** to `apps/ui/src/lib/http.ts` — web client unchanged.

---

## 1. API — `ndjson-stream.ts` Changes

### 1a. Add `ping` to `StreamEvent`

```ts
export type StreamEvent =
  | { type: 'log';    ts: string; message: string; stage?: string; meta?: any }
  | { type: 'result'; ts: string; data: any }
  | { type: 'error';  ts: string; message: string; details?: any }
  | { type: 'ping';   ts: string };   // ← ADD
```

### 1b. Add `write()` public method

Expose a public `write(event)` so controllers can call it directly via the emit callback pattern.

```ts
write(event: StreamEvent): void {
  this.writeEvent(event);
}
```

### 1c. Add `startKeepAlive(intervalMs?: number)` method

Fires a `ping` on an interval; auto-clears when the client disconnects.

```ts
startKeepAlive(intervalMs = 15_000): void {
  if (!this.streaming || !this.res) return;
  const id = setInterval(() => {
    if (!this.res?.writableEnded) {
      this.writeEvent({ type: 'ping', ts: new Date().toISOString() });
    }
  }, intervalMs);
  this.res.on('close', () => clearInterval(id));
  this.res.on('finish', () => clearInterval(id));
}
```

---

## 2. API — `extraction.service.ts` Refactor

### Current signature
```ts
async analyzeDocument(documentId: string, res?: Response): Promise<ExtractionResult>
```

### New signature
```ts
type StreamEmit = (event: StreamEvent) => void;
const noopEmit: StreamEmit = () => {};

async analyzeDocument(documentId: string, emit: StreamEmit = noopEmit): Promise<ExtractionResult>
```

### Migration rules
- Replace every `stream.sendLog(...)` → `emit({ type: 'log', ts: new Date().toISOString(), message, stage, meta })`
- Replace `stream.sendResult(data)` → `emit({ type: 'result', ts: new Date().toISOString(), data })`
- Replace `stream.sendError(message, details)` → `emit({ type: 'error', ts: new Date().toISOString(), message, details })`
- Remove `createNdjsonStream` import from the service — service no longer knows about HTTP
- Remove all `stream.isStreaming()` branches — emit is always safe to call (noop by default)
- Do **not** call `stream.init()` or `stream.end()` from the service — that is the controller's job

---

## 3. API — `document.controller.ts` Changes

### `analyzeIepDocument` controller method

Read `X-Stream-Capabilities` from the request header. Parse as comma-separated list. Start keep-alive only if `keepalive` is present. Default (header absent) preserves existing behaviour.

```ts
analyzeIepDocument = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const capabilities = (req.headers['x-stream-capabilities'] ?? '')
      .toString()
      .split(',')
      .map((s) => s.trim().toLowerCase());

    const stream = createNdjsonStream(res);
    stream.init();

    if (capabilities.includes('keepalive')) {
      stream.startKeepAlive(15_000);
    }

    await this.extractionService.analyzeDocument(
      req.params.id,
      (event) => stream.write(event),
    );
    stream.end();
  } catch (error) {
    next(error);
  }
};
```

> **Note:** `stream.end()` guards with `!res.writableEnded` internally — safe to call even if `sendResult`/`sendError` already closed the stream.

---

## 4. Mobile — `apps/mobile/src/lib/http.ts` (New File)

### Token storage
Mirror the web pattern — read from `AsyncStorage` (or wherever mobile auth stores the token).

```ts
import AsyncStorage from '@react-native-async-storage/async-storage';

async function getAccessToken(): Promise<string | null> {
  try {
    const raw = await AsyncStorage.getItem('session');
    if (!raw) return null;
    return JSON.parse(raw)?.accessToken ?? null;
  } catch {
    return null;
  }
}
```

> Adjust key name to match whatever key mobile auth uses when it is implemented.

### Stream event types (mirror server)

```ts
export type StreamLogEvent    = { type: 'log';    ts: string; message: string; stage?: string; meta?: Record<string, unknown> };
export type StreamResultEvent<T> = { type: 'result'; ts: string; data: T };
export type StreamErrorEvent  = { type: 'error';  ts: string; message: string; details?: unknown };
export type StreamPingEvent   = { type: 'ping';   ts: string };
export type StreamEvent<T = unknown> = StreamLogEvent | StreamResultEvent<T> | StreamErrorEvent | StreamPingEvent;
```

### `apiStreamRequest` — XHR NDJSON client

```ts
const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:3000';

export interface StreamCallbacks<T> {
  onLog?:    (event: StreamLogEvent) => void;
  onResult:  (data: T) => void;
  onError:   (message: string, details?: unknown) => void;
}

export interface StreamRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
}

export async function apiStreamRequest<T>(
  path: string,
  options: StreamRequestOptions = {},
  callbacks: StreamCallbacks<T>,
): Promise<() => void> {
  const token = await getAccessToken();
  const url = path.startsWith('http') ? path : `${API_BASE_URL}${path}`;

  const xhr = new XMLHttpRequest();
  let cursor = 0;

  xhr.onprogress = () => {
    const chunk = xhr.responseText.slice(cursor);
    cursor = xhr.responseText.length;

    const lines = chunk.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      try {
        const event = JSON.parse(trimmed) as StreamEvent<T>;

        if (event.type === 'ping') continue; // keep-alive — ignore silently

        if (event.type === 'log') {
          callbacks.onLog?.(event);
        } else if (event.type === 'result') {
          callbacks.onResult(event.data);
        } else if (event.type === 'error') {
          callbacks.onError(event.message, event.details);
        }
      } catch {
        // incomplete JSON chunk — will be retried on next onprogress
      }
    }
  };

  xhr.onerror = () => callbacks.onError('Network error');
  xhr.ontimeout = () => callbacks.onError('Request timed out');
  xhr.timeout = 300_000; // 5 minutes

  xhr.open(options.method ?? 'GET', url);
  xhr.setRequestHeader('Accept', 'application/x-ndjson');
  xhr.setRequestHeader('X-Stream-Capabilities', 'keepalive'); // opt-in to keep-alive pings
  if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
  if (options.headers) {
    for (const [k, v] of Object.entries(options.headers)) {
      xhr.setRequestHeader(k, v);
    }
  }
  if (options.body) {
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(JSON.stringify(options.body));
  } else {
    xhr.send();
  }

  return () => xhr.abort(); // caller holds cancel function
}
```

### Usage example (React Native screen)

```ts
useEffect(() => {
  let cancel: (() => void) | undefined;

  apiStreamRequest<ExtractionResult>(
    `/api/documents/${documentId}/analyze-iep`,
    { method: 'GET' },
    {
      onLog:    (e) => setStatus(e.message),
      onResult: (data) => { setResult(data); setStatus('Done'); },
      onError:  (msg) => setError(msg),
    },
  ).then((cancelFn) => { cancel = cancelFn; });

  return () => cancel?.();
}, [documentId]);
```

---

## Implementation Order

1. `ndjson-stream.ts` — add `ping` type, `write()`, `startKeepAlive()`
2. `extraction.service.ts` — swap `res?: Response` → `emit: StreamEmit`
3. `document.controller.ts` — wire `stream + keepAlive + emit callback`
4. `apps/mobile/src/lib/http.ts` — new file with `apiStreamRequest`

Steps 1–3 are backward-compatible with the existing web UI. No changes to `apps/ui`.

---

## Notes / Decisions

- **Single endpoint:** `X-Stream-Capabilities` header drives behaviour. No separate mobile endpoint. Default (no header) = unchanged web behaviour.
- **Why not SSE on mobile?** RN 0.72 has no native `EventSource`. Polyfills exist but add a dependency and still lack `Authorization` header support in some implementations.
- **Why not `fetch` streaming on RN?** `response.body.getReader()` is not available in RN 0.72. Available from RN 0.73+ with the New Architecture enabled.
- **Keep-alive interval:** 15 seconds is a safe default. Most mobile proxies/NATs timeout idle TCP connections at 30s+.
- **Incomplete chunk safety:** The XHR `onprogress` parser splits on `\n` and silently skips lines that fail `JSON.parse` — they will arrive complete on the next progress event.
- **Extensibility:** Future capabilities (e.g. `compressed`, `progress-only`) follow the same comma-separated header pattern — no endpoint or service changes needed.
- **Token storage key:** Placeholder uses `'session'` key in `AsyncStorage`. Update to match mobile auth implementation when built.
