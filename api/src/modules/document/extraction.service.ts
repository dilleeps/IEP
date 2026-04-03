import { Response } from 'express';
import { DocumentRepository } from './document.repo.js';
import { AppError } from '../../shared/errors/appError.js';
import { getStorageService } from '../../shared/services.js';
import { GeminiService } from '../ai/gemini.service.js';
import { logger } from '../../config/logger.js';
import { createNdjsonStream } from '../../shared/streaming/ndjson-stream.js';
import {
  ExtractionResult,
  metadataSchema, metadataSystemPrompt,
  goalsSchema, goalsSystemPrompt,
  servicesSchema, servicesSystemPrompt,
  supportsSchema, supportsSystemPrompt,
  analysisSchema, analysisSystemPrompt,
} from './types/promptschema.js';

// ─── Concurrency limiter (no external dep needed) ────────────────────────────
function createLimiter(maxConcurrent: number) {
  let running = 0;
  const queue: Array<() => void> = [];
  return async function limit<T>(fn: () => Promise<T>): Promise<T> {
    if (running >= maxConcurrent) {
      await new Promise<void>(resolve => queue.push(resolve));
    }
    running++;
    try {
      return await fn();
    } finally {
      running--;
      queue.shift()?.();
    }
  };
}

// ─── Per-call retry with exponential backoff ─────────────────────────────────
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 2,
  baseDelayMs = 2000
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      const errMsg = err instanceof Error ? err.message : String(err);
      const isRetryable = errMsg.includes('429') || errMsg.includes('503') || errMsg.includes('500') || errMsg.includes('RESOURCE_EXHAUSTED');
      if (!isRetryable || attempt === maxRetries) {
        logger.error(`Gemini call failed (attempt ${attempt + 1}/${maxRetries + 1}, retryable=${isRetryable}): ${errMsg}`);
        break;
      }
      const delay = baseDelayMs * Math.pow(2, attempt);
      logger.warn(`Gemini retry ${attempt + 1}/${maxRetries} in ${delay}ms: ${errMsg}`);
      await new Promise(r => setTimeout(r, delay));
    }
  }
  throw lastError;
}

// ─── Helper to run one sectioned Gemini task ─────────────────────────────────
async function runSection<T>(
  gemini: GeminiService,
  prompt: string,
  schema: Record<string, any>,
  systemPrompt: string,
  fileData: { mimeType: string; data: string },
  maxTokens = 8192,
  skipSchema = false,
): Promise<T> {
  return withRetry(() =>
    gemini.chatAsObject<T>(prompt, schema, {
      systemPrompt,
      temperature: 0.0,
      maxTokens,
      skipSchema,
      fileData,
    })
  );
}

/**
 * ExtractionService — parallel sectioned AI extraction with idempotency,
 * per-section retry, and live NDJSON progress streaming.
 */
export class ExtractionService {
  private docRepo: DocumentRepository;

  constructor() {
    this.docRepo = new DocumentRepository();
  }

