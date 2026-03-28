import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/authenticate.js';
import { DocumentService } from './document.service.js';
import { ExtractionService } from './extraction.service.js';
import { CorrectionService } from './correction.service.js';
import { NormalizationService } from './normalization.service.js';
import { DocumentResponse, AnalysisResponse } from './document.types.js';
import { appenv } from '../config/appenv.js';
import { AppError } from '../shared/errors/appError.js';
import { createNdjsonStream } from '../shared/streaming/ndjson-stream.js';
import multer from 'multer';

// Configure multer for memory storage (no local files)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: parseInt(appenv.get('UPLOAD_MAX_SIZE') || '26214400'), // 25MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOC, and DOCX files are allowed.'));
    }
  }
});

export class DocumentController {
  private service: DocumentService;
  private extractionService: ExtractionService;
  private correctionService: CorrectionService;
  private normalizationService: NormalizationService;
  public upload = upload.single('file');

  constructor() {
    this.service = new DocumentService();
    this.extractionService = new ExtractionService();
    this.correctionService = new CorrectionService();
    this.normalizationService = new NormalizationService();
  }

  uploadDocument = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const { childId, documentType, metadata } = req.body;

      if (!childId) {
        return res.status(400).json({ error: 'childId is required' });
      }

      // Use new uploadDocument method that handles cloud storage
      // AI will determine document type during analysis (iep, progress_report, evaluation, pwn, other)
      const document = await this.service.uploadDocument(
        req.user!.id,
        childId,
        documentType || null, // Optional - AI determines during analysis
        {
          buffer: req.file.buffer,
          originalname: req.file.originalname,
          mimetype: req.file.mimetype
        },
        metadata ? JSON.parse(metadata) : undefined
      );

