import type { Migration } from '../umzug.js';
import { DataTypes } from 'sequelize';
import { randomUUID } from 'node:crypto';

async function safeAddIndex(queryInterface: any, tableName: string, fields: string[], options: any) {
  try {
    await queryInterface.addIndex(tableName, fields, options);
  } catch (error: any) {
    if (!error.message?.includes('already exists')) {
      throw error;
    }
  }
}

const CATEGORY_ROWS = [
  { department: 'Counseling', examples: 'Individual, Play Therapy', icon_key: 'MessageSquare', sort_order: 10 },
  { department: 'Speech Therapy', examples: 'Articulation, Pragmatics', icon_key: 'FileText', sort_order: 20 },
  { department: 'Occupational Therapy', examples: 'Fine motor, Sensory', icon_key: 'Zap', sort_order: 30 },
  { department: 'Physical Therapy', examples: 'Balance, Strength', icon_key: 'Target', sort_order: 40 },
  { department: 'Academic Support', examples: 'Resource room, Tutoring', icon_key: 'BookOpen', sort_order: 50 },
  { department: 'Executive Function', examples: 'Study skills', icon_key: 'Target', sort_order: 60 },
  { department: 'Behavioral Support', examples: 'FBA, BIP', icon_key: 'Users', sort_order: 70 },
  { department: 'Parent Coaching', examples: 'IEP prep, Strategy', icon_key: 'MessageSquare', sort_order: 80 },
  { department: 'Transition Services', examples: 'College readiness', icon_key: 'Briefcase', sort_order: 90 },
];

const TEMPLATE_ROWS = [
  {
    name: 'Individual Counseling Session',
    service_type: 'Counseling',
    duration_minutes: 45,
    price_cents: 9000,
    payment_required: true,
    description: 'One-on-one support session focused on emotional and behavioral needs.',
    sort_order: 10,
  },
  {
    name: 'Speech Articulation Coaching',
    service_type: 'Speech Therapy',
    duration_minutes: 30,
    price_cents: 7000,
    payment_required: true,
    description: 'Targeted speech support for articulation and communication clarity.',
    sort_order: 20,
  },
  {
    name: 'Sensory Regulation Support',
    service_type: 'Occupational Therapy',
    duration_minutes: 45,
    price_cents: 8500,
    payment_required: true,
    description: 'Practical interventions for sensory integration and daily function.',
    sort_order: 30,
  },
  {
    name: 'Parent IEP Strategy Intro',
    service_type: 'Parent Coaching',
    duration_minutes: 20,
    price_cents: null,
    payment_required: false,
    description: 'Free introductory call for IEP meeting preparation and strategy alignment.',
    sort_order: 40,
  },
];

export const up: Migration = async ({ context: sequelize }) => {
  const queryInterface = sequelize.getQueryInterface();

  await queryInterface.createTable('counselor_service_categories', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4,
    },
    department: {
      type: DataTypes.STRING(120),
      allowNull: false,
      unique: true,
    },
    examples: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: '',
    },
    icon_key: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    sort_order: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    is_active: {
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

  await queryInterface.createTable('counselor_service_templates', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    service_type: {
      type: DataTypes.STRING(120),
      allowNull: false,
    },
    duration_minutes: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    price_cents: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    payment_required: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: '',
    },
    sort_order: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    is_active: {
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

  await safeAddIndex(queryInterface, 'counselor_service_templates', ['service_type'], {
    name: 'idx_counselor_service_templates_service_type',
  });

  const now = new Date();
  await queryInterface.bulkInsert(
    'counselor_service_categories',
    CATEGORY_ROWS.map((row) => ({
      id: randomUUID(),
      ...row,
      is_active: true,
      created_at: now,
      updated_at: now,
    })),
  );

  await queryInterface.bulkInsert(
    'counselor_service_templates',
    TEMPLATE_ROWS.map((row) => ({
      id: randomUUID(),
      ...row,
      is_active: true,
      created_at: now,
      updated_at: now,
    })),
  );
};

export const down: Migration = async ({ context: sequelize }) => {
  const queryInterface = sequelize.getQueryInterface();
  await queryInterface.dropTable('counselor_service_templates');
  await queryInterface.dropTable('counselor_service_categories');
};