  /**
   * Analyze document with parallel AI extraction.
   * Idempotent: returns cached result if already completed.
   * Pass force=true to bypass the cache and re-run AI extraction.
   */
  async analyzeDocument(documentId: string, res?: Response, force = false): Promise<ExtractionResult> {
    const stream = createNdjsonStream(res);
    if (stream.isStreaming()) {
      stream.init();
      stream.sendLog('Starting document analysis', 'init', { documentId });
    }

    try {
      const doc = await this.docRepo.findById(documentId);
      if (!doc) {
        throw new AppError('Document not found', 404, 'DOCUMENT_NOT_FOUND');
      }
      if (!doc.storagePath) {
        throw new AppError('Document has no storage path', 400, 'NO_STORAGE_PATH');
      }

      // ── Idempotency guard ─────────────────────────────────────────────────
      if (!force && doc.analysisStatus === 'completed' && doc.metadata?.extraction) {
        stream.sendLog('Document already analyzed — returning cached result', 'complete');
        stream.sendResult(doc.metadata.extraction as ExtractionResult);
        logger.info(`[Extraction ${documentId}] Cache hit — skipping Gemini`);
        return doc.metadata.extraction as ExtractionResult;
      }

      // ── Guard against concurrent duplicate runs ───────────────────────────
      if (!force && doc.analysisStatus === 'in_progress') {
        throw new AppError('Document is already being analyzed', 409, 'ANALYSIS_IN_PROGRESS');
      }

      stream.sendLog('Preparing document for AI analysis', 'preparing');
      await this.docRepo.update(documentId, {
        status: 'processing',
        analysisStatus: 'in_progress',
        // When force-re-analyzing, reset extractionStatus so finalize can run again
        ...(force ? { extractionStatus: 'pending_review' } : {}),
      } as any);

      // ── Download PDF once (required to pass file bytes to Gemini inline) ──
      const storage = getStorageService();
      const fileBuffer = await storage.downloadData(doc.storagePath);
      
      // Convert buffer to base64 for Gemini inline data
      const base64Data = fileBuffer.toString('base64');
      const fileData = { mimeType: doc.mimeType || 'application/pdf', data: base64Data };

      stream.sendLog(
        `Running 5 parallel AI tasks…`,
        'ai-analysis',
        { fileSize: fileBuffer.length }
      );

      const gemini = GeminiService.create();
      if (!gemini) {
        throw new AppError('AI service not configured. Set GEMINI_API_KEY.', 500, 'AI_NOT_CONFIGURED');
      }

      // ── Parallel extraction — max 2 concurrent Gemini calls (avoid rate limits) ─
      const limit = createLimiter(2);

      let completedSections = 0;
      const total = 5;
      const sectionDone = (name: string) => {
        completedSections++;
        stream.sendLog(
          `✓ ${name} extracted (${completedSections}/${total})`,
          'ai-analysis',
          { section: name, completedSections, total }
        );
      };

      const [metaRaw, goalsRaw, servicesRaw, supportsRaw, analysisRaw] = await Promise.allSettled([
        limit(() =>
          runSection<any>(gemini,
            'Extract student identity and all date fields from this IEP document.',
            metadataSchema, metadataSystemPrompt, fileData
          ).then(r => { sectionDone('identity & dates'); return r; })
        ),
        limit(() =>
          runSection<any>(gemini,
            'Extract ALL annual goals from this IEP document. Return as JSON object: {"goals": [...]}. Include every goal found, do not omit any.',
            goalsSchema, goalsSystemPrompt, fileData, 32768
          ).then(r => { sectionDone('goals'); return r; })
        ),
        limit(() =>
          runSection<any>(gemini,
            'Extract ALL related services listed in this IEP document.',
            servicesSchema, servicesSystemPrompt, fileData
          ).then(r => { sectionDone('services'); return r; })
        ),
        limit(() =>
          runSection<any>(gemini,
            'Extract ALL accommodations and modifications listed in this IEP document.',
            supportsSchema, supportsSystemPrompt, fileData
          ).then(r => { sectionDone('accommodations & modifications'); return r; })
        ),
        limit(() =>
          runSection<any>(gemini,
            'Analyze this IEP document for summary, red flags, legal perspective, and confidence scores.',
            analysisSchema, analysisSystemPrompt, fileData, 16384
          ).then(r => { sectionDone('analysis & insights'); return r; })
        ),
      ]);

      // ── Deterministic merge — failures fall back to empty defaults ─────────
      const meta     = metaRaw.status     === 'fulfilled' ? metaRaw.value     : {};
      const goals    = goalsRaw.status    === 'fulfilled' ? goalsRaw.value    : { goals: [] };
      const services = servicesRaw.status === 'fulfilled' ? servicesRaw.value : { services: [] };
      const supports = supportsRaw.status === 'fulfilled' ? supportsRaw.value : { accommodations: [], modifications: [] };
      const analysis = analysisRaw.status === 'fulfilled' ? analysisRaw.value : { summary: '', redFlags: [], legalLens: '', confidence: {} };

      // Log any section failures without crashing
      [
        ['identity & dates', metaRaw],
        ['goals', goalsRaw],
        ['services', servicesRaw],
        ['accommodations', supportsRaw],
        ['analysis', analysisRaw],
      ].forEach(([name, result]) => {
        if ((result as PromiseSettledResult<any>).status === 'rejected') {
          const reason = (result as PromiseRejectedResult).reason;
          const errorMsg = reason instanceof Error ? reason.message : String(reason);
          const errorStack = reason instanceof Error ? reason.stack : undefined;
          logger.warn(`[Extraction ${documentId}] Section "${name}" failed — used empty default`, {
            errorMessage: errorMsg,
            errorStack,
          });
        }
      });

      const extraction: ExtractionResult = {
        // Identity & dates
        iepStartDate:        meta.iepStartDate,
        iepEndDate:          meta.iepEndDate,
        iepMeetingDate:      meta.iepMeetingDate,
        schoolYear:          meta.schoolYear,
        studentName:         meta.studentName,
        studentDob:          meta.studentDob,
        grade:               meta.grade,
        schoolName:          meta.schoolName,
        schoolDistrict:      meta.schoolDistrict,
        homeAddress:         meta.homeAddress,
        phoneNumber:         meta.phoneNumber,
        country:             meta.country,
        primaryDisability:   meta.primaryDisability,
        secondaryDisability: meta.secondaryDisability,
        otherDisabilities:   meta.otherDisabilities   || [],
        // Goals & services
        // Deduplicate goals by goalName
        goals: (() => {
          const raw = goals.goals || [];
          const seen = new Set<string>();
          return raw.filter((g: any) => {
            const key = (g.goalName || g.goalText || '').toLowerCase().trim();
            if (!key || seen.has(key)) return false;
            seen.add(key);
            return true;
          });
        })(),
        // Deduplicate services by serviceType+provider
        services: (() => {
          const raw = services.services || [];
          const seen = new Set<string>();
          return raw.filter((s: any) => {
            const key = `${(s.serviceType || '').toLowerCase()}_${(s.provider || '').toLowerCase()}_${s.minutesPerSession || ''}_${s.sessionsPerWeek || ''}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          });
        })(),
        // Supports
        accommodations:      [...new Set(supports.accommodations || [])] as string[],
        modifications:       [...new Set(supports.modifications  || [])] as string[],
        // Analysis
        summary:             analysis.summary         || '',
        redFlags:            analysis.redFlags        || [],
        legalLens:           analysis.legalLens       || '',
        confidence:          analysis.confidence      || {},
        metadata:            { documentTypeHint: meta.documentTypeHint },
      };

      stream.sendLog(
        `AI extraction complete — ${extraction.goals?.length ?? 0} goals, ${extraction.services?.length ?? 0} services`,
        'saving',
        { goalsExtracted: extraction.goals?.length, servicesExtracted: extraction.services?.length }
      );

      // ── Persist to DB ─────────────────────────────────────────────────────
      await this.docRepo.update(documentId, {
        status: 'analyzed',
        analysisStatus: 'completed',
        extractionStatus: 'pending_review',
        iepStartDate:   extraction.iepStartDate   ? new Date(extraction.iepStartDate)   : undefined,
        iepEndDate:     extraction.iepEndDate     ? new Date(extraction.iepEndDate)     : undefined,
        iepMeetingDate: extraction.iepMeetingDate ? new Date(extraction.iepMeetingDate) : undefined,
        schoolYear:     extraction.schoolYear,
        confidence:     extraction.confidence,
        documentType:   meta.documentTypeHint || undefined,
        metadata: { ...doc.metadata, extraction },
      } as any);

      // ── Auto-update child profile from extraction ───────────────────────
      try {
        if (doc.childId && extraction) {
          const { ChildProfile } = await import('../child/child.model.js');
          const childUpdate: Record<string, any> = {};
          if (extraction.grade) childUpdate.grade = extraction.grade;
          if (extraction.schoolName) childUpdate.schoolName = extraction.schoolName;
          if (extraction.schoolDistrict) childUpdate.schoolDistrict = extraction.schoolDistrict;
          if (extraction.homeAddress) childUpdate.homeAddress = extraction.homeAddress;
          if (extraction.phoneNumber) childUpdate.phoneNumber = extraction.phoneNumber;
          if (extraction.country) childUpdate.country = extraction.country;
          if (extraction.studentDob) {
            const dob = new Date(extraction.studentDob);
            if (!isNaN(dob.getTime())) {
              childUpdate.dateOfBirth = dob;
              const ageDiff = Date.now() - dob.getTime();
              childUpdate.age = Math.floor(ageDiff / (365.25 * 24 * 60 * 60 * 1000));
            }
          }
          if (extraction.primaryDisability) {
            const disabilities = [extraction.primaryDisability];
            if (extraction.secondaryDisability) disabilities.push(extraction.secondaryDisability);
            if (extraction.otherDisabilities?.length) disabilities.push(...extraction.otherDisabilities);
            childUpdate.disabilities = disabilities;
          }
          if (Object.keys(childUpdate).length > 0) {
            await ChildProfile.update(childUpdate, { where: { id: doc.childId } });
            logger.info(`[Extraction ${documentId}] Child profile auto-updated`, { childId: doc.childId, fields: Object.keys(childUpdate) });
          }
        }
      } catch (childErr) {
        logger.error('[Extraction] Child profile auto-update failed (non-fatal)', { error: childErr });
      }

      stream.sendLog('Extraction complete!', 'complete');
      stream.sendResult(extraction);
      logger.info(`[Extraction ${documentId}] Complete — goals=${extraction.goals?.length} services=${extraction.services?.length}`);

      return extraction;

    } catch (error) {
      logger.error('[Extraction] Failed', { documentId, error });

      try {
        await this.docRepo.update(documentId, { analysisStatus: 'failed' } as any);
      } catch { /* ignore secondary failure */ }

      if (stream.isStreaming()) {
        stream.sendError(
          error instanceof Error ? error.message : 'Unknown error occurred',
          { name: error instanceof Error ? error.name : 'UnknownError' }
        );
        return { metadata: { error: true }, confidence: {} };
      }
      throw error;
    }
  }

  /**
   * Get analysis status for a document (for polling).
   */
  async getStatus(documentId: string) {
    const doc = await this.docRepo.findById(documentId);
    if (!doc) throw new AppError('Document not found', 404, 'DOCUMENT_NOT_FOUND');
    return {
      analysisStatus:  doc.analysisStatus  ?? 'pending',
      extractionStatus: doc.extractionStatus ?? null,
      status:          doc.status,
      updatedAt:       doc.updatedAt,
    };
  }

  /**
   * Get extraction result for a document.
   */
  async getExtraction(documentId: string): Promise<ExtractionResult | null> {
    const doc = await this.docRepo.findById(documentId);
    if (!doc) throw new AppError('Document not found', 404, 'DOCUMENT_NOT_FOUND');
    return doc.metadata?.extraction || null;
  }
}
