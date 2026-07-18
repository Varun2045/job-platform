# Directory & Folder Structure

## Metadata
- **Title**: Folder Structure Guide - Job Monitor Platform
- **Purpose**: Map out the repository directories, explain the function of each core folder, and define safe cleanup rules.
- **Last Updated**: 2026-07-13
- **Current Version**: v5.0.0
- **Cross-References**: [RULES.md](file:///c:/Users/varun/Downloads/Job%20Monitor/docs/RULES.md), [TECH_STACK.md](file:///c:/Users/varun/Downloads/Job%20Monitor/docs/TECH_STACK.md)

---

## Table of Contents
1. [Repository Directory Tree](#repository-directory-tree)
2. [Folder Purpose & Classification](#folder-purpose--classification)
3. [Component Structure Details](#component-structure-details)
4. [Build & Generated Outputs](#build--generated-outputs)
5. [Safe Cleanup & Maintenance Rules](#safe-cleanup--maintenance-rules)

---

## Repository Directory Tree

```text
job-monitor/ (Root)
├── .env.example               # Template environment configuration variables file
├── .gitignore                 # Files excluded from git tracking
├── .prettierrc                # Prettier code formatting rules config
├── Dockerfile                 # Docker containerization description config
├── LICENSE                    # Software license terms document
├── README.md                  # Main entry point documentation
├── docker-compose.yml         # Containerized services orchestrator config
├── eslint.config.js           # ESLint linting specifications rules
├── jest.config.js             # Jest unit/integration test runner configurations
├── package-lock.json          # Dependency lockfile containing exact packages versions
├── package.json               # Backend Node.js package description configuration
├── tsconfig.json              # TypeScript compilation rules config
├── config/                    # Default weights and system config files [Core] [Never Delete]
├── coverage/                  # Jest test coverage metrics reports [Generated] [Safe to Delete]
├── dist/                      # Backend TypeScript compile output [Generated] [Safe to Delete]
├── docs/                      # Unified project markdown reference documents [Core]
│   ├── PRD.md                 # Product Requirements Document
│   ├── ARCHITECTURE.md        # System architecture guide
│   ├── API.md                 # REST API reference guide
│   ├── DATABASE.md            # Database schemas, RLS, and indices reference
│   ├── FEATURES.md            # Features inventory mapping
│   ├── DESIGN.md              # UI/UX design tokens and aesthetics reference
│   ├── RULES.md               # Coding rules, styles, and guidelines
│   ├── PHASES.md              # Historical milestones and future phases roadmap
│   ├── TECH_STACK.md          # Technical frameworks and packages catalog
│   ├── MEMORY.md              # Project status and bug ledgers
│   ├── FOLDER_STRUCTURE.md    # Directory maps and classifications guide (this file)
│   ├── CHANGELOG.md           # Unified historical release logs
│   ├── ROADMAP.md             # Long-term feature goals and strategies
│   ├── SECURITY.md            # Headers, rates limiters, and response codes
│   ├── CONTRIBUTING.md        # Developer setup and contribution guides
│   ├── CODE_OF_CONDUCT.md     # Community guidelines and behavior rules
│   ├── SUPPORT.md             # Support request guidelines and emails
│   └── archive/               # Consolidated legacy and deprecated reports [Core]
├── frontend/                  # React 19 SPA client application [Core]
├── logs/                      # System logging target directories [Generated] [Safe to Delete]
├── node_modules/              # Node package manager dependencies [Generated]
├── resumes/                   # Local target resume PDF/Word uploads [Optional]
├── src/                       # Backend TypeScript source directory [Core] [Never Delete]
├── storage/                   # Local FileStorage JSON output database [Core/Generated]
└── supabase/                  # Database schema migrations [Core]
```

---

## Folder Purpose & Classification

| Directory Path | Classification | Purpose |
| :--- | :--- | :--- |
| `config/` | **Never Delete** | Contains configuration JSON matrices like default matching weights. |
| `src/` | **Never Delete** | Primary TypeScript business logic files of the backend coordinator. |
| `frontend/` | **Never Delete** | Client web application assets (React 19 SPA). |
| `supabase/` | **Never Delete** | PostgreSQL schema setups and Row Level Security definitions. |
| `docs/` | **Core** | Standard engineering instructions and architecture workflows. |
| `storage/` | **Core / Generated** | Holds crawled database tables locally in FileStorage mode. |
| `logs/` | **Generated** | Outputs daily debug statements. |
| `dist/` & `frontend/dist/` | **Generated** | Target compilation outputs. Automatically generated during building. |
| `resumes/` | **Optional** | Temp storage for candidate profile PDF files. |

---

## Component Structure Details

### 1. Backend (`src/`)
- `cli/`: Commands to monitor, verify health, print stats, and trigger backups from the terminal.
- `companies/`: Holds company-specific ATS scrapers (e.g. Google, Microsoft, Amazon) and general fallbacks.
- `core/`: Coordinates similarity scoring (`ResumeMatcher`), dynamic opportunity rating (`OpportunityEngine`), auto-applying (`AutoApplyEngine`), and server routing endpoints (`server.ts`).
- `storage/`: Holds implementation files for `FileStorage.ts` and `SupabaseStorage.ts`.

### 2. Frontend (`frontend/src/`)
- `components/`: Core components (e.g. `Sidebar.tsx`, `ErrorBoundary.tsx`) imported across modules.
- `features/`: Divided by functional context:
  - `tracker/`: Kanban board columns tracking status details.
  - `explorer/`: Interactive job lists with contact recommendations.
  - `copilot/`: Skill Gap lists, syllabus generators, and interview simulators.
  - `referrals/`: Referrals CRM boards, CSV importer actions, and EML builders.
  - `automation/`: Auto-apply control queues.

---

## Build & Generated Outputs

- **TypeScript Compile Target (`dist/`)**: Cleaned and recreated on every `npm run build` run.
- **Vite Build Target (`frontend/dist/`)**: Holds optimized static HTML, CSS, and JS. Recreated on client build tasks.
- **Coverage Reports (`coverage/`)**: Contains Jest HTML reports measuring test scope. Safe to remove at any time.

---

## Safe Cleanup & Maintenance Rules

1. **Do Not Delete `storage/*.json`**: Deleting files like `companies_state.json` or `jobs.json` will wipe out the local database. Always trigger backup exports before cleaning up.
2. **Deleting `dist/` is Safe**: Simply run `npm run build` to recompile the backend.
3. **Deleting `node_modules/` is Safe**: Run `npm install` (or `npm install --prefix frontend` for client dependencies) to restore package modules.
4. **Log Clearance**: Files inside `logs/` can be removed safely when the server is idle.
