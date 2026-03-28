import { DataTypes, Model, Sequelize } from 'sequelize';

export interface CommunicationLogAttributes {
  id: string;
  childId: string;
  userId: string;
  date: Date;
  contactType: 'email' | 'phone' | 'meeting' | 'letter' | 'portal' | 'other';
  contactWith: string;
  contactRole?: string;
  subject: string;
  summary: string;
  followUpRequired: boolean;
  followUpDate?: Date;
  followUpCompleted?: boolean;
  attachments: any;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export class CommunicationLog extends Model<CommunicationLogAttributes> implements CommunicationLogAttributes {
  declare id: string;
  declare childId: string;
  declare userId: string;
  declare date: Date;
  declare contactType: 'email' | 'phone' | 'meeting' | 'letter' | 'portal' | 'other';
  declare contactWith: string;
  declare contactRole?: string;
  declare subject: string;
  declare summary: string;
  declare followUpRequired: boolean;
  declare followUpDate?: Date;
  declare followUpCompleted?: boolean;
  declare attachments: any;
  declare createdAt: Date;
  declare updatedAt: Date;
  declare deletedAt?: Date;
}

export function initCommunicationLogModel(sequelize: Sequelize): void {
  CommunicationLog.init(
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      childId: {
        field: 'child_id',
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'child_profiles',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      userId: {
        field: 'user_id',
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      date: {
        field: 'communication_date',
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      contactType: {
        field: 'method',
        type: DataTypes.STRING(20),
        allowNull: false,
        validate: {
          isIn: [['email', 'phone', 'meeting', 'letter', 'portal', 'other']],
        },
      },
      contactWith: {
        field: 'contact_name',
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      contactRole: {
        field: 'contact_role',
        type: DataTypes.STRING(100),
      },
      subject: {
        field: 'subject',
        type: DataTypes.STRING(500),
        allowNull: false,
      },
      summary: {
        field: 'summary',
        type: DataTypes.TEXT,
        allowNull: false,
      },
      followUpRequired: {
        field: 'follow_up_needed',
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      followUpDate: {
        field: 'follow_up_date',
        type: DataTypes.DATEONLY,
      },
      followUpCompleted: {
        field: 'follow_up_completed',
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      attachments: {
        field: 'attachments',
        type: DataTypes.JSONB,
        defaultValue: [],
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
      tableName: 'communication_logs',
      underscored: true,
      timestamps: true,
      paranoid: true,
    }
  );
}
