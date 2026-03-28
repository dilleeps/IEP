// src/modules/resource/resource.validation.ts
import { z } from 'zod';

const categories = ['legal', 'educational', 'medical', 'advocacy', 'support', 'financial', 'technology', 'other'] as const;
const resourceTypes = ['article', 'video', 'pdf', 'link', 'contact', 'organization', 'tool', 'other'] as const;

export const createResourceSchema = z.object({
  body: z.object({
    title: z.string().min(5).max(500),
    description: z.string().min(20).max(5000),
    category: z.enum(categories, { message: 'Invalid category' }),
    resourceType: z.enum(resourceTypes, { message: 'Invalid resource type' }),
    url: z.string().url().optional(),
    content: z.string().max(50000).optional(),
    tags: z.array(z.string().max(50)).optional(),
    targetAudience: z.array(z.string().max(100)).optional(),
    state: z.string().length(2).optional(),
  }),
});

export const updateResourceSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid resource ID format'),
  }),
  body: z.object({
    title: z.string().min(5).max(500).optional(),
    description: z.string().min(20).max(5000).optional(),
    category: z.enum(categories).optional(),
    resourceType: z.enum(resourceTypes).optional(),
    url: z.string().url().optional(),
    content: z.string().max(50000).optional(),
    tags: z.array(z.string().max(50)).optional(),
    targetAudience: z.array(z.string().max(100)).optional(),
    state: z.string().length(2).optional(),
    isActive: z.boolean().optional(),
  }),
});

export const listResourcesSchema = z.object({
  query: z.object({
    category: z.enum(categories).optional(),
    resourceType: z.enum(resourceTypes).optional(),
    tags: z.string().optional(), // Comma-separated
    state: z.string().length(2).optional(),
    targetAudience: z.string().optional(), // Comma-separated
    search: z.string().optional(),
  }),
});

export const resourceIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid resource ID format'),
  }),
});

export const rateResourceSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid resource ID format'),
  }),
  body: z.object({
    rating: z.number().min(1).max(5),
  }),
});

export const popularLimitSchema = z.object({
  query: z.object({
    limit: z.string().regex(/^\d+$/).optional(),
  }),
});
