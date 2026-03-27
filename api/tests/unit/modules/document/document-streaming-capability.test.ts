import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Response } from 'express';
import type { AuthRequest } from '../../../../src/middleware/authenticate.js';
import type { StreamEvent } from '../../../../src/shared/streaming/ndjson-stream.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeMockRes() {
  const written: string[] = [];
  const res = {
    writableEnded: false,
    status: vi.fn().mockReturnThis(),
    setHeader: vi.fn(),
    flushHeaders: vi.fn(),
    write: vi.fn((chunk: string) => written.push(chunk)),
    end: vi.fn(function (this: any) { this.writableEnded = true; }),
    on: vi.fn(),
    _written: written,
  };
  return res;
}

function parseEvents(res: ReturnType<typeof makeMockRes>): StreamEvent[] {
  return res._written
    .join('')
    .split('\n')
    .filter(Boolean)
    .map((l) => JSON.parse(l));
}

function makeReq(capabilities?: string): Partial<AuthRequest> {
  return {
    params: { id: 'doc-123' },
    headers: capabilities ? { 'x-stream-capabilities': capabilities } : {},
    user: { id: 'user-1' } as any,
  };
}

// ---------------------------------------------------------------------------
// Mock ExtractionService
// ---------------------------------------------------------------------------

const mockAnalyzeDocument = vi.fn();

vi.mock('../../../../src/modules/document/extraction.service.js', () => ({
  ExtractionService: vi.fn().mockImplementation(() => ({
    analyzeDocument: mockAnalyzeDocument,
  })),
}));

// Mock other services used by DocumentController constructor
vi.mock('../../../../src/modules/document/document.service.js', () => ({
  DocumentService: vi.fn().mockImplementation(() => ({})),
}));
vi.mock('../../../../src/modules/document/correction.service.js', () => ({
  CorrectionService: vi.fn().mockImplementation(() => ({})),
}));
vi.mock('../../../../src/modules/document/normalization.service.js', () => ({
  NormalizationService: vi.fn().mockImplementation(() => ({})),
}));
vi.mock('../../../../src/config/appenv.js', () => ({
  appenv: { get: vi.fn().mockReturnValue('26214400') },
}));

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('DocumentController.analyzeIepDocument — X-Stream-Capabilities', () => {
  let controller: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockAnalyzeDocument.mockResolvedValue({ goals: [], confidence: {} });
    const { DocumentController } = await import('../../../../src/modules/document/document.controller.js');
    controller = new DocumentController();
  });

  it('streams NDJSON without keep-alive when no header provided', async () => {
    const res = makeMockRes();
    const next = vi.fn();

    await controller.analyzeIepDocument(makeReq() as any, res as any, next);

    // startKeepAlive was NOT called — no ping events
    const events = parseEvents(res);
    expect(events.some((e) => e.type === 'ping')).toBe(false);
    expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'application/x-ndjson; charset=utf-8');
    expect(next).not.toHaveBeenCalled();
  });

  it('passes emit callback to extraction service', async () => {
    const res = makeMockRes();
    const next = vi.fn();

    await controller.analyzeIepDocument(makeReq() as any, res as any, next);

    expect(mockAnalyzeDocument).toHaveBeenCalledWith('doc-123', expect.any(Function));
  });

  it('emit callback writes events to the stream', async () => {
    const res = makeMockRes();
    const next = vi.fn();

    // Simulate service emitting a log then result
    mockAnalyzeDocument.mockImplementation(async (_id: string, emit: (e: StreamEvent) => void) => {
      emit({ type: 'log', ts: '2026-01-01T00:00:00.000Z', message: 'processing', stage: 'test' });
      emit({ type: 'result', ts: '2026-01-01T00:00:00.000Z', data: { done: true } });
      return { done: true };
    });

    await controller.analyzeIepDocument(makeReq() as any, res as any, next);

    const events = parseEvents(res);
    expect(events).toContainEqual(expect.objectContaining({ type: 'log', message: 'processing' }));
    expect(events).toContainEqual(expect.objectContaining({ type: 'result', data: { done: true } }));
  });

  it('activates keep-alive when X-Stream-Capabilities: keepalive header is present', async () => {
    vi.useFakeTimers();
    const res = makeMockRes();
    res.on.mockImplementation(() => {});
    const next = vi.fn();

    // Service resolves after timer advance
    let resolve: () => void;
    mockAnalyzeDocument.mockImplementation(
      () => new Promise<void>((r) => { resolve = r; }).then(() => ({ goals: [] })),
    );

    const promise = controller.analyzeIepDocument(makeReq('keepalive') as any, res as any, next);

    // Advance timers to trigger keep-alive pings
    vi.advanceTimersByTime(16_000);
    resolve!();
    await promise;
    vi.useRealTimers();

    const pings = parseEvents(res).filter((e) => e.type === 'ping');
    expect(pings.length).toBeGreaterThanOrEqual(1);
  });

  it('is case-insensitive for capability values (KEEPALIVE)', async () => {
    vi.useFakeTimers();
    const res = makeMockRes();
    res.on.mockImplementation(() => {});
    const next = vi.fn();

    let resolve: () => void;
    mockAnalyzeDocument.mockImplementation(
      () => new Promise<void>((r) => { resolve = r; }).then(() => ({ goals: [] })),
    );

    const promise = controller.analyzeIepDocument(makeReq('KEEPALIVE') as any, res as any, next);
    vi.advanceTimersByTime(16_000);
    resolve!();
    await promise;
    vi.useRealTimers();

    const pings = parseEvents(res).filter((e) => e.type === 'ping');
    expect(pings.length).toBeGreaterThanOrEqual(1);
  });

  it('supports comma-separated capabilities (keepalive,compressed)', async () => {
    vi.useFakeTimers();
    const res = makeMockRes();
    res.on.mockImplementation(() => {});
    const next = vi.fn();

    let resolve: () => void;
    mockAnalyzeDocument.mockImplementation(
      () => new Promise<void>((r) => { resolve = r; }).then(() => ({ goals: [] })),
    );

    const promise = controller.analyzeIepDocument(makeReq('keepalive,compressed') as any, res as any, next);
    vi.advanceTimersByTime(16_000);
    resolve!();
    await promise;
    vi.useRealTimers();

    const pings = parseEvents(res).filter((e) => e.type === 'ping');
    expect(pings.length).toBeGreaterThanOrEqual(1);
  });

  it('calls next(error) when extraction service throws', async () => {
    const res = makeMockRes();
    const next = vi.fn();
    const error = new Error('AI failure');
    mockAnalyzeDocument.mockRejectedValue(error);

    await controller.analyzeIepDocument(makeReq() as any, res as any, next);

    expect(next).toHaveBeenCalledWith(error);
  });
});
