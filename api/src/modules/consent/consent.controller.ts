import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/authenticate.js';
import { ConsentService } from './consent.service.js';

export class ConsentController {
  private consentService: ConsentService;

  constructor() {
    this.consentService = new ConsentService();
  }

  recordConsent = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const consent = await this.consentService.recordConsent({
        userId: req.user!.id,
        consentType: req.body.consentType,
        consentText: req.body.consentText,
        consentVersion: req.body.consentVersion,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'] || undefined,
      });

      res.status(201).json({ consentedAt: consent.consentedAt });
    } catch (error) {
      next(error);
    }
  };
}
