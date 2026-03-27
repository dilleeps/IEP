// src/modules/preference/preference.types.ts

export interface UpdatePreferenceDto {
  theme?: string;
  language?: string;
  notifications?: boolean;
  emailUpdates?: boolean;
  emailFrequency?: string;
  smartPromptFrequency?: string;
  dashboardLayout?: Record<string, any>;
  dashboardWidgets?: string[];
  defaultView?: string;
  advocacyLevel?: string;
  showLegalCitations?: boolean;
  showAdvocacyQuotes?: boolean;
  showSmartPrompts?: boolean;
  reminderLeadTimeDays?: number;
  calendarSyncEnabled?: boolean;
  anonymousAnalytics?: boolean;
  additionalSettings?: Record<string, any>;
}

export interface PreferenceResponse {
  id: string;
  userId: string;
  theme: string;
  language: string;
  notifications: boolean;
  emailUpdates: boolean;
  emailFrequency: string;
  smartPromptFrequency: string;
  dashboardLayout: Record<string, any>;
  dashboardWidgets?: string[];
  defaultView: string;
  advocacyLevel: string;
  showLegalCitations: boolean;
  showAdvocacyQuotes: boolean;
  showSmartPrompts: boolean;
  reminderLeadTimeDays: number;
  calendarSyncEnabled: boolean;
  anonymousAnalytics: boolean;
  additionalSettings: Record<string, any>;
  updatedAt: string;
}
