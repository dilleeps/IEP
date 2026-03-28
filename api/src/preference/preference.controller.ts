// src/modules/preference/preference.controller.ts
import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/authenticate.js';
import { PreferenceService } from './preference.service.js';
import { PreferenceResponse } from './preference.types.js';

export class PreferenceController {
  private service: PreferenceService;

  constructor() {
    this.service = new PreferenceService();
  }

  get = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const preference = await this.service.getByUserId(req.user!.id);
      res.json(this.toResponse(preference));
    } catch (error) {
      next(error);
    }
  };

  update = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const preference = await this.service.update(req.user!.id, req.body);
      res.json(this.toResponse(preference));
    } catch (error) {
      next(error);
    }
  };

  private toResponse(preference: any): PreferenceResponse {
    return {
      id: preference.id,
      userId: preference.userId,
      theme: preference.theme,
      language: preference.language,
      notifications: preference.notifications,
      emailUpdates: preference.emailUpdates,
      emailFrequency: preference.emailFrequency,
      smartPromptFrequency: preference.smartPromptFrequency,
      dashboardLayout: preference.dashboardLayout,
      dashboardWidgets: preference.dashboardWidgets,
      defaultView: preference.defaultView,
      advocacyLevel: preference.advocacyLevel,
      showLegalCitations: preference.showLegalCitations,
      showAdvocacyQuotes: preference.showAdvocacyQuotes,
      showSmartPrompts: preference.showSmartPrompts,
      reminderLeadTimeDays: preference.reminderLeadTimeDays,
      calendarSyncEnabled: preference.calendarSyncEnabled,
      anonymousAnalytics: preference.anonymousAnalytics,
      additionalSettings: preference.additionalSettings,
      updatedAt: preference.updatedAt.toISOString(),
    };
  }
}
