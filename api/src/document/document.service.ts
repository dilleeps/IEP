import { IepDocument } from './document.model.js';
import { IepAnalysis } from './analysis.model.js';
import { DocumentRepository, AnalysisRepository } from './document.repo.js';
import { CreateDocumentDto, UpdateDocumentDto } from './document.types.js';
import { AppError } from '../shared/errors/appError.js';
import { getAiService, getStorageService, getVectorDbService } from '../shared/services.js';
import { Readable } from 'stream';
import { Buffer } from 'buffer';
import crypto from 'crypto';
import { GoalRepository } from '../goal/goal.repo.js';
import { ChildProfile } from '../child/child.model.js';
import { logger } from '../config/logger.js';
import { getSequelize } from '../config/sequelize.js';
import { QueryTypes } from 'sequelize';

export class DocumentService {
  private docRepo: DocumentRepository;
  private analysisRepo: AnalysisRepository;
  private goalRepo: GoalRepository;

  constructor() {
    this.docRepo = new DocumentRepository();
    this.analysisRepo = new AnalysisRepository();
    this.goalRepo = new GoalRepository();
  }

  /**
   * Upload document to cloud storage and create DB record
   */
  async uploadDocument(
    userId: string,
    childId: string,
    documentType: string | null,
    file: { buffer: Buffer; originalname: string; mimetype: string },
    metadata?: Record<string, any>
  ): Promise<IepDocument> {
    await this.ensureChildOwnership(userId, childId);

    // Calculate SHA-256 hash for duplicate detection
    const fileHash = crypto.createHash('sha256').update(file.buffer).digest('hex');
    
    // Check for existing document with same hash for this child
    const existingDoc = await this.docRepo.findByChildAndHash(childId, fileHash);
    if (existingDoc) {
      throw new AppError(
        'This document has already been uploaded',
        409,
        'DUPLICATE_DOCUMENT',
        {
          existingDocument: {
            documentId: existingDoc.id,
            fileName: existingDoc.fileName,
            uploadDate: existingDoc.uploadDate,
            analysisStatus: existingDoc.analysisStatus,
          },
          suggestion: 'Delete the existing document first or use a different file',
        }
      );
    }
    
    const storage = getStorageService();
    
    // Upload to cloud storage based on file type
    let storageKey: string;
    const stream = Readable.from(file.buffer);
    
    if (file.mimetype === 'application/pdf') {
      storageKey = await storage.uploadPDF(userId, stream);
    } else if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      storageKey = await storage.uploadDOCX(userId, stream);
    } else {
      // For other types, upload as PDF (you might want to add more types)
      storageKey = await storage.uploadPDFBytes(userId, file.buffer);
    }

    // Create document record
    const doc = await this.docRepo.create({
      userId,
      childId,
      documentType,
      fileName: file.originalname,
      originalFileName: file.originalname,
      fileSize: file.buffer.length,
      mimeType: file.mimetype,
      storagePath: storageKey, // Store the GCS object key
      uploadDate: new Date(),
      fileHash, // Store hash for duplicate detection
      status: 'uploaded',
      analysisStatus: 'pending',
      metadata: metadata || {},
    } as any);

