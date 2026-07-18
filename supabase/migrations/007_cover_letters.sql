-- 007_cover_letters.sql - Database Migration for Cover Letters CRM
-- Creates table for Cover Letter Builder with content management and templates

CREATE TABLE IF NOT EXISTS job_monitor_cover_letters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    company_name TEXT NOT NULL,
    job_title TEXT NOT NULL,
    job_description TEXT NOT NULL DEFAULT '',
    tone TEXT NOT NULL DEFAULT 'professional',
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_cover_letters_user_id ON job_monitor_cover_letters(user_id);
CREATE INDEX IF NOT EXISTS idx_cover_letters_company ON job_monitor_cover_letters(company_name);

-- Enable Row Level Security
ALTER TABLE job_monitor_cover_letters ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow all on own cover letters" ON job_monitor_cover_letters
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Add table comment
COMMENT ON TABLE job_monitor_cover_letters IS 'Saved cover letters for the Cover Letter Builder';
