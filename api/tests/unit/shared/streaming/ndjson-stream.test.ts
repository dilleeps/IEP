import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NdjsonStream, createNdjsonStream, noopEmit, type StreamEvent } from '../../../../src/shared/streaming/ndjson-stream.js';

function makeMockRes() {
  const written: string[] = [];
  return {
    writableEnded: false,
    status: vi.fn().mockReturnThis(),
    setHeader: vi.fn(),
    flushHeaders: vi.fn(),
    write: vi.fn((chunk: string) => written.push(chunk)),
    end: vi.fn(function (this: any) { this.writableEnded = true; }),
    on: vi.fn(),
    _written: written,
  };
}

function parseLines(res: ReturnType<typeof makeMockRes>): StreamEvent[] {
  return res._written
    .join('')
    .split('\n')
    .filter(Boolean)
    .map((l) => JSON.parse(l));
}

describe('NdjsonStream', () => {
  describe('init()', () => {
    it('sets NDJSON content-type and keep-alive headers', () => {
      const res = makeMockRes();
      const stream = createNdjsonStream(res as any);
      stream.init();

      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'application/x-ndjson; charset=utf-8');
      expect(res.setHeader).toHaveBeenCalledWith('Connection', 'keep-alive');
      expect(res.flushHeaders).toHaveBeenCalled();
    });

    it('is a no-op when no response provided', () => {
      const stream = createNdjsonStream();
      expect(() => stream.init()).not.toThrow();
    });
  });

  describe('write()', () => {
    it('writes NDJSON line for a log event', () => {
      const res = makeMockRes();
      const stream = createNdjsonStream(res as any);
      stream.init();

      const event: StreamEvent = { type: 'log', ts: '2026-01-01T00:00:00.000Z', message: 'hello', stage: 'test' };
      stream.write(event);

      const lines = parseLines(res);
      expect(lines).toHaveLength(1);
      expect(lines[0]).toMatchObject({ type: 'log', message: 'hello', stage: 'test' });
    });

    it('writes NDJSON line for a ping event', () => {
      const res = makeMockRes();
      const stream = createNdjsonStream(res as any);
      stream.init();

      stream.write({ type: 'ping', ts: '2026-01-01T00:00:00.000Z' });

      const lines = parseLines(res);
      expect(lines[0]).toMatchObject({ type: 'ping' });
    });

    it('is a no-op when no response provided', () => {
      const stream = createNdjsonStream();
      expect(() => stream.write({ type: 'ping', ts: '2026-01-01T00:00:00.000Z' })).not.toThrow();
    });
  });

  describe('sendLog() / sendResult() / sendError()', () => {
    it('sendLog emits a log event with correct shape', () => {
      const res = makeMockRes();
      const stream = createNdjsonStream(res as any);
      stream.init();
      stream.sendLog('step one', 'init', { id: '123' });

      const [event] = parseLines(res);
      expect(event).toMatchObject({ type: 'log', message: 'step one', stage: 'init' });
      expect((event as any).meta).toEqual({ id: '123' });
    });

    it('sendResult emits result event and ends stream', () => {
      const res = makeMockRes();
      const stream = createNdjsonStream(res as any);
      stream.init();
      stream.sendResult({ value: 42 });

      const events = parseLines(res);
      expect(events[0]).toMatchObject({ type: 'result', data: { value: 42 } });
      expect(res.end).toHaveBeenCalled();
    });

    it('sendError emits error event and ends stream', () => {
      const res = makeMockRes();
      const stream = createNdjsonStream(res as any);
      stream.init();
      stream.sendError('something broke', { code: 500 });

      const events = parseLines(res);
      expect(events[0]).toMatchObject({ type: 'error', message: 'something broke' });
      expect(res.end).toHaveBeenCalled();
    });
  });

  describe('end()', () => {
    it('ends the response', () => {
      const res = makeMockRes();
      const stream = createNdjsonStream(res as any);
      stream.init();
      stream.end();
      expect(res.end).toHaveBeenCalledTimes(1);
    });

    it('does not double-end when writableEnded is true', () => {
      const res = makeMockRes();
      res.writableEnded = true;
      const stream = createNdjsonStream(res as any);
      stream.end();
      expect(res.end).not.toHaveBeenCalled();
    });

    it('is safe to call multiple times', () => {
      const res = makeMockRes();
      const stream = createNdjsonStream(res as any);
      stream.init();
      stream.end();
      stream.end(); // second call — writableEnded is now true from first
      expect(res.end).toHaveBeenCalledTimes(1);
    });
  });

  describe('startKeepAlive()', () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    it('sends ping events at the specified interval', () => {
      const res = makeMockRes();
      // simulate res.on('close'/'finish') with no-op
      res.on.mockImplementation(() => {});
      const stream = createNdjsonStream(res as any);
      stream.init();
      stream.startKeepAlive(1_000);

      vi.advanceTimersByTime(3_100);

      const events = parseLines(res);
      const pings = events.filter((e) => e.type === 'ping');
      expect(pings.length).toBeGreaterThanOrEqual(3);
    });

    it('stops pinging when close event fires', () => {
      const res = makeMockRes();
      let closeHandler: (() => void) | undefined;
      res.on.mockImplementation((event: string, handler: () => void) => {
        if (event === 'close') closeHandler = handler;
      });

      const stream = createNdjsonStream(res as any);
      stream.init();
      stream.startKeepAlive(500);

      vi.advanceTimersByTime(600);
      closeHandler?.();
      vi.advanceTimersByTime(1_000);

      const pings = parseLines(res).filter((e) => e.type === 'ping');
      expect(pings.length).toBe(1);
    });

    it('is a no-op when no response provided', () => {
      const stream = createNdjsonStream();
      expect(() => stream.startKeepAlive(100)).not.toThrow();
    });
  });
});

describe('noopEmit', () => {
  it('does not throw for any event type', () => {
    expect(() => noopEmit({ type: 'log', ts: '', message: 'x' })).not.toThrow();
    expect(() => noopEmit({ type: 'result', ts: '', data: {} })).not.toThrow();
    expect(() => noopEmit({ type: 'error', ts: '', message: 'x' })).not.toThrow();
    expect(() => noopEmit({ type: 'ping', ts: '' })).not.toThrow();
  });
});
