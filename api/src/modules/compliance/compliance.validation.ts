// src/modules/compliance/compliance.validation.ts
import { z } from 'zod';

export const createComplianceLogSchema = z.object({
  body: z.object({
    childId: z.string().uuid('Invalid child ID format'),
    serviceDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
    serviceType: z.string().min(1, 'Service type is required').max(255),
    serviceProvider: z.string().max(255).optional(),
    status: z.string().min(1).max(50),
    minutesProvided: z.number().int().min(0).optional(),
    minutesRequired: z.number().int().min(0).optional(),
    notes: z.string().max(5000).optional(),
    attachments: z.array(z.any()).optional(),
    issueReported: z.boolean().optional(),
    resolutionStatus: z.string().max(255).optional(),
  }),
});

export const updateComplianceLogSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid log ID format'),
  }),
  body: z.object({
    serviceDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    serviceType: z.string().min(1).max(255).optional(),
    serviceProvider: z.string().max(255).optional(),
    status: z.string().min(1).max(50).optional(),
    minutesProvided: z.number().int().min(0).optional(),
    minutesRequired: z.number().int().min(0).optional(),
    notes: z.string().max(5000).optional(),
    attachments: z.array(z.any()).optional(),
    issueReported: z.boolean().optional(),
    resolutionStatus: z.string().max(255).optional(),
  }),
});

export const updateStatusSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid log ID format'),
  }),
  body: z.object({
    status: z.string().min(1).max(50),
    resolutionStatus: z.string().max(255).optional(),
  }),
});

export const listComplianceLogsSchema = z.object({
  query: z.object({
    childId: z.string().uuid().optional(),
    serviceType: z.string().optional(),
    status: z.string().optional(),
    issueReported: z.enum(['true', 'false']).optional(),
  }),
});

export const logParamsSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid log ID format'),
  }),
});

export const childIdParamsSchema = z.object({
  params: z.object({
    childId: z.string().uuid('Invalid child ID format'),
  }),
});
