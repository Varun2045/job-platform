# Server.ts Modular Refactoring Plan

## Overview
The current `server.ts` file is 4,249 lines with 100+ route handlers. This document outlines a phased approach to split it into modular route files for better maintainability.

## Current Route Groups (Identified)

### 1. Authentication Routes (`/api/auth/*`)
- POST `/api/auth/register` - User registration
- POST `/api/auth/login` - User login
- GET `/api/auth/oauth/:provider` - OAuth initiation
- GET `/api/auth/oauth/google/callback` - Google OAuth callback
- GET `/api/auth/oauth/github/callback` - GitHub OAuth callback
- GET `/auth/google/callback` - Alternative Google callback
- GET `/auth/github/callback` - Alternative GitHub callback

**Target Module**: `src/routes/authRoutes.ts`

### 2. Jobs Routes (`/api/jobs/*`, `/api/v1/jobs/*`)
- GET `/api/jobs` - List jobs
- GET `/api/jobs/:hash` - Get job details
- GET `/api/jobs/:hash/analysis` - Job analysis
- POST `/api/jobs/:hash/tailor` - Resume tailoring
- GET `/api/v1/jobs/facets` - Job facets
- GET `/api/v1/jobs/search` - Job search

**Target Module**: `src/routes/jobsRoutes.ts`

### 3. Applications Routes (`/api/applications/*`)
- GET `/api/applications` - List applications
- POST `/api/applications` - Create application
- GET `/api/applications/queue` - Application queue
- POST `/api/applications/queue` - Add to queue
- DELETE `/api/applications/queue/:id` - Remove from queue
- POST `/api/applications/run` - Run application automation

**Target Module**: `src/routes/applicationsRoutes.ts`

### 4. Resumes Routes (`/api/resumes/*`, `/api/resume-profiles/*`)
- GET `/api/resumes` - List resumes
- POST `/api/resumes` - Upload resume
- POST `/api/resumes/parse` - Parse resume
- DELETE `/api/resumes/:name` - Delete resume
- POST `/api/resumes/:name/optimize` - Optimize resume
- GET `/api/resume-profiles` - List resume profiles
- POST `/api/resume-profiles` - Create resume profile
- PUT `/api/resume-profiles/:id` - Update resume profile
- DELETE `/api/resume-profiles/:id` - Delete resume profile

**Target Module**: `src/routes/resumesRoutes.ts`

### 5. Companies Routes (`/api/companies/*`)
- GET `/api/companies` - List companies
- POST `/api/companies` - Create company
- POST `/api/companies/:id/toggle` - Toggle company
- PATCH `/api/companies/:id` - Update company
- PUT `/api/companies/:id` - Update company (alternative)
- DELETE `/api/companies/:id` - Delete company
- GET `/api/companies/:id/insights` - Company insights

**Target Module**: `src/routes/companiesRoutes.ts`

### 6. Cover Letters Routes (`/api/cover-letters/*`)
- POST `/api/jobs/:hash/cover-letter` - Generate cover letter
- POST `/api/cover-letters/save` - Save cover letter
- GET `/api/cover-letters/saved` - List saved cover letters
- DELETE `/api/cover-letters/:id` - Delete cover letter
- POST `/api/cover-letters/generate` - Generate cover letter
- POST `/api/cover-letters/regenerate` - Regenerate cover letter
- POST `/api/cover-letters/export/pdf` - Export to PDF
- POST `/api/cover-letters/export/latex` - Export to LaTeX

**Target Module**: `src/routes/coverLettersRoutes.ts`

### 7. Settings Routes (`/api/settings/*`)
- GET `/api/settings` - Get settings
- POST `/api/settings` - Update settings
- GET `/api/settings/extended` - Get extended settings
- POST `/api/settings/extended` - Update extended settings

**Target Module**: `src/routes/settingsRoutes.ts`

### 8. Admin Routes (`/api/admin/*`)
- GET `/api/admin/profiles` - List user profiles
- GET `/api/admin/feature-flags` - List feature flags
- POST `/api/admin/feature-flags/:key` - Update feature flag
- GET `/api/admin/audit-logs` - List audit logs
- GET `/api/admin/telemetry` - Get telemetry
- GET `/api/admin/scraper-watchdog` - Scraper watchdog status

**Target Module**: `src/routes/adminRoutes.ts`

