// src/modules/preference/preference.routes.ts
import { Router } from 'express';
import { PreferenceController } from './preference.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { validate } from '../../middleware/validate.js';
import { updatePreferenceSchema } from './preference.validation.js';

const router = Router();
const controller = new PreferenceController();

// All routes require authentication - any authenticated user can manage their preferences
router.use(authenticate);

router.get('/', controller.get);
router.patch('/', validate(updatePreferenceSchema), controller.update);

export default router;
