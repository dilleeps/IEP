import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { requireRole } from '../middleware/authorize.js';
import { STANDARD_PROTECTED_ROLES } from '../middleware/roles.js';
import { validateBody, validateParams, validateQuery } from '../middleware/validate.js';
import { requireResourceOwnership } from '../middleware/resourceOwnership.js';
import { requireChildAccess } from '../middleware/childAccess.js';
import { auditLog } from '../middleware/auditLog.js';
import { uploadRateLimit } from '../middleware/rateLimit.js';
import { DocumentController } from './document.controller.js';
import {
  createDocumentSchema,
  updateDocumentSchema,
  documentIdSchema,
  listDocumentsQuerySchema,
} from './document.validation.js';

export const documentRouter = Router();
const controller = new DocumentController();

// All routes below require authentication
documentRouter.use(authenticate);
documentRouter.use(requireRole(STANDARD_PROTECTED_ROLES));

// List documents
documentRouter.get(
  '/',
  validateQuery(listDocumentsQuerySchema),
  controller.list
);

// Upload document
documentRouter.post(
  '/upload',
  uploadRateLimit,
  controller.upload,
  requireChildAccess({ bodyField: 'childId' }),
  auditLog('document_uploaded', 'document'),
  controller.uploadDocument
);

// View extraction
documentRouter.get(
  '/:id/view',
  validateParams(documentIdSchema),
  requireResourceOwnership({ resourceType: 'document' }),
  controller.viewExtraction
);

// Get specific document
documentRouter.get(
  '/:id',
  validateParams(documentIdSchema),
  requireResourceOwnership({ resourceType: 'document' }),
  controller.getById
);

// Update document metadata
documentRouter.patch(
  '/:id',
  validateParams(documentIdSchema),
  validateBody(updateDocumentSchema),
  requireResourceOwnership({ resourceType: 'document' }),
  auditLog('document_updated', 'document'),
  controller.update
);

// Delete document
documentRouter.delete(
  '/:id',
  validateParams(documentIdSchema),
  requireResourceOwnership({ resourceType: 'document' }),
  auditLog('document_deleted', 'document'),
  controller.delete
);

// Delete all documents for a child (testing only)
documentRouter.delete(
  '/child/:childId/all',
  requireChildAccess({ paramName: 'childId' }),
  controller.deleteAllDocumentsForChild
);

// Download document
documentRouter.get(
  '/:id/download',
  validateParams(documentIdSchema),
  requireResourceOwnership({ resourceType: 'document' }),
  controller.downloadDocument
);

// Analyze document with AI
documentRouter.post(
  '/:id/analyze',
  validateParams(documentIdSchema),
  requireResourceOwnership({ resourceType: 'document' }),
  auditLog('document_analyzed', 'document'),
  controller.analyzeDocument
);

// Get document analysis
documentRouter.get(
  '/:id/analysis',
  validateParams(documentIdSchema),
  requireResourceOwnership({ resourceType: 'document' }),
  controller.getAnalysis
);

// ===== IEP EXTRACTION ROUTES =====

// Get analysis status (for polling)
documentRouter.get(
  '/:id/status',
  validateParams(documentIdSchema),
  requireResourceOwnership({ resourceType: 'document' }),
  controller.getAnalysisStatus
);

// Analyze IEP document with AI extraction (SSE streaming)
documentRouter.get(
  '/:id/analyze-iep',
  validateParams(documentIdSchema),
  requireResourceOwnership({ resourceType: 'document' }),
  auditLog('iep_analyzed', 'document'),
  controller.analyzeIepDocument
);

// Get extraction result
documentRouter.get(
  '/:id/extraction',
  validateParams(documentIdSchema),
  requireResourceOwnership({ resourceType: 'document' }),
  controller.getExtraction
);

// Submit corrections to extraction
documentRouter.post(
  '/:id/corrections',
  validateParams(documentIdSchema),
  requireResourceOwnership({ resourceType: 'document' }),
  auditLog('extraction_corrected', 'document'),
  controller.submitCorrections
);

// Get corrections for a document
documentRouter.get(
  '/:id/corrections',
  validateParams(documentIdSchema),
  requireResourceOwnership({ resourceType: 'document' }),
  controller.getCorrections
);

// Finalize extraction (normalize to tables)
documentRouter.post(
  '/:id/finalize',
  validateParams(documentIdSchema),
  requireResourceOwnership({ resourceType: 'document' }),
  auditLog('extraction_finalized', 'document'),
  controller.finalizeExtraction
);

// Check if document can be finalized
documentRouter.get(
  '/:id/can-finalize',
  validateParams(documentIdSchema),
  requireResourceOwnership({ resourceType: 'document' }),
  controller.canFinalize
);
