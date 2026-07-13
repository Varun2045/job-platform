# Technology Stack Reference

## Metadata
- **Title**: Technology Stack Reference - Job Monitor Platform
- **Purpose**: Document all languages, frameworks, developer tooling, databases, and package dependencies.
- **Last Updated**: 2026-07-13
- **Current Version**: v5.0.0
- **Cross-References**: [ARCHITECTURE.md](file:///c:/Users/varun/Downloads/Job%20Monitor/docs/ARCHITECTURE.md), [RULES.md](file:///c:/Users/varun/Downloads/Job%20Monitor/docs/RULES.md)

---

## Table of Contents
1. [Core Stack Matrix](#core-stack-matrix)
2. [Frontend Technology Stack](#frontend-technology-stack)
3. [Backend Technology Stack](#backend-technology-stack)
4. [Database & Authentication](#database--authentication)
5. [Developer & Testing Tooling](#developer--testing-tooling)
6. [NPM Dependencies List](#npm-dependencies-list)

---

## Core Stack Matrix

| Layer | Technology | Version | Description |
| :--- | :--- | :--- | :--- |
| **Language** | TypeScript | ~5.5 / ~6.0 | Enforces type safety across backend and client. |
| **Runtime** | Node.js | v20+ / v22 | Application engine. |
| **Frontend** | React | v19.2 | UI presentation library. |
| **Client Build** | Vite | v8.1 | High-speed hot-module reload bundler. |
| **Styling** | TailwindCSS | v4.3 | Utility-first styling framework. |
| **Backend API** | Express | v5.2 | Web framework with async error mitigation. |
| **Database** | PostgreSQL | (Supabase) | Persistent data store with Row Level Security. |
| **Automation** | Playwright | v1.44 | Headless browser crawler and auto-apply driver. |
| **Email Alerts** | Resend | v3.2 | Transactional email transmission. |

---

## Frontend Technology Stack

- **Framework**: **React 19**
- **Styling**: **TailwindCSS v4**
- **Routing**: **React Router v7** (`react-router-dom`)
- **Query & Cache**: **TanStack React Query v5** (`@tanstack/react-query`)
- **Icons**: **Lucide React** (`lucide-react`)
- **Charts**: **Recharts** (`recharts`)
- **Split Views**: **React Resizable Panels** (`react-resizable-panels`)
- **Forms**: **React Hook Form** (`react-hook-form`)

---

## Backend Technology Stack

- **API Router**: **Express 5**
- **Scraper Engines**:
  - **Cheerio**: High-speed parse library for static HTML career listings.
  - **Playwright**: Automates browser actions for JavaScript-heavy SPA job portals.
- **Document Extractors**:
  - **pdf-parse**: Extracts clean text streams from uploaded PDF resumes.
  - **mammoth**: Converts Microsoft Word `.docx` documents into structured text.
- **Security Middlewares**:
  - **helmet**: Secure HTTP response header builder.
  - **express-rate-limit**: Gateway rate limiting.
- **Logging**: Dedicated class outputting structured audit logs to console and file targets.

---

## Database & Authentication

- **Database**: **PostgreSQL** hosted via **Supabase**.
- **Auth**: Multi-user JWT authentication managed via **Supabase Auth**.
- **Local Mode Fallback**: JSON flat-file storage adapters writing to `storage/*.json` when database variables are absent.

---

## Developer & Testing Tooling

- **Linter**: **ESLint** (backend) and **Oxlint** (frontend, ultra-fast rust-based linter).
- **Formatter**: **Prettier**.
- **Test Runner**: **Jest** (`ts-jest`) sequentially executing integration and performance load runs.
- **Docker**: Packages runtime server and dependencies into a container.

---

## NPM Dependencies List

### Backend Dependencies (`package.json`)
- `express` (^5.2.1): Handles API routes.
- `@supabase/supabase-js` (^2.43.4): Database client.
- `playwright` (^1.44.1): Headless scraper.
- `cheerio` (^1.0.0-rc.12): Static crawler.
- `pdf-parse` (^2.4.5): PDF resume parser.
- `mammoth` (^1.12.0): Word resume parser.
- `resend` (^3.2.0): Email transmission.
- `compression` (^1.8.1): Gzip compression middleware.
- `cors` (^2.8.6): Controls API CORS policies.
- `dotenv` (^16.4.5): Loads environment configurations.
- `helmet` (^8.2.0): Protects API headers.
- `express-rate-limit` (^8.5.2): Limit request thresholds.
- `swagger-ui-express` (^5.0.1) & `swagger-jsdoc` (^6.3.0): Self-generating OpenAPI references.

### Frontend Dependencies (`frontend/package.json`)
- `react` & `react-dom` (^19.2.7): Main framework.
- `react-router-dom` (^7.18.1): SPA routing paths.
- `@tanstack/react-query` (^5.101.2): Server-state management.
- `tailwindcss` & `@tailwindcss/vite` (^4.3.2): Styling bundler tools.
- `lucide-react` (^1.23.0): Vector iconography.
- `recharts` (^3.9.2): Visualizes candidate funnel charts.
- `react-hook-form` (^7.81.0): Validates layout fields.
- `react-resizable-panels` (^2.0.0): Dashboard panels divider.
