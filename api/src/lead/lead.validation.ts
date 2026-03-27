import { z } from 'zod';

export const createLeadSchema = z.object({
  email: z.string().email('Invalid email address'),
  recaptchaToken: z.string().min(1, 'reCAPTCHA token is required'),
  recaptchaAction: z.string().optional(),
});

export const listLeadsSchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).optional().default(50),
  offset: z.coerce.number().int().min(0).optional().default(0),
  format: z.enum(['json', 'csv']).optional().default('json'),
});
