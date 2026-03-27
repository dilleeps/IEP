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

  // Check if table already exists (may have been applied outside umzug tracking)
  const [tables] = await sequelize.query(
    "SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename = 'subscription_plans'"
  ) as any;
  if (tables && tables.length > 0) return;

  await queryInterface.createTable('subscription_plans', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    slug: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    price_cents: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    billing_period: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'month',
    },
    features: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: [],
    },
    limits: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
    },
    color: {
      type: DataTypes.STRING(30),
      allowNull: true,
    },
    badge_text: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    is_featured: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    sort_order: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    target_audience: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    created_by: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'users', key: 'id' },
      onDelete: 'SET NULL',
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

  await safeAddIndex(queryInterface, 'subscription_plans', ['is_active'], {
    name: 'idx_subscription_plans_is_active',
  });
  await safeAddIndex(queryInterface, 'subscription_plans', ['sort_order'], {
    name: 'idx_subscription_plans_sort_order',
  });

  // Seed default plans from the image
  const now = new Date().toISOString();
  await queryInterface.bulkInsert('subscription_plans', [
    {
      id: '11111111-1111-1111-1111-000000000001',
      name: 'Free (Starter)',
      slug: 'free',
      description: 'Top-of-funnel acquisition; first-time IEP parents',
      price_cents: 0,
      billing_period: 'month',
      features: JSON.stringify([
        'Dashboard',
        'Child Profile',
        'Basic Resources',
        'Limited document storage (3 docs)',
      ]),
      limits: JSON.stringify({ documents: 3, scans: 0, letters: 0 }),
      color: '#6B7280',
      badge_text: null,
      is_featured: false,
      is_active: true,
      sort_order: 0,
      target_audience: 'Top-of-funnel acquisition; first-time IEP parents',
      created_at: now,
      updated_at: now,
      deleted_at: null,
    },
    {
      id: '11111111-1111-1111-1111-000000000002',
      name: 'Essentials',
      slug: 'essentials',
      description: 'Active parents managing ongoing IEP process',
      price_cents: 1499,
      billing_period: 'month',
      features: JSON.stringify([
        'All Starter features',
        'IEP Analyzer (3 scans/mo)',
        'Goal Progress',
        'Contact Log',
        'Letter Writer (5 letters/mo)',
      ]),
      limits: JSON.stringify({ documents: -1, scans: 3, letters: 5 }),
      color: '#3B82F6',
      badge_text: null,
      is_featured: false,
      is_active: true,
      sort_order: 1,
      target_audience: 'Active parents managing ongoing IEP process',
      created_at: now,
      updated_at: now,
      deleted_at: null,
    },
    {
      id: '11111111-1111-1111-1111-000000000003',
      name: 'Pro Advocate',
      slug: 'pro_advocate',
      description: 'Power users, parents in disputes or due process',
      price_cents: 2999,
      billing_period: 'month',
      features: JSON.stringify([
        'All Essentials features',
        'Unlimited scans',
        'Advocacy Lab',
        'Compliance tracker',
        'Legal Support access',
        'Priority support',
      ]),
      limits: JSON.stringify({ documents: -1, scans: -1, letters: -1 }),
      color: '#8B5CF6',
      badge_text: 'Most Popular',
      is_featured: true,
      is_active: true,
      sort_order: 2,
      target_audience: 'Power users, parents in disputes or due process',
      created_at: now,
      updated_at: now,
      deleted_at: null,
    },
    {
      id: '11111111-1111-1111-1111-000000000004',
      name: 'Professional',
      slug: 'professional',
      description: 'Educational advocates, attorneys, nonprofits',
      price_cents: 7999,
      billing_period: 'month',
      features: JSON.stringify([
        'Multi-child/multi-client support',
        'Team collaboration',
        'Bulk document analysis',
        'Practice management tools',
      ]),
      limits: JSON.stringify({ documents: -1, scans: -1, letters: -1, clients: -1 }),
      color: '#F59E0B',
      badge_text: 'Enterprise',
      is_featured: false,
      is_active: true,
      sort_order: 3,
      target_audience: 'Educational advocates, attorneys, nonprofits',
      created_at: now,
      updated_at: now,
      deleted_at: null,
    },
  ]);
};

export const down: Migration = async ({ context: sequelize }) => {
  const queryInterface = sequelize.getQueryInterface();
  await queryInterface.dropTable('subscription_plans');
};
