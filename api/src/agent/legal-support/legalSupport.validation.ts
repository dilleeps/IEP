import { z } from 'zod';

export const createSessionSchema = z.object({});

export const sessionParamsSchema = z.object({
  sessionId: z.string().min(1, 'Session ID is required'),
});

export const sendMessageSchema = {
  params: sessionParamsSchema,
  body: z.object({
    message: z
      .string()
      .trim()
      .min(1, 'Message is required')
      .max(2000, 'Message is too long'),
  }),
};

export const getSessionSchema = {
  params: sessionParamsSchema,
};
