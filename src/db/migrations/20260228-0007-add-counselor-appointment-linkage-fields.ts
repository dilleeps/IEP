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

  await safeAddColumn(queryInterface, 'counselor_appointments', 'child_id', {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'child_profiles',
      key: 'id',
    },
    onDelete: 'CASCADE',
  });

  await safeAddColumn(queryInterface, 'counselor_appointments', 'counselor_service_id', {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'counselor_services',
      key: 'id',
    },
    onDelete: 'CASCADE',
  });

  await safeAddColumn(queryInterface, 'counselor_appointments', 'iep_document_id', {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'iep_documents',
      key: 'id',
    },
    onDelete: 'SET NULL',
  });

  await safeAddColumn(queryInterface, 'counselor_appointments', 'supporting_document_ids', {
    type: DataTypes.ARRAY(DataTypes.UUID),
    allowNull: false,
    defaultValue: [],
  });

  await safeAddIndex(queryInterface, 'counselor_appointments', ['child_id'], {
    name: 'idx_counselor_appointments_child_id',
  });

  await safeAddIndex(queryInterface, 'counselor_appointments', ['counselor_service_id'], {
    name: 'idx_counselor_appointments_counselor_service_id',
  });

  await safeAddIndex(queryInterface, 'counselor_appointments', ['iep_document_id'], {
    name: 'idx_counselor_appointments_iep_document_id',
  });
};

export const down: Migration = async ({ context: sequelize }) => {
  const queryInterface = sequelize.getQueryInterface();

  await queryInterface.removeColumn('counselor_appointments', 'supporting_document_ids');
  await queryInterface.removeColumn('counselor_appointments', 'iep_document_id');
  await queryInterface.removeColumn('counselor_appointments', 'counselor_service_id');
  await queryInterface.removeColumn('counselor_appointments', 'child_id');
};
