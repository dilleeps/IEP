import bcrypt from "bcrypt";
import { faker } from "@faker-js/faker";
import type { Migration } from "../umzug.js";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load seed configuration
const configPath = join(__dirname, "seed-config.json");
const seedConfig = JSON.parse(readFileSync(configPath, "utf-8"));

interface UserConfig {
  email: string;
  role: string;
  status: string;
  children: ChildConfig[];
}

interface ChildConfig {
  name: string;
  age: number;
  grade: string;
  disabilities: string[];
}

export const up: Migration = async ({ context: sequelize }) => {
  const queryInterface = sequelize.getQueryInterface();
  const password = process.env.DEFAULT_SEED_PASSWORD || "Demo123";
  const passwordHash = await bcrypt.hash(password, 12);
  const now = new Date();
  
  // Check if users already exist
  const existingUsers = await queryInterface.select(null, "users", {});
  if (existingUsers && existingUsers.length > 0) {
    console.log("⚠️  Users already exist in database. Skipping seed to prevent data loss.");
    console.log("   Run 'seed:down' first if you want to reset the data.");
    return;
  }
  
  console.log("🌱 Starting demo data seeding...");
  
  const userIds: Record<string, string> = {};
  const childIds: Record<string, string> = {};
  const users = seedConfig.users as UserConfig[];

  // Generate UUIDs for users
  users.forEach((user) => {
    userIds[user.email] = faker.string.uuid();
  });

  const adminId = userIds["admin@askiep.com"];

  // Create users
  const usersData = users.map((user) => ({
    id: userIds[user.email],
    email: user.email,
    password_hash: passwordHash,
    display_name: faker.person.fullName(),
    role: user.role,
    status: user.status,
    approved_by: user.status === "active" && user.role !== "PARENT" && user.role !== "ADMIN" ? adminId : null,
    approved_at: user.status === "active" ? now : null,
    last_login_at: user.status === "active" ? now : null,
    created_at: now,
    updated_at: now,
  }));

  console.log("🔍 Debug - Users data to insert:");
  usersData.forEach((u) => console.log(`  ${u.email}: role=${u.role}, status=${u.status}`));

  await queryInterface.bulkInsert("users", usersData);

  // Create child profiles
  const childProfilesData: any[] = [];
  const goalsData: any[] = [];

  users.forEach((user) => {
    const userId = userIds[user.email];
    
    user.children.forEach((child) => {
      const childId = faker.string.uuid();
      childIds[`${user.email}-${child.name}`] = childId;
      
      const dateOfBirth = faker.date.birthdate({ min: child.age, max: child.age, mode: "age" });
      const lastIepDate = faker.date.recent({ days: 180 });
      const nextIepReviewDate = new Date(lastIepDate);
      nextIepReviewDate.setFullYear(nextIepReviewDate.getFullYear() + 1);

      childProfilesData.push({
        id: childId,
        user_id: userId,
        name: child.name,
        date_of_birth: dateOfBirth.toISOString().split("T")[0],
        age: child.age,
        grade: child.grade,
        school_name: faker.company.name() + " " + faker.helpers.arrayElement(["Elementary", "Middle School", "High School"]),
        school_district: faker.location.city() + " School District",
        disabilities: child.disabilities,
        focus_tags: faker.helpers.arrayElements(
          ["reading", "writing", "math", "attention", "social skills", "communication", "behavior", "motor skills"],
          { min: 2, max: 4 }
        ),
        last_iep_date: lastIepDate.toISOString().split("T")[0],
        next_iep_review_date: nextIepReviewDate.toISOString().split("T")[0],
        advocacy_level: faker.helpers.arrayElement(["Beginner", "Intermediate", "Advanced"]),
        primary_goal: faker.lorem.sentence(),
        state_context: faker.location.state({ abbreviated: true }),
        advocacy_bio: faker.lorem.paragraph(),
        accommodations_summary: faker.lorem.sentences(2),
        services_summary: faker.lorem.sentences(2),
        is_active: true,
        reminder_preferences: JSON.stringify({
          iep_review_reminder: faker.datatype.boolean(),
          service_tracking_reminder: faker.datatype.boolean(),
        }),
        created_at: now,
        updated_at: now,
        deleted_at: null,
      });

      // Generate 2-3 goals per child
      const numGoals = faker.number.int({ min: 2, max: 3 });
      for (let i = 0; i < numGoals; i++) {
        const category = faker.helpers.arrayElement(["academic", "behavioral", "communication", "social", "adaptive", "motor"]);
        const goalName = `${category.charAt(0).toUpperCase() + category.slice(1)} Goal ${i + 1}`;
        
        goalsData.push({
          id: faker.string.uuid(),
          child_id: childId,
          user_id: userId,
          goal_name: goalName,
          goal_description: faker.lorem.paragraph(),
          goal_category: category,
          baseline_value: faker.number.int({ min: 0, max: 50 }).toString(),
          current_value: faker.number.int({ min: 20, max: 70 }).toString(),
          target_value: faker.number.int({ min: 70, max: 100 }).toString(),
          measurement_unit: faker.helpers.arrayElement(["percent", "occurrences", "minutes", "tasks completed"]),
          status: faker.helpers.arrayElement(["not_started", "in_progress", "achieved", "modified"]),
          progress_percentage: faker.number.int({ min: 0, max: 100 }),
          start_date: faker.date.past({ years: 0.5 }).toISOString().split("T")[0],
          target_date: faker.date.future({ years: 1 }).toISOString().split("T")[0],
          last_updated: now.toISOString().split("T")[0],
          mastered_date: null,
          notes: faker.lorem.sentence(),
          data_source: faker.helpers.arrayElement(["Parent Report", "Teacher Assessment", "IEP Meeting", "Progress Monitoring"]),
          created_at: now,
          updated_at: now,
          deleted_at: null,
        });
      }
    });
  });

  if (childProfilesData.length > 0) {
    await queryInterface.bulkInsert("child_profiles", childProfilesData);
  }

  if (goalsData.length > 0) {
    await queryInterface.bulkInsert("goal_progress", goalsData);
  }

  // Create user preferences for all users
  const preferencesData = users.map((user) => ({
    id: faker.string.uuid(),
    user_id: userIds[user.email],
    theme: faker.helpers.arrayElement(["light", "dark", "system"]),
    language: "en",
    notifications: faker.datatype.boolean(),
    email_updates: faker.datatype.boolean(),
    email_frequency: faker.helpers.arrayElement(["realtime", "daily", "weekly", "never"]),
    smart_prompt_frequency: faker.helpers.arrayElement(["minimal", "normal", "frequent"]),
    dashboard_layout: JSON.stringify({
      widgets: faker.helpers.arrayElements(
        ["children", "deadlines", "goals", "resources", "communications", "stats"],
        { min: 3, max: 5 }
      ),
    }),
    dashboard_widgets: faker.helpers.arrayElements(
      ["overview", "recent_activity", "upcoming_deadlines", "goal_progress", "resources"],
      { min: 3, max: 5 }
    ),
    default_view: faker.helpers.arrayElement(["dashboard", "children", "goals", "documents"]),
    advocacy_level: faker.helpers.arrayElement(["Beginner", "Intermediate", "Advanced"]),
    show_legal_citations: faker.datatype.boolean(),
    show_advocacy_quotes: faker.datatype.boolean(),
    show_smart_prompts: faker.datatype.boolean(),
    reminder_lead_time_days: faker.number.int({ min: 3, max: 14 }),
    calendar_sync_enabled: faker.datatype.boolean(),
    anonymous_analytics: faker.datatype.boolean(),
    additional_settings: JSON.stringify({
      iep_deadlines: faker.datatype.boolean(),
      goal_reviews: faker.datatype.boolean(),
      follow_ups: faker.datatype.boolean(),
      meeting_reminders: faker.datatype.boolean(),
    }),
    created_at: now,
    updated_at: now,
  }));

  await queryInterface.bulkInsert("user_preferences", preferencesData);

  console.log("✅ Demo data created successfully!");
  console.log("\n📝 Demo user credentials:");
  console.log("-----------------------------------");
  users.forEach((user) => {
    console.log(`${user.role.padEnd(20)} ${user.email.padEnd(30)} / ${password} (${user.status})`);
  });
  console.log("-----------------------------------");
  console.log(`\n👥 Created ${usersData.length} users`);
  console.log(`👶 Created ${childProfilesData.length} child profiles`);
  console.log(`🎯 Created ${goalsData.length} goals`);
  console.log(`⚙️  Created ${preferencesData.length} user preferences\n`);
};



