# Changelog & Version History

## Metadata
- **Title**: Changelog & Version History - Job Monitor Platform
- **Purpose**: Records the chronological history of changes, features added, issues fixed, and manual migration instructions per version.
- **Last Updated**: 2026-07-13
- **Current Version**: v5.0.0
- **Cross-References**: [PHASES.md](file:///c:/Users/varun/Downloads/Job%20Monitor/docs/PHASES.md), [PRD.md](file:///c:/Users/varun/Downloads/Job%20Monitor/docs/PRD.md)

---

## [v5.0.0] - 2026-07-08

### Added
- Created **AutoApplyEngine** supporting automated Greenhouse and Lever application submission.
- Created **ResumeProfileManager** to select and manage context-specific resume profile names (Backend, Frontend, etc.).
- Created **ResumeOptimizationService** for LLM-driven resume alignment and cover letter tailoring.
- Created **RecruiterManager** CRM tracking for outreach history and scheduling follow-up alerts.
- Created **CalendarService** providing standard ICS invites download.
- Created **OpportunityEngine** for dynamic job ranking score calculations.
- Created **ExportService** supporting JSON/CSV/Markdown file exports.
- Added comprehensive frontend tabbed copilot dashboard: **AutomationHub**.
- Created robust unit test coverage for all new services.

### Migration Notes (Upgrading to v5.0.0)
Execute the database migration SQL script located in `supabase/migrations/005_application_automation.sql` and `supabase/migrations/006_referrals_crm.sql` to add the required tables:
- `job_monitor_resume_profiles`
- `job_monitor_application_queue`
- `job_monitor_recruiters`
- `job_monitor_calendar_events`
- `job_monitor_exports`
- `job_monitor_referrals`

---

## [v4.1.0] - 2026-07-08

### Added
- Created complete sequential REST API integration tests ([ApiServer.test.ts](file:///c:/Users/varun/Downloads/Job%20Monitor/src/tests/ApiServer.test.ts)).
- Created workflow pipeline integration tests ([WorkflowPipelines.test.ts](file:///c:/Users/varun/Downloads/Job%20Monitor/src/tests/WorkflowPipelines.test.ts)).
- Created Playwright browser E2E test suite ([e2e.test.ts](file:///c:/Users/varun/Downloads/Job%20Monitor/src/tests/e2e.test.ts)).
- Created concurrent load, scale, and memory leakage test suite ([Performance.test.ts](file:///c:/Users/varun/Downloads/Job%20Monitor/src/tests/Performance.test.ts)).
- Created failure injection test suite ([FailureInjection.test.ts](file:///c:/Users/varun/Downloads/Job%20Monitor/src/tests/FailureInjection.test.ts)).

### Changed
- Improved CORS loopback flexibility to allow local loopback origins on dynamic ports, fixing E2E assets load errors.
- Reduced orchestrator batch staggering wait time from 3 minutes to 1ms under test/dryRun environments.

### Fixed
- Wrapped the email digest transmission in a try-catch block to prevent SMTP failures from causing orchestrator crashes.

---

## [v4.0.0] - 2026-06-15

### Added
- Integrated Autonomous Career Copilot agent framework.
- Built interactive **Skill Gap Engine** with dynamic syllabus/learning task generators.
- Created **PlaywrightScraper** for browser-based career portal parsing.

### Migration Notes (Upgrading to v4.0.0)
Apply schema migration `supabase/migrations/004_copilot.sql` to initialize mock interviews and syllabus roadmaps tables.

---

## [v3.0.0] - 2026-04-10

### Added
- Integrated Supabase database storage provider.
- Added Express REST API Server with login authentication and admin configuration endpoints.

### Migration Notes (Upgrading to v3.0.0)
Provision a Supabase project and apply the schema SQL migrations located in `supabase/migrations/001_setup.sql` through `003_multi_user.sql`.

---

## [v2.0.0] - 2026-02-18

### Added
- Implemented core local Mode with FileStorage.
- Added Cheerio fallback scraping and cosine similarity resume matching algorithms.

---

## [v1.0.0] - 2026-01-05

### Added
- Initial release of the job board checker system.
