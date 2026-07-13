-- 005_application_automation.sql - Database Migration for Application Automation
-- Creates tables for Auto-Apply, Resume Profiles, Recruiter CRM, Calendar, and Exports

-- 1. Resume Profiles Table
CREATE TABLE IF NOT EXISTS job_monitor_resume_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    profile_name TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_user_profile UNIQUE (user_id, profile_name)
);
ALTER TABLE job_monitor_resume_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on own resume profiles" ON job_monitor_resume_profiles USING (auth.uid() = user_id);

-- 2. Application Queue Table
CREATE TABLE IF NOT EXISTS job_monitor_application_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    job_hash TEXT NOT NULL,
    company TEXT NOT NULL,
    title TEXT NOT NULL,
    state TEXT NOT NULL DEFAULT 'NEW',
    payload JSONB NOT NULL DEFAULT '{}',
    validation_errors JSONB NOT NULL DEFAULT '[]',
    retries INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_user_job UNIQUE (user_id, job_hash)
);
ALTER TABLE job_monitor_application_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on own application queue" ON job_monitor_application_queue USING (auth.uid() = user_id);

-- 3. Recruiters CRM Table
CREATE TABLE IF NOT EXISTS job_monitor_recruiters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    company TEXT NOT NULL,
    linkedin TEXT,
    email TEXT,
    phone TEXT,
    notes TEXT,
    conversation_history JSONB NOT NULL DEFAULT '[]',
    follow_up_date TIMESTAMP WITH TIME ZONE,
    last_contacted TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
ALTER TABLE job_monitor_recruiters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on own recruiters" ON job_monitor_recruiters USING (auth.uid() = user_id);

-- 4. Calendar Events Table
CREATE TABLE IF NOT EXISTS job_monitor_calendar_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    event_type TEXT NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
ALTER TABLE job_monitor_calendar_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on own calendar events" ON job_monitor_calendar_events USING (auth.uid() = user_id);

-- 5. Exports Table
CREATE TABLE IF NOT EXISTS job_monitor_exports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    export_type TEXT NOT NULL,
    format TEXT NOT NULL,
    file_path TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
ALTER TABLE job_monitor_exports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on own exports" ON job_monitor_exports USING (auth.uid() = user_id);
