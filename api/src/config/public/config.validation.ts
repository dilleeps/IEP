// src/modules/config/public/config.validation.ts
import { z } from 'zod';

export const listConfigsSchema = z.object({
  configType: z.enum(['dropdown', 'setting', 'feature_flag', 'constant', 'other']).optional(),
  isActive: z.string().optional().transform(val => {
    if (val === 'true') return true;
    if (val === 'false') return false;
    return undefined;
  }),
});
