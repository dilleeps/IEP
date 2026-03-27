import type { Migration } from '../umzug.js';

/**
 * Update subscription plans with early bird pricing details:
 *  - Store regularPriceCents in limits JSONB for UI strikethrough display
 *  - Update Protected Parent features to include additional call pricing
 *  - Update badge text and descriptions
 */
export const up: Migration = async ({ context: sequelize }) => {
  const qi = sequelize.getQueryInterface();
  const now = new Date();

  // Prepared Parent — intro $9.99/mo, regular $14.99/mo
  await qi.bulkUpdate('subscription_plans', {
    badge_text: 'Early Bird $9.99/mo',
    description: 'For active parents managing ongoing IEPs or navigating disputes, support, and services/benefits awareness.',
    limits: JSON.stringify({
      documents: -1, scans: -1, letters: -1,
      regularPriceCents: 1499,
    }),
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
    updated_at: now,
  }, { slug: 'prepared_parent' });

  // Protected Parent — intro $29.99/mo, regular $49.99/mo
  await qi.bulkUpdate('subscription_plans', {
    badge_text: 'Early Bird $29.99/mo',
    description: 'Everything in Prepared Parent plus expert on-call scheduling for personalized advice — disputes and pre-legal action advisory.',
    limits: JSON.stringify({
      documents: -1, scans: -1, letters: -1, consultations: 1,
      regularPriceCents: 4999,
      additionalCallCents: 4999,
    }),
    features: JSON.stringify([
      'Everything in Prepared Parent',
      'Expert on-call scheduling',
      '1 consultation call (30 min) with special education specialist',
      'Dispute resolution advisory',
      'Pre-legal action guidance',
      'Additional expert calls: $49.99 each',
    ]),
    updated_at: now,
  }, { slug: 'protected_parent' });
};

export const down: Migration = async ({ context: sequelize }) => {
  const qi = sequelize.getQueryInterface();
  const now = new Date();

  await qi.bulkUpdate('subscription_plans', {
    limits: JSON.stringify({ documents: -1, scans: -1, letters: -1 }),
    updated_at: now,
  }, { slug: 'prepared_parent' });

  await qi.bulkUpdate('subscription_plans', {
    limits: JSON.stringify({ documents: -1, scans: -1, letters: -1, consultations: 1 }),
    features: JSON.stringify([
      'Everything in Prepared Parent',
      'Expert on-call scheduling',
      '1 consultation call (30 min) with special education specialist',
      'Dispute resolution advisory',
      'Pre-legal action guidance',
    ]),
    updated_at: now,
  }, { slug: 'protected_parent' });
};
