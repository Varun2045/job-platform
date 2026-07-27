-- V1.1__kanban_crm_offers.sql - Database Migration for Version 1.1 Features
-- Enables Kanban reordering, Offers compensation management, Follow-ups, Notification preferences, Visa intelligence, Export tracking, and Keyword heatmaps.

-- Enable UUID extension if not already available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Alter existing applications table to support Kanban board ordering and resume variant linking
ALTER TABLE job_monitor_applications 
  ADD COLUMN IF NOT EXISTS stage_order DOUBLE PRECISION DEFAULT 0.0,
  ADD COLUMN IF NOT EXISTS resume_profile_id UUID;

-- 2. Offers Table
CREATE TABLE IF NOT EXISTS offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID UNIQUE NOT NULL,
  user_id UUID NOT NULL,
  base_salary NUMERIC(12, 2) NOT NULL CHECK (base_salary >= 0),
  signing_bonus NUMERIC(12, 2) DEFAULT 0 CHECK (signing_bonus >= 0),
  annual_bonus_pct NUMERIC(5, 2) DEFAULT 0 CHECK (annual_bonus_pct >= 0),
  equity_value NUMERIC(12, 2) DEFAULT 0 CHECK (equity_value >= 0),
  vesting_years NUMERIC(4, 2) DEFAULT 4 CHECK (vesting_years > 0),
  location TEXT NOT NULL,
  remote_status TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Draft', 'Active', 'Accepted', 'Rejected', 'Expired')),
  offer_deadline TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 3. Follow-Ups Table
CREATE TABLE IF NOT EXISTS followups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL,
  user_id UUID NOT NULL,
  scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Sent', 'Completed', 'Skipped', 'Snoozed')),
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 4. Notification Preferences Table
CREATE TABLE IF NOT EXISTS notification_preferences (
  user_id UUID PRIMARY KEY,
  email_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  slack_webhook_url TEXT,
  telegram_bot_token TEXT,
  telegram_chat_id TEXT,
  digest_frequency TEXT NOT NULL DEFAULT 'Daily' CHECK (digest_frequency IN ('Realtime', 'Daily', 'Weekly')),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 5. Visa Sponsors Intelligence Table
CREATE TABLE IF NOT EXISTS visa_sponsors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  normalized_name TEXT NOT NULL,
  total_lcas INTEGER NOT NULL CHECK (total_lcas >= 0),
  approval_rate_pct NUMERIC(5, 2) NOT NULL CHECK (approval_rate_pct BETWEEN 0 AND 100),
  avg_salary NUMERIC(12, 2) NOT NULL CHECK (avg_salary >= 0),
  fiscal_year INTEGER NOT NULL CHECK (fiscal_year >= 2000),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 6. Export Jobs Table
CREATE TABLE IF NOT EXISTS export_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  format TEXT NOT NULL CHECK (format IN ('PDF', 'CSV', 'JSON')),
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Processing', 'Completed', 'Failed')),
  file_url TEXT,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 7. Keyword Heatmaps Table
CREATE TABLE IF NOT EXISTS keyword_heatmaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id TEXT NOT NULL,
  resume_profile_id UUID NOT NULL,
  matched_keywords TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
  missing_keywords TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
  match_density_pct NUMERIC(5, 2) NOT NULL CHECK (match_density_pct BETWEEN 0 AND 100),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 8. Recruiter Interactions Table
CREATE TABLE IF NOT EXISTS recruiter_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recruiter_id UUID NOT NULL,
  application_id UUID,
  type TEXT NOT NULL CHECK (type IN ('Email', 'LinkedInMessage', 'PhoneCall', 'Meeting', 'Other')),
  direction TEXT NOT NULL CHECK (direction IN ('Outbound', 'Inbound')),
  summary TEXT NOT NULL,
  interaction_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 9. Optimization Indexes
CREATE INDEX IF NOT EXISTS idx_applications_stage_order ON job_monitor_applications(stage_order);
CREATE INDEX IF NOT EXISTS idx_offers_user_id ON offers(user_id);
CREATE INDEX IF NOT EXISTS idx_offers_application_id ON offers(application_id);
CREATE INDEX IF NOT EXISTS idx_followups_user_id ON followups(user_id);
CREATE INDEX IF NOT EXISTS idx_followups_application_id ON followups(application_id);
CREATE INDEX IF NOT EXISTS idx_followups_scheduled_date ON followups(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_followups_status ON followups(status);
CREATE INDEX IF NOT EXISTS idx_visa_sponsors_normalized ON visa_sponsors(normalized_name);
CREATE INDEX IF NOT EXISTS idx_export_jobs_user_status ON export_jobs(user_id, status);
CREATE INDEX IF NOT EXISTS idx_recruiter_interactions_recruiter ON recruiter_interactions(recruiter_id);
