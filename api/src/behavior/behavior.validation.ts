// src/modules/behavior/behavior.validation.ts
import { z } from 'zod';

export const createBehaviorLogSchema = z.object({
  body: z.object({
    childId: z.string().uuid('Invalid child ID format'),
    eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (use YYYY-MM-DD)'),
    eventTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Invalid time format (use HH:mm or HH:mm:ss)'),
    durationMinutes: z.number().min(0).optional(),
    antecedent: z.string().min(1, 'Antecedent is required').max(2000),
    behavior: z.string().min(1, 'Behavior is required').max(2000),
    consequence: z.string().min(1, 'Consequence is required').max(2000),
    intensity: z.number().min(1).max(10, 'Intensity must be between 1 and 10'),
    severityLevel: z.string().max(20).optional(),
    location: z.string().max(255).optional(),
    activity: z.string().max(255).optional(),
    peoplePresent: z.array(z.string().max(100)).optional(),
    interventionUsed: z.string().max(1000).optional(),
    interventionEffective: z.boolean().optional(),
    notes: z.string().max(2000).optional(),
    triggersIdentified: z.array(z.string().max(100)).optional(),
    patternTags: z.array(z.string().max(50)).optional(),
  }),
});

export const updateBehaviorLogSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid log ID format'),
  }),
  body: z.object({
    eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    eventTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/).optional(),
    durationMinutes: z.number().min(0).optional(),
    antecedent: z.string().min(1).max(2000).optional(),
    behavior: z.string().min(1).max(2000).optional(),
    consequence: z.string().min(1).max(2000).optional(),
    intensity: z.number().min(1).max(10).optional(),
    severityLevel: z.string().max(20).optional(),
    location: z.string().max(255).optional(),
    activity: z.string().max(255).optional(),
    peoplePresent: z.array(z.string().max(100)).optional(),
    interventionUsed: z.string().max(1000).optional(),
    interventionEffective: z.boolean().optional(),
    notes: z.string().max(2000).optional(),
    triggersIdentified: z.array(z.string().max(100)).optional(),
    patternTags: z.array(z.string().max(50)).optional(),
  }),
});

export const listBehaviorLogsSchema = z.object({
  query: z.object({
    childId: z.string().uuid().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    minSeverity: z.string().regex(/^\d+$/).optional(),
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

export const patternAnalysisSchema = z.object({
  params: z.object({
    childId: z.string().uuid('Invalid child ID format'),
  }),
  query: z.object({
    days: z.string().regex(/^\d+$/).optional(),
  }),
});
