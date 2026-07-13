-- 006_referrals_crm.sql - Database Migration for Referral CRM
-- Creates table for LinkedIn Referral Assistant with contact management, pipeline tracking, and analytics

-- Referrals CRM Table
CREATE TABLE IF NOT EXISTS job_monitor_referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('Recruiter', 'Hiring Manager', 'Engineering Manager', 'University Alumni', 'Employee', 'Talent Acquisition', 'HR')),
    company TEXT NOT NULL,
    linkedin_url TEXT,
    email TEXT,
    location TEXT,
    notes TEXT,
    tags TEXT[] NOT NULL DEFAULT '{}',
    connection_status TEXT NOT NULL DEFAULT 'Potential Contact' CHECK (connection_status IN ('Potential Contact', 'LinkedIn Opened', 'Connection Sent', 'Connected', 'Referral Requested', 'Referral Submitted', 'Applied', 'Interview', 'Offer')),
    referral_status TEXT,
    last_contacted TIMESTAMP WITH TIME ZONE,
    next_follow_up TIMESTAMP WITH TIME ZONE,
    reminder TIMESTAMP WITH TIME ZONE,
    outcome TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_referrals_user_id ON job_monitor_referrals(user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_company ON job_monitor_referrals(company);
CREATE INDEX IF NOT EXISTS idx_referrals_category ON job_monitor_referrals(category);
CREATE INDEX IF NOT EXISTS idx_referrals_connection_status ON job_monitor_referrals(connection_status);
CREATE INDEX IF NOT EXISTS idx_referrals_next_follow_up ON job_monitor_referrals(next_follow_up) WHERE next_follow_up IS NOT NULL;

-- Enable Row Level Security
ALTER TABLE job_monitor_referrals ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow all on own referrals" ON job_monitor_referrals
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_referrals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_referrals_updated_at
    BEFORE UPDATE ON job_monitor_referrals
    FOR EACH ROW
    EXECUTE FUNCTION update_referrals_updated_at();

-- Add comment to table
COMMENT ON TABLE job_monitor_referrals IS 'LinkedIn Referral Assistant - Contact management and pipeline tracking';
