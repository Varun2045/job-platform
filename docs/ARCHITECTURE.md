# Architecture Guide

## Metadata
- **Title**: Architecture Guide - Job Monitor Platform
- **Purpose**: Details the high-level and module-level architecture, database ERD, data flow systems, and infrastructure design.
- **Last Updated**: 2026-07-13
- **Current Version**: v5.0.0
- **Cross-References**: [PRD.md](file:///c:/Users/varun/Downloads/Job%20Monitor/docs/PRD.md), [DATABASE.md](file:///c:/Users/varun/Downloads/Job%20Monitor/docs/DATABASE.md), [TECH_STACK.md](file:///c:/Users/varun/Downloads/Job%20Monitor/docs/TECH_STACK.md)

---

## Table of Contents
1. [High-Level Architecture](#high-level-architecture)
2. [Frontend Architecture](#frontend-architecture)
3. [Backend Architecture](#backend-architecture)
4. [Database & Storage Providers](#database--storage-providers)
5. [Core Pipelines](#core-pipelines)
   - [Scraper & Job Monitor Pipeline](#scraper--job-monitor-pipeline)
   - [Scheduler & Locking Pipeline](#scheduler--locking-pipeline)
   - [Resume Matching Pipeline](#resume-matching-pipeline)
   - [AI Copilot & Career Agent Pipeline](#ai-copilot--career-agent-pipeline)
   - [Auto-Apply Workflow](#auto-apply-workflow)
   - [Notification Flow](#notification-flow)
6. [Authentication Flow](#authentication-flow)
7. [State Management](#state-management)
8. [Build & Deployment Pipelines](#build--deployment-pipelines)

---

## High-Level Architecture

The Job Monitor Platform is designed as a decoupled client-server architecture with support for both local development (FileStorage mode) and production scale (Supabase Cloud mode).

```mermaid
graph TD
    User[Web Client / User] -->|HTTP requests| API[Express API Server]
    API -->|Session Auth| AuthMiddleware[Authentication Middleware]
    AuthMiddleware -->|Fetch metrics/stats| Storage[Storage Provider]
    Cron[Scheduler Cron] -->|Trigger run| Orchestrator[Scraper Orchestrator]
    Orchestrator -->|Priority queue| Queue[Task Queue]
    Queue -->|Scrape| ScraperRegistry[Scraper Registry]
    ScraperRegistry -->|Playwright/Cheerio| Portals[Company Career Portals]
    Orchestrator -->|Resume matching| Matching[Resume Matcher]
    Orchestrator -->|Alerts| Notifier[Email Notification Provider]
    Notifier -->|API calls| Resend[Resend Email Service]
    Storage -->|File Mode| FileStorage[Local JSON Storage]
    Storage -->|DB Mode| Supabase[Supabase DB / Postgres]
```

---

## Frontend Architecture

The frontend is a single-page application (SPA) built using modern web paradigms:
- **Framework**: **React 19**
- **Build Tool**: **Vite v8**
- **Styling**: **TailwindCSS v4** (utilizing native CSS configuration imports)
- **Routing**: **React Router v7** (configured with client-side SPA routing)
- **Data Fetching**: **TanStack React Query v5** (provides server-state caching, synchronization, and automated mutations)
- **UI Design System**: Curated dark theme, glassmorphic layout, using Lucide-react for iconography and Recharts for analytics data visualization.

### Folder Division
All frontend features are modularly structured under `frontend/src/features/` with isolated components, state actions, and view pages:
- `/dashboard`: High-level summaries, statistics widgets, funnel status charts.
- `/tracker`: Kanban application tracking board.
- `/explorer`: Scraped job board browser with AI contact recommendation widgets.
- `/copilot`: Chat assistants, mock interview simulators, and study syllabi.
- `/referrals`: CRM pipeline, CSV contact importer, and template generators.
- `/automation`: Automation queues, run status displays, and rules setup.

---

## Backend Architecture

The backend is built as a robust **Node.js TypeScript API server** using **Express v5**:
- **Framework**: **Express 5.2** (featuring asynchronous middleware handler insulation)
- **Bootstrap**: Coordinates server startups, scheduler crons, database adapter bindings, and error-insulated email queues.
- **Client Handling**: Integrated with Helmet headers (CSP, frame protections), CORS origin filters, and input sanitization guards to protect against XSS/injections.
- **Scraper Engines**: Built with a hierarchy using Playwright (browser crawling for dynamic sites) and Cheerio (high-speed static HTML extraction).
- **Outreach Integration**: Formulates custom outreach messages, compiles EML file objects, and integrates with Gmail compose targets.

---

## Database & Storage Providers

The system implements a unified **StorageProvider** interface:
- **Local Mode (FileStorage)**: Automatically selected if no Supabase environment secrets are detected. Writes tables as JSON files into `storage/*.json` (e.g. `jobs.json`, `applications.json`, `referrals.json`).
- **Cloud Mode (SupabaseStorage)**: Connects to a remote Supabase PostgreSQL database. Enforces Row Level Security (RLS) policies at the database layer to ensure strict data isolation.

### Database ERD
```mermaid
erDiagram
    job_monitor_companies ||--o{ job_monitor_state : "has"
    job_monitor_companies ||--o{ job_monitor_jobs : "scrapes"
    auth_users ||--o{ job_monitor_profiles : "has_profile"
    auth_users ||--o{ job_monitor_resume_profiles : "owns_resumes"
    auth_users ||--o{ job_monitor_applications : "tracks_applications"
    auth_users ||--o{ job_monitor_saved_searches : "saves_searches"
    auth_users ||--o{ job_monitor_watchlists : "saves_watchlists"
    auth_users ||--o{ job_monitor_user_notifications : "receives_notifications"
    auth_users ||--o{ job_monitor_copilot_recommendations : "gets_recommendations"
    auth_users ||--o{ job_monitor_learning_roadmaps : "has_roadmaps"
    auth_users ||--o{ job_monitor_interview_sessions : "has_sessions"
    auth_users ||--o{ job_monitor_career_roadmaps : "has_career_roadmaps"
    auth_users ||--o{ job_monitor_daily_briefs : "has_briefs"
    auth_users ||--o{ job_monitor_application_queue : "queues_auto_apply"
    auth_users ||--o{ job_monitor_recruiters : "manages_recruiters"
    auth_users ||--o{ job_monitor_calendar_events : "tracks_events"
    auth_users ||--o{ job_monitor_exports : "owns_exports"
    auth_users ||--o{ job_monitor_referrals : "tracks_referrals"
    auth_users ||--o{ job_monitor_audit_logs : "records_logs"
```

---

## Core Pipelines

### Scraper & Job Monitor Pipeline
When scraping a company, the orchestrator detects the Applicant Tracking System (ATS), selects the proper plugin, executes the scrape, normalizes the job description, matches it, and saves it.

```mermaid
flowchart TD
    A[Start Company Scrape] --> B{ATS Detected?}
    B -->|No| C[Run AtsDetector Probe]
    C --> D[Identify greenhouse/lever/fallback]
    B -->|Yes| E[ScraperRegistry.getPlugin]
    D --> E
    E --> F[Execute Scrape]
    F --> G[Enrich Job Description Page]
    G --> H[JobNormalizer.normalize]
    H --> I[Save Scraped Postings]
```

### Scheduler & Locking Pipeline
The scheduler triggers scraper runs at configurable intervals. To prevent race conditions between replica node servers in production cloud mode, a distributed advisory lock is acquired on Supabase before running.

```mermaid
sequenceDiagram
    participant C as Cron Trigger
    participant O as Scraper Orchestrator
    participant L as Advisory Lock
    participant S as Storage Database

    C->>O: tick() - Trigger Scraper Run
    O->>L: pg_try_advisory_lock(8675309)
    alt Lock Acquired
        L-->>O: Success
        O->>S: getEnabledCompanies()
        S-->>O: Active Companies List
        O->>O: Stagger Batch Groups (Queueing)
        O->>S: updateCompanyScrapeState()
        O->>L: pg_advisory_unlock(8675309)
    else Lock Exists
        L-->>O: Locked (Exit Run)
    end
```

### Resume Matching Pipeline
Calculates real-time candidate fit scores using NLP comparison metrics:

```mermaid
flowchart LR
    Job[Job Posting Description] --> Tokenize[Clean & Tokenize Words]
    Resume[User Resume Profile] --> Tokenize2[Clean & Tokenize Words]
    Tokenize --> TFIDF[TF-IDF Vector Space]
    Tokenize2 --> TFIDF
    TFIDF --> Cosine[Cosine Similarity Calculation]
    Cosine --> Weights[Weight Adjustment heuristics]
    Weights --> Rank[Rank Matches & Filter by Threshold]
```

Heuristics evaluation weights are normalized to sum to 100%:
- **Skills Overlay**: 40% (direct matches of technical keywords)
- **Job Title Alignment**: 30% (role hierarchy and keywords similarity)
- **Experience Match**: 15% (compares candidate years vs job requirements)
- **Location Alignment**: 10% (remote/hybrid preferences)
- **TF-IDF Vector Score**: 5% (overall textual semantic similarity)

### AI Copilot & Career Agent Pipeline
Analyzes user skill gaps and generates custom study syllabus tasks:

```mermaid
sequenceDiagram
    participant O as Scraper Orchestrator
    participant A as Career Agent
    participant S as Skill Gap Engine
    participant DB as Storage Provider

    O->>A: analyzeUserMatches()
    A->>DB: getResumeProfile()
    DB-->>A: User Resume
    A->>S: identifyMissingSkills()
    S->>S: Compare Job Keywords vs Resume Skills
    S-->>A: Missed Skills List
    A->>A: Generate Learning Syllabus Tasks
    A->>DB: saveAnalyticsAndDashboard()
```

### Auto-Apply Workflow
Queues and processes job application submissions automatically:

```mermaid
sequenceDiagram
    participant U as Web User
    participant Q as Application Queue
    participant E as AutoApply Engine
    participant S as Storage Database
    participant A as External ATS (Lever/Greenhouse)

    U->>Q: Enqueue Job apply (jobHash, profileName)
    Q->>S: saveApplicationQueueItem (State: NEW)
    Note over E: Background queue runner processes queued items
    E->>S: getApplicationQueue()
    S-->>E: Pending items list (READY/QUEUED/NEW)
    loop For each item
        E->>E: determineAutomatedSupport()
        alt Supported (Lever/Greenhouse)
            E->>E: validatePayload()
            alt Payload valid
                E->>A: POST Form submission payload
                A-->>E: 200 OK Submission ID
                E->>S: saveApplicationQueueItem (State: SUBMITTED)
                E->>S: saveApplication (Status: Applied)
            else Invalid fields
                E->>S: saveApplicationQueueItem (State: REQUIRES_MANUAL_ACTION)
            end
        else Redirect/Workday/Unsupported
            E->>S: saveApplicationQueueItem (State: REQUIRES_MANUAL_ACTION)
        end
    end
```

### Notification Flow
Insulates email dispatch to prevent SMTP issues from halting core runtimes:

```mermaid
sequenceDiagram
    participant O as Orchestrator
    participant N as Notifier
    participant R as Resend API

    O->>N: dispatchDigest(newMatches)
    N->>N: Format HTML template
    N->>R: sendEmail(from, to, subject, html)
    alt Send Success
        R-->>N: Message ID (Success)
        N->>O: Mark jobs notified in DB
    else Timeout / SMTP Error
        R-->>N: Connection Refused
        N->>N: Log warning & Fail Gracefully
    end
```

---

## Authentication Flow

Coordinates secure session establishment:

```mermaid
sequenceDiagram
    participant C as Web Client
    participant S as Express Server
    participant DB as Supabase DB

    C->>S: POST /api/auth/login (email, password)
    S->>DB: getUser(email)
    DB-->>S: User info & password_hash
    S->>S: verifyPasswordHash()
    alt Match
        S->>S: Generate session cookie / JWT
        S-->>C: 200 OK (with Auth Cookie)
    else Invalid
        S-->>C: 401 Unauthorized
    end
```

*Note: In local mode, authMiddleware checks token strings for mock roles (e.g. Admin, User, Viewer).*

---

## State Management

- **Client state**: Managed using React context and hook forms.
- **Server state**: Handled using **TanStack React Query** mutations and query caches, eliminating redundant state flags and ensuring UI views immediately refresh upon database changes.
- **Background workers state**: Maintained in database queue tables (`job_monitor_application_queue`, `job_monitor_state`) and read periodically by backend cron threads.

---

## Build & Deployment Pipelines

### Local Build & Development
Run the orchestrator, server, and client concurrently:
```bash
# Run server watch compile and Vite client dev server
npm run dev:start
```

### Compile & Build Checks
TypeScript is checked across both backend and frontend layers:
- Backend: `tsc` compiles files into `dist/*`.
- Frontend: `tsc -b && vite build` generates optimized assets under `frontend/dist/`.

### Docker Architecture
The container setup wraps the compiled Express API server alongside Playwright headless dependencies, enabling deployment to cloud platforms like Render, AWS, or Azure:
```bash
# Compile and package Docker container
docker build -t job-monitor:latest .
```
See [DEPLOYMENT.md](file:///c:/Users/varun/Downloads/Job%20Monitor/docs/archive/DEPLOYMENT.md) for detailed instructions.
