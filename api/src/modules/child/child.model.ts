import { DataTypes, Model, Sequelize } from 'sequelize';

// ─── Source-tracking types ────────────────────────────────────────────────────
export interface DisabilityFieldSource {
  documentId: string;
  fileName: string;
  setAt: string; // ISO timestamp
}
export interface OtherDisabilitySource {
  label: string;
  documentId: string;
  fileName: string;
  addedAt: string; // ISO timestamp
}
export interface DisabilitySourceTracking {
  primaryDisability?: DisabilityFieldSource;
  secondaryDisability?: DisabilityFieldSource;
  others: OtherDisabilitySource[];
}
export interface ProfileUpdateLogEntry {
  version: number;
  at: string; // ISO timestamp
  documentId: string;
  fileName: string;
  changes: Record<string, { from: unknown; to: unknown }>;
}
// ─────────────────────────────────────────────────────────────────────────────

export interface ChildProfileAttributes {
  id: string;
  userId: string;
  name: string;
  dateOfBirth?: Date;
  age?: number;
  grade?: string;
  schoolName?: string;
  schoolDistrict?: string;
  country?: string;
  homeAddress?: string;
  phoneNumber?: string;
  primaryDisability?: string;
  secondaryDisability?: string;
  /** Additive list of additional disability labels (never cleared) */
  otherDisabilities: string[];
  /** Broad array kept for backward-compat — includes primary + secondary + others */
  disabilities: string[];
  /** Tracks which document first set each disability field */
  disabilitySourceTracking: DisabilitySourceTracking;
  /** Append-only mutation log for profile updates driven by document finalization */
  profileUpdateLog: ProfileUpdateLogEntry[];
  focusTags: string[];
  lastIepDate?: Date;
  nextIepReviewDate?: Date;
  advocacyLevel?: 'Beginner' | 'Intermediate' | 'Advanced';
  advocacyBio?: string;
  primaryGoal?: string;
  stateContext?: string;
  accommodationsSummary?: string;
  servicesSummary?: string;
  isActive: boolean;
  reminderPreferences: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export class ChildProfile extends Model<ChildProfileAttributes> implements ChildProfileAttributes {
  declare id: string;
  declare userId: string;
  declare name: string;
  declare dateOfBirth?: Date;
  declare age?: number;
  declare grade?: string;
  declare schoolName?: string;
  declare schoolDistrict?: string;
  declare country?: string;
  declare homeAddress?: string;
  declare phoneNumber?: string;
  declare primaryDisability?: string;
  declare secondaryDisability?: string;
  declare otherDisabilities: string[];
  declare disabilities: string[];
  declare disabilitySourceTracking: DisabilitySourceTracking;
  declare profileUpdateLog: ProfileUpdateLogEntry[];
  declare focusTags: string[];
  declare lastIepDate?: Date;
  declare nextIepReviewDate?: Date;
  declare advocacyLevel?: 'Beginner' | 'Intermediate' | 'Advanced';
  declare advocacyBio?: string;
  declare primaryGoal?: string;
  declare stateContext?: string;
  declare accommodationsSummary?: string;
  declare servicesSummary?: string;
  declare isActive: boolean;
  declare reminderPreferences: Record<string, any>;
  declare createdAt: Date;
  declare updatedAt: Date;
  declare deletedAt?: Date;
}

export function initChildProfileModel(sequelize: Sequelize): void {
  ChildProfile.init(
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
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      dateOfBirth: {
        type: DataTypes.DATE,
      },
      age: {
        type: DataTypes.INTEGER,
      },
      grade: {
        type: DataTypes.STRING(50),
      },
      schoolName: {
        type: DataTypes.STRING(255),
      },
      schoolDistrict: {
        type: DataTypes.STRING(255),
      },
      country: {
        type: DataTypes.STRING(100),
      },
      homeAddress: {
        type: DataTypes.TEXT,
        field: 'home_address',
      },
      phoneNumber: {
        type: DataTypes.STRING(50),
        field: 'phone_number',
      },
      primaryDisability: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      secondaryDisability: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      otherDisabilities: {
        type: DataTypes.ARRAY(DataTypes.TEXT),
        defaultValue: [],
      },
      disabilities: {
        type: DataTypes.ARRAY(DataTypes.TEXT),
        defaultValue: [],
      },
      disabilitySourceTracking: {
        type: DataTypes.JSONB,
        defaultValue: { others: [] },
      },
      profileUpdateLog: {
        type: DataTypes.JSONB,
        defaultValue: [],
      },
      focusTags: {
        type: DataTypes.ARRAY(DataTypes.TEXT),
        defaultValue: [],
      },
      lastIepDate: {
        type: DataTypes.DATE,
      },
      nextIepReviewDate: {
        type: DataTypes.DATE,
      },
      advocacyLevel: {
        type: DataTypes.STRING(20),
        validate: {
          isIn: [['Beginner', 'Intermediate', 'Advanced']],
        },
      },
      advocacyBio: {
        type: DataTypes.TEXT,
      },
      primaryGoal: {
        type: DataTypes.TEXT,
      },
      stateContext: {
        type: DataTypes.STRING(100),
      },
      accommodationsSummary: {
        type: DataTypes.TEXT,
      },
      servicesSummary: {
        type: DataTypes.TEXT,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      reminderPreferences: {
        type: DataTypes.JSONB,
        defaultValue: {},
      },
      createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      updatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      deletedAt: {
        type: DataTypes.DATE,
      },
    },
    {
      sequelize,
      tableName: 'child_profiles',
      underscored: true,
      timestamps: true,
      paranoid: true,
    }
  );
}
