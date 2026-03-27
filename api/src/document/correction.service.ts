import { ExtractionCorrection } from './extraction-corrections.model.js';
import { IepDocument } from './document.model.js';
import { DocumentRepository } from './document.repo.js';
import { AppError } from '../../shared/errors/appError.js';
import { logger } from '../../config/logger.js';

export interface CorrectionInput {
  field: string;
  originalValue: any;
  correctedValue: any;
  aiConfidence?: number;
  reason?: string;
}

/**
 * CorrectionService handles parent corrections to AI extractions.
 * Maintains audit trail of all manual edits.
 */
export class CorrectionService {
  private docRepo: DocumentRepository;

  constructor() {
    this.docRepo = new DocumentRepository();
  }

  /**
   * Submit corrections for extracted data
   */
  async submitCorrections(
    documentId: string,
    corrections: CorrectionInput[],
    correctedBy: string
  ): Promise<ExtractionCorrection[]> {
    const doc = await this.docRepo.findById(documentId);
    if (!doc) {
      throw new AppError('Document not found', 404, 'DOCUMENT_NOT_FOUND');
    }

    if (doc.extractionStatus === 'finalized') {
      throw new AppError('Cannot correct finalized extractions', 400, 'EXTRACTION_FINALIZED');
    }

    const results: ExtractionCorrection[] = [];

    for (const correction of corrections) {
      const record = await ExtractionCorrection.create({
        documentId,
        field: correction.field,
        originalValue: correction.originalValue,
        correctedValue: correction.correctedValue,
        aiConfidence: correction.aiConfidence,
        correctedBy,
        correctedAt: new Date(),
        reason: correction.reason,
      } as any);

      results.push(record);
    }

    // Update document status to 'reviewed'
    await this.docRepo.update(documentId, {
      extractionStatus: 'reviewed',
      reviewedAt: new Date(),
      reviewedBy: correctedBy,
    } as any);

    logger.info(`Submitted ${corrections.length} corrections for document ${documentId}`);

    return results;
  }

  /**
   * Get all corrections for a document
   */
  async getCorrectionsByDocument(documentId: string): Promise<ExtractionCorrection[]> {
    return ExtractionCorrection.findAll({
      where: { documentId },
      order: [['correctedAt', 'DESC']],
    });
  }

  /**
   * Get AI confidence statistics (fields often corrected)
   */
  async getConfidenceStats(documentId: string): Promise<{
    totalCorrections: number;
    fieldStats: Array<{ field: string; count: number; avgConfidence: number }>;
  }> {
    const corrections = await this.getCorrectionsByDocument(documentId);

    const fieldMap = new Map<string, { count: number; confidenceSum: number }>();

    for (const correction of corrections) {
      const existing = fieldMap.get(correction.field) || { count: 0, confidenceSum: 0 };
      existing.count++;
      if (correction.aiConfidence) {
        existing.confidenceSum += correction.aiConfidence;
      }
      fieldMap.set(correction.field, existing);
    }

    const fieldStats = Array.from(fieldMap.entries()).map(([field, stats]) => ({
      field,
      count: stats.count,
      avgConfidence: stats.count > 0 ? stats.confidenceSum / stats.count : 0,
    }));

    return {
      totalCorrections: corrections.length,
      fieldStats,
    };
  }
}