      res.status(201).json({
        success: true,
        data: this.toSimpleDocumentResponse(document),
      });
    } catch (error) {
      next(error);
    }
  };

  list = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { childId, documentType, status } = req.query;
      
      const documents = await this.service.findByUserId(req.user!.id, {
        childId: childId as string,
        documentType: documentType as string,
        status: status as string,
      });

      res.json({
        documents: documents.map(d => this.toDocumentResponse(d)),
      });
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const document = await this.service.findById(req.params.id);
      res.json(this.toDocumentResponse(document));
    } catch (error) {
      next(error);
    }
  };

  update = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const document = await this.service.update(req.params.id, req.body);
      res.json(this.toDocumentResponse(document));
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      await this.service.softDelete(req.params.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };

  analyzeDocument = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const analysis = await this.service.analyzeDocument(req.params.id);
      res.json(this.toAnalysisResponse(analysis));
    } catch (error) {
      next(error);
    }
  };

  getAnalysis = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const analysis = await this.service.getAnalysis(req.params.id);
      res.json(this.toAnalysisResponse(analysis));
    } catch (error) {
      next(error);
    }
  };

  downloadDocument = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      // Get presigned download URL instead of serving file locally
      const downloadUrl = await this.service.getDownloadUrl(req.params.id, 3600); // 1 hour expiry
      res.json({ downloadUrl });
    } catch (error) {
      next(error);
    }
  };

  // ===== IEP EXTRACTION ENDPOINTS =====

  /**
   * Analyze document with AI extraction (NDJSON streaming)
   * Supports X-Stream-Capabilities: keepalive for mobile clients (keep-alive pings every 15s)
   * GET /api/documents/:id/analyze-iep
   */
  analyzeIepDocument = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const force = req.query.force === '1';
      // Stream analysis progress via SSE
      await this.extractionService.analyzeDocument(req.params.id, res, force);
      // Response handled by extraction service (SSE)
    } catch (error) {
      next(error);
    }
  };


    // analyzeIepDocumentNew = async (req: AuthRequest, res: Response, next: NextFunction) => {
    //     try {
    //         const capabilities = (req.headers['x-stream-capabilities'] ?? '')
    //             .toString()
    //             .split(',')
    //             .map((s) => s.trim().toLowerCase());

    //         const stream = createNdjsonStream(res);
    //         stream.init();

    //         if (capabilities.includes('keepalive')) {
    //             stream.startKeepAlive(15_000);
    //         }

    //         await this.extractionService.analyzeDocument(
    //             req.params.id,
    //             (event) => stream.write(event),
    //         );
    //         stream.end();
    //     } catch (error) {
    //         next(error);
    //     }
    // };

  /**
   * Get analysis status for a document (used for polling)
   * GET /api/documents/:id/status
   */
  getAnalysisStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const status = await this.extractionService.getStatus(req.params.id);
      res.json({ success: true, data: status });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get extraction result
   * GET /api/documents/:id/extraction
   */
  getExtraction = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const extraction = await this.extractionService.getExtraction(req.params.id);
      res.json({ success: true, data: extraction });
    } catch (error) {
      next(error);
    }
  };

  /**
   * View document extraction (public access with documentId only)
   * GET /api/documents/:id/view
   */
  viewExtraction = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const extraction = await this.extractionService.getExtraction(req.params.id);
      res.json({ success: true, data: extraction });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Submit corrections to extraction
   * POST /api/documents/:id/corrections
   */
  submitCorrections = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { corrections } = req.body;

      if (!corrections || !Array.isArray(corrections)) {
        throw new AppError('Corrections array required', 400, 'INVALID_CORRECTIONS');
      }

      const results = await this.correctionService.submitCorrections(
        req.params.id,
        corrections,
        req.user!.id
      );

      res.json({
        success: true,
        data: {
          correctionsCount: results.length,
          corrections: results,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get corrections for a document
   * GET /api/documents/:id/corrections
   */
  getCorrections = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const corrections = await this.correctionService.getCorrectionsByDocument(req.params.id);
      res.json({ success: true, data: corrections });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Finalize extraction (convert JSONB to normalized records)
   * POST /api/documents/:id/finalize
   */
  finalizeExtraction = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await this.normalizationService.finalizeExtraction(
        req.params.id,
        req.user!.id
      );

      res.json({
        success: true,
        data: result,
        message: `Created ${result.goalsCreated} goals, ${result.servicesCreated} services, and ${result.promptsCreated} smart prompts`,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Check if document can be finalized
   * GET /api/documents/:id/can-finalize
   */
  canFinalize = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await this.normalizationService.canFinalize(req.params.id);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  private toDocumentResponse(doc: any): DocumentResponse {
    return {
      id: doc.id,
      childId: doc.childId,
      fileName: doc.fileName,
      originalFileName: doc.originalFileName,
      fileSize: doc.fileSize,
      mimeType: doc.mimeType,
      documentType: doc.documentType,
      status: doc.status,
      analysisStatus: doc.analysisStatus,
      uploadDate: doc.uploadDate?.toISOString?.() || doc.uploadDate,
      metadata: doc.metadata,
      createdAt: doc.createdAt?.toISOString?.() || doc.createdAt,
    };
  }

  /**
   * Simple document response for upload - only essential fields
   */
  private toSimpleDocumentResponse(doc: any) {
    return {
      documentId: doc.id,
      fileName: doc.fileName,
      status: doc.status,
      analysisStatus: doc.analysisStatus,
    };
  }

  private toAnalysisResponse(analysis: any): AnalysisResponse {
    return {
      id: analysis.id,
      documentId: analysis.documentId,
      analysisDate: analysis.analysisDate.toISOString(),
      strengths: analysis.strengths,
      concerns: analysis.concerns,
      recommendations: analysis.recommendations,
      complianceIssues: analysis.complianceIssues,
      complianceScore: analysis.complianceScore,
      summary: analysis.summary,
      aiInsights: analysis.aiInsights,
    };
  }

  deleteAllDocumentsForChild = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { childId } = req.params;
      const result = await this.service.deleteAllDocumentsForChild(childId, req.user!.id);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };
}
