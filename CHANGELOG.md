# Changelog

All notable changes to this project will be documented in this file.

## [v5.0.0] - 2026-07-08
### Added
- Created `AutoApplyEngine` supporting automated Greenhouse and Lever application submission.
- Created `ResumeProfileManager` to select and manage context-specific resume profile names (Backend, Frontend, etc.).
- Created `ResumeOptimizationService` for LLM-driven resume alignment and cover letter tailoring.
- Created `RecruiterManager` CRM tracking for outreach history and scheduling follow-up alerts.
- Created `CalendarService` providing standard ICS invites download.
- Created `OpportunityEngine` for dynamic job ranking score calculations.
- Created `ExportService` supporting JSON/CSV/Markdown file exports.
- Added comprehensive frontend tabbed copilot dashboard: `AutomationHub`.
- Created robust unit test coverage for all new services.

## [v4.1.0] - 2026-07-08
### Added
- Created complete sequential REST API integration tests ([ApiServer.test.ts](src/tests/ApiServer.test.ts)).
- Created workflow pipeline integration tests ([WorkflowPipelines.test.ts](src/tests/WorkflowPipelines.test.ts)).
- Created Playwright browser E2E test suite ([e2e.test.ts](src/tests/e2e.test.ts)).
- Created concurrent load, scale, and memory leakage test suite ([Performance.test.ts](src/tests/Performance.test.ts)).
- Created failure injection test suite ([FailureInjection.test.ts](src/tests/FailureInjection.test.ts)).

### Changed
- Improved CORS loopback flexibility to allow local loopback origins on dynamic ports, fixing E2E assets load errors.
- Reduced orchestrator batch staggering wait time from 3 minutes to 1ms under test/dryRun environments.

### Fixed
- Wrapped the email digest transmission in a try-catch block to prevent SMTP failures from causing orchestrator crashes.

## [v4.0.0] - 2026-06-15
### Added
- Integrated Autonomous Career Copilot agent framework.
- Built interactive Skill Gap Engine with dynamic syllabus/learning task generators.
- Created PlaywrightScraper for browser-based career portal parsing.

## [v3.0.0] - 2026-04-10
### Added
- Integrated Supabase database storage provider.
- Added Express REST API Server with login authentication and admin configuration endpoints.

## [v2.0.0] - 2026-02-18
### Added
- Implemented core local Mode with FileStorage.
- Added Cheerio fallback scraping and cosine similarity resume matching algorithms.

## [v1.0.0] - 2026-01-05
### Added
- Initial release of the job board checker system.
