import { DataTypes, Model, Sequelize } from 'sequelize';
import {
  CONSULTATION_STATUSES,
  type ConsultationStatus,
} from './consultation.types.js';

export interface ExpertConsultationSlotAttributes {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  isAvailable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class ExpertConsultationSlot extends Model<ExpertConsultationSlotAttributes> implements ExpertConsultationSlotAttributes {
  declare id: string;
  declare date: string;
  declare startTime: string;
  declare endTime: string;
  declare durationMinutes: number;
  declare isAvailable: boolean;
  declare createdAt: Date;
  declare updatedAt: Date;
}

export interface ExpertConsultationAttributes {
  id: string;
  parentUserId: string;
  childId: string;
  slotId: string;
  parentName: string;
  parentEmail: string;
  childName: string;
  concernArea: string;
  notes: string;
  status: ConsultationStatus;
  meetLink: string | null;
  expertNotes: string;
  createdAt: Date;
  updatedAt: Date;
  cancelledAt: Date | null;
}

export class ExpertConsultation extends Model<ExpertConsultationAttributes> implements ExpertConsultationAttributes {
  declare id: string;
  declare parentUserId: string;
  declare childId: string;
  declare slotId: string;
  declare parentName: string;
  declare parentEmail: string;
  declare childName: string;
  declare concernArea: string;
  declare notes: string;
  declare status: ConsultationStatus;
  declare meetLink: string | null;
  declare expertNotes: string;
  declare createdAt: Date;
  declare updatedAt: Date;
  declare cancelledAt: Date | null;

  // Eager-loaded association
  declare slot?: ExpertConsultationSlot;
}

export function initExpertConsultationSlotModel(sequelize: Sequelize): void {
  ExpertConsultationSlot.init(
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      date: {
        type: DataTypes.DATEONLY,
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
      durationMinutes: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 30,
        field: 'duration_minutes',
      },
      isAvailable: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        field: 'is_available',
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
      tableName: 'expert_consultation_slots',
      underscored: true,
      timestamps: true,
    },
  );
}

export function initExpertConsultationModel(sequelize: Sequelize): void {
  ExpertConsultation.init(
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
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
      slotId: {
        type: DataTypes.UUID,
        allowNull: false,
        unique: true,
        field: 'slot_id',
        references: {
          model: 'expert_consultation_slots',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      parentName: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: 'parent_name',
      },
      parentEmail: {
        type: DataTypes.STRING(320),
        allowNull: false,
        field: 'parent_email',
      },
      childName: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: 'child_name',
      },
      concernArea: {
        type: DataTypes.STRING(255),
        allowNull: false,
        defaultValue: 'General IEP Consultation',
        field: 'concern_area',
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: '',
      },
      status: {
        type: DataTypes.ENUM(...CONSULTATION_STATUSES),
        allowNull: false,
        defaultValue: 'BOOKED',
      },
      meetLink: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'meet_link',
      },
      expertNotes: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: '',
        field: 'expert_notes',
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
      cancelledAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'cancelled_at',
      },
    },
    {
      sequelize,
      tableName: 'expert_consultations',
      underscored: true,
      timestamps: true,
    },
  );
}
