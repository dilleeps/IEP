import bcrypt from 'bcrypt';
import { faker } from '@faker-js/faker';
import type { Migration } from '../umzug.js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const configPath = join(__dirname, 'seed-config.json');
const seedConfig = JSON.parse(readFileSync(configPath, 'utf-8'));

interface UserConfig {
  email: string;
  role: string;
  status: string;
}

function demoDisplayNameFor(email: string, role: string): string {
  const roleLabel = role
    .toLowerCase()
    .split('_')
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(' ');

  // Keep it stable for easier cleanup/debugging
  if (email.startsWith('admin@')) return 'Demo Admin';
  if (email.startsWith('parent@')) return 'Demo Parent';
  if (email.startsWith('advocate@')) return 'Demo Advocate';
  if (email.startsWith('teacher@')) return 'Demo Teacher';
  if (email.startsWith('counselor@')) return 'Demo Counselor';
  if (email.startsWith('support@')) return 'Demo Support';

  return `Demo ${roleLabel}`;
}

export const up: Migration = async ({ context: sequelize }) => {
  const queryInterface = sequelize.getQueryInterface();
  const password = process.env.DEFAULT_SEED_PASSWORD || 'Demo123';
  const passwordHash = await bcrypt.hash(password, 12);
  const now = new Date();

  const users = (seedConfig.users ?? []) as UserConfig[];
  if (!Array.isArray(users) || users.length === 0) {
    console.log('⚠️  No users found in seed-config.json; skipping ensure-demo-users seed.');
    return;
  }

  const existingUsers = (await queryInterface.select(null, 'users', {})) as Array<{ id: string; email: string }>;
  const existingEmailSet = new Set((existingUsers ?? []).map((u) => (u.email || '').toLowerCase()));

  const adminUser = (existingUsers ?? []).find((u) => (u.email || '').toLowerCase() === 'admin@askiep.com');
  const adminId = adminUser?.id;

  const missingUsers = users.filter((u) => !existingEmailSet.has(u.email.toLowerCase()));

  if (missingUsers.length === 0) {
    console.log('✅ Demo users already present; nothing to add.');
    return;
  }

  console.log('🌱 Ensuring demo users exist (non-destructive)...');

  const insertRows = missingUsers.map((user) => {
    const isActive = user.status === 'active';

    return {
      id: faker.string.uuid(),
      email: user.email,
      password_hash: passwordHash,
      display_name: demoDisplayNameFor(user.email, user.role),
      role: user.role,
      status: user.status,
      approved_by:
        isActive && user.role !== 'PARENT' && user.role !== 'ADMIN' && adminId ? adminId : null,
      approved_at: isActive ? now : null,
      last_login_at: null,
      created_at: now,
      updated_at: now,
    };
  });

  insertRows.forEach((u) => console.log(`  + ${u.email}: role=${u.role}, status=${u.status}`));

  await queryInterface.bulkInsert('users', insertRows);

  console.log('✅ Missing demo users inserted successfully.');
  console.log('📝 Demo credentials:', { password });
};

export const down: Migration = async ({ context: sequelize }) => {
  // Best-effort cleanup: only remove demo users that this seed would have created.
  // This avoids deleting real accounts.
  const queryInterface = sequelize.getQueryInterface();

  const users = (seedConfig.users ?? []) as UserConfig[];
  if (!Array.isArray(users) || users.length === 0) return;

  const emails = users.map((u) => u.email.toLowerCase());

  // We only delete rows that look like demo rows created by this seed.
  // (display_name starts with "Demo ")
  await (queryInterface as any).sequelize.query(
    `DELETE FROM users WHERE lower(email) = ANY(:emails) AND display_name LIKE 'Demo %'`,
    { replacements: { emails } }
  );
};
