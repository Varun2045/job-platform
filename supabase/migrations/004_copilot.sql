-- 004_copilot.sql - Database Migration for Autonomous Career Copilot

-- 1. Recommendations Table
CREATE TABLE IF NOT EXISTS job_monitor_copilot_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    recommendations JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
ALTER TABLE job_monitor_copilot_recommendations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on own recommendations" ON job_monitor_copilot_recommendations USING (auth.uid() = user_id);

-- 2. Learning Roadmaps Table
CREATE TABLE IF NOT EXISTS job_monitor_learning_roadmaps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    roadmap JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
ALTER TABLE job_monitor_learning_roadmaps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on own learning roadmaps" ON job_monitor_learning_roadmaps USING (auth.uid() = user_id);

-- 3. Mock Interview Sessions Table
CREATE TABLE IF NOT EXISTS job_monitor_interview_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_type TEXT NOT NULL,
    questions JSONB NOT NULL DEFAULT '[]',
    responses JSONB NOT NULL DEFAULT '[]',
    feedback JSONB NOT NULL DEFAULT '{}',
    score INTEGER,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
ALTER TABLE job_monitor_interview_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on own mock interviews" ON job_monitor_interview_sessions USING (auth.uid() = user_id);

-- 4. Career Roadmaps Table
CREATE TABLE IF NOT EXISTS job_monitor_career_roadmaps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    roadmap_data JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
ALTER TABLE job_monitor_career_roadmaps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on own career roadmaps" ON job_monitor_career_roadmaps USING (auth.uid() = user_id);

-- 5. Daily Briefs Table
CREATE TABLE IF NOT EXISTS job_monitor_daily_briefs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    brief_data JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
ALTER TABLE job_monitor_daily_briefs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on own daily briefs" ON job_monitor_daily_briefs USING (auth.uid() = user_id);
