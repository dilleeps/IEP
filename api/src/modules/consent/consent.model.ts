import { DataTypes, Model, Sequelize } from 'sequelize';

export interface UserConsentAttributes {
  id: string;
  userId: string;
  consentType: 'data_processing' | 'ai_analysis' | 'data_sharing' | 'marketing' | 'terms_of_service' | 'privacy_policy';
  consentGiven: boolean;
  consentText?: string | null;
  consentVersion?: string | null;
  consentedAt?: Date;
  revokedAt?: Date | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  childId?: string | null;
  expiresAt?: Date | null;
}

export class UserConsent extends Model<UserConsentAttributes> implements UserConsentAttributes {
  declare id: string;
  declare userId: string;
  declare consentType: 'data_processing' | 'ai_analysis' | 'data_sharing' | 'marketing' | 'terms_of_service' | 'privacy_policy';
  declare consentGiven: boolean;
  declare consentText?: string | null;
  declare consentVersion?: string | null;
  declare consentedAt?: Date;
  declare revokedAt?: Date | null;
  declare ipAddress?: string | null;
  declare userAgent?: string | null;
  declare childId?: string | null;
  declare expiresAt?: Date | null;
}

export function initUserConsentModel(sequelize: Sequelize): void {
  UserConsent.init(
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      consentType: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      consentGiven: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
      },
      consentText: {
        type: DataTypes.TEXT,
      },
      consentVersion: {
        type: DataTypes.STRING(50),
      },
      consentedAt: {
        type: DataTypes.DATE,
      },
      revokedAt: {
        type: DataTypes.DATE,
      },
      ipAddress: {
        type: DataTypes.STRING(45),
      },
      userAgent: {
        type: DataTypes.TEXT,
      },
      childId: {
        type: DataTypes.UUID,
        field: 'child_id',
      },
      expiresAt: {
        type: DataTypes.DATE,
        field: 'expires_at',
      },
    },
    {
      sequelize,
      tableName: 'user_consents',
      underscored: true,
      timestamps: false,
    }
  );
}
