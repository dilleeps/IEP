import { z } from 'zod';
import { COUNSELOR_APPOINTMENT_STATUSES, COUNSELOR_DAYS } from './counselor.types.js';

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const createCounselorServiceSchema = z.object({
  name: z.string().trim().min(1).max(255),
  serviceType: z.string().trim().min(1).max(120),
  durationMinutes: z.number().int().min(15).max(480),
  priceCents: z.number().int().min(0).nullable(),
  paymentRequired: z.boolean(),
  description: z.string().trim().max(2000).optional().default(''),
});

export const updateCounselorServiceSchema = createCounselorServiceSchema.partial();

export const counselorServiceIdSchema = z.object({
  id: z.string().uuid(),
});

export const replaceAvailabilitySchema = z.object({
  windows: z.array(
    z.object({
      day: z.enum(COUNSELOR_DAYS),
      startTime: z.string().regex(timeRegex, 'startTime must be HH:mm format'),
      endTime: z.string().regex(timeRegex, 'endTime must be HH:mm format'),
      label: z.string().trim().max(50).optional(),
    }),
  ),
});

export const updateCounselorProfileSchema = z.object({
  bio: z.string().trim().max(2000).optional(),
  timezone: z.string().trim().min(1).max(100).optional(),
  credentials: z.string().trim().max(255).optional(),
  specializations: z.array(z.string().trim().min(1).max(120)).max(30).optional(),
  paymentEnabled: z.boolean().optional(),
  googleConnected: z.boolean().optional(),
});

export const counselorAppointmentIdSchema = z.object({
  id: z.string().uuid(),
});

export const updateCounselorAppointmentStatusSchema = z.object({
  status: z.enum(COUNSELOR_APPOINTMENT_STATUSES),
});

export const updateCounselorAppointmentSchema = z.object({
  status: z.enum(COUNSELOR_APPOINTMENT_STATUSES).optional(),
  scheduledAt: z.string().datetime().nullable().optional(),
  counselorMessage: z.string().trim().max(2000).optional(),
}).refine(
  (value) => value.status !== undefined || value.scheduledAt !== undefined || value.counselorMessage !== undefined,
  {
    message: 'At least one update field is required',
  },
);

export const counselorUserIdParamSchema = z.object({
  counselorId: z.string().uuid(),
});

export const counselorSlotsQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD'),
  duration: z.coerce.number().int().min(15).max(480).optional().default(60),
});

export const createCounselorAppointmentSchema = z.object({
  counselorServiceId: z.string().uuid().optional(),
  counselorId: z.string().uuid().optional(),
  serviceName: z.string().trim().min(1).max(255).optional(),
  durationMinutes: z.number().int().min(15).max(480).optional(),
  childId: z.string().uuid(),
  iepDocumentId: z.string().uuid().nullable().optional(),
  supportingDocumentIds: z.array(z.string().uuid()).max(10).optional().default([]),
  scheduledAt: z.string().datetime().nullable().optional(),
  notes: z.string().trim().max(2000).optional().default(''),
}).refine(
  (data) => !!(data.counselorServiceId || data.counselorId),
  { message: 'Either counselorServiceId or counselorId must be provided' },
);

export const catalogSlotsQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD'),
});

export const googleOAuthCallbackQuerySchema = z.object({
  code: z.string().min(1),
  state: z.string().min(1),
});

export const updateParentCounselorAppointmentSchema = z.object({
  scheduledAt: z.string().datetime().nullable().optional(),
  notes: z.string().trim().max(2000).optional(),
  cancel: z.boolean().optional(),
}).refine(
  (value) => value.cancel === true || value.scheduledAt !== undefined || value.notes !== undefined,
  {
    message: 'At least one update field is required',
  },
);

export const markParentCounselorAppointmentPaidSchema = z.object({
  paymentSessionId: z.string().trim().min(1).max(120).optional(),
  dummyTransactionRef: z.string().trim().min(1).max(120).optional(),
}).refine(
  (value) => value.paymentSessionId !== undefined || value.dummyTransactionRef !== undefined,
  {
    message: 'paymentSessionId or dummyTransactionRef is required',
  },
);
