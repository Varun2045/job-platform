CREATE TABLE IF NOT EXISTS job_monitor_analyses (
    job_hash TEXT PRIMARY KEY,
    summary TEXT NOT NULL,
    why_matches TEXT NOT NULL,
    missing_skills TEXT[] NOT NULL DEFAULT '{}',
    resume_improvements TEXT[] NOT NULL DEFAULT '{}',
    difficulty TEXT NOT NULL,
    prep_topics TEXT[] NOT NULL DEFAULT '{}',
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS job_monitor_extended_settings (
    id TEXT PRIMARY KEY DEFAULT 'default',
    preferred_companies TEXT[] NOT NULL DEFAULT '{}',
    preferred_technologies TEXT[] NOT NULL DEFAULT '{}',
    preferred_cities TEXT[] NOT NULL DEFAULT '{}',
    remote_preference TEXT NOT NULL DEFAULT 'all',
    notification_frequency TEXT NOT NULL DEFAULT 'daily',
    digest_format TEXT NOT NULL DEFAULT 'markdown',
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
