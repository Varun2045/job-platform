# 🚀 Job Platform (v2.1.0) — Job Search Tracker & Automation Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Tests](https://img.shields.io/badge/Tests-57%20Suites%20%7C%20241%20Passing-success.svg)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.0-blue.svg)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![Heroku Ready](https://img.shields.io/badge/Heroku-Deployment--Ready-purple.svg)](Procfile)

**Job Platform** is an open-source, full-stack job application tracker and automation framework engineered to streamline, organize, and automate software engineering job searching. Featuring a Manifest V3 Chrome Extension, native ATS scrapers, a plugin-based Playwright fallback framework for 50 major company career portals, ATS match density heatmaps, cover letter generation, multi-channel daily career digests, and Heroku deployment readiness.

---

## 📑 Table of Contents
- [✨ Key Features](#-key-features)
- [🏗️ System Architecture](#️-system-architecture)
- [🧩 Supported ATS Explorer & 50 Company Plugins](#-supported-ats-explorer--50-company-plugins)
- [🧠 Zero-Fabrication AI Workspaces](#-zero-fabrication-ai-workspaces)
- [🔒 Security & SSRF Defense](#-security--ssrf-defense)
- [🛠️ Technology Stack](#️-technology-stack)
- [🚀 Quick Start & Installation](#-quick-start--installation)
- [☁️ Heroku Production Deployment](#️-heroku-production-deployment)
- [🧪 Testing & Quality Assurance](#-testing--quality-assurance)
- [📄 License](#-license)

---

## ✨ Key Features

- 🧩 **Manifest V3 Chrome Extension**: One-click job capture from LinkedIn, Greenhouse, Lever, Workday, Ashby, Wellfound, SmartRecruiters, Taleo, Indeed, and Glassdoor with offline queueing (`chrome.storage.local`).
- 🤖 **Playwright Fallback & 50 Company Plugins**: Plugin-based fallback layer with dedicated extractors for 50 tech giants (Google, Microsoft, Amazon, Meta, Apple, NVIDIA, OpenAI, Stripe, Netflix, etc.).
- 🌐 **Supported ATS Explorer**: Dynamic frontend dashboard showing ATS coverage, company mappings, and real-time URL parser diagnostic testing.
- 📥 **Job Inbox Queue**: Intermediate staging queue separating raw web captures from active application cards.
- 📋 **11-Stage Kanban Tracker**: Visual drag-and-drop workflow tracking applications through customizable lifecycle stages with single-row fractional sorting algorithms ($O(1)$ updates).
- 🧠 **Zero-Fabrication AI Workspaces**: Keyword match density heatmaps, ATS bullet optimization suggestions, and interview topic extraction without experience hallucination.
- ✉️ **Tone-Tailored Cover Letter Generator**: Generates customized cover letter drafts matching specific company profiles with customizable tone and length constraints.
- 🔔 **Multi-Channel Daily Career Digest**: Scheduled digest dispatching notifications via Email, Slack Webhooks (with SSRF protection), and Telegram Bots.
- 📅 **Calendar `.ics` Sync**: One-click RFC-5545 calendar invite export for Google Calendar, Apple Calendar, and Outlook.

---

## 🛠️ Technology Stack

- **Frontend**: React 18, TypeScript, Vite, React Query, Lucide Icons, Vanilla CSS Design System
- **Backend**: Node.js, Express, TypeScript, REST APIs
- **Database / Persistence**: PostgreSQL (Supabase) & Local JSON File Storage
- **Browser Extension**: Chrome Extension Manifest V3 (Service Workers, Content Scripts)
- **DevOps & Deployment**: Heroku (`Procfile`), Docker, Jest, ESLint

---

## 🚀 Quick Start & Local Installation

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/Varun2045/job-platform.git
cd job-platform
npm install
npm --prefix frontend install
```

### 2. Environment Configuration
Copy `.env.example` to `.env`:
```bash
PORT=3000
NODE_ENV=development
STORAGE_MODE=file
```

### 3. Run Locally
```bash
# Start backend REST API server & frontend client concurrently
npm run dev:start
```

---

## ☁️ Heroku Production Deployment

Deployment to Heroku is performed manually using the Heroku CLI and pre-configured `Procfile`.

### 1. Heroku Prerequisites
Verify that your Heroku account is active and you have installed the [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli).

### 2. Deployment Commands
```bash
# Login to Heroku CLI
heroku login

# Create Heroku App
heroku create job-platform-prod

# Add Heroku Playwright buildpack for headless Chromium binaries
heroku buildpacks:add --index 1 https://github.com/mxschmitt/heroku-buildpack-playwright.git
heroku buildpacks:add --index 2 heroku/nodejs

# Set Production Config Vars
heroku config:set NODE_ENV=production
heroku config:set STORAGE_MODE=file
heroku config:set JWT_SECRET=your_production_jwt_secret
heroku config:set PLAYWRIGHT_CONCURRENCY=2

# Deploy
git push heroku main
```

---

## 🧪 Testing & Quality Assurance

```bash
# Run all unit & integration tests
npm test

# Run TypeScript typecheck
npx tsc --noEmit

# Run ESLint validation
npm run lint
```

---

## 📄 License
This project is open-source software licensed under the [MIT License](LICENSE).
