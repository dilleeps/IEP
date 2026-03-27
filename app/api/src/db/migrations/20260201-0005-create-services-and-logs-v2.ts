import type { Migration } from "../umzug.js";

/**
 * Migration: Create Services and Service Logs Tables
 * Uses raw SQL for idempotent operations, indexes only (no foreign keys)
 */
export const up: Migration = async ({ context: sequelize }) => {
  await sequelize.query(`
    -- Create services table if not exists
    CREATE TABLE IF NOT EXISTS services (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      document_id UUID NOT NULL,
      child_id UUID NOT NULL,
      service_type VARCHAR(100) NOT NULL,
      provider VARCHAR(255),
      minutes_per_session INTEGER,
      sessions_per_week DECIMAL(3, 1),
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      status VARCHAR(50) DEFAULT 'active' NOT NULL,
      total_sessions_planned INTEGER DEFAULT 0 NOT NULL,
      total_sessions_delivered INTEGER DEFAULT 0 NOT NULL,
      notes TEXT,
      metadata JSONB DEFAULT '{}' NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
      deleted_at TIMESTAMP WITH TIME ZONE
    );

    -- Add computed column for delivery percentage
    DO $$ BEGIN
      ALTER TABLE services 
      ADD COLUMN IF NOT EXISTS delivery_percentage DECIMAL(5,2) 
      GENERATED ALWAYS AS (
        CASE WHEN total_sessions_planned > 0 
        THEN (total_sessions_delivered::DECIMAL / total_sessions_planned * 100)
        ELSE 0 END
      ) STORED;
    EXCEPTION
      WHEN duplicate_column THEN null;
    END $$;

    -- Create service_logs table if not exists
    CREATE TABLE IF NOT EXISTS service_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      service_id UUID NOT NULL,
      session_date DATE NOT NULL,
      minutes_delivered INTEGER,
      status VARCHAR(50) NOT NULL,
      provider_id UUID NOT NULL,
      notes TEXT,
      activities JSONB,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
      deleted_at TIMESTAMP WITH TIME ZONE
    );

    -- Create indexes for services (no foreign keys)
    CREATE INDEX IF NOT EXISTS idx_services_document_id ON services(document_id);
    CREATE INDEX IF NOT EXISTS idx_services_child_id ON services(child_id);
    CREATE INDEX IF NOT EXISTS idx_services_service_type ON services(service_type);
    CREATE INDEX IF NOT EXISTS idx_services_status ON services(status);
    CREATE INDEX IF NOT EXISTS idx_services_dates ON services(start_date, end_date);
    CREATE INDEX IF NOT EXISTS idx_services_deleted_at ON services(deleted_at) WHERE deleted_at IS NULL;

    -- Create indexes for service_logs (no foreign keys)
    CREATE INDEX IF NOT EXISTS idx_service_logs_service_id ON service_logs(service_id);
    CREATE INDEX IF NOT EXISTS idx_service_logs_provider_id ON service_logs(provider_id);
    CREATE INDEX IF NOT EXISTS idx_service_logs_session_date ON service_logs(session_date);
    CREATE INDEX IF NOT EXISTS idx_service_logs_status ON service_logs(status);
    CREATE INDEX IF NOT EXISTS idx_service_logs_deleted_at ON service_logs(deleted_at) WHERE deleted_at IS NULL;
  `);
  
  console.log('✅ Created services and service_logs tables');
};

export const down: Migration = async ({ context: sequelize }) => {
  await sequelize.query(`
    DROP TABLE IF EXISTS service_logs CASCADE;
    DROP TABLE IF EXISTS services CASCADE;
  `);
  
  console.log('✅ Dropped services and service_logs tables');
};
