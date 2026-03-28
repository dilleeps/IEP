import { DataTypes, Model, Sequelize } from 'sequelize';

export interface UserPreferenceAttributes {
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
  createdAt: Date;
  updatedAt: Date;
}

export class UserPreference extends Model<UserPreferenceAttributes> implements UserPreferenceAttributes {
  declare id: string;
  declare userId: string;
  declare theme: string;
  declare language: string;
  declare notifications: boolean;
  declare emailUpdates: boolean;
  declare emailFrequency: string;
  declare smartPromptFrequency: string;
  declare dashboardLayout: Record<string, any>;
  declare dashboardWidgets?: string[];
  declare defaultView: string;
  declare advocacyLevel: string;
  declare showLegalCitations: boolean;
  declare showAdvocacyQuotes: boolean;
  declare showSmartPrompts: boolean;
  declare reminderLeadTimeDays: number;
  declare calendarSyncEnabled: boolean;
  declare anonymousAnalytics: boolean;
  declare additionalSettings: Record<string, any>;
  declare createdAt: Date;
  declare updatedAt: Date;
}

export function initUserPreferenceModel(sequelize: Sequelize): void {
  UserPreference.init(
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        unique: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'CASCADE',
        field: 'user_id',
      },
      theme: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'light',
      },
      language: {
        type: DataTypes.STRING(10),
        allowNull: false,
        defaultValue: 'en',
      },
      notifications: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      emailUpdates: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        field: 'email_updates',
      },
      emailFrequency: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'daily',
        field: 'email_frequency',
      },
      smartPromptFrequency: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'normal',
        field: 'smart_prompt_frequency',
      },
      dashboardLayout: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: {},
        field: 'dashboard_layout',
      },
      dashboardWidgets: {
        type: DataTypes.ARRAY(DataTypes.TEXT),
        allowNull: true,
        field: 'dashboard_widgets',
      },
      defaultView: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: 'dashboard',
        field: 'default_view',
      },
      advocacyLevel: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'Beginner',
        field: 'advocacy_level',
      },
      showLegalCitations: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: 'show_legal_citations',
      },
      showAdvocacyQuotes: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        field: 'show_advocacy_quotes',
      },
      showSmartPrompts: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        field: 'show_smart_prompts',
      },
      reminderLeadTimeDays: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 7,
        field: 'reminder_lead_time_days',
      },
      calendarSyncEnabled: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: 'calendar_sync_enabled',
      },
      anonymousAnalytics: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        field: 'anonymous_analytics',
      },
      additionalSettings: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: {},
        field: 'additional_settings',
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'created_at',
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'updated_at',
      },
    },
    {
      sequelize,
      tableName: 'user_preferences',
      underscored: true,
      timestamps: true,
    }
  );
}
