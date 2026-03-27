import type { Migration } from '../umzug.js';

/**
 * Update subscription plans:
 * 1. Replace "Legal Support FAQ" → "Special Education Consultation"
 * 2. Replace "Pre-legal action guidance" → "Special education consultation guidance"
 * 3. Update Protected Parent description (remove "pre-legal")
 * 4. Add yearly pricing with ~17% discount (10 months for the price of 12)
 */
export const up: Migration = async ({ context: sequelize }) => {
  const qi = sequelize.getQueryInterface();
  const now = new Date();

  // Prepared Parent — update feature text + add yearly pricing
  await qi.bulkUpdate('subscription_plans', {
    features: JSON.stringify([
      'Everything in Informed Parent',
      'IEP Analyzer (unlimited scans)',
      'Goal Progress Tracking',
      'Contact Log',
      'Letter Writer',
      'Advocacy Lab',
      'Compliance Tracker',
      'Special Education Consultation',
      'Priority Support',
    ]),
    limits: JSON.stringify({
      documents: -1, scans: -1, letters: -1,
      regularPriceCents: 1499,
      yearlyPriceCents: 9990,         // $99.90/yr  → $8.33/mo (save ~17%)
      yearlyRegularPriceCents: 14990, // regular $149.90/yr
    }),
    updated_at: now,
  }, { slug: 'prepared_parent' });

  // Protected Parent — update feature text + description + add yearly pricing
  await qi.bulkUpdate('subscription_plans', {
    description: 'Everything in Prepared Parent plus expert on-call scheduling for personalized advice — disputes and special education consultation advisory.',
    features: JSON.stringify([
      'Everything in Prepared Parent',
      'Expert on-call scheduling',
      '1 consultation call (30 min) with special education specialist',
      'Dispute resolution advisory',
      'Special education consultation guidance',
      'Additional expert calls: $49.99 each',
    ]),
    limits: JSON.stringify({
      documents: -1, scans: -1, letters: -1, consultations: 1,
      regularPriceCents: 4999,
      additionalCallCents: 4999,
      yearlyPriceCents: 29990,         // $299.90/yr → $24.99/mo (save ~17%)
      yearlyRegularPriceCents: 49990,  // regular $499.90/yr
    }),
    updated_at: now,
  }, { slug: 'protected_parent' });
};

export const down: Migration = async ({ context: sequelize }) => {
  const qi = sequelize.getQueryInterface();
  const now = new Date();

  // Revert Prepared Parent
  await qi.bulkUpdate('subscription_plans', {
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
    limits: JSON.stringify({
      documents: -1, scans: -1, letters: -1,
      regularPriceCents: 1499,
    }),
    updated_at: now,
  }, { slug: 'prepared_parent' });

  // Revert Protected Parent
  await qi.bulkUpdate('subscription_plans', {
    description: 'Everything in Prepared Parent plus expert on-call scheduling for personalized advice — disputes and pre-legal action advisory.',
    features: JSON.stringify([
      'Everything in Prepared Parent',
      'Expert on-call scheduling',
      '1 consultation call (30 min) with special education specialist',
      'Dispute resolution advisory',
      'Pre-legal action guidance',
      'Additional expert calls: $49.99 each',
    ]),
    limits: JSON.stringify({
      documents: -1, scans: -1, letters: -1, consultations: 1,
      regularPriceCents: 4999,
      additionalCallCents: 4999,
    }),
    updated_at: now,
  }, { slug: 'protected_parent' });
};
