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

  await queryInterface.createTable('expert_consultation_slots', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4,
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    start_time: {
      type: DataTypes.TIME,
      allowNull: false,
    },
    end_time: {
      type: DataTypes.TIME,
      allowNull: false,
    },
    duration_minutes: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 30,
    },
    is_available: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
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
  });

  await safeAddIndex(queryInterface, 'expert_consultation_slots', ['date'], {
    name: 'idx_expert_consultation_slots_date',
  });

  await safeAddIndex(queryInterface, 'expert_consultation_slots', ['date', 'is_available'], {
    name: 'idx_expert_consultation_slots_availability',
  });

  await queryInterface.createTable('expert_consultations', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4,
    },
    parent_user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    child_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'child_profiles',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    slot_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'expert_consultation_slots',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    parent_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    parent_email: {
      type: DataTypes.STRING(320),
      allowNull: false,
    },
    child_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    concern_area: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: 'General IEP Consultation',
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: '',
    },
    status: {
      type: DataTypes.ENUM('BOOKED', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'),
      allowNull: false,
      defaultValue: 'BOOKED',
    },
    meet_link: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    expert_notes: {
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
    cancelled_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  });

  await safeAddIndex(queryInterface, 'expert_consultations', ['parent_user_id'], {
    name: 'idx_expert_consultations_parent',
  });

  await safeAddIndex(queryInterface, 'expert_consultations', ['slot_id'], {
    name: 'idx_expert_consultations_slot',
    unique: true,
  });

  await safeAddIndex(queryInterface, 'expert_consultations', ['status'], {
    name: 'idx_expert_consultations_status',
  });

  await safeAddIndex(queryInterface, 'expert_consultations', ['parent_user_id', 'status'], {
    name: 'idx_expert_consultations_parent_status',
  });
};

export const down: Migration = async ({ context: sequelize }) => {
  const queryInterface = sequelize.getQueryInterface();

  await queryInterface.dropTable('expert_consultations');
  await queryInterface.dropTable('expert_consultation_slots');

  await sequelize.query('DROP TYPE IF EXISTS "enum_expert_consultations_status";');
};
