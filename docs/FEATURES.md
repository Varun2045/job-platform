# Feature Inventory

## Metadata
- **Title**: Feature Inventory - Job Monitor Platform
- **Purpose**: Defines every user-facing and backend functional feature, its status, codebase location, and planned updates.
- **Last Updated**: 2026-07-13
- **Current Version**: v5.0.0
- **Cross-References**: [PRD.md](file:///c:/Users/varun/Downloads/Job%20Monitor/docs/PRD.md), [TECH_STACK.md](file:///c:/Users/varun/Downloads/Job%20Monitor/docs/TECH_STACK.md)

---

## Table of Contents
1. [Core Scraping & Sourcing](#1-core-scraping--sourcing)
2. [Resume Matching & Fit Scoring](#2-resume-matching--fit-scoring)
3. [AI Copilot & Career Assistant](#3-ai-copilot--career-assistant)
4. [Intelligent Automation Hub (Auto-Apply)](#4-intelligent-automation-hub-auto-apply)
5. [LinkedIn Referrals & CRM Tracker](#5-linkedin-referrals--crm-tracker)
6. [Analytics & Telemetry Reporting](#6-analytics--telemetry-reporting)
7. [System Administration & Backups](#7-system-administration--backups)

---

## 1. Core Scraping & Sourcing

### ATS Auto-Detection
- **Description**: Automatically probes target company URLs to detect if they use Lever, Greenhouse, or Workday.
- **Status**: Complete.
- **Dependencies**: Cheerio, HttpClient.
- **Backend Location**: `src/core/AtsDetector.ts`
- **Frontend Location**: Managed under settings and company configurations panels.
- **Future Improvements**: Add support for automated discovery of corporate job boards using metadata scraping.

### Priority-Based Crawl Queue
- **Description**: Staggers crawler tasks in parallel batches based on company priorities (1 to 3) to prevent rate limits and IP blocks.
- **Status**: Complete.
- **Dependencies**: StorageProvider, TaskQueue.
- **Backend Location**: `src/core/Queue.ts`, `src/core/index.ts`
- **Frontend Location**: None.
- **Future Improvements**: Support dynamic priority escalations for companies with active applications.

---

## 2. Resume Matching & Fit Scoring

### Weighted Similarity Scoring
- **Description**: Tokenizes crawled descriptions and user resumes, calculating a fit score (0-100) based on weighted heuristics (Skills: 40%, Title: 30%, Experience: 15%, Location: 10%, TF-IDF similarity: 5%).
- **Status**: Complete.
- **Dependencies**: Natural Language Processing utilities, Tokenizers.
- **Backend Location**: `src/core/ResumeMatcher.ts`, `src/core/ComparisonEngine.ts`
- **Frontend Location**: Settings configuration panels.
- **Future Improvements**: Move weights customization control into a dynamic sliding bar on the dashboard.

### Resume Parser
- **Description**: Extracts raw text blocks from PDF and Docx resume uploads.
- **Status**: Complete.
- **Dependencies**: pdf-parse, mammoth.
- **Backend Location**: Integrated in `server.ts` parsing routes.
- **Frontend Location**: `frontend/src/features/resumes/Resumes.tsx`
- **Future Improvements**: Enhance formatting retention during parsing.

---

## 3. AI Copilot & Career Assistant

### Skill Gap & Syllabus Generator
- **Description**: Highlights technical keywords missing from the candidate's resume and compiles custom study syllabus tasks.
- **Status**: Complete.
- **Dependencies**: CareerAgent, SkillGapEngine.
- **Backend Location**: `src/core/CareerAgent.ts`, `src/core/SkillGapEngine.ts`
- **Frontend Location**: `frontend/src/features/copilot/SkillGap.tsx`
- **Future Improvements**: Suggest online courses (e.g. Coursera, Udemy) for missing keywords.

### Mock Interview Simulator
- **Description**: Launches interactive Q&A mock interviews, scores candidate answers, and provides feedback.
- **Status**: Complete.
- **Dependencies**: InterviewGenerator, AI Providers.
- **Backend Location**: `src/core/InterviewGenerator.ts`, `src/core/InterviewCopilot.ts`
- **Frontend Location**: `frontend/src/features/copilot/MockInterview.tsx`
- **Future Improvements**: Integrate voice-to-text recording.

---

## 4. Intelligent Automation Hub (Auto-Apply)

### Auto-Apply Engine
- **Description**: Fills and submits application forms on Lever and Greenhouse boards using headless Playwright actions.
- **Status**: Complete.
- **Dependencies**: Playwright, AutoApplyEngine.
- **Backend Location**: `src/core/AutoApplyEngine.ts`
- **Frontend Location**: `frontend/src/features/automation/AutomationHub.tsx`
- **Future Improvements**: Support captcha-solving services.

---

## 5. LinkedIn Referrals & CRM Tracker

### Contact Recommendations
- **Description**: Recommends corporate contacts for target jobs, ranking them by category (Recruiter, Hiring Manager, EM) and university alumni matches.
- **Status**: Complete.
- **Dependencies**: LinkedInIntegration, StorageProvider.
- **Backend Location**: `src/core/LinkedInIntegration.ts`
- **Frontend Location**: `frontend/src/features/explorer/JobExplorer.tsx` (ContactRecommendations component)
- **Future Improvements**: Automated outbound draft integration.

### Connection CSV Importer
- **Description**: Imports connection CSV lists exported from LinkedIn, mapping contacts into CRM pipeline stages.
- **Status**: Complete.
- **Dependencies**: ManualImportProvider.
- **Backend Location**: `src/core/LinkedInIntegration.ts`
- **Frontend Location**: `frontend/src/features/referrals/Referrals.tsx`
- **Future Improvements**: Automated CSV validation checks.

---

## 6. Analytics & Telemetry Reporting

### Daily Brief & Email Digests
- **Description**: Formulates daily text brief summaries and triggers HTML digest emails (via Resend) listing matches.
- **Status**: Complete.
- **Dependencies**: Resend API, EmailNotificationProvider.
- **Backend Location**: `src/core/DailyBriefService.ts`, `src/notifications/`
- **Frontend Location**: `frontend/src/features/dashboard/Dashboard.tsx`
- **Future Improvements**: Customized email schedules.

---

## 7. System Administration & Backups

### Automated Backups & Restore
- **Description**: Exports tables data into JSON backups after successful crawling tasks, retaining the last 5 daily files.
- **Status**: Complete.
- **Dependencies**: BackupService.
- **Backend Location**: `src/core/BackupService.ts`, `src/cli/admin.js`
- **Frontend Location**: Admin backup utilities dashboard.
- **Future Improvements**: Support automatic database restores via the web UI.
