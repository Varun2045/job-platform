# Project Memory Ledger

## Metadata
- **Last Updated**: 2026-07-13
- **Updated By**: Antigravity (AI Coding Assistant)
- **Current Version**: v5.0.0
- **Cross-References**: [PRD.md](file:///c:/Users/varun/Downloads/Job%20Monitor/docs/PRD.md), [PHASES.md](file:///c:/Users/varun/Downloads/Job%20Monitor/docs/PHASES.md), [CHANGELOG.md](file:///c:/Users/varun/Downloads/Job%20Monitor/docs/CHANGELOG.md)

---

## 1. Project Overview

The **Job Monitor Platform** is an enterprise-grade autonomous job board monitoring coordinator and career copilot. It crawls individual company career boards (Greenhouse, Lever, Workday) or falls back to browser/static HTML scraping (Playwright/Cheerio), normalizes listings, matches them against resumes using a customized cosine-similarity weighted algorithm, calculates skill gaps, generates study syllabi, and runs automated form submissions.

---

## 2. Current Status

The codebase is in a stable, verified production-ready state corresponding to release version **v5.0.0**. The platform supports full multi-user SaaS authentication models in production cloud environments (powered by Supabase DB + Resend Email Services) and a fully offline-compliant FileStorage local development mode.

- **Current Branch**: `main`
- **Active Development Stage**: Documentation audit, consolidation, and refactoring to establish a single source of truth under `/docs/`.

---

## 3. Recently Completed Features (v5.0.0)

- **AutoApplyEngine**: Form-submitting engine using Playwright to fill out Lever and Greenhouse application pages.
- **ResumeProfileManager**: Component mapping context-specific resumes (e.g. backend, frontend) to scrape matching profiles.
- **ResumeOptimizationService**: Custom backend alignment service generating recommendations and tailored letters.
- **Recruiter CRM Manager**: Outreach logger supporting contact status tracking and followup dates.
- **CalendarService**: RFC-5545 `.ics` file exporter providing calendar invites for interview schedules.
- **OpportunityEngine**: Dynamically calculates opportunity scores for listings based on custom weights.
- **ExportService**: Generates CSV/JSON exports of metrics, applications, and logs.
- **Automation Hub**: Frontend control panel for managing application queues.
- **Comprehensive Integration Testing**: Sequential API, workflow pipeline, Playwright E2E, performance concurrent scale, and fault injection Jest suites.

---

## 4. Important Architecture Decisions

### 1. Unified Storage Adapter Pattern
We decoupled database reads and writes using the `StorageProvider` abstract class. This allows the server to toggle seamlessly between local mock testing (FileStorage) and live production databases (SupabaseStorage) by checking the availability of environmental keys.

### 2. PostgreSQL Distributed Advisory Locking
To allow scalable container deployments without scraping duplicates or hitting company API limits, the orchestrator acquires a Postgres advisory lock (`8675309`) before running. Multiple coordinator instances immediately exit if the lock is held.

### 3. Sequential Integration Testing
Due to shared FileStorage assets, Jest tests must run sequentially. We enforce the `--runInBand` flag in CLI execution commands to prevent test concurrency collision.

### 4. Compliant Assistant Framework
To prevent users' accounts from being suspended by LinkedIn, the LinkedIn Referral Assistant acts as an offline helper. It imports connections via CSV, generates prefilled EML files, and provides Gmail prefill targets, but never executes browser actions directly on the LinkedIn domain.

---

## 5. Known Bugs & Technical Debt

- **Workday Scraping Selectors**: Workday boards alter layouts and elements dynamic IDs frequently, occasionally requiring updates to `WorkdayPlugin.ts` CSS selectors.
- **Local SQLite Fallback**: Local FileStorage uses simple JSON files. If JSON data scale grows to thousands of jobs, read/write I/O performance will degrade. Migrating local FileStorage to an embedded SQLite configuration is open technical debt.
- **SMTP Error Resiliency**: Email digester is wrapped in a try/catch block, but failures do not trigger an automated retry queue. If Resend fails, that hourly alert digest is simply skipped.

---

## 6. Schema Summary

### Table Prefix: `job_monitor_*`
- `job_monitor_companies`: Configurations, scraper states, circuit breaker indicators.
- `job_monitor_jobs`: Crawled postings, location tags, date stamps.
- `job_monitor_applications`: Status funnels, logs, profile name references.
- `job_monitor_scores`: Cached matcher outputs.
- `job_monitor_resume_profiles`: User text profiles.
- `job_monitor_referrals`: Contacts CRM.
- `job_monitor_application_queue`: Auto-apply queue items.
- `job_monitor_user_notifications`: In-app notifications.

---

## 7. Next Priorities

1. **pgvector Search Integration**: Implement vector embedding indices for semantic similarity matching.
2. **SQLite Local Adapter**: Replace JSON file storage with an embedded SQLite database in local mode.
3. **Outreach Queue Automation**: Automated outreach campaigns inside the Recruiter CRM tracker.
