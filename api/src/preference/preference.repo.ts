// src/modules/preference/preference.repo.ts
import { UserPreference } from './preference.model.js';
import { BaseRepo } from '../shared/db/base.repo.js';

export class PreferenceRepository extends BaseRepo<UserPreference> {
  constructor() {
    super(UserPreference);
  }

  async findByUserId(userId: string): Promise<UserPreference | null> {
    return this.model.findOne({ where: { userId } });
  }

  async findOrCreateByUserId(userId: string): Promise<UserPreference> {
    const [preference] = await this.model.findOrCreate({
      where: { userId },
      defaults: {
        userId,
        theme: 'light',
        language: 'en',
        notifications: true,
        emailUpdates: true,
        emailFrequency: 'daily',
        smartPromptFrequency: 'normal',
        dashboardLayout: {},
        dashboardWidgets: [],
        defaultView: 'dashboard',
        advocacyLevel: 'Beginner',
        showLegalCitations: false,
        showAdvocacyQuotes: true,
        showSmartPrompts: true,
        reminderLeadTimeDays: 7,
        calendarSyncEnabled: false,
        anonymousAnalytics: true,
        additionalSettings: {},
      } as any,
    });
    return preference;
  }

  async updateByUserId(userId: string, data: Partial<UserPreference>): Promise<UserPreference> {
    const preference = await this.findOrCreateByUserId(userId);
    return preference.update(data);
  }
}
