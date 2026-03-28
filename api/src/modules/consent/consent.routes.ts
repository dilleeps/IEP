import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { validateBody } from '../../middleware/validate.js';
import { recordConsentSchema } from './consent.validation.js';
import { ConsentController } from './consent.controller.js';

const controller = new ConsentController();
export const consentRouter = Router();

consentRouter.post('/', authenticate, validateBody(recordConsentSchema), controller.recordConsent);