### 9. Monitoring Routes (`/api/monitoring/*`)
- GET `/api/monitoring` - Monitoring status
- POST `/api/monitoring/run` - Run monitoring
- POST `/api/monitoring/trigger` - Trigger monitoring
- POST `/api/monitoring/cron-trigger` - Cron trigger
- POST `/api/monitoring/pause` - Pause monitoring
- POST `/api/monitoring/resume` - Resume monitoring
- GET `/api/monitoring/logs` - Monitoring logs

**Target Module**: `src/routes/monitoringRoutes.ts`

### 10. Flashcards Routes (`/api/flashcards/*`)
- GET `/api/flashcards` - List flashcards
- POST `/api/flashcards/save` - Save flashcard
- DELETE `/api/flashcards/:id` - Delete flashcard
- POST `/api/flashcards/generate` - Generate flashcards

**Target Module**: `src/routes/flashcardsRoutes.ts`

### 11. Copilot Routes (`/api/copilot/*`)
- GET `/api/copilot/daily-brief` - Daily brief
- GET `/api/copilot/recommendations` - Recommendations
- GET `/api/copilot/skill-gap` - Skill gap analysis
- POST `/api/copilot/interview/start` - Start interview
- POST `/api/copilot/interview/submit` - Submit interview answer
- GET `/api/copilot/roadmap` - Career roadmap
- GET `/api/copilot/market-intelligence` - Market intelligence
- GET `/api/copilot/salary-analysis` - Salary analysis
- GET `/api/copilot/follow-ups` - Follow-up suggestions
- POST `/api/copilot/chat` - Chat with copilot

**Target Module**: `src/routes/copilotRoutes.ts`

### 12. Profile Builder Routes (`/api/profile-builder/*`)
- POST `/api/profile-builder/generate-website` - Generate website
- GET `/api/profile-builder/check-subdomain` - Check subdomain availability
- POST `/api/profile-builder/deploy-vercel` - Deploy to Vercel
- POST `/api/profile-builder/publish-website` - Publish website

**Target Module**: `src/routes/profileBuilderRoutes.ts`

### 13. GitHub Routes (`/api/github/*`)
- POST `/api/github/analyze` - Analyze GitHub profile

**Target Module**: `src/routes/githubRoutes.ts`

### 14. Email Routes (`/api/email/*`)
- POST `/api/email/send-test` - Send test email

**Target Module**: `src/routes/emailRoutes.ts`

### 15. Backup Routes (`/api/backup/*`)
- POST `/api/backup/export` - Export backup
- POST `/api/backup/import` - Import backup
- GET `/api/backup/export-csv` - Export to CSV

**Target Module**: `src/routes/backupRoutes.ts`

### 16. User Routes (`/api/profile/*`, `/api/notifications/*`, `/api/saved-searches/*`, `/api/watchlists/*`)
- GET `/api/profile` - Get user profile
- POST `/api/profile` - Update user profile
- GET `/api/notifications` - List notifications
- POST `/api/notifications/:id/read` - Mark notification as read
- DELETE `/api/notifications` - Clear notifications
- GET `/api/saved-searches` - List saved searches
- POST `/api/saved-searches` - Create saved search
- DELETE `/api/saved-searches/:id` - Delete saved search
- GET `/api/watchlists` - List watchlists
- POST `/api/watchlists` - Create watchlist
- DELETE `/api/watchlists/:id` - Delete watchlist

**Target Module**: `src/routes/userRoutes.ts`

### 17. Scraper Routes (`/api/scraper/*`)
- POST `/api/scraper/test-run` - Test scraper run
- POST `/api/scraper/test-selector` - Test CSS selector

**Target Module**: `src/routes/scraperRoutes.ts`

### 18. Miscellaneous Routes
- GET `/api/dashboard` - Dashboard data
- GET `/api/metrics/classification` - Classification metrics
- GET `/api/jobs/:hash/prep` - Job preparation
- POST `/api/cheatsheet/generate` - Generate cheatsheet

**Target Module**: `src/routes/miscRoutes.ts`

## Proposed Directory Structure

