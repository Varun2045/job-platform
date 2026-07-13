# Engineering Rules & Guidelines

## Metadata
- **Title**: Engineering Rules & Guidelines - Job Monitor Platform
- **Purpose**: Establishes strict repository-wide coding standards, folder structures, Git workflows, database rules, and security guidelines.
- **Last Updated**: 2026-07-13
- **Current Version**: v5.0.0
- **Cross-References**: [FOLDER_STRUCTURE.md](file:///c:/Users/varun/Downloads/Job%20Monitor/docs/FOLDER_STRUCTURE.md), [ARCHITECTURE.md](file:///c:/Users/varun/Downloads/Job%20Monitor/docs/ARCHITECTURE.md), [DATABASE.md](file:///c:/Users/varun/Downloads/Job%20Monitor/docs/DATABASE.md)

---

## Table of Contents
1. [Coding Standards](#coding-standards)
2. [Folder & Naming Conventions](#folder--naming-conventions)
3. [React 19 & TypeScript Guidelines](#react-19--typescript-guidelines)
4. [API Guidelines](#api-guidelines)
5. [Database & RLS Guidelines](#database--rls-guidelines)
6. [Git Workflow & Commit Formats](#git-workflow--commit-formats)
7. [Error Handling & Logging Protocols](#error-handling--logging-protocols)
8. [Security & Compliance Guidelines](#security--compliance-guidelines)
9. [Performance & Telemetry Rules](#performance--telemetry-rules)
10. [UX & Responsive Design Rules](#ux--responsive-design-rules)
11. [AI Prompting & Engineering Guidelines](#ai-prompting--engineering-guidelines)
12. [Testing Standards](#testing-standards)
13. [Code Review Checklist](#code-review-checklist)
14. [Anti-Patterns: Things to Avoid](#anti-patterns-things-to-avoid)

---

## Coding Standards

- **Strict Formatting**: Enforced via ESLint and Prettier. All files must terminate with a newline and use 2-space indentation.
- **ES Modules**: Backend imports must explicitly use ES module file extensions (e.g. `import { Logger } from './Logger.js'`).
- **TypeScript Strict Mode**: No implicit `any` allowed. Explicit typing must be defined for function arguments, class attributes, and API request schemas.
- **Prettier configuration**:
  ```json
  {
    "semi": true,
    "trailingComma": "all",
    "singleQuote": true,
    "printWidth": 120,
    "tabWidth": 2
  }
  ```

---

## Folder & Naming Conventions

### File & Directory Naming
- **Components**: PascalCase (e.g. `Referrals.tsx`, `Sidebar.tsx`).
- **Services/Helpers/Classes**: PascalCase (e.g. `AutoApplyEngine.ts`, `StorageProvider.ts`).
- **Tests**: Matches target file name + `.test.ts` or `.test.tsx` suffix.
- **Style Files**: kebab-case or lower-case (e.g. `index.css`).

### Variable Naming
- **Variables & Functions**: camelCase (e.g. `runOrchestrator`, `jobHash`).
- **Types, Interfaces, Classes**: PascalCase (e.g. `StorageProvider`, `Job`).
- **Database Column Names**: snake_case (e.g. `user_id`, `job_hash`, `connection_status`).
- **Constants**: UPPER_SNAKE_CASE (e.g. `ADVISORY_LOCK_ID`).

---

## React 19 & TypeScript Guidelines

- **Functional Components**: Component classes must be functional, utilizing TS arrow functions and `React.FC` or typed props parameters.
- **React 19 Forms**: Leverage native form actions and hook forms rather than manual component state handlers.
- **TanStack React Query**: Use React Query for all server-side fetches. Never use `useEffect` for data loading.
- **Isolated Custom Hooks**: Extract reuse-prone states and layouts into custom hooks (e.g. `useAuth()`, `useReferrals()`).
- **TypeScript Types over Interfaces**: Prefer `type` declarations for simple prop types or unions, and `interface` for class contract shapes.

---

## API Guidelines

- **Standard REST Routes**:
  - `GET`: Read resources. Must be idempotent and cache-insulated.
  - `POST`: Create a new resource or execute an operation queue (e.g. `/api/applications/run`).
  - `PUT`: Complete update of resources.
  - `PATCH`: Partial state modification (e.g. updating connection status).
  - `DELETE`: Remove resource.
- **Consistent Response Schema**:
  - Success: `200 OK` or `201 Created` with payload.
  - Error: `{ error: "Descriptive error message", code: "ERROR_CODE" }`.
- **Role Permissions**: Apply role validation check helper rules (e.g. `requireRole(['Admin'])`) to guard enterprise settings and telemetry.

---

## Database & RLS Guidelines

- **Row Level Security (RLS)**: Enforced on all tables except system config and public indices. Every user row must validate ownership using `auth.uid() = user_id`.
- **Primary & Foreign Keys**: Every table must have a primary key (or composite keys) and appropriate foreign key relations with `ON DELETE CASCADE`.
- **Indexes**: Create indexes on fields that appear in `WHERE` clauses, `JOIN` conditions, or ordering blocks.
- **Triggers**: Use triggers only for automatic fields (like `updated_at`). Avoid complex business logic in SQL triggers.

---

## Git Workflow & Commit Formats

### Branch Naming
- Features: `feature/short-description`
- Bug fixes: `bugfix/issue-description`
- Documentation: `docs/audit-and-restructure`
- Releases: `release/vX.Y.Z`

### Commit Message Format
Strictly follow Angular-style Semantic Commits format:
`<type>(<scope>): <subject>`

Types:
- `feat`: A new feature implementation
- `fix`: A bug fix
- `docs`: Documentation modifications
- `style`: Formatting, missing semi-colons, etc. (no business code changes)
- `refactor`: Code restructuring without changing behavior or adding features
- `test`: Adding missing tests or refactoring test suites
- `chore`: Updating build scripts, dependencies, etc.

*Example*: `feat(crm): add CSV connections importer supporting LinkedIn templates`

---

## Error Handling & Logging Protocols

- **Insulate Async Middleware**: Wrap Express middleware async calls inside try/catch blocks or use an Express async boundary wrapper.
- **No Uncaught Exceptions**: All file operations, API network requests, and database calls must implement retry rules or catch buffers.
- **Log Levels Verbosity**:
  - `Logger.debug()`: Granular parser match weights, raw HTML crawler load pages.
  - `Logger.info()`: Application startups, scraper queue status, successful runs.
  - `Logger.warn()`: Recoverable failures (SMTP timeout, single-portal scraper block).
  - `Logger.error()`: DB credential failures, server-wide exception logs.
  - `Logger.critical()`: System startup crashes.
- **No `console.log`**: Always use the core `Logger` service class.

---

## Security & Compliance Guidelines

- **Helmet Protection**: Do not override Helmet header headers without security review.
- **Clean Inputs**: Sanitize all request objects using `sanitizeObject` wrapper middleware.
- **Safe Secrets Handling**: Never commit `.env` values. Use `.env.example` as a template.
- **LinkedIn Compliance**: Under no circumstances should browser scripts simulate clicks, keystrokes, or direct navigations on the official LinkedIn domain. The tool must only assist the user offline.

---

## Performance & Telemetry Rules

- **Request Rate Limits**: Throttle clients using rate limits (`100 requests / 15 minutes`).
- **Prometheus Telemetry**: Record scrape runtime, success/failure ratios, and matched totals to `storage/metrics.prom`.
- **Distributed Lock Check**: Always verify Postgres advisory lock `pg_try_advisory_lock` in orchestrator runs to prevent database locking or scraping conflicts.
- **ETags**: Enable etags for API calls to optimize network transmissions.

---

## UX & Responsive Design Rules

- **Mobile First Responsive Rules**: All views must use flex/grid structures matching Tailwind breakpoints (`sm:`, `md:`, `lg:`).
- **Glassmorphism Theme**: Utilize smooth borders, micro-borders, and backdrops (`backdrop-blur-md bg-opacity-10`) to provide high-quality aesthetics.
- **Hover Micro-Animations**: Implement transition transitions on all action cards and buttons (`transition-all duration-300 hover:scale-102`).
- **Loading & Error Feedback**: Component cards must display skeleton animations or clear errors during async fetches.

---

## AI Prompting & Engineering Guidelines

- **Context Preservation**: When interacting with code generation engines, maintain context by explicitly passing current schemas and typescript models.
- **No Overwriting Code**: When adding new functions, preserve existing code, comments, and docstrings.
- **Safe API Keys**: Never enter actual API tokens or secret keys in prompts or prompt logs.

---

## Testing Standards

- **Sequential Jest Execution**: Since tests share local file storage resources, unit/integration runs must run sequentially:
  ```bash
  npm test -- --runInBand
  ```
- **Broad Coverage**: New features require unit test coverage checking success flows, validation limits, and failure catches.
- **Insulated Environments**: Mock all external API integrations (e.g. Supabase connection, Resend email send).
- **E2E Validation**: Verify UI pages render correctly under Playwright test pipelines.

---

## Code Review Checklist

Before opening a pull request, ensure the following checklist is completed:
1. [ ] **Build Safe**: Verify TypeScript compilation passes (`npm run build`).
2. [ ] **Lint Clean**: Ensure no warnings remain (`npm run lint`).
3. [ ] **Tests Pass**: Run test runner checking suite safety (`npm test`).
4. [ ] **No Secrets**: Verify no actual keys exist in code blocks or env logs.
5. [ ] **DB Migrations**: SQL files must have RLS guards and indices.
6. [ ] **Documentation**: Ensure related documents are updated.

---

## Anti-Patterns: Things to Avoid

- **No Hardcoded API Keys**: Avoid placing raw API keys anywhere in the repository.
- **No Blockers on Cron threads**: Never let scraper failures block the main process. Wrap integrations in try/catch structures.
- **No Multi-lock Runs**: Do not bypass advisory locking rules.
- **No direct DOM mutations**: Never bypass React virtual DOM processes.
- **No raw SQL injections**: Always use parameterized queries or Supabase client helpers to construct database requests.
