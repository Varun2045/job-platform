-- 001_setup.sql - Database Setup Migration for Job Monitor Platform

-- Enable UUID extension if not already available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Companies Table
CREATE TABLE IF NOT EXISTS job_monitor_companies (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    priority INTEGER NOT NULL DEFAULT 3 CHECK (priority IN (1, 2, 3)),
    interval_minutes INTEGER NOT NULL DEFAULT 60 CHECK (interval_minutes > 0),
    last_successful_scrape TIMESTAMP WITH TIME ZONE,
    last_failed_scrape TIMESTAMP WITH TIME ZONE,
    last_scraper_used TEXT,
    detected_ats TEXT,
    detected_ats_at TIMESTAMP WITH TIME ZONE,
    api_endpoint TEXT,
    api_suspended_until TIMESTAMP WITH TIME ZONE,
    consecutive_failures INTEGER NOT NULL DEFAULT 0,
    resume_profiles TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
    avg_response_time_ms INTEGER NOT NULL DEFAULT 0,
    total_scrapes INTEGER NOT NULL DEFAULT 0,
    total_failures INTEGER NOT NULL DEFAULT 0,
    last_seen_timestamp TIMESTAMP WITH TIME ZONE,
    max_jobs_to_fetch INTEGER,
    max_pages INTEGER,
    scrape_timeout INTEGER,
    retry_count INTEGER,
    preferred_scraper TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 2. State Table (Stores the previous jobs list per company)
CREATE TABLE IF NOT EXISTS job_monitor_state (
    company_id TEXT PRIMARY KEY REFERENCES job_monitor_companies(id) ON DELETE CASCADE,
    jobs_data JSONB NOT NULL DEFAULT '[]'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 3. Notification History Table (Deduplication)
CREATE TABLE IF NOT EXISTS job_monitor_notifications (
    job_hash TEXT PRIMARY KEY,
    notified_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 4. Execution Stats Table
CREATE TABLE IF NOT EXISTS job_monitor_stats (
    id BIGSERIAL PRIMARY KEY,
    run_metrics JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 5. Cached Resume Match Scores Table
CREATE TABLE IF NOT EXISTS job_monitor_scores (
    job_hash TEXT NOT NULL,
    resume_profile TEXT NOT NULL,
    score INTEGER NOT NULL CHECK (score BETWEEN 0 AND 100),
    matcher_version TEXT NOT NULL,
    scored_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    PRIMARY KEY (job_hash, resume_profile, matcher_version)
);

-- 6. Applications Table
CREATE TABLE IF NOT EXISTS job_monitor_applications (
    job_hash TEXT PRIMARY KEY,
    company TEXT NOT NULL,
    job_id TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('New', 'Saved', 'Applied', 'OA Scheduled', 'OA Completed', 'Interview', 'Offer', 'Rejected', 'Closed')),
    applied_date TIMESTAMP WITH TIME ZONE,
    resume_used TEXT,
    notes TEXT,
    last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create Indexes for optimization
CREATE INDEX IF NOT EXISTS idx_companies_enabled ON job_monitor_companies(enabled);
CREATE INDEX IF NOT EXISTS idx_companies_priority ON job_monitor_companies(priority);
CREATE INDEX IF NOT EXISTS idx_companies_last_scrape ON job_monitor_companies(last_successful_scrape DESC);
CREATE INDEX IF NOT EXISTS idx_companies_failures ON job_monitor_companies(consecutive_failures);
CREATE INDEX IF NOT EXISTS idx_notifications_notified_at ON job_monitor_notifications(notified_at);
CREATE INDEX IF NOT EXISTS idx_scores_lookup ON job_monitor_scores(job_hash, resume_profile);
CREATE INDEX IF NOT EXISTS idx_scores_score ON job_monitor_scores(score DESC);
CREATE INDEX IF NOT EXISTS idx_applications_status ON job_monitor_applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_company ON job_monitor_applications(company);
CREATE INDEX IF NOT EXISTS idx_state_updated ON job_monitor_state(updated_at DESC);
