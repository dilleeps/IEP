import { z } from 'zod';

export const createDocumentSchema = z.object({
  childId: z.string().uuid(),
  documentType: z.enum(['current_iep', 'previous_iep', 'progress_report', 'evaluation', 'other']),
  metadata: z.record(z.string(), z.any()).optional(),
});

export const updateDocumentSchema = z.object({
  documentType: z.enum(['current_iep', 'previous_iep', 'progress_report', 'evaluation', 'other']).optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

export const documentIdSchema = z.object({
  id: z.string().uuid(),
});

export const listDocumentsQuerySchema = z.object({
  childId: z.string().uuid().optional(),
  documentType: z.enum(['current_iep', 'previous_iep', 'progress_report', 'evaluation', 'other']).optional(),
  status: z.enum(['uploaded', 'processing', 'analyzed', 'error']).optional(),
});

export const analyzeDocumentSchema = z.object({
  documentId: z.string().uuid(),
});
