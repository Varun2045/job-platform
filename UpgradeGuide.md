# Upgrade Guide - v1.0.0 to v1.1.0

Follow these steps to upgrade your Job Monitor Platform to v1.1.0.

## 1. Database Schema Update

If you are running in production with Supabase, execute the following SQL migration statement in the Supabase SQL Editor:

```sql
ALTER TABLE job_monitor_companies
ADD COLUMN IF NOT EXISTS max_jobs_to_fetch INTEGER,
ADD COLUMN IF NOT EXISTS max_pages INTEGER,
ADD COLUMN IF NOT EXISTS scrape_timeout INTEGER,
ADD COLUMN IF NOT EXISTS retry_count INTEGER,
ADD COLUMN IF NOT EXISTS preferred_scraper TEXT;
```

This ensures compatibility with the new priorities and throttling configurations.

## 2. Advanced Filters Configuration

Create or modify your `config/filters.json` file to manage job filters without changing code:

```json
{
  "minMatchScore": 70,
  "experienceMinYears": null,
  "experienceMaxYears": null,
  "workplaceTypes": ["remote", "hybrid"],
  "cities": [],
  "states": [],
  "countries": ["India"],
  "employmentTypes": [],
  "internship": true,
  "newGrad": true,
  "fullTime": true,
  "contract": true
}
```

## 3. Re-run Scraping

Execute a new monitor run to populate explanations, CSV records, and analytics:

```bash
npm run monitor
```

Verify that `storage/jobs.csv`, `storage/daily-report.md`, and `storage/analytics.json` are created successfully.
