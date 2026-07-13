# Database Reference (Archived)

The Job Monitor Platform supports two storage providers:
1. **Local Mode (FileStorage)**: Uses structured JSON files stored in the local `storage/` directory.
2. **Cloud Mode (SupabaseStorage)**: Uses a Supabase PostgreSQL instance with schema definitions.

---

## 1. Schema Tables

### `companies_state`
Tracks scraper configurations and status for career pages.
- `id` (text, Primary Key): Unique alphanumeric ID (e.g., `google`, `facebook`).
- `name` (text): Public name of the company.
- `enabled` (boolean): Scraper active status flag.
- `api_endpoint` (text): Base URL or ATS reference identifier.
- `priority` (integer): Scraper execution priority (1-5, where 5 is highest).
- `interval_minutes` (integer): Minutes between runs.
- `resume_profiles` (array of text): User profile names matched against (e.g. `['backend', 'ml']`).
- `consecutive_failures` (integer): Count of continuous errors.
- `total_scrapes` (integer): Cumulative run count.
- `total_failures` (integer): Cumulative error count.
- `detected_ats` (text): Detected ATS string (e.g., `workday`, `greenhouse`, `lever`, `fallback`).
- `last_scraper_used` (text): Identifier of last successful scraper.
- `api_suspended_until` (timestamp): Circuit breaker timeout time.

### `jobs`
Stores crawled and normalized postings.
- `jobHash` (text, Primary Key): Unique hash of company + job posting ID.
- `company` (text): Company name.
- `id` (text): Job ID from portal source.
- `title` (text): Job title.
- `location` (text): Location string.
- `url` (text): Direct apply link.
- `source` (text): Scraper source (e.g., `lever`, `greenhouse`, `cheerio_fallback`).
- `description` (text): Enriched job description text.
- `isRemote` (boolean): Remote status flag.
- `experience` (text): Experience level (`Junior`, `Mid`, `Senior`, `Lead`, `Graduate`).
- `employmentType` (text): Employment type (`Full-time`, `Contractor`, `Part-time`, `Internship`).
- `datePosted` (text): Human-readable date.

### `applications`
Tracks user job application status.
- `jobHash` (text, Primary Key): Foreign key to crawled job posting.
- `company` (text): Company name.
- `jobId` (text): Job ID reference.
- `status` (text): Candidate funnel state (`Saved`, `Applied`, `OA Scheduled`, `OA Completed`, `Interview`, `Offer`, `Rejected`).
- `appliedDate` (text): Submission date string.
- `resumeUsed` (text): Profile name used.
- `notes` (text): User interview journal text.
- `lastUpdated` (text): Change timestamp.

### `user_resumes`
Stores candidate profiles for resume matching.
- `userId` (text, PK Part): Owner user reference.
- `profile` (text, PK Part): Resume profile name (e.g. `backend`, `frontend`).
- `content` (text): Cleaned text version of resume.

---

## 2. Advisory Locking

In Cloud Mode, a distributed advisory lock prevents multiple coordinator nodes from scraping the same career boards concurrently:
- Key ID: `8675309`
- Lock query: `SELECT pg_try_advisory_xact_lock(8675309)`
- Unlock query: `SELECT pg_advisory_unlock(8675309)`