```
src/
├── routes/
│   ├── index.ts              # Main router aggregator
│   ├── authRoutes.ts         # Authentication
│   ├── jobsRoutes.ts         # Jobs management
│   ├── applicationsRoutes.ts # Applications
│   ├── resumesRoutes.ts      # Resumes & profiles
│   ├── companiesRoutes.ts    # Companies
│   ├── coverLettersRoutes.ts # Cover letters
│   ├── settingsRoutes.ts     # Settings
│   ├── adminRoutes.ts        # Admin functions
│   ├── monitoringRoutes.ts   # Monitoring
│   ├── flashcardsRoutes.ts   # Flashcards
│   ├── copilotRoutes.ts      # AI Copilot
│   ├── profileBuilderRoutes.ts # Profile builder
│   ├── githubRoutes.ts       # GitHub integration
│   ├── emailRoutes.ts        # Email
│   ├── backupRoutes.ts       # Backup/restore
│   ├── userRoutes.ts         # User profile & notifications
│   ├── scraperRoutes.ts      # Scraper testing
│   └── miscRoutes.ts         # Miscellaneous
├── middleware/
│   ├── auth.ts               # Authentication middleware
│   ├── csrf.ts               # CSRF protection (already exists)
│   └── ...
└── server.ts                 # Main server setup (simplified)
```

## Implementation Phases

### Phase 1: Infrastructure Setup
1. Create route module directory structure
2. Create shared middleware module for auth, role checks
3. Create route index.ts to aggregate all routes
4. Update server.ts to use the new router structure

### Phase 2: Low-Risk Routes (Start Here)
1. Extract miscRoutes.ts (miscellaneous endpoints)
2. Extract emailRoutes.ts (single endpoint)
3. Extract githubRoutes.ts (single endpoint)
4. Extract scraperRoutes.ts (2 endpoints)

### Phase 3: Core Routes
1. Extract authRoutes.ts (authentication)
2. Extract userRoutes.ts (user profile, notifications)
3. Extract settingsRoutes.ts (settings)

### Phase 4: Business Logic Routes
1. Extract jobsRoutes.ts (jobs)
2. Extract applicationsRoutes.ts (applications)
3. Extract resumesRoutes.ts (resumes)
4. Extract companiesRoutes.ts (companies)

### Phase 5: Advanced Features
1. Extract coverLettersRoutes.ts
2. Extract adminRoutes.ts
3. Extract monitoringRoutes.ts
4. Extract flashcardsRoutes.ts
5. Extract copilotRoutes.ts
6. Extract profileBuilderRoutes.ts
7. Extract backupRoutes.ts

### Phase 6: Testing & Validation
1. Comprehensive API testing
2. Integration testing
3. Performance testing
4. Documentation updates

## Shared Middleware Strategy

Create `src/middleware/index.ts` to export all middleware:

```typescript
export { authMiddleware } from './auth';
export { requireRole } from './auth';
export { csrfProtection, csrfTokenMiddleware } from './csrf';
// ... other middleware
```

## Route Module Template

Each route module should follow this pattern:

```typescript
import { Router } from 'express';
import { authMiddleware, requireRole } from '../middleware/index.js';
import { storage } from '../storage/storageProvider.js'; // or inject via DI

const router = Router();

// Apply middleware to all routes in this module
router.use(authMiddleware);

// Define routes
router.get('/', async (req, res) => {
  // Route logic
});

router.post('/', requireRole(['Admin']), async (req, res) => {
  // Route logic
});

export default router;
```

## Dependency Injection Consideration

Currently, `storage` is a global variable. Consider:
1. Passing storage as a parameter to route modules
2. Using a dependency injection container
3. Creating a singleton service registry

## Testing Strategy

For each phase:
1. Extract routes to new module
2. Run existing test suite
3. Test extracted routes manually
4. Only proceed if all tests pass

## Rollback Plan

Keep the original server.ts as `server.ts.backup` until all phases are complete and validated.

## Estimated Effort

- Phase 1: 2-3 hours
- Phase 2: 1-2 hours
- Phase 3: 2-3 hours
- Phase 4: 4-6 hours
- Phase 5: 4-6 hours
- Phase 6: 4-6 hours

**Total Estimated Time: 17-26 hours**

## Risks & Mitigations

### Risk 1: Breaking Changes
- **Mitigation**: Maintain backward compatibility during transition
- **Mitigation**: Comprehensive testing after each phase

### Risk 2: Dependency Issues
- **Mitigation**: Carefully track shared dependencies
- **Mitigation**: Use TypeScript to catch type errors

### Risk 3: Global State Issues
- **Mitigation**: Audit global variables before starting
- **Mitigation**: Consider dependency injection pattern

## Next Steps

1. Review this plan with the team
2. Get approval for the refactoring approach
3. Start with Phase 1 (Infrastructure Setup)
4. Proceed with Phase 2 (Low-Risk Routes)

## Notes

- The existing `apiV1Routes.ts` file should be integrated into this structure
- Some routes may need to be consolidated (e.g., `/api/jobs` and `/api/v1/jobs`)
- Consider API versioning strategy during refactoring
- Update API documentation after each phase
