// src/modules/ai/conversation/conversation.validation.ts
import { z } from 'zod';

export const createConversationSchema = z.object({
  childId: z.string().uuid().optional(),
  conversationType: z.enum(['meeting_simulation', 'legal_qa', 'iep_help', 'advocacy_advice', 'general']),
  title: z.string().min(1).max(200),
  initialMessage: z.string().optional(),
});

export const sendMessageSchema = z.object({
  message: z.string().min(1).max(5000),
  context: z.record(z.string(), z.any()).optional(),
});

export const listConversationsSchema = z.object({
  page: z.string().optional().transform(val => (val ? parseInt(val) : 1)),
  limit: z.string().optional().transform(val => (val ? parseInt(val) : 20)),
  conversationType: z.enum(['meeting_simulation', 'legal_qa', 'iep_help', 'advocacy_advice', 'general']).optional(),
  childId: z.string().uuid().optional(),
});
