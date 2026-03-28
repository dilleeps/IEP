import { DataTypes, Model, Sequelize } from 'sequelize';
import {
  COUNSELOR_APPOINTMENT_STATUSES,
  COUNSELOR_DAYS,
  COUNSELOR_PAYMENT_STATUSES,
  type CounselorAppointmentStatus,
  type CounselorDay,
  type CounselorPaymentStatus,
} from './counselor.types.js';

export interface CounselorServiceAttributes {
  id: string;
  counselorId: string;
  name: string;
  serviceType: string;
  durationMinutes: number;
  priceCents: number | null;
  paymentRequired: boolean;
  description: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export class CounselorService extends Model<CounselorServiceAttributes> implements CounselorServiceAttributes {
  declare id: string;
  declare counselorId: string;
  declare name: string;
  declare serviceType: string;
  declare durationMinutes: number;
  declare priceCents: number | null;
  declare paymentRequired: boolean;
  declare description: string;
  declare createdAt: Date;
  declare updatedAt: Date;
  declare deletedAt?: Date;
}

export interface CounselorAvailabilityWindowAttributes {
  id: string;
  counselorId: string;
  day: CounselorDay;
  label: string;
  startTime: string;
  endTime: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CounselorProfileAttributes {
  id: string;
  userId: string;
  bio: string;
  timezone: string;
  credentials: string;
  specializations: string[];
  paymentEnabled: boolean;
  googleConnected: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CounselorGoogleTokenAttributes {
  id: string;
  userId: string;
  googleEmail: string | null;
  encryptedAccessToken: string;
  encryptedRefreshToken: string | null;
  scope: string;
  tokenType: string;
  accessTokenExpiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CounselorAppointmentAttributes {
  id: string;
  counselorId: string;
  parentUserId: string;
  childId: string;
  counselorServiceId: string | null;
  iepDocumentId: string | null;
  supportingDocumentIds: string[];
  parentName: string;
  childName: string;
  serviceName: string;
  durationMinutes: number;
  scheduledAt: Date | null;
  status: CounselorAppointmentStatus;
  paymentStatus: CounselorPaymentStatus;
  paymentReference: string | null;
  meetLink: string | null;
  calendarEventId: string | null;
  counselorMessage: string;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export class CounselorProfile extends Model<CounselorProfileAttributes> implements CounselorProfileAttributes {
  declare id: string;
  declare userId: string;
  declare bio: string;
  declare timezone: string;
  declare credentials: string;
  declare specializations: string[];
  declare paymentEnabled: boolean;
  declare googleConnected: boolean;
  declare createdAt: Date;
  declare updatedAt: Date;
}

export class CounselorGoogleToken extends Model<CounselorGoogleTokenAttributes> implements CounselorGoogleTokenAttributes {
  declare id: string;
  declare userId: string;
  declare googleEmail: string | null;
  declare encryptedAccessToken: string;
  declare encryptedRefreshToken: string | null;
  declare scope: string;
  declare tokenType: string;
  declare accessTokenExpiresAt: Date | null;
  declare createdAt: Date;
  declare updatedAt: Date;
}

export class CounselorAvailabilityWindow extends Model<CounselorAvailabilityWindowAttributes> implements CounselorAvailabilityWindowAttributes {
  declare id: string;
  declare counselorId: string;
  declare day: CounselorDay;
  declare label: string;
  declare startTime: string;
  declare endTime: string;
  declare createdAt: Date;
  declare updatedAt: Date;
}

export class CounselorAppointment extends Model<CounselorAppointmentAttributes> implements CounselorAppointmentAttributes {
  declare id: string;
  declare counselorId: string;
  declare parentUserId: string;
  declare childId: string;
  declare counselorServiceId: string | null;
  declare iepDocumentId: string | null;
  declare supportingDocumentIds: string[];
  declare parentName: string;
  declare childName: string;
  declare serviceName: string;
  declare durationMinutes: number;
  declare scheduledAt: Date | null;
  declare status: CounselorAppointmentStatus;
  declare paymentStatus: CounselorPaymentStatus;
  declare paymentReference: string | null;
  declare meetLink: string | null;
  declare calendarEventId: string | null;
  declare counselorMessage: string;
  declare notes: string;
  declare createdAt: Date;
  declare updatedAt: Date;
  declare deletedAt?: Date;
}

export interface CounselorServiceCategoryAttributes {
  id: string;
  department: string;
  examples: string;
  iconKey: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class CounselorServiceCategory extends Model<CounselorServiceCategoryAttributes> implements CounselorServiceCategoryAttributes {
  declare id: string;
  declare department: string;
  declare examples: string;
  declare iconKey: string;
  declare sortOrder: number;
  declare isActive: boolean;
  declare createdAt: Date;
  declare updatedAt: Date;
}

export interface CounselorServiceTemplateAttributes {
  id: string;
  name: string;
  serviceType: string;
  durationMinutes: number;
  priceCents: number | null;
  paymentRequired: boolean;
  description: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export class CounselorServiceTemplate extends Model<CounselorServiceTemplateAttributes> implements CounselorServiceTemplateAttributes {
  declare id: string;
  declare name: string;
  declare serviceType: string;
  declare durationMinutes: number;
  declare priceCents: number | null;
  declare paymentRequired: boolean;
  declare description: string;
  declare isActive: boolean;
  declare sortOrder: number;
  declare createdAt: Date;
  declare updatedAt: Date;
}

export function initCounselorServiceModel(sequelize: Sequelize): void {
  CounselorService.init(
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      counselorId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'counselor_id',
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      serviceType: {
        type: DataTypes.STRING(120),
        allowNull: false,
        field: 'service_type',
      },
      durationMinutes: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'duration_minutes',
      },
      priceCents: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'price_cents',
      },
      paymentRequired: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        field: 'payment_required',
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: '',
      },
      createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        field: 'created_at',
      },
      updatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        field: 'updated_at',
      },
      deletedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'deleted_at',
      },
    },
    {
      sequelize,
      tableName: 'counselor_services',
      underscored: true,
      timestamps: true,
      paranoid: true,
    },
  );
}

