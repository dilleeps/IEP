// src/modules/admin/analytics/admin-analytics.validation.ts
import { z } from 'zod';

export const analyticsQuerySchema = z.object({
  period: z.enum(['7d', '30d', '90d', '365d', 'all']).optional().default('30d'),
  from: z.string().optional(),
  to: z.string().optional(),
  granularity: z.enum(['day', 'week', 'month']).optional().default('day'),
});