    return doc;
  }

  async create(userId: string, data: CreateDocumentDto): Promise<IepDocument> {
    await this.ensureChildOwnership(userId, data.childId);

    return this.docRepo.create({
      ...data,
      userId,
      uploadDate: new Date(),
      status: 'uploaded',
      analysisStatus: 'pending',
      metadata: data.metadata || {},
    } as any);
  }

  async findByUserId(
    userId: string,
    filters?: {
      childId?: string;
      documentType?: string;
      status?: string;
    }
  ): Promise<IepDocument[]> {
    return this.docRepo.findByUserId(userId, filters);
  }

  async findById(id: string): Promise<IepDocument> {
    const doc = await this.docRepo.findById(id);
    if (!doc) {
      throw new AppError('Document not found', 404, 'DOCUMENT_NOT_FOUND');
    }
    return doc;
  }

  async update(id: string, data: UpdateDocumentDto): Promise<IepDocument> {
    await this.findById(id);
    return this.docRepo.update(id, data);
  }

  async softDelete(id: string): Promise<void> {
    const doc = await this.findById(id);
    
    // Delete all goals associated with this document
    const deletedGoalsCount = await this.goalRepo.deleteByDocumentId(id);
    logger.info(`Deleted ${deletedGoalsCount} goals associated with document ${id}`);
    
    // Delete the document
    await this.docRepo.softDelete(id);
  }

  /**
   * Analyze IEP document using AI
   */
  async analyzeDocument(documentId: string): Promise<IepAnalysis> {
    const doc = await this.findById(documentId);
    
    if (doc.status === 'processing') {
      throw new AppError('Document is already being analyzed', 400, 'ANALYSIS_IN_PROGRESS');
    }

    // Check if analysis already exists
    const existingAnalysis = await this.analysisRepo.findByDocumentId(documentId);
    if (existingAnalysis) {
      return existingAnalysis;
    }

    // Update status
    await this.docRepo.updateStatus(documentId, 'processing', 'in_progress');

    try {
      const ai = getAiService();
      const vectorDb = getVectorDbService();
      const storage = getStorageService();

      // Download document from storage (in production, extract text properly)
      // For now, using the storagePath as a key
      const downloadUrl = await storage.downloadURL(doc.storagePath, 3600); // 1 hour expiry
      
      // TODO: In production, download file and extract text using pdf-parse or similar
      // For now, assume we have text content
      const extractedText = `Extracted text from ${doc.fileName}`;

      // Analyze with AI
      const analysisResponse = await ai.chatAsObject({
        messages: [
          {
            role: 'user',
            content: `Analyze this IEP document and provide structured analysis:

Document Type: ${doc.documentType}
Document Text:
${extractedText}

Please analyze for:
1. Strengths
2. Concerns
3. Recommendations
4. Compliance Issues
5. Overall Summary`
          }
        ],
        schema: {
          type: 'object',
          properties: {
            strengths: { type: 'array', items: { type: 'string' } },
            concerns: { type: 'array', items: { type: 'string' } },
            recommendations: { type: 'array', items: { type: 'string' } },
            complianceIssues: { type: 'array', items: { type: 'string' } },
            complianceScore: { type: 'number' },
            summary: { type: 'string' }
          }
        },
        metadata: {
          systemMessage: 'You are an expert IEP analyst. Provide thorough, actionable analysis.'
        }
      });

      const analysis = analysisResponse.object as any;

      // Store analysis
      const analysisRecord = await this.analysisRepo.createAnalysis({
        documentId,
        analysisDate: new Date(),
        strengths: analysis.strengths || [],
        concerns: analysis.concerns || [],
        recommendations: analysis.recommendations || [],
        complianceIssues: analysis.complianceIssues || [],
        complianceScore: analysis.complianceScore || 0,
        extractedText,
        summary: analysis.summary || '',
        aiInsights: {},
      } as any);

      // Store embedding for semantic search
      await vectorDb.insert({
        entityType: 'document',
        entityId: documentId,
        text: `${analysis.summary}\n\n${extractedText.substring(0, 5000)}`,
        metadata: { documentType: doc.documentType }
      });

      // Update document status
      await this.docRepo.updateStatus(documentId, 'analyzed', 'completed');

      return analysisRecord;
    } catch (error) {
      // Update status to error
      await this.docRepo.updateStatus(documentId, 'error', 'failed');
      throw new AppError(
        `Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500,
        'ANALYSIS_FAILED'
      );
    }
  }

  async getAnalysis(documentId: string): Promise<IepAnalysis> {
    const analysis = await this.analysisRepo.findByDocumentId(documentId);
    if (!analysis) {
      throw new AppError('Analysis not found', 404, 'ANALYSIS_NOT_FOUND');
    }
    return analysis;
  }

  async verifyOwnership(documentId: string, userId: string): Promise<boolean> {
    const doc = await this.docRepo.findById(documentId);
    return doc?.userId === userId;
  }

  private async ensureChildOwnership(userId: string, childId: string): Promise<void> {
    const child = await ChildProfile.findByPk(childId, {
      attributes: ['id', 'userId'],
      paranoid: true,
    });

    if (!child) {
      throw new AppError('Child not found', 404, 'CHILD_NOT_FOUND');
    }

    if (child.userId !== userId) {
      throw new AppError('Access denied', 403, 'FORBIDDEN');
    }
  }

  /**
   * Get download URL for document
   */
  async getDownloadUrl(documentId: string, expiresInSeconds: number = 3600): Promise<string> {
    const doc = await this.findById(documentId);
    const storage = getStorageService();
    return storage.downloadURL(doc.storagePath, expiresInSeconds);
  }

  /**
   * Delete all documents for a child (testing only)
   */
  async deleteAllDocumentsForChild(childId: string, userId: string): Promise<{ deletedCount: number }> {
    const sequelize = getSequelize();
    
    // Verify child belongs to user
    const childCheck = await sequelize.query(
      `SELECT id FROM child_profiles WHERE id = :childId AND user_id = :userId AND deleted_at IS NULL`,
      {
        replacements: { childId, userId },
        type: QueryTypes.SELECT,
      }
    );

    if (!childCheck || childCheck.length === 0) {
      throw new AppError('Child not found or access denied', 404);
    }

    // Soft delete all documents for this child
    const result = await sequelize.query(
      `UPDATE iep_documents 
       SET deleted_at = NOW() 
       WHERE child_id = :childId AND user_id = :userId AND deleted_at IS NULL`,
      {
        replacements: { childId, userId },
        type: QueryTypes.UPDATE,
      }
    );

    const deletedCount = Array.isArray(result) && result[1] ? result[1] : 0;

    logger.info('Deleted all documents for child', { childId, userId, deletedCount });

    return { deletedCount: deletedCount as number };
  }
}

// Export standalone function for middleware
export async function verifyOwnership(documentId: string, userId: string): Promise<boolean> {
  const service = new DocumentService();
  return service.verifyOwnership(documentId, userId);
}
