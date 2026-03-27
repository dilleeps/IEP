import type { Migration } from "../umzug.js";

/**
 * Migration: Create Dashboard Materialized Views
 * Uses raw SQL for idempotent view creation (drop and recreate)
 */
export const up: Migration = async ({ context: sequelize }) => {
  await sequelize.query(`
    -- Drop views if they exist (idempotent)
    DROP MATERIALIZED VIEW IF EXISTS dashboard_goal_mastery CASCADE;
    DROP MATERIALIZED VIEW IF EXISTS dashboard_compliance_health CASCADE;

    -- Create compliance health view
    CREATE MATERIALIZED VIEW dashboard_compliance_health AS
    SELECT 
      cp.id AS child_id,
      cp.user_id,
      
      -- Service delivery percentage (total minutes delivered vs planned)
      COALESCE(
        SUM(sl.minutes_delivered)::DECIMAL / 
        NULLIF(
          SUM(
            s.minutes_per_session * s.sessions_per_week * 
            ((LEAST(CURRENT_DATE, s.end_date) - s.start_date) / 7.0)
          )::DECIMAL, 
          0
        ) * 100,
        0
      ) AS service_delivery_percentage,
      
      -- Missed sessions count
      COUNT(CASE WHEN sl.status = 'missed' THEN 1 END) AS total_missed_sessions,
      
      -- Review status
      CASE 
        WHEN cp.next_iep_review_date < CURRENT_DATE THEN 'overdue'
        WHEN cp.next_iep_review_date - CURRENT_DATE < 30 THEN 'due_soon'
        ELSE 'on_track'
      END AS review_status,
      
      NOW() AS refreshed_at
    FROM child_profiles cp
    LEFT JOIN services s ON cp.id = s.child_id 
      AND s.status = 'active' 
      AND s.deleted_at IS NULL
    LEFT JOIN service_logs sl ON s.id = sl.service_id
      AND sl.deleted_at IS NULL
    WHERE cp.deleted_at IS NULL
    GROUP BY cp.id, cp.user_id, cp.next_iep_review_date;

    -- Create indexes on materialized view
    CREATE UNIQUE INDEX idx_dashboard_compliance_child 
      ON dashboard_compliance_health(child_id);
    CREATE INDEX idx_dashboard_compliance_user 
      ON dashboard_compliance_health(user_id);

    -- Create goal mastery view
    CREATE MATERIALIZED VIEW dashboard_goal_mastery AS
    SELECT 
      cp.id AS child_id,
      cp.user_id,
      
      COUNT(CASE WHEN gp.status = 'achieved' THEN 1 END) AS mastered_goals,
      COUNT(CASE WHEN gp.status = 'in_progress' 
        AND gp.progress_percentage >= 50 THEN 1 END) AS progressing_goals,
      COUNT(CASE WHEN gp.status = 'in_progress' 
        AND gp.progress_percentage < 50 THEN 1 END) AS emerging_goals,
      COUNT(CASE WHEN gp.status = 'not_started' THEN 1 END) AS not_started_goals,
      
      AVG(gp.progress_percentage) AS average_progress,
      
      NOW() AS refreshed_at
    FROM child_profiles cp
    LEFT JOIN iep_documents doc ON cp.id = doc.child_id 
      AND doc.document_type IN ('iep', 'current_iep')
      AND doc.iep_end_date >= CURRENT_DATE
      AND doc.deleted_at IS NULL
    LEFT JOIN goal_progress gp ON doc.id = gp.document_id 
      AND gp.deleted_at IS NULL
    WHERE cp.deleted_at IS NULL
    GROUP BY cp.id, cp.user_id;

    -- Create indexes on materialized view
    CREATE UNIQUE INDEX idx_dashboard_goals_child 
      ON dashboard_goal_mastery(child_id);
    CREATE INDEX idx_dashboard_goals_user 
      ON dashboard_goal_mastery(user_id);
  `);
  
  console.log('✅ Created dashboard materialized views');
  console.log('💡 Refresh views with: REFRESH MATERIALIZED VIEW CONCURRENTLY dashboard_compliance_health');
  console.log('💡 Refresh views with: REFRESH MATERIALIZED VIEW CONCURRENTLY dashboard_goal_mastery');
};

export const down: Migration = async ({ context: sequelize }) => {
  await sequelize.query(`
    DROP MATERIALIZED VIEW IF EXISTS dashboard_goal_mastery CASCADE;
    DROP MATERIALIZED VIEW IF EXISTS dashboard_compliance_health CASCADE;
  `);
  
  console.log('✅ Dropped dashboard materialized views');
};
