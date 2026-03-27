// src/modules/advocacy/advocacy.validation.ts
import { z } from 'zod';

const priorities = ['high', 'medium', 'low'] as const;
const statuses = ['active', 'acknowledged', 'acted_upon', 'dismissed'] as const;

export const createAdvocacyInsightSchema = z.object({
  body: z.object({
    childId: z.string().uuid().optional(),
    priority: z.enum(priorities, { message: 'Invalid priority' }),
    category: z.string().min(2).max(100),
    title: z.string().min(5).max(500),
    description: z.string().min(10).max(5000),
    actionItems: z.array(z.string().min(5).max(500)).min(1),
    triggerType: z.string().max(100).optional(),
    triggerData: z.record(z.string(), z.any()).optional(),
    aiGenerated: z.boolean().optional(),
    aiConfidenceScore: z.number().min(0).max(1).optional(),
  }),
});

export const updateAdvocacyInsightSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid insight ID format'),
  }),
  body: z.object({
    priority: z.enum(priorities).optional(),
    category: z.string().min(2).max(100).optional(),
    title: z.string().min(5).max(500).optional(),
    description: z.string().min(10).max(5000).optional(),
    actionItems: z.array(z.string().min(5).max(500)).min(1).optional(),
    status: z.enum(statuses).optional(),
  }),
});

export const generateInsightSchema = z.object({
  body: z.object({
    childId: z.string().uuid('Invalid child ID format'),
    context: z.string().min(20).max(2000),
    focusAreas: z.array(z.string().max(100)).optional(),
    includeHistory: z.boolean().optional(),
  }),
});

export const searchSimilarCasesSchema = z.object({
  body: z.object({
    query: z.string().min(10).max(1000),
    childId: z.string().uuid().optional(),
    limit: z.number().min(1).max(50).optional(),
  }),
});

export const listAdvocacyInsightsSchema = z.object({
  query: z.object({
    childId: z.string().uuid().optional(),
    priority: z.enum(priorities).optional(),
    status: z.enum(statuses).optional(),
    category: z.string().optional(),
  }),
});

export const insightIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid insight ID format'),
  }),
});

export const updateStatusSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid insight ID format'),
  }),
  body: z.object({
    status: z.enum(statuses, { message: 'Invalid status' }),
  }),
});

export const childIdParamsSchema = z.object({
  params: z.object({
    childId: z.string().uuid('Invalid child ID format'),
  }),
});
