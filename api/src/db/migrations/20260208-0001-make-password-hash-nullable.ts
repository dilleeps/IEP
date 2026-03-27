import type { Migration } from '../umzug.js';
import { DataTypes } from 'sequelize';

export const up: Migration = async ({ context: sequelize }) => {
  const queryInterface = sequelize.getQueryInterface();
  await queryInterface.changeColumn('users', 'password_hash', {
    type: DataTypes.STRING(255),
    allowNull: true,
  });
};

export const down: Migration = async ({ context: sequelize }) => {
  const queryInterface = sequelize.getQueryInterface();
  await queryInterface.changeColumn('users', 'password_hash', {
    type: DataTypes.STRING(255),
    allowNull: false,
  });
};
