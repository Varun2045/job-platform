# REST API Reference

## Metadata
- **Title**: REST API Reference - Job Monitor Platform
- **Purpose**: Fully document all Express REST endpoints exposed by the API gateway server.
- **Last Updated**: 2026-07-13
- **Current Version**: v5.0.0
- **Cross-References**: [ARCHITECTURE.md](file:///c:/Users/varun/Downloads/Job%20Monitor/docs/ARCHITECTURE.md), [DATABASE.md](file:///c:/Users/varun/Downloads/Job%20Monitor/docs/DATABASE.md)

---

## Table of Contents
1. [Authentication Endpoints](#1-authentication-endpoints)
2. [Jobs & Companies Endpoints](#2-jobs--companies-endpoints)
3. [Resumes & Profiles Endpoints](#3-resumes--profiles-endpoints)
4. [Dashboard & Settings Endpoints](#4-dashboard--settings-endpoints)
5. [AI Copilot Endpoints](#5-ai-copilot-endpoints)
6. [Intelligent Application Automation (Auto-Apply)](#6-intelligent-application-automation-auto-apply)
7. [Referrals & Recruiter CRM Tracker](#7-referrals--recruiter-crm-tracker)
8. [Google Calendar & Scheduling Endpoints](#8-google-calendar--scheduling-endpoints)
9. [Portfolio & Opportunities Ranking](#9-portfolio--opportunities-ranking)
10. [Admin & Telemetry Endpoints](#10-admin--telemetry-endpoints)
11. [Health & Prometheus Exporters](#11-health--prometheus-exporters)

---

## 1. Authentication Endpoints

All client requests must provide authorization headers except where specified.
- In Cloud Mode: `Authorization: Bearer <supabase_jwt>`
- In Local Mode: `Authorization: <admin-token|user-token|viewer-token>`

### `POST /api/auth/register`
- **Purpose**: Registers a new user. (No auth required)
- **Request Body**:
  ```json
  {
    "email": "candidate@domain.com",
    "password": "securepassword123",
    "name": "Varun Dev"
  }
  ```
- **Response (201 Created)**:
  ```json
  {
    "success": true,
    "user": { "id": "uuid-1234", "email": "candidate@domain.com" }
  }
  ```

### `POST /api/auth/login`
- **Purpose**: Session establishment. (No auth required)
- **Request Body**:
  ```json
  {
    "email": "candidate@domain.com",
    "password": "securepassword123"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "token": "jwt_token_string",
    "user": { "id": "uuid-1234", "email": "candidate@domain.com" }
  }
  ```

---

## 2. Jobs & Companies Endpoints

### `GET /api/jobs`
- **Purpose**: Retrieves filtered job listings.
- **Query Params**: `minScore` (int), `company` (string), `isRemote` (bool).
- **Response (200 OK)**:
  ```json
  [
    {
      "jobHash": "google-1234",
      "company": "Google",
      "title": "Software Engineer",
      "location": "Remote",
      "url": "https://careers.google.com/jobs/123",
      "isRemote": true,
      "experience": "Mid",
      "datePosted": "2026-07-12"
    }
  ]
  ```

### `GET /api/jobs/:hash`
- **Purpose**: Retrieves a specific job posting.
- **Response (200 OK)**: Detailed job object.

### `GET /api/companies`
- **Purpose**: Fetches scraper configurations for career boards.
- **Response (200 OK)**: Array of company objects detailing priorities, interval schedules, and scrape metrics.

### `POST /api/companies/:id/toggle`
- **Purpose**: Enable/disable a company crawler board.
- **Request Body**: `{ "enabled": boolean }`
- **Response (200 OK)**: `{ "success": true }`

---

## 3. Resumes & Profiles Endpoints

### `GET /api/resumes`
- **Purpose**: Fetch all user resume profiles.
- **Response (200 OK)**: Array of profiles containing profile names and plain content.

### `POST /api/resumes`
- **Purpose**: Upload or create a resume profile text block.
- **Request Body**: `{ "profileName": "Backend", "content": "Resume text..." }`
- **Response (200 OK)**: `{ "success": true }`

### `POST /api/resumes/parse`
- **Purpose**: Parse raw document bytes (PDF, Docx) into clean text.
- **Request Headers**: `Content-Type: application/pdf` (binary data)
- **Response (200 OK)**: `{ "text": "Extracted string content" }`

---

## 4. Dashboard & Settings Endpoints

### `GET /api/dashboard`
- **Purpose**: Fetches analytical widgets, applicant pipelines, and skill gap highlights.
- **Response (200 OK)**:
  ```json
  {
    "stats": { "totalJobsScraped": 150, "totalMatches": 24 },
    "jobs": [ ... ],
    "applications": [ ... ],
    "skillGap": { "missingSkills": ["TypeScript"], "recommendedSyllabus": [ ... ] }
  }
  ```

### `GET /api/settings/extended`
- **Purpose**: Fetch extended preferences.
- **Response (200 OK)**: Preferences matching remote, location, and technology options.

---

## 5. AI Copilot Endpoints

### `GET /api/copilot/daily-brief`
- **Purpose**: Fetch custom daily briefings outlining matching opportunities and schedules.
- **Response (200 OK)**: `{ "brief": "Good morning Varun! Today you have..." }`

### `GET /api/copilot/skill-gap`
- **Purpose**: Identify missing tech stack keywords vs active user resumes.
- **Response (200 OK)**: `{ "missingSkills": ["Docker"], "syllabus": [ ... ] }`

### `POST /api/copilot/interview/start`
- **Purpose**: Initiate mock interview sessions.
- **Request Body**: `{ "jobHash": "google-1234", "sessionType": "Technical" }`
- **Response (200 OK)**: `{ "sessionId": "session-uuid", "questions": ["Question 1", "Question 2"] }`

### `POST /api/copilot/interview/submit`
- **Purpose**: Submit responses to questions to get AI feedback.
- **Request Body**:
  ```json
  {
    "sessionId": "session-uuid",
    "responses": [{ "question": "Question 1", "answer": "User answer..." }]
  }
  ```
- **Response (200 OK)**: `{ "score": 85, "feedback": "Strong answer, but you should mention..." }`

---

## 6. Intelligent Application Automation (Auto-Apply)

### `GET /api/applications/queue`
- **Purpose**: Fetch all queued applications.
- **Response (200 OK)**: Array of applications containing states (`NEW`, `READY`, `SUBMITTED`, `REQUIRES_MANUAL_ACTION`).

### `POST /api/applications/queue`
- **Purpose**: Enqueue job details for automated submissions.
- **Request Body**:
  ```json
  {
    "jobHash": "lever-1234",
    "profileName": "Backend",
    "coverLetterText": "Dear hiring manager..."
  }
  ```
- **Response (200 OK)**: `{ "success": true }`

### `POST /api/applications/run`
- **Purpose**: Triggers immediate browser workers to run form submissions.
- **Response (200 OK)**: `{ "success": true }`

---

## 7. Referrals & Recruiter CRM Tracker

### `GET /api/referrals`
- **Purpose**: Fetch CRM tracking contacts.
- **Response (200 OK)**: Array of contact profiles showing categories (Recruiter, Hiring Manager, etc.) and pipeline stages.

### `POST /api/referrals`
- **Purpose**: Add outreach contact details.
- **Request Body**:
  ```json
  {
    "name": "John Doe",
    "company": "Amazon",
    "category": "Recruiter",
    "email": "john@amazon.com",
    "linkedInUrl": "https://linkedin.com/in/johndoe"
  }
  ```
- **Response (201 Created)**: `{ "success": true }`

### `POST /api/linkedin/import-csv`
- **Purpose**: Parse connection lists exported from LinkedIn.
- **Request Body**: `{ "csvData": "Name,Role,Company...\nJohn Doe,Recruiter,Amazon..." }`
- **Response (200 OK)**: `{ "success": true, "imported": 1, "saved": 1 }`

### `POST /api/linkedin/recommend`
- **Purpose**: Recommend contacts for target job hashes.
- **Request Body**: `{ "company": "Amazon", "jobTitle": "SDE 2" }`
- **Response (200 OK)**: Array of ranked connections sorted by alumni/skills relevance scoring.

---

## 8. Google Calendar & Scheduling Endpoints

### `GET /api/calendar`
- **Purpose**: Fetch schedule lists.
- **Response (200 OK)**: Array of events.

### `GET /api/calendar/:id/ics`
- **Purpose**: Compiles interview schedules into RFC-5545 `.ics` file downloads.
- **Response (200 OK)**: Transmits raw `text/calendar` header streams.

---

## 9. Portfolio & Opportunities Ranking

### `GET /api/opportunities`
- **Purpose**: Fetch jobs dynamically ordered by dynamic Opportunity Scores.
- **Response (200 OK)**: Array of postings with custom score mappings and strength listings.

---

## 10. Admin & Telemetry Endpoints

All admin endpoints require role checking flags matching `'Admin'`.

### `GET /api/admin/feature-flags`
- **Purpose**: Read global overrides.
- **Response (200 OK)**: Active overrides status.

### `GET /api/admin/audit-logs`
- **Purpose**: Retrieve historical audit logs.
- **Response (200 OK)**: JSON array of actions, IP addresses, and database changes.

---

## 11. Health & Prometheus Exporters

### `GET /health`
- **Purpose**: Heartbeat and status check. (No auth required)
- **Response (200 OK)**:
  ```json
  { "status": "healthy", "uptime": 3600.5, "telemetry": { "schedulerStatus": "idle" } }
  ```

### `GET /metrics`
- **Purpose**: Exposes Prometheus telemetry. (No auth required)
- **Response (200 OK)**: Text format outputs listing `job_monitor_discovered_jobs_total` and scrape duration telemetry.
