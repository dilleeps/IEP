// src/modules/communication/communication.validation.ts
import { z } from 'zod';

const contactTypes = ['email', 'phone', 'meeting', 'letter', 'portal', 'other'] as const;

export const createCommunicationLogSchema = z.object({
  body: z.object({
    childId: z.string().uuid('Invalid child ID format').optional(),
    date: z.string().datetime().or(z.string().date()),
    contactType: z.enum(contactTypes, { message: 'Invalid contact type' }),
    contactWith: z.string().min(1, 'Contact person is required').max(255),
    contactRole: z.string().max(100).optional(),
    subject: z.string().min(1, 'Subject is required').max(500),
    summary: z.string().min(10, 'Summary must be at least 10 characters').max(5000),
    outcome: z.string().max(2000).optional(),
    followUpRequired: z.boolean().optional(),
    followUpDate: z.string().datetime().or(z.string().date()).optional(),
    attachments: z.array(z.string()).optional(),
    tags: z.array(z.string().max(50)).optional(),
  }),
});

export const updateCommunicationLogSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid log ID format'),
  }),
  body: z.object({
    date: z.string().datetime().or(z.string().date()).optional(),
    contactType: z.enum(contactTypes).optional(),
    contactWith: z.string().min(1).max(255).optional(),
    contactRole: z.string().max(100).optional(),
    subject: z.string().min(1).max(500).optional(),
    summary: z.string().min(10).max(5000).optional(),
    outcome: z.string().max(2000).optional(),
    followUpRequired: z.boolean().optional(),
    followUpDate: z.string().datetime().or(z.string().date()).optional(),
    attachments: z.array(z.string()).optional(),
    tags: z.array(z.string().max(50)).optional(),
  }),
});

export const listCommunicationLogsSchema = z.object({
  query: z.object({
    childId: z.string().uuid().optional(),
    contactType: z.enum(contactTypes).optional(),
    followUpRequired: z.enum(['true', 'false']).optional(),
    startDate: z.string().datetime().or(z.string().date()).optional(),
    endDate: z.string().datetime().or(z.string().date()).optional(),
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
