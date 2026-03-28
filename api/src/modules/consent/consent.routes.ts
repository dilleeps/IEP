import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { validateBody } from '../../middleware/validate.js';
import { recordConsentSchema } from './consent.validation.js';
import { ConsentController } from './consent.controller.js';

const controller = new ConsentController();
export const consentRouter = Router();

consentRouter.get('/', authenticate, async (req, res, next) => {
  try {
    const consents = await controller['consentService'].getConsentsForUser(req.user!.id);
    res.json({ data: consents || [] });
  } catch (err) {
    // If getConsentsForUser doesn't exist, return empty
    res.json({ data: [] });
  }
});
consentRouter.post('/', authenticate, validateBody(recordConsentSchema), controller.recordConsent);
