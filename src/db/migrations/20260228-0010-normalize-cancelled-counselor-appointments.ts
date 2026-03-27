import type { Migration } from '../umzug.js';

export const up: Migration = async ({ context: sequelize }) => {
  await sequelize.query(`
    UPDATE counselor_appointments
    SET
      payment_status = 'NOT_REQUIRED',
      payment_reference = NULL,
      meet_link = NULL,
      calendar_event_id = NULL,
      scheduled_at = NULL,
      counselor_message = ''
    WHERE status = 'CANCELLED';
  `);
};

export const down: Migration = async () => {
  // Irreversible data normalization migration.
};
