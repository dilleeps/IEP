import { z } from 'zod';

export const createChildSchema = z.object({
  name: z.string().min(1).max(255),
  dateOfBirth: z.string().optional(),
  age: z.number().int().min(0).max(22).optional(),
  grade: z.string().max(50).optional(),
  schoolName: z.string().max(255).optional(),
  schoolDistrict: z.string().max(255).optional(),
  country: z.string().max(100).optional(),
  homeAddress: z.string().optional(),
  phoneNumber: z.string().max(50).optional(),
  disabilities: z.array(z.string()).optional().default([]),
  focusTags: z.array(z.string()).optional(),
  advocacyLevel: z.enum(['Beginner', 'Intermediate', 'Advanced']).optional(),
  advocacyBio: z.string().optional(),
  primaryGoal: z.string().optional(),
  stateContext: z.string().length(2).optional(),
  accommodationsSummary: z.string().optional(),
  servicesSummary: z.string().optional(),
  reminderPreferences: z.record(z.string(), z.any()).optional(),
});

export const updateChildSchema = createChildSchema.partial();

export const childIdSchema = z.object({
  id: z.string().uuid(),
});

export const listChildrenQuerySchema = z.object({
  active: z.enum(['true', 'false']).optional(),
});