export function initCounselorAvailabilityWindowModel(sequelize: Sequelize): void {
  CounselorAvailabilityWindow.init(
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      counselorId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'counselor_id',
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      day: {
        type: DataTypes.ENUM(...COUNSELOR_DAYS),
        allowNull: false,
      },
      label: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      startTime: {
        type: DataTypes.TIME,
        allowNull: false,
        field: 'start_time',
      },
      endTime: {
        type: DataTypes.TIME,
        allowNull: false,
        field: 'end_time',
      },
      createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        field: 'created_at',
      },
      updatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        field: 'updated_at',
      },
    },
    {
      sequelize,
      tableName: 'counselor_availability_windows',
      underscored: true,
      timestamps: true,
    },
  );
}

export function initCounselorProfileModel(sequelize: Sequelize): void {
  CounselorProfile.init(
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
        field: 'user_id',
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      bio: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: '',
      },
      timezone: {
        type: DataTypes.STRING(100),
        allowNull: false,
        defaultValue: 'America/New_York',
      },
      credentials: {
        type: DataTypes.STRING(255),
        allowNull: false,
        defaultValue: '',
      },
      specializations: {
        type: DataTypes.ARRAY(DataTypes.STRING(120)),
        allowNull: false,
        defaultValue: [],
      },
      paymentEnabled: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: 'payment_enabled',
      },
      googleConnected: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: 'google_connected',
      },
      createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        field: 'created_at',
      },
      updatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        field: 'updated_at',
      },
    },
    {
      sequelize,
      tableName: 'counselor_profiles',
      underscored: true,
      timestamps: true,
    },
  );
}

