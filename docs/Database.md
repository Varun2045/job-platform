# Database Reference (PostgreSQL / Supabase)

## Metadata
- **Title**: Database Reference - Job Monitor Platform
- **Purpose**: Reference for table schemas, columns, constraints, foreign keys, row-level security (RLS) policies, triggers, and migrations.
- **Last Updated**: 2026-07-13
- **Current Version**: v5.0.0
- **Cross-References**: [ARCHITECTURE.md](file:///c:/Users/varun/Downloads/Job%20Monitor/docs/ARCHITECTURE.md), [API.md](file:///c:/Users/varun/Downloads/Job%20Monitor/docs/API.md)

---

## Table of Contents
1. [Core Tables & Schema](#1-core-tables--schema)
2. [Copilot & AI Agent Tables](#2-copilot--ai-agent-tables)
3. [Automation & CRM Tables](#3-automation--crm-tables)
4. [Row Level Security (RLS) Policies](#4-row-level-security-rls-policies)
5. [Database Triggers](#5-database-triggers)
6. [Advisory Locking & Indexes](#6-advisory-locking--indexes)
7. [Migration History](#7-migration-history)

---

## 1. Core Tables & Schema

All tables in production cloud deployments are prefixed with `job_monitor_`.

### `job_monitor_companies`
- **Purpose**: Stores configurations, scraper targets, execution metrics, and circuit breaker status for career pages.
- **Columns**:
  - `id` (`TEXT`, Primary Key): Alphanumeric company ID (e.g. `google`, `amazon`).
  - `name` (`TEXT`, Not Null): Display name.
  - `enabled` (`BOOLEAN`, Default: `true`): Active crawling flag.
  - `priority` (`INTEGER`, Default: `3`): Priority limit (1, 2, or 3).
  - `interval_minutes` (`INTEGER`, Default: `60`): Scrape frequency interval check.
  - `last_successful_scrape` (`TIMESTAMP WITH TIME ZONE`)
  - `last_failed_scrape` (`TIMESTAMP WITH TIME ZONE`)
  - `last_scraper_used` (`TEXT`)
  - `detected_ats` (`TEXT`)
  - `detected_ats_at` (`TIMESTAMP WITH TIME ZONE`)
  - `api_endpoint` (`TEXT`)
  - `api_suspended_until` (`TIMESTAMP WITH TIME ZONE`)
  - `consecutive_failures` (`INTEGER`, Default: `0`): Continuous errors tracker.
  - `resume_profiles` (`TEXT[]`, Default: `'{}'`): Linked profiles list.
  - `avg_response_time_ms` (`INTEGER`, Default: `0`)
  - `total_scrapes` (`INTEGER`, Default: `0`)
  - `total_failures` (`INTEGER`, Default: `0`)
  - `max_jobs_to_fetch` (`INTEGER`)
  - `max_pages` (`INTEGER`)
  - `scrape_timeout` (`INTEGER`)
  - `retry_count` (`INTEGER`)
  - `preferred_scraper` (`TEXT`)
  - `created_at` (`TIMESTAMP WITH TIME ZONE`, Default: `now()`)

### `job_monitor_state`
- **Purpose**: Deduplicates job crawls. Stores previous scrape job listings list per company.
- **Columns**:
  - `company_id` (`TEXT`, Primary Key, references `job_monitor_companies(id)`): Linked company.
  - `jobs_data` (`JSONB`, Default: `'[]'`): Scraped payload.
  - `updated_at` (`TIMESTAMP WITH TIME ZONE`, Default: `now()`)

### `job_monitor_notifications`
- **Purpose**: Deduplicates sent email alerts.
- **Columns**:
  - `job_hash` (`TEXT`, Primary Key): Unique job hash.
  - `notified_at` (`TIMESTAMP WITH TIME ZONE`, Default: `now()`)

### `job_monitor_scores`
- **Purpose**: Caches calculated matcher score outcomes.
- **Composite Primary Key**: `(user_id, job_hash, resume_profile, matcher_version)`
- **Columns**:
  - `user_id` (`UUID`, references `auth.users(id)`): Tenant owner link.
  - `job_hash` (`TEXT`, Not Null): Target job identifier.
  - `resume_profile` (`TEXT`, Not Null): Linked candidate resume profile name.
  - `score` (`INTEGER`, Check: `0-100`): Computed fit percentage.
  - `matcher_version` (`TEXT`, Not Null): Matching algorithm version.
  - `scored_at` (`TIMESTAMP WITH TIME ZONE`, Default: `now()`)

### `job_monitor_applications`
- **Purpose**: Stores funnels and candidates status pipelines.
- **Composite Primary Key**: `(user_id, job_hash)`
- **Columns**:
  - `user_id` (`UUID`, references `auth.users(id)`): Tenant owner link.
  - `job_hash` (`TEXT`, Not Null): Target job hash.
  - `company` (`TEXT`, Not Null): Target company name.
  - `job_id` (`TEXT`, Not Null): External job board ID.
  - `status` (`TEXT`, Check: Funnel status list - Saved, Applied, OA, Interview, Offer, Rejected, etc.)
  - `applied_date` (`TIMESTAMP WITH TIME ZONE`)
  - `resume_used` (`TEXT`): Target profile name.
  - `notes` (`TEXT`): Free-form notes.
  - `last_updated` (`TIMESTAMP WITH TIME ZONE`, Default: `now()`)

---

## 2. Copilot & AI Agent Tables

### `job_monitor_copilot_recommendations`
- **Purpose**: Stores custom recommendations suggested by the CareerAgent.
- **Columns**:
  - `id` (`UUID`, Primary Key, Default: `uuid_generate_v4()`)
  - `user_id` (`UUID`, Not Null, references `auth.users(id)`)
  - `recommendations` (`JSONB`, Default: `'[]'`): Ranked job suggestions array.
  - `created_at` (`TIMESTAMP WITH TIME ZONE`, Default: `now()`)

### `job_monitor_learning_roadmaps`
- **Purpose**: Stores personalized roadmaps generated from skill gaps.
- **Columns**:
  - `id` (`UUID`, Primary Key)
  - `user_id` (`UUID`, Not Null, references `auth.users(id)`)
  - `roadmap` (`JSONB`, Default: `'{}'`): Syllabus lessons JSON array.
  - `created_at` (`TIMESTAMP WITH TIME ZONE`, Default: `now()`)

### `job_monitor_interview_sessions`
- **Purpose**: Stores mock interview records and response feedback scores.
- **Columns**:
  - `id` (`UUID`, Primary Key)
  - `user_id` (`UUID`, references `auth.users(id)`)
  - `session_type` (`TEXT`, Not Null)
  - `questions` (`JSONB`, Default: `'[]'`)
  - `responses` (`JSONB`, Default: `'[]'`)
  - `feedback` (`JSONB`, Default: `'{}'`)
  - `score` (`INTEGER`)
  - `created_at` (`TIMESTAMP WITH TIME ZONE`, Default: `now()`)

---

## 3. Automation & CRM Tables

### `job_monitor_application_queue`
- **Purpose**: Stores auto-apply queues for automated browser runs.
- **Columns**:
  - `id` (`UUID`, Primary Key)
  - `user_id` (`UUID`, references `auth.users(id)`)
  - `job_hash` (`TEXT`, Not Null)
  - `company` (`TEXT`, Not Null)
  - `title` (`TEXT`, Not Null)
  - `state` (`TEXT`, Default: `'NEW'`): Queued states (`NEW`, `READY`, `SUBMITTED`, `REQUIRES_MANUAL_ACTION`).
  - `payload` (`JSONB`, Default: `'{}'`)
  - `validation_errors` (`JSONB`, Default: `'[]'`)
  - `retries` (`INTEGER`, Default: `0`)
  - `created_at` (`TIMESTAMP WITH TIME ZONE`, Default: `now()`)
  - `updated_at` (`TIMESTAMP WITH TIME ZONE`, Default: `now()`)

### `job_monitor_referrals`
- **Purpose**: LinkedIn Referral Assistant contact CRM tracker.
- **Columns**:
  - `id` (`UUID`, Primary Key)
  - `user_id` (`UUID`, references `auth.users(id)`)
  - `name` (`TEXT`, Not Null)
  - `role` (`TEXT`, Not Null)
  - `category` (`TEXT`, Check: categories list - Recruiter, Hiring Manager, EM, HR, Alumni, etc.)
  - `company` (`TEXT`, Not Null)
  - `linkedin_url` (`TEXT`)
  - `email` (`TEXT`)
  - `location` (`TEXT`)
  - `notes` (`TEXT`)
  - `tags` (`TEXT[]`, Default: `'{}'`)
  - `connection_status` (`TEXT`, Default: `'Potential Contact'`)
  - `referral_status` (`TEXT`)
  - `last_contacted` (`TIMESTAMP WITH TIME ZONE`)
  - `next_follow_up` (`TIMESTAMP WITH TIME ZONE`)
  - `outcome` (`TEXT`)
  - `created_at` (`TIMESTAMP WITH TIME ZONE`, Default: `now()`)
  - `updated_at` (`TIMESTAMP WITH TIME ZONE`, Default: `now()`)

---

## 4. Row Level Security (RLS) Policies

All user-facing tables enforce Row Level Security policies at the database layer in Supabase Cloud Mode. No cross-tenant reads or writes are allowed.

Example SQL Policies:
```sql
-- Enforce RLS on Referrals CRM table
ALTER TABLE job_monitor_referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on own referrals" ON job_monitor_referrals
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
```

Policy structure applied across:
- `job_monitor_applications`: Check `auth.uid() = user_id` for SELECT, INSERT, UPDATE, DELETE.
- `job_monitor_resume_profiles`: Isolated to the owner user.
- `job_monitor_application_queue`: Isolated to the owner user.
- `job_monitor_user_notifications`: Isolated to the owner user.
- `job_monitor_audit_logs`: Only users can read their own logs; users with the role `'Admin'` can read all rows.

---

## 5. Database Triggers

### Auto updated_at Trigger
Ensures that the modification timestamp matches the actual transaction execution time.

Applied on: `job_monitor_referrals` and `job_monitor_application_queue`.
```sql
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
```

---

## 6. Advisory Locking & Indexes

### Advisory Locking Key
- **Distributed Advisory Lock ID**: `8675309` (Acquired session-wise by orchestrators to prevent duplicate crawling tasks).
- SQL statements:
  - Acquire: `SELECT pg_try_advisory_lock(8675309);`
  - Release: `SELECT pg_advisory_unlock(8675309);`

### Indexes
To optimize database queries:
- `idx_companies_enabled` ON `job_monitor_companies(enabled)`
- `idx_companies_priority` ON `job_monitor_companies(priority)`
- `idx_applications_status` ON `job_monitor_applications(status)`
- `idx_referrals_user_id` ON `job_monitor_referrals(user_id)`
- `idx_referrals_company` ON `job_monitor_referrals(company)`
- `idx_referrals_next_follow_up` ON `job_monitor_referrals(next_follow_up)` WHERE `next_follow_up` IS NOT NULL

---

## 7. Migration History

Migrations are stored in `/supabase/migrations/` and executed sequentially:
1. `001_setup.sql`: Core schema initialization (`companies`, `jobs`, `applications`, `scores`).
2. `002_version_2_1.sql`: Added `analyses` table and `extended_settings` table.
3. `003_multi_user.sql`: SaaS upgrade adding `profiles` table, user notifications, and `user_id` columns across tables.
4. `004_copilot.sql`: Copilot tables schema (`recommendations`, `roadmaps`, `sessions`, `daily_briefs`).
5. `005_application_automation.sql`: Automation queues, calendars, exports, and `resume_profiles`.
6. `006_referrals_crm.sql`: Referrals CRM table, indexes, and updated_at trigger logic.
