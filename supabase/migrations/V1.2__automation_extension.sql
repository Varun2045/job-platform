-- Migration Version 1.2: Automation & Chrome Extension Queue Table
CREATE TABLE IF NOT EXISTS extension_saved_jobs (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    company_name TEXT NOT NULL,
    job_title TEXT NOT NULL,
    location TEXT,
    salary_range TEXT,
    job_url TEXT NOT NULL,
    description TEXT,
    skills TEXT[],
    platform_source TEXT NOT NULL,
    status TEXT DEFAULT 'Captured',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_extension_jobs_user ON extension_saved_jobs (user_id);
CREATE INDEX IF NOT EXISTS idx_extension_jobs_platform ON extension_saved_jobs (platform_source);
