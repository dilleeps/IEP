// src/modules/config/admin/admin-config.validation.ts
import { z } from 'zod';

export const createConfigSchema = z.object({
  category: z.string().min(1).max(100),
  displayName: z.string().min(1).max(255),
  description: z.string().optional(),
  values: z.record(z.string(), z.any()),
  metadata: z.record(z.string(), z.any()).optional().default({}),
  isActive: z.boolean().optional().default(true),
  allowCustomValues: z.boolean().optional().default(false),
  sortOrder: z.number().int().optional().default(0),
  stateCode: z.string().length(2).optional(),
});

export const updateConfigSchema = z.object({
  displayName: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  values: z.record(z.string(), z.any()).optional(),
  metadata: z.record(z.string(), z.any()).optional(),
  isActive: z.boolean().optional(),
  allowCustomValues: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
  stateCode: z.string().length(2).optional(),
});

export const listAdminConfigsSchema = z.object({
  page: z.string().optional().transform(val => (val ? parseInt(val) : 1)),
  limit: z.string().optional().transform(val => (val ? parseInt(val) : 50)),
  category: z.string().optional(),
  isActive: z.string().optional().transform(val => {
    if (val === 'true') return true;
    if (val === 'false') return false;
    return undefined;
  }),
  search: z.string().optional(),
});
