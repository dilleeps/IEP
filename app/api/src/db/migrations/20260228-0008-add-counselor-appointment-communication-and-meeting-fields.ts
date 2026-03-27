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

export const up: Migration = async ({ context: sequelize }) => {
  const queryInterface = sequelize.getQueryInterface();

  await safeAddColumn(queryInterface, 'counselor_appointments', 'counselor_message', {
    type: DataTypes.TEXT,
    allowNull: false,
    defaultValue: '',
  });

  await safeAddColumn(queryInterface, 'counselor_appointments', 'calendar_event_id', {
    type: DataTypes.STRING(120),
    allowNull: true,
  });

  await safeAddColumn(queryInterface, 'counselor_appointments', 'payment_reference', {
    type: DataTypes.STRING(120),
    allowNull: true,
  });
};

export const down: Migration = async ({ context: sequelize }) => {
  const queryInterface = sequelize.getQueryInterface();

  await queryInterface.removeColumn('counselor_appointments', 'payment_reference');
  await queryInterface.removeColumn('counselor_appointments', 'calendar_event_id');
  await queryInterface.removeColumn('counselor_appointments', 'counselor_message');
};
