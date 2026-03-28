import { Router } from 'express';
import { authenticate, type AuthRequest } from '../../middleware/authenticate.js';
import { Response, NextFunction } from 'express';
import { validateBody } from '../../middleware/validate.js';
import { recordConsentSchema } from './consent.validation.js';
import { ConsentController } from './consent.controller.js';

const controller = new ConsentController();
export const consentRouter = Router();

consentRouter.get('/', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    res.json({ data: [] });
  } catch (err) {
    next(err);
  }
});
consentRouter.post('/', authenticate, validateBody(recordConsentSchema), controller.recordConsent);
