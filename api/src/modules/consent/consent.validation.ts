import { z } from 'zod';

export const recordConsentSchema = z.object({
  consentType: z.enum(
    ['data_processing', 'ai_analysis', 'data_sharing', 'marketing', 'terms_of_service', 'privacy_policy'],
    { message: 'Invalid consentType' }
  ),
  consentText: z.string().min(1, 'consentText is required'),
  consentVersion: z.string().min(1, 'consentVersion is required'),
});
