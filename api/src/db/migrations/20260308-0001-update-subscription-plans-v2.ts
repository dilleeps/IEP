import type { Migration } from '../umzug.js';

/**
 * Update subscription plans to the new 3-tier structure:
 *   Informed Parent (free) -> Prepared Parent ($9.99 intro / $14.99) -> Protected Parent ($29.99 intro / $49.99)
 * Remove the old Professional tier.
 * Launch date: July 4th -- early bird users get 1 month free + 1 free expert consultation call.
 */
export const up: Migration = async ({ context: sequelize }) => {
  const qi = sequelize.getQueryInterface();
  const now = new Date();

  // 1. Update Free (Starter) -> Informed Parent
  await qi.bulkUpdate('subscription_plans', {
    name: 'Informed Parent',
    slug: 'informed_parent',
    description: 'For parents just beginning the IEP journey.',
    price_cents: 0,
    features: JSON.stringify([
      'Dashboard',
      'Child Profile',
      'Basic Resources',
      'Limited document storage (2 IEP docs)',
    ]),
    limits: JSON.stringify({ documents: 2, scans: 0, letters: 0 }),
    color: '#6B7280',
    badge_text: null,
    is_featured: false,
    sort_order: 0,
    target_audience: 'For parents just beginning the IEP journey.',
    updated_at: now,
  }, { id: '11111111-1111-1111-1111-000000000001' });

  // 2. Update Essentials -> Prepared Parent
  await qi.bulkUpdate('subscription_plans', {
    name: 'Prepared Parent',
    slug: 'prepared_parent',
    description: 'For active parents managing ongoing IEPs or navigating disputes, support, and services/benefits awareness.',
    price_cents: 999,
    features: JSON.stringify([
      'Everything in Informed Parent',
      'IEP Analyzer (unlimited scans)',
      'Goal Progress Tracking',
      'Contact Log',
      'Letter Writer',
      'Advocacy Lab',
      'Compliance Tracker',
      'Legal Support FAQ',
      'Priority Support',
    ]),
    limits: JSON.stringify({ documents: -1, scans: -1, letters: -1 }),
    color: '#3B82F6',
    badge_text: 'Early Bird $9.99/mo',
    is_featured: true,
    sort_order: 1,
    target_audience: 'Active parents managing ongoing IEPs or navigating disputes.',
    updated_at: now,
  }, { id: '11111111-1111-1111-1111-000000000002' });

  // 3. Update Pro Advocate -> Protected Parent
  await qi.bulkUpdate('subscription_plans', {
    name: 'Protected Parent',
    slug: 'protected_parent',
    description: 'Everything in Prepared Parent plus expert on-call scheduling for personalized advice -- disputes and pre-legal action advisory.',
    price_cents: 2999,
    features: JSON.stringify([
      'Everything in Prepared Parent',
      'Expert on-call scheduling',
      '1 consultation call (30 min) with special education specialist',
      'Dispute resolution advisory',
      'Pre-legal action guidance',
    ]),
    limits: JSON.stringify({ documents: -1, scans: -1, letters: -1, consultations: 1 }),
    color: '#8B5CF6',
    badge_text: 'Early Bird $29.99/mo',
    is_featured: false,
    sort_order: 2,
    target_audience: 'Parents needing expert guidance for disputes and pre-legal action.',
    updated_at: now,
  }, { id: '11111111-1111-1111-1111-000000000003' });

  // 4. Soft-delete Professional plan (no longer offered)
  await qi.bulkUpdate('subscription_plans', {
    is_active: false,
    deleted_at: now,
    updated_at: now,
  }, { id: '11111111-1111-1111-1111-000000000004' });

  // 5. Migrate users on old slugs to new slugs
  await sequelize.query(`UPDATE users SET subscription_plan_slug = 'informed_parent' WHERE subscription_plan_slug = 'free'`);
  await sequelize.query(`UPDATE users SET subscription_plan_slug = 'prepared_parent' WHERE subscription_plan_slug = 'essentials'`);
  await sequelize.query(`UPDATE users SET subscription_plan_slug = 'protected_parent' WHERE subscription_plan_slug = 'pro_advocate'`);
  await sequelize.query(`UPDATE users SET subscription_plan_slug = 'protected_parent' WHERE subscription_plan_slug = 'professional'`);
};

export const down: Migration = async ({ context: sequelize }) => {
  const qi = sequelize.getQueryInterface();
  const now = new Date();

  await qi.bulkUpdate('subscription_plans', {
    name: 'Free (Starter)',
    slug: 'free',
    description: 'Top-of-funnel acquisition; first-time IEP parents',
    price_cents: 0,
    color: '#6B7280',
    badge_text: null,
    is_featured: false,
    sort_order: 0,
    features: JSON.stringify(['Dashboard', 'Child Profile', 'Basic Resources', 'Limited document storage (3 docs)']),
    limits: JSON.stringify({ documents: 3, scans: 0, letters: 0 }),
    target_audience: 'Top-of-funnel acquisition; first-time IEP parents',
    updated_at: now,
  }, { id: '11111111-1111-1111-1111-000000000001' });

  await qi.bulkUpdate('subscription_plans', {
    name: 'Essentials',
    slug: 'essentials',
    description: 'Active parents managing ongoing IEP process',
    price_cents: 1499,
    color: '#3B82F6',
    badge_text: null,
    is_featured: false,
    sort_order: 1,
    features: JSON.stringify(['All Starter features', 'IEP Analyzer (3 scans/mo)', 'Goal Progress', 'Contact Log', 'Letter Writer (5 letters/mo)']),
    limits: JSON.stringify({ documents: -1, scans: 3, letters: 5 }),
    target_audience: 'Active parents managing ongoing IEP process',
    updated_at: now,
  }, { id: '11111111-1111-1111-1111-000000000002' });

  await qi.bulkUpdate('subscription_plans', {
    name: 'Pro Advocate',
    slug: 'pro_advocate',
    description: 'Power users, parents in disputes or due process',
    price_cents: 2999,
    color: '#8B5CF6',
    badge_text: 'Most Popular',
    is_featured: true,
    sort_order: 2,
    features: JSON.stringify(['All Essentials features', 'Unlimited scans', 'Advocacy Lab', 'Compliance tracker', 'Legal Support access', 'Priority support']),
    limits: JSON.stringify({ documents: -1, scans: -1, letters: -1 }),
    target_audience: 'Power users, parents in disputes or due process',
    updated_at: now,
  }, { id: '11111111-1111-1111-1111-000000000003' });

  await qi.bulkUpdate('subscription_plans', {
    is_active: true,
    deleted_at: null,
    updated_at: now,
  }, { id: '11111111-1111-1111-1111-000000000004' });

  await sequelize.query(`UPDATE users SET subscription_plan_slug = 'free' WHERE subscription_plan_slug = 'informed_parent'`);
  await sequelize.query(`UPDATE users SET subscription_plan_slug = 'essentials' WHERE subscription_plan_slug = 'prepared_parent'`);
  await sequelize.query(`UPDATE users SET subscription_plan_slug = 'pro_advocate' WHERE subscription_plan_slug = 'protected_parent'`);
};
