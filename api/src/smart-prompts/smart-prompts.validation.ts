// src/modules/smart-prompts/smart-prompts.validation.ts
import { z } from 'zod';

export const listPromptsSchema = z.object({
  page: z.string().optional().transform(val => (val ? parseInt(val) : 1)),
  limit: z.string().optional().transform(val => (val ? parseInt(val) : 20)),
  category: z.enum(['iep', 'behavior', 'communication', 'compliance', 'advocacy', 'general']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  acknowledged: z.string().optional().transform(val => {
    if (val === 'true') return true;
    if (val === 'false') return false;
    return undefined;
  }),
  childId: z.string().uuid().optional(),
});

export const acknowledgePromptSchema = z.object({
  feedback: z.string().optional(),
});
