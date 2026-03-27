import type { Migration } from '../umzug.js';
import { DataTypes } from 'sequelize';

async function safeAddColumn(queryInterface: any, tableName: string, columnName: string, definition: any) {
  try {
    await queryInterface.addColumn(tableName, columnName, definition);
  } catch (error: any) {
    if (!error.message?.includes('already exists')) {
      throw error;
    }
  }
}

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

  await safeAddColumn(queryInterface, 'counselor_appointments', 'parent_user_id', {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id',
    },
    onDelete: 'CASCADE',
  });

  await safeAddIndex(queryInterface, 'counselor_appointments', ['parent_user_id'], {
    name: 'idx_counselor_appointments_parent_user_id',
  });

  await safeAddIndex(queryInterface, 'counselor_appointments', ['parent_user_id', 'status'], {
    name: 'idx_counselor_appointments_parent_status',
  });
};

export const down: Migration = async ({ context: sequelize }) => {
  const queryInterface = sequelize.getQueryInterface();
  await queryInterface.removeColumn('counselor_appointments', 'parent_user_id');
};
