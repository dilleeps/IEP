import type { Migration } from '../umzug.js';
import { DataTypes } from 'sequelize';

async function safeAddIndex(queryInterface: any, tableName: string, fields: string[], options: any) {
  try {
    await queryInterface.addIndex(tableName, fields, options);
  } catch (error: any) {
    if (!error.message?.includes('already exists')) {
      throw error;
    }
  }
}

export const up: Migration = async ({ context: sequelize }) => {
  const queryInterface = sequelize.getQueryInterface();

  await queryInterface.createTable('counselor_appointments', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4,
    },
    counselor_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    parent_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    child_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    service_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    duration_minutes: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    scheduled_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('REQUESTED', 'ACCEPTED', 'WAITLISTED', 'COMPLETED', 'CANCELLED'),
      allowNull: false,
      defaultValue: 'REQUESTED',
    },
    payment_status: {
      type: DataTypes.ENUM('NOT_REQUIRED', 'PENDING', 'PAID'),
      allowNull: false,
      defaultValue: 'PENDING',
    },
    meet_link: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: '',
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  });

  await safeAddIndex(queryInterface, 'counselor_appointments', ['counselor_id'], {
    name: 'idx_counselor_appointments_counselor_id',
  });

  await safeAddIndex(queryInterface, 'counselor_appointments', ['counselor_id', 'status'], {
    name: 'idx_counselor_appointments_status',
  });

  await safeAddIndex(queryInterface, 'counselor_appointments', ['counselor_id', 'scheduled_at'], {
    name: 'idx_counselor_appointments_schedule',
  });
};

export const down: Migration = async ({ context: sequelize }) => {
  const queryInterface = sequelize.getQueryInterface();

  await queryInterface.dropTable('counselor_appointments');

  await sequelize.query('DROP TYPE IF EXISTS "enum_counselor_appointments_status";');
  await sequelize.query('DROP TYPE IF EXISTS "enum_counselor_appointments_payment_status";');
};
