import { z } from 'zod';

export const createConsultationSlotSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  durationMinutes: z.number().int().min(15).max(120).optional().default(30),
});

export const createConsultationSlotsBulkSchema = z.object({
  slots: z.array(createConsultationSlotSchema).min(1).max(50),
});

// slotId can be a UUID (existing DB slot) or "auto:YYYY-MM-DD:HH:mm" (auto-generated)
const slotIdValue = z.string().refine(
  (val) => {
    // UUID format
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val)) return true;
    // Auto-generated format: auto:YYYY-MM-DD:HH:mm
    if (/^auto:\d{4}-\d{2}-\d{2}:\d{2}:\d{2}$/.test(val)) return true;
    return false;
  },
  { message: 'Must be a valid UUID or auto-generated slot ID' },
);

export const createConsultationSchema = z.object({
  slotId: slotIdValue,
  childId: z.string().uuid(),
  concernArea: z.string().max(255).optional().default('General IEP Consultation'),
  notes: z.string().max(2000).optional().default(''),
});

export const updateConsultationSchema = z.object({
  status: z.enum(['BOOKED', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW']).optional(),
  expertNotes: z.string().max(5000).optional(),
  meetLink: z.string().url().max(2000).nullable().optional(),
});

export const cancelConsultationSchema = z.object({
  reason: z.string().max(1000).optional(),
});

export const consultationIdSchema = z.object({
  id: z.string().uuid(),
});

export const slotIdSchema = z.object({
  id: z.string().uuid(),
});

export const availableSlotsQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});
