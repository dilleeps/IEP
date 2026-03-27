// src/modules/admin/users/admin-users.validation.ts
import { z } from 'zod';

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(100, 'Password must be at most 100 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

export const createUserSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  role: z.enum(['PARENT', 'ADVOCATE', 'TEACHER_THERAPIST', 'SUPPORT', 'ADMIN']),
  status: z.enum(['active', 'inactive', 'pending']).optional().default('pending'),
  sendWelcomeEmail: z.boolean().optional().default(true),
});

export const updateUserSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  role: z.enum(['PARENT', 'ADVOCATE', 'TEACHER_THERAPIST', 'SUPPORT', 'ADMIN']).optional(),
  status: z.enum(['active', 'inactive', 'pending', 'suspended']).optional(),
});

export const listUsersSchema = z.object({
  page: z.string().optional().transform(val => (val ? parseInt(val) : 1)),
  limit: z.string().optional().transform(val => (val ? parseInt(val) : 50)),
  role: z.enum(['PARENT', 'ADVOCATE', 'TEACHER_THERAPIST', 'SUPPORT', 'ADMIN']).optional(),
  status: z.enum(['active', 'inactive', 'pending', 'suspended']).optional(),
  search: z.string().optional(),
  sortBy: z.enum(['createdAt', 'lastLoginAt', 'email', 'role']).optional().default('createdAt'),
  sortOrder: z.enum(['ASC', 'DESC']).optional().default('DESC'),
});

export const changeStatusSchema = z.object({
  status: z.enum(['active', 'inactive', 'suspended']),
  reason: z.string().optional(),
});

export const directRegisterSchema = z.object({
  email: z.string().email(),
  password: passwordSchema,
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  role: z.enum(['ADMIN', 'ADVOCATE', 'TEACHER_THERAPIST']),
  sendWelcomeEmail: z.boolean().optional().default(false),
});

const baseRegisterSchema = z.object({
  email: z.string().email(),
  password: passwordSchema,
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  sendWelcomeEmail: z.boolean().optional().default(false),
});

export const registerAdminSchema = baseRegisterSchema;
export const registerAdvocateSchema = baseRegisterSchema;
export const registerTeacherSchema = baseRegisterSchema;
export const registerParentSchema = baseRegisterSchema;