export function initCounselorGoogleTokenModel(sequelize: Sequelize): void {
  CounselorGoogleToken.init(
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
        field: 'user_id',
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      googleEmail: {
        type: DataTypes.STRING(320),
        allowNull: true,
        field: 'google_email',
      },
      encryptedAccessToken: {
        type: DataTypes.TEXT,
        allowNull: false,
        field: 'encrypted_access_token',
      },
      encryptedRefreshToken: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'encrypted_refresh_token',
      },
      scope: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: '',
      },
      tokenType: {
        type: DataTypes.STRING(30),
        allowNull: false,
        defaultValue: 'Bearer',
        field: 'token_type',
      },
      accessTokenExpiresAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'access_token_expires_at',
      },
      createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        field: 'created_at',
      },
      updatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        field: 'updated_at',
      },
    },
    {
      sequelize,
      tableName: 'counselor_google_tokens',
      underscored: true,
      timestamps: true,
    },
  );
}

export function initCounselorAppointmentModel(sequelize: Sequelize): void {
  CounselorAppointment.init(
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      counselorId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'counselor_id',
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      parentUserId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'parent_user_id',
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      childId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'child_id',
        references: {
          model: 'child_profiles',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      counselorServiceId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'counselor_service_id',
        references: {
          model: 'counselor_services',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      iepDocumentId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'iep_document_id',
        references: {
          model: 'iep_documents',
          key: 'id',
        },
        onDelete: 'SET NULL',
      },
      supportingDocumentIds: {
        type: DataTypes.ARRAY(DataTypes.UUID),
        allowNull: false,
        defaultValue: [],
        field: 'supporting_document_ids',
      },
      parentName: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: 'parent_name',
      },
      childName: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: 'child_name',
      },
      serviceName: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: 'service_name',
      },
      durationMinutes: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'duration_minutes',
      },
      scheduledAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'scheduled_at',
      },
      status: {
        type: DataTypes.ENUM(...COUNSELOR_APPOINTMENT_STATUSES),
        allowNull: false,
        defaultValue: 'REQUESTED',
      },
      paymentStatus: {
        type: DataTypes.ENUM(...COUNSELOR_PAYMENT_STATUSES),
        allowNull: false,
        defaultValue: 'PENDING',
        field: 'payment_status',
      },
      paymentReference: {
        type: DataTypes.STRING(120),
        allowNull: true,
        field: 'payment_reference',
      },
      meetLink: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'meet_link',
      },
      calendarEventId: {
        type: DataTypes.STRING(120),
        allowNull: true,
        field: 'calendar_event_id',
      },
      counselorMessage: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: '',
        field: 'counselor_message',
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: '',
      },
      createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        field: 'created_at',
      },
      updatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        field: 'updated_at',
      },
      deletedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'deleted_at',
      },
    },
    {
      sequelize,
      tableName: 'counselor_appointments',
      underscored: true,
      timestamps: true,
      paranoid: true,
    },
  );
}

export function initCounselorServiceCategoryModel(sequelize: Sequelize): void {
  CounselorServiceCategory.init(
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      department: {
        type: DataTypes.STRING(120),
        allowNull: false,
      },
      examples: {
        type: DataTypes.STRING(255),
        allowNull: false,
        defaultValue: '',
      },
      iconKey: {
        type: DataTypes.STRING(50),
        allowNull: false,
        field: 'icon_key',
      },
      sortOrder: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        field: 'sort_order',
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        field: 'is_active',
      },
      createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        field: 'created_at',
      },
      updatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        field: 'updated_at',
      },
    },
    {
      sequelize,
      tableName: 'counselor_service_categories',
      underscored: true,
      timestamps: true,
    },
  );
}

export function initCounselorServiceTemplateModel(sequelize: Sequelize): void {
  CounselorServiceTemplate.init(
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      serviceType: {
        type: DataTypes.STRING(120),
        allowNull: false,
        field: 'service_type',
      },
      durationMinutes: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'duration_minutes',
      },
      priceCents: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'price_cents',
      },
      paymentRequired: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        field: 'payment_required',
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: '',
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        field: 'is_active',
      },
      sortOrder: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        field: 'sort_order',
      },
      createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        field: 'created_at',
      },
      updatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        field: 'updated_at',
      },
    },
    {
      sequelize,
      tableName: 'counselor_service_templates',
      underscored: true,
      timestamps: true,
    },
  );
}
