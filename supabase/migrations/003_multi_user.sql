-- 003_multi_user.sql - Database Migration for SaaS Enterprise Multi-User Platform

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS job_monitor_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    photo_url TEXT,
    preferred_roles TEXT[] NOT NULL DEFAULT '{}',
    preferred_cities TEXT[] NOT NULL DEFAULT '{}',
    experience_level TEXT,
    tech_stack TEXT[] NOT NULL DEFAULT '{}',
    linkedin TEXT,
    github TEXT,
    portfolio TEXT,
    role TEXT NOT NULL DEFAULT 'User' CHECK (role IN ('Admin', 'User', 'Viewer')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS for profiles
ALTER TABLE job_monitor_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read of profiles" ON job_monitor_profiles FOR SELECT USING (true);
CREATE POLICY "Allow update of own profile" ON job_monitor_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Allow insert of own profile" ON job_monitor_profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Indexes for profiles
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON job_monitor_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON job_monitor_profiles(role);

-- 2. Resumes Table
CREATE TABLE IF NOT EXISTS job_monitor_resumes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    profile_name TEXT NOT NULL,
    content TEXT NOT NULL,
    pdf_data TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, profile_name)
);

-- Enable RLS for resumes
ALTER TABLE job_monitor_resumes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all actions on own resumes" ON job_monitor_resumes USING (auth.uid() = user_id);

-- Indexes for resumes
CREATE INDEX IF NOT EXISTS idx_resumes_user_id ON job_monitor_resumes(user_id);
CREATE INDEX IF NOT EXISTS idx_resumes_profile_name ON job_monitor_resumes(profile_name);

-- 3. Saved Searches Table
CREATE TABLE IF NOT EXISTS job_monitor_saved_searches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    filters JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS for saved searches
ALTER TABLE job_monitor_saved_searches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all actions on own saved searches" ON job_monitor_saved_searches USING (auth.uid() = user_id);

-- 4. Watchlists Table
CREATE TABLE IF NOT EXISTS job_monitor_watchlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    filters JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS for watchlists
ALTER TABLE job_monitor_watchlists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all actions on own watchlists" ON job_monitor_watchlists USING (auth.uid() = user_id);

-- 5. In-App User Notifications Table
CREATE TABLE IF NOT EXISTS job_monitor_user_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS for user notifications
ALTER TABLE job_monitor_user_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all actions on own notifications" ON job_monitor_user_notifications USING (auth.uid() = user_id);

-- 6. Audit Log Table
CREATE TABLE IF NOT EXISTS job_monitor_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    details JSONB NOT NULL DEFAULT '{}',
    ip_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS for audit logs (only users can view their own, admins can view all)
ALTER TABLE job_monitor_audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow admin read all audit logs" ON job_monitor_audit_logs FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM job_monitor_profiles 
    WHERE job_monitor_profiles.id = auth.uid() AND job_monitor_profiles.role = 'Admin'
  )
);
CREATE POLICY "Allow insert of audit logs" ON job_monitor_audit_logs FOR INSERT WITH CHECK (true);

-- Indexes for audit logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON job_monitor_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON job_monitor_audit_logs(created_at DESC);

-- 7. Feature Flags Table
CREATE TABLE IF NOT EXISTS job_monitor_feature_flags (
    key TEXT PRIMARY KEY,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Seed basic feature flags
INSERT INTO job_monitor_feature_flags (key, enabled, description) VALUES
('AI', true, 'Enable/Disable AI resume tailoring and job analysis services'),
('Email', true, 'Enable/Disable email notifications digests'),
('Reports', true, 'Enable/Disable reporting generators'),
('Dashboard', true, 'Enable/Disable real-time dashboard UI charts'),
('Notifications', true, 'Enable/Disable in-app push notifications center'),
('Analytics', true, 'Enable/Disable analytics metrics charts')
ON CONFLICT (key) DO NOTHING;

-- 8. Alter existing tables to add multi-user tenant columns

-- Alter job_monitor_applications
ALTER TABLE job_monitor_applications ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
-- Recreate Primary Key
ALTER TABLE job_monitor_applications DROP CONSTRAINT IF EXISTS job_monitor_applications_pkey;
ALTER TABLE job_monitor_applications ADD CONSTRAINT job_monitor_applications_pkey PRIMARY KEY (user_id, job_hash);
ALTER TABLE job_monitor_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all actions on own applications" ON job_monitor_applications USING (auth.uid() = user_id);

-- Indexes for applications with user_id
CREATE INDEX IF NOT EXISTS idx_applications_user_id ON job_monitor_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_user_status ON job_monitor_applications(user_id, status);
CREATE INDEX IF NOT EXISTS idx_applications_updated ON job_monitor_applications(last_updated DESC);

-- Alter job_monitor_scores
ALTER TABLE job_monitor_scores ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
-- Recreate Primary Key
ALTER TABLE job_monitor_scores DROP CONSTRAINT IF EXISTS job_monitor_scores_pkey;
ALTER TABLE job_monitor_scores ADD CONSTRAINT job_monitor_scores_pkey PRIMARY KEY (user_id, job_hash, resume_profile, matcher_version);
ALTER TABLE job_monitor_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all actions on own scores" ON job_monitor_scores USING (auth.uid() = user_id);

-- Indexes for scores with user_id
CREATE INDEX IF NOT EXISTS idx_scores_user_id ON job_monitor_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_scores_user_score ON job_monitor_scores(user_id, score DESC);

-- Alter job_monitor_extended_settings
ALTER TABLE job_monitor_extended_settings ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
-- Recreate Primary Key
ALTER TABLE job_monitor_extended_settings DROP CONSTRAINT IF EXISTS job_monitor_extended_settings_pkey;
ALTER TABLE job_monitor_extended_settings ADD CONSTRAINT job_monitor_extended_settings_pkey PRIMARY KEY (user_id);
ALTER TABLE job_monitor_extended_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all actions on own settings" ON job_monitor_extended_settings USING (auth.uid() = user_id);
