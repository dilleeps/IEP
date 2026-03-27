import type { Migration } from '../umzug.js';
import { randomUUID } from 'node:crypto';

interface TemplateSeedRow {
  name: string;
  service_type: string;
  duration_minutes: number;
  price_cents: number | null;
  payment_required: boolean;
  description: string;
  sort_order: number;
}

const EXTRA_TEMPLATE_ROWS: TemplateSeedRow[] = [
  {
    name: 'Play-Based Emotional Regulation Session',
    service_type: 'Counseling',
    duration_minutes: 45,
    price_cents: 9500,
    payment_required: true,
    description: 'Child-centered counseling session using play techniques for emotional regulation.',
    sort_order: 11,
  },
  {
    name: 'Family Counseling Check-In',
    service_type: 'Counseling',
    duration_minutes: 30,
    price_cents: 7500,
    payment_required: true,
    description: 'Short family session to align home strategies and school supports.',
    sort_order: 12,
  },
  {
    name: 'Pragmatic Language Coaching',
    service_type: 'Speech Therapy',
    duration_minutes: 45,
    price_cents: 9000,
    payment_required: true,
    description: 'Social communication and conversational language support session.',
    sort_order: 21,
  },
  {
    name: 'Language Comprehension Support',
    service_type: 'Speech Therapy',
    duration_minutes: 30,
    price_cents: 7000,
    payment_required: true,
    description: 'Focused intervention for receptive and expressive language needs.',
    sort_order: 22,
  },
  {
    name: 'Fine Motor Skill Session',
    service_type: 'Occupational Therapy',
    duration_minutes: 45,
    price_cents: 8500,
    payment_required: true,
    description: 'Activities targeting handwriting, grip, and classroom fine motor tasks.',
    sort_order: 31,
  },
  {
    name: 'Daily Living Skills Coaching',
    service_type: 'Occupational Therapy',
    duration_minutes: 30,
    price_cents: 7000,
    payment_required: true,
    description: 'Support for routines, organization, and independent task completion.',
    sort_order: 32,
  },
  {
    name: 'Balance and Coordination Training',
    service_type: 'Physical Therapy',
    duration_minutes: 45,
    price_cents: 9000,
    payment_required: true,
    description: 'Session focused on posture, mobility, and core physical coordination.',
    sort_order: 41,
  },
  {
    name: 'Strength and Endurance Session',
    service_type: 'Physical Therapy',
    duration_minutes: 30,
    price_cents: 7500,
    payment_required: true,
    description: 'Targeted PT plan for classroom stamina and functional movement.',
    sort_order: 42,
  },
  {
    name: 'Academic Skills Strategy Session',
    service_type: 'Academic Support',
    duration_minutes: 45,
    price_cents: 8500,
    payment_required: true,
    description: 'Intervention planning for reading, writing, and math support goals.',
    sort_order: 51,
  },
  {
    name: 'Homework Systems Coaching',
    service_type: 'Academic Support',
    duration_minutes: 30,
    price_cents: 6500,
    payment_required: true,
    description: 'Structure and routines for assignment planning and completion.',
    sort_order: 52,
  },
  {
    name: 'Executive Function Strategy Session',
    service_type: 'Executive Function',
    duration_minutes: 45,
    price_cents: 8500,
    payment_required: true,
    description: 'Planning, organization, and task-initiation supports tailored to student needs.',
    sort_order: 61,
  },
  {
    name: 'Study Skills Intensive',
    service_type: 'Executive Function',
    duration_minutes: 30,
    price_cents: 6500,
    payment_required: true,
    description: 'Practical note-taking, planning, and test-prep skill coaching.',
    sort_order: 62,
  },
  {
    name: 'Behavior Plan Review (FBA/BIP)',
    service_type: 'Behavioral Support',
    duration_minutes: 60,
    price_cents: 12000,
    payment_required: true,
    description: 'Behavior data review and support planning based on FBA/BIP goals.',
    sort_order: 71,
  },
  {
    name: 'Behavior Coaching Follow-Up',
    service_type: 'Behavioral Support',
    duration_minutes: 30,
    price_cents: 7000,
    payment_required: true,
    description: 'Progress-focused check-in to adjust behavior strategies across settings.',
    sort_order: 72,
  },
  {
    name: 'Parent IEP Meeting Prep',
    service_type: 'Parent Coaching',
    duration_minutes: 45,
    price_cents: 8500,
    payment_required: true,
    description: 'Prepare agenda, concerns, and goals before an upcoming IEP meeting.',
    sort_order: 81,
  },
  {
    name: 'Parent Follow-Up Strategy Session',
    service_type: 'Parent Coaching',
    duration_minutes: 30,
    price_cents: 6000,
    payment_required: true,
    description: 'Action-plan follow-up after IEP meetings or school communications.',
    sort_order: 82,
  },
  {
    name: 'Postsecondary Transition Planning',
    service_type: 'Transition Services',
    duration_minutes: 60,
    price_cents: 12000,
    payment_required: true,
    description: 'Transition planning for college, career readiness, and independent living skills.',
    sort_order: 91,
  },
  {
    name: 'High School to College Readiness Check-In',
    service_type: 'Transition Services',
    duration_minutes: 30,
    price_cents: 7000,
    payment_required: true,
    description: 'Short planning session for accommodations and support continuity after graduation.',
    sort_order: 92,
  },
];

export const up: Migration = async ({ context: sequelize }) => {
  const queryInterface = sequelize.getQueryInterface();
  const now = new Date();

  const [existingRows] = await sequelize.query(
    'SELECT name FROM counselor_service_templates WHERE is_active = true',
  );

  const existingNames = new Set(
    (existingRows as Array<{ name: string }>).map((row) => row.name),
  );

  const rowsToInsert = EXTRA_TEMPLATE_ROWS
    .filter((row) => !existingNames.has(row.name))
    .map((row) => ({
      id: randomUUID(),
      ...row,
      is_active: true,
      created_at: now,
      updated_at: now,
    }));

  if (rowsToInsert.length > 0) {
    await queryInterface.bulkInsert('counselor_service_templates', rowsToInsert);
  }
};

export const down: Migration = async ({ context: sequelize }) => {
  const names = EXTRA_TEMPLATE_ROWS.map((row) => row.name);
  await sequelize.query(
    'DELETE FROM counselor_service_templates WHERE name = ANY(:names)',
    {
      replacements: { names },
    },
  );
};
