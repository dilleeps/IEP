// src/modules/preference/preference.validation.ts
import { z } from 'zod';

export const updatePreferenceSchema = z.object({
  body: z.object({
    theme: z.string().max(20).optional(),
    language: z.string().min(2).max(10).optional(),
    notifications: z.boolean().optional(),
    emailUpdates: z.boolean().optional(),
    emailFrequency: z.string().max(20).optional(),
    smartPromptFrequency: z.string().max(20).optional(),
    dashboardLayout: z.record(z.string(), z.any()).optional(),
    dashboardWidgets: z.array(z.string()).optional(),
    defaultView: z.string().max(50).optional(),
    advocacyLevel: z.string().max(20).optional(),
    showLegalCitations: z.boolean().optional(),
    showAdvocacyQuotes: z.boolean().optional(),
    showSmartPrompts: z.boolean().optional(),
    reminderLeadTimeDays: z.number().int().min(1).max(90).optional(),
    calendarSyncEnabled: z.boolean().optional(),
    anonymousAnalytics: z.boolean().optional(),
    additionalSettings: z.record(z.string(), z.any()).optional(),
  }),
});