export const down: Migration = async ({ context: sequelize }) => {
  const queryInterface = sequelize.getQueryInterface();
  
  console.log("🧹 Cleaning all data except system configuration...");
  
  // Delete ALL data from these tables (respecting foreign key order)
  // System configuration table is NOT touched
  
  // AI & Communication related
  await queryInterface.bulkDelete("smart_prompts", {});
  await queryInterface.bulkDelete("ai_conversations", {});
  await queryInterface.bulkDelete("advocacy_insights", {});
  await queryInterface.bulkDelete("letter_drafts", {});
  await queryInterface.bulkDelete("communication_logs", {});
  
  // Documents & Resources
  await queryInterface.bulkDelete("vector_embeddings", {});
  await queryInterface.bulkDelete("iep_analyses", {});
  await queryInterface.bulkDelete("iep_documents", {});
  await queryInterface.bulkDelete("resources", {});
  
  // Tracking & Compliance
  await queryInterface.bulkDelete("behavior_logs", {});
  await queryInterface.bulkDelete("compliance_summaries", {});
  await queryInterface.bulkDelete("compliance_logs", {});
  await queryInterface.bulkDelete("data_access_requests", {});
  await queryInterface.bulkDelete("user_consents", {});
  
  // Goals & Progress
  await queryInterface.bulkDelete("goal_progress", {});
  
  // User related (respecting FK dependencies)
  await queryInterface.bulkDelete("user_preferences", {});
  await queryInterface.bulkDelete("child_profiles", {});
  await queryInterface.bulkDelete("leads", {});
  await queryInterface.bulkDelete("letter_templates", {});
  await queryInterface.bulkDelete("users", {});

  console.log("✅ All data deleted successfully (system configuration preserved)!");
};
