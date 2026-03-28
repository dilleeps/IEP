// src/modules/goal/goal.validation.ts
import { z } from 'zod';

const goalCategories = [
  'academic', 'behavioral', 'behavior', 'communication', 'social', 'adaptive', 'motor', 'other',
  'reading', 'math', 'writing', 'social_emotional', 'speech_language',
  'occupational_therapy', 'physical_therapy', 'self_care_independent_living',
  'vocational', 'transition',
] as const;
const goalStatuses = ['not_started', 'in_progress', 'achieved', 'modified', 'discontinued'] as const;

export const createGoalSchema = z.object({
  body: z.object({
    childId: z.string().uuid('Invalid child ID format'),
    goalText: z.string().min(10, 'Goal text must be at least 10 characters').max(2000),
    goalName: z.string().max(500).optional(),
    domain: z.enum(goalCategories).optional(),
    category: z.enum(goalCategories, { message: 'Invalid goal category' }).optional(),
    targetDate: z.string().datetime().optional(),
    notes: z.string().max(5000).optional(),
    milestonesData: z.record(z.string(), z.any()).optional(),
  }),
});

export const updateGoalSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid goal ID format'),
  }),
  body: z.object({
    goalText: z.string().min(10).max(2000).optional(),
    goalName: z.string().max(500).optional(),
    domain: z.enum(goalCategories).optional(),
    category: z.enum(goalCategories).optional(),
    targetDate: z.string().datetime().optional(),
    status: z.enum(goalStatuses).optional(),
    progressPercentage: z.number().min(0).max(100).optional(),
    notes: z.string().max(5000).optional(),
    milestonesData: z.record(z.string(), z.any()).optional(),
  }),
});

export const updateProgressSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid goal ID format'),
  }),
  body: z.object({
    progressPercentage: z.number().min(0).max(100, 'Progress must be between 0 and 100'),
    status: z.enum(goalStatuses, { message: 'Invalid status' }),
    notes: z.string().max(5000).optional(),
  }),
});

export const listGoalsSchema = z.object({
  query: z.object({
    childId: z.string().uuid().optional(),
    category: z.enum(goalCategories).optional(),
    status: z.enum(goalStatuses).optional(),
  }),
});

export const goalParamsSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid goal ID format'),
  }),
});

export const childIdParamsSchema = z.object({
  params: z.object({
    childId: z.string().uuid('Invalid child ID format'),
  }),
});
