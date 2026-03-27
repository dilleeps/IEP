import type { Response } from 'express';

/**
 * NDJSON Streaming Event Types
 */
export type StreamEvent =
  | { type: 'log'; ts: string; message: string; stage?: string; meta?: any }
  | { type: 'result'; ts: string; data: any }
  | { type: 'error'; ts: string; message: string; details?: any }
  | { type: 'ping'; ts: string };

/** Callback type for services to emit stream events without coupling to HTTP */
export type StreamEmit = (event: StreamEvent) => void;

/** No-op emit — default when no streaming response is provided */
export const noopEmit: StreamEmit = () => {};

/**
 * NDJSON Stream Helper
 * Provides abstractions for sending progress logs, results, and errors
 * over HTTP using newline-delimited JSON (NDJSON)
 */
export class NdjsonStream {
  private res?: Response;
  private streaming: boolean;

  constructor(res?: Response) {
    this.res = res;
    this.streaming = !!res;
  }

  /**
   * Initialize the NDJSON stream response headers
   * Call this before sending any events
   */
  init(): void {
    if (!this.streaming || !this.res) return;

    this.res.status(200);
    this.res.setHeader('Content-Type', 'application/x-ndjson; charset=utf-8');
    this.res.setHeader('Cache-Control', 'no-cache, no-transform');
    this.res.setHeader('Connection', 'keep-alive');
    this.res.flushHeaders?.();
  }

  /**
   * Send a log event (progress update)
   * @param message - Human-readable progress message
   * @param stage - Optional stage identifier (e.g., 'preparing', 'analyzing', 'saving')
   * @param meta - Optional metadata object
   */
  sendLog(message: string, stage?: string, meta?: any): void {
    if (!this.streaming || !this.res) return;

    const event: StreamEvent = {
      type: 'log',
      ts: new Date().toISOString(),
      message,
      stage,
      meta,
    };

    this.writeEvent(event);
  }

  /**
   * Send the final result and end the stream
   * @param data - Result data to send
   */
  sendResult(data: any): void {
    if (!this.streaming || !this.res) return;

    const event: StreamEvent = {
      type: 'result',
      ts: new Date().toISOString(),
      data,
    };

    this.writeEvent(event);
    this.end();
  }

  /**
   * Send an error event and end the stream
   * @param message - Error message
   * @param details - Optional error details (stack, code, etc.)
   */
  sendError(message: string, details?: any): void {
    if (!this.streaming || !this.res) return;

    const event: StreamEvent = {
      type: 'error',
      ts: new Date().toISOString(),
      message,
      details,
    };

    this.writeEvent(event);
    this.end();
  }

  /**
   * Write any StreamEvent directly (used with emit callback pattern)
   */
  write(event: StreamEvent): void {
    this.writeEvent(event);
  }

  /**
   * Start keep-alive ping interval — fires { type: 'ping' } every intervalMs.
   * Auto-clears when the client disconnects or the stream ends.
   * Only activate when client requests it via X-Stream-Capabilities: keepalive.
   */
  startKeepAlive(intervalMs = 15_000): void {
    if (!this.streaming || !this.res) return;

    const id = setInterval(() => {
      if (this.res && !this.res.writableEnded) {
        this.writeEvent({ type: 'ping', ts: new Date().toISOString() });
      } else {
        clearInterval(id);
      }
    }, intervalMs);

    this.res.on('close', () => clearInterval(id));
    this.res.on('finish', () => clearInterval(id));
  }

  /**
   * Check if streaming is enabled
   */
  isStreaming(): boolean {
    return this.streaming;
  }

  /**
   * End the stream without sending a result
   * Use this for early termination or when result was already sent
   */
  end(): void {
    if (this.streaming && this.res && !this.res.writableEnded) {
      this.res.end();
    }
  }

  /**
   * Internal: write a single NDJSON event
   */
  private writeEvent(event: StreamEvent): void {
    if (!this.res) return;
    this.res.write(JSON.stringify(event) + '\n');
  }
}

/**
 * Factory function to create a new NDJSON stream
 * @param res - Express response object (optional)
 * @returns NdjsonStream instance
 */
export function createNdjsonStream(res?: Response): NdjsonStream {
  return new NdjsonStream(res);
}
