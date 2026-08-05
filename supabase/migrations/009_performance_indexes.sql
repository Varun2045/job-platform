-- Performance Optimization: Database Indexes for Job Monitor
-- This migration adds indexes to improve query performance for job search and filtering

-- Index on company_id for faster company-specific queries
CREATE INDEX IF NOT EXISTS idx_job_monitor_state_company_id 
ON job_monitor_state(company_id);

-- Index on updated_at for efficient time-based queries and cache invalidation
CREATE INDEX IF NOT EXISTS idx_job_monitor_state_updated_at 
ON job_monitor_state(updated_at DESC);

-- Composite index for company_id + updated_at for common query patterns
CREATE INDEX IF NOT EXISTS idx_job_monitor_state_company_updated 
ON job_monitor_state(company_id, updated_at DESC);

-- Index for job_monitor_companies table
CREATE INDEX IF NOT EXISTS idx_job_monitor_companies_enabled 
ON job_monitor_companies(enabled);

CREATE INDEX IF NOT EXISTS idx_job_monitor_companies_priority 
ON job_monitor_companies(priority);

-- Index for applications table if it exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'applications') THEN
        CREATE INDEX IF NOT EXISTS idx_applications_user_id 
        ON applications(user_id);
        
        CREATE INDEX IF NOT EXISTS idx_applications_status 
        ON applications(status);
        
        CREATE INDEX IF NOT EXISTS idx_applications_created_at 
        ON applications(created_at DESC);
    END IF;
END $$;

-- Add comment for documentation
COMMENT ON INDEX idx_job_monitor_state_company_id IS 'Index for company-specific job queries';
COMMENT ON INDEX idx_job_monitor_state_updated_at IS 'Index for time-based queries and cache invalidation';
COMMENT ON INDEX idx_job_monitor_state_company_updated IS 'Composite index for company + time queries';
