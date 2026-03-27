import { z } from 'zod';

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

const baseRegisterSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: passwordSchema,
  displayName: z.string().min(1, 'Display name is required').max(255),
});

export const registerParentSchema = baseRegisterSchema;

export const registerAdvocateSchema = baseRegisterSchema;

export const registerTeacherSchema = baseRegisterSchema;

// Legacy schema for backward compatibility
export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: passwordSchema,
  displayName: z.string().min(1, 'Display name is required').max(255),
  role: z.enum(['PARENT', 'ADVOCATE', 'TEACHER_THERAPIST', 'ADMIN', 'SUPPORT']).optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export const exchangeFirebaseTokenSchema = z.object({
  firebaseToken: z.string().min(1, 'Firebase token is required'),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema,
});

export { passwordSchema };
