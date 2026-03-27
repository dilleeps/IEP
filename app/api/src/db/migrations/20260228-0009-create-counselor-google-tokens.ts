import type { Migration } from '../umzug.js';
import { DataTypes } from 'sequelize';

export const up: Migration = async ({ context: sequelize }) => {
  const queryInterface = sequelize.getQueryInterface();

  await queryInterface.createTable('counselor_google_tokens', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    google_email: {
      type: DataTypes.STRING(320),
      allowNull: true,
    },
    encrypted_access_token: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    encrypted_refresh_token: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    scope: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: '',
    },
    token_type: {
      type: DataTypes.STRING(30),
      allowNull: false,
      defaultValue: 'Bearer',
    },
    access_token_expires_at: {
      type: DataTypes.DATE,
      allowNull: true,
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

  await queryInterface.addIndex('counselor_google_tokens', ['user_id'], {
    name: 'idx_counselor_google_tokens_user_id',
    unique: true,
  });
};

export const down: Migration = async ({ context: sequelize }) => {
  const queryInterface = sequelize.getQueryInterface();
  await queryInterface.dropTable('counselor_google_tokens');
};
