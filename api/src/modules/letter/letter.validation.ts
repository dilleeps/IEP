// src/modules/letter/letter.validation.ts
import { z } from 'zod';

const letterTypes = ['request', 'concern', 'thank_you', 'follow_up', 'complaint', 'appeal', 'other'] as const;
const tones = ['formal', 'friendly', 'assertive', 'empathetic'] as const;
const statuses = ['draft', 'final', 'sent'] as const;

export const createLetterSchema = z.object({
  body: z.object({
    childId: z.string().uuid().optional(),
    letterType: z.enum(letterTypes, { message: 'Invalid letter type' }),
    subject: z.string().min(5).max(500),
    recipient: z.string().min(2).max(255),
    content: z.string().min(50).max(10000),
    tone: z.string().max(50).optional(),
    keywords: z.array(z.string().max(100)).optional(),
    metadata: z.record(z.string(), z.any()).optional(),
  }),
});

export const updateLetterSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid letter ID format'),
  }),
  body: z.object({
    childId: z.string().uuid().optional(),
    letterType: z.enum(letterTypes).optional(),
    subject: z.string().min(5).max(500).optional(),
    recipient: z.string().min(2).max(255).optional(),
    content: z.string().min(50).max(10000).optional(),
    tone: z.string().max(50).optional(),
    keywords: z.array(z.string().max(100)).optional(),
    metadata: z.record(z.string(), z.any()).optional(),
  }),
});

export const generateLetterSchema = z.object({
  body: z.object({
    letterType: z.enum(letterTypes, { message: 'Invalid letter type' }),
    purpose: z.string().min(10).max(1000),
    keyPoints: z.array(z.string().min(5).max(500)).min(1),
    childId: z.string().uuid().optional(),
    recipient: z.string().max(255).optional(),
    tone: z.enum(tones).optional(),
    templateId: z.string().uuid().optional(),
    additionalContext: z.string().max(2000).optional(),
  }),
});

export const listLettersSchema = z.object({
  query: z.object({
    childId: z.string().uuid().optional(),
    letterType: z.enum(letterTypes).optional(),
    status: z.enum(statuses).optional(),
  }),
});

export const letterIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid letter ID format'),
  }),
});

export const updateStatusSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid letter ID format'),
  }),
  body: z.object({
    status: z.enum(statuses, { message: 'Invalid status' }),
  }),
});

export const sendLetterSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid letter ID format'),
  }),
  body: z.object({
    recipientEmail: z.string().email('Invalid email format'),
    cc: z.array(z.string().email()).optional(),
    attachments: z.array(z.string().url()).optional(),
  }),
});
