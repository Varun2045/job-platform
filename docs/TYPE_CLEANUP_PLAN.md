# TypeScript Type Cleanup Plan

## Overview
The codebase currently contains 501 instances of `: any` types. This document outlines a systematic approach to replace them with proper TypeScript types for better type safety and developer experience.

## Current State
- **Total `any` types**: 501 instances
- **Impact**: Reduced type safety, poorer IDE support, potential runtime errors
- **Priority**: Medium (code quality improvement, not security critical)

## Common `any` Usage Patterns

### 1. Express Request/Response Objects
```typescript
// Current
(req: any, res: any) => { ... }

// Better
(req: express.Request, res: express.Response) => { ... }
```

### 2. Database Query Results
```typescript
// Current
const result: any = await storage.getData();

// Better
interface DataResult {
  id: string;
  name: string;
  // ...
}
const result: DataResult = await storage.getData();
```

### 3. API Request Bodies
```typescript
// Current
const { name, email } = req.body as any;

// Better
interface CreateProfileRequest {
  name: string;
  email: string;
}
const { name, email } = req.body as CreateProfileRequest;
```

### 4. Configuration Objects
```typescript
// Current
const config: any = { ... };

// Better
interface ScraperConfig {
  id: string;
  name: string;
  enabled: boolean;
  // ...
}
const config: ScraperConfig = { ... };
```

### 5. Error Handling
```typescript
// Current
catch (err: any) { ... }

// Better
catch (err: Error | unknown) { 
  if (err instanceof Error) { ... }
}
```

## Type Definition Strategy

### Create Shared Type Modules

#### 1. `src/types/api.ts` - API Request/Response Types
```typescript
import { Request } from 'express';

export interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
    role: string;
    name?: string;
  };
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface SearchFilters {
  query?: string;
  company?: string;
  location?: string;
  experience?: string;
  // ...
}
```

#### 2. `src/types/database.ts` - Database Entity Types
```typescript
export interface User {
  id: string;
  email: string;
  role: 'Admin' | 'User' | 'Viewer';
  name?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Company {
  id: string;
  name: string;
  enabled: boolean;
  priority: number;
  intervalMinutes: number;
  // ...
}

export interface Job {
  id: string;
  company: string;
  title: string;
  location: string;
  // ...
}
```

#### 3. `src/types/scraper.ts` - Scraper-Specific Types
```typescript
export interface ScraperConfig {
  id: string;
  name: string;
  enabled: boolean;
  priority: 1 | 2 | 3;
  intervalMinutes: number;
  resumeProfiles: string[];
  maxJobsToFetch?: number;
  preferredScraper?: string;
}

export interface ScraperResult {
  success: boolean;
  jobsFound: number;
  durationMs: number;
  error?: string;
}
```

#### 4. `src/types/ai.ts` - AI Service Types
```typescript
export interface AIRequest {
  prompt: string;
  context?: Record<string, any>;
  model?: string;
}

export interface AIResponse {
  content: string;
  model: string;
  tokensUsed: number;
}
```

## Cleanup Phases

### Phase 1: Critical Type Safety (High Impact)
**Files to prioritize:**
1. `src/server.ts` - Main server logic
2. `src/storage/*.ts` - Database operations
3. `src/routes/*.ts` - API routes
4. `src/middleware/*.ts` - Middleware

**Target:** Replace `any` in authentication, authorization, and database operations

### Phase 2: Business Logic Types (Medium Impact)
**Files to prioritize:**
1. `src/core/*.ts` - Core business logic
2. `src/companies/*.ts` - Company scrapers
3. `src/notifications/*.ts` - Notification services

**Target:** Replace `any` in core business operations

### Phase 3: Utility & Helper Types (Low Impact)
**Files to prioritize:**
1. `src/utils/*.ts` - Utility functions
2. `src/cli/*.ts` - CLI tools
3. `src/tests/*.ts` - Test files

**Target:** Replace `any` in utilities and tests

## Specific File Cleanup Plan

### src/server.ts
**Current `any` count:** ~50 instances

**Priority fixes:**
1. Express request/response types
2. Request body types
3. Error handling types
4. Configuration types

### src/storage/FileStorage.ts
**Current `any` count:** ~30 instances

**Priority fixes:**
1. Method parameter types
2. Return types
3. Error handling

### src/storage/SupabaseStorage.ts
**Current `any` count:** ~40 instances

**Priority fixes:**
1. Query result types
2. Parameter types
3. Response types

### src/core/Telemetry.ts
**Current `any` count:** ~5 instances

**Priority fixes:**
1. Parameter types in calculateScraperStats
2. Return types

### src/core/HttpClient.ts
**Current `any` count:** ~10 instances

**Priority fixes:**
1. Response types
2. Error types

## Type Safety Best Practices

### 1. Use `unknown` Instead of `any`
```typescript
// Bad
function processData(data: any) { ... }

// Better
function processData(data: unknown) {
  if (typeof data === 'string') { ... }
  // ...
}
```

### 2. Create Type Guards
```typescript
function isJob(data: unknown): data is Job {
  return (
    typeof data === 'object' &&
    data !== null &&
    'id' in data &&
    'title' in data
  );
}
```

### 3. Use Discriminated Unions
```typescript
type Result<T, E> = 
  | { success: true; data: T }
  | { success: false; error: E };
```

### 4. Leverage TypeScript Utility Types
```typescript
// Partial
type PartialConfig = Partial<ScraperConfig>;

// Pick
type CompanyId = Pick<Company, 'id'>;

// Omit
type CreateCompanyDto = Omit<Company, 'id' | 'createdAt'>;

// Record
type CompanyMap = Record<string, Company>;
```

## Implementation Strategy

### Step 1: Create Type Definitions
1. Create `src/types/` directory
2. Define shared types in modules
3. Export types for reuse

### Step 2: Incremental Replacement
1. Start with one file at a time
2. Replace `any` with proper types
3. Run TypeScript compiler to check
4. Fix any type errors
5. Test the functionality

### Step 3: Enable Strict Mode
1. Enable `strict: true` in tsconfig.json
2. Enable `noImplicitAny: true`
3. Fix remaining type issues
4. Ensure no new `any` types are added

## Tooling

### ESLint Rules
Add to `.eslintrc.js`:
```javascript
{
  rules: {
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unsafe-assignment': 'warn',
    '@typescript-eslint/no-unsafe-member-access': 'warn',
    '@typescript-eslint/no-unsafe-call': 'warn',
    '@typescript-eslint/no-unsafe-return': 'warn',
  }
}
```

### TypeScript Compiler Options
Update `tsconfig.json`:
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true
  }
}
```

## Testing Strategy

### Type Testing
1. Ensure TypeScript compilation succeeds
2. Run type checking with `tsc --noEmit`
3. Use IDE type checking features

### Runtime Testing
1. Run existing test suite
2. Add integration tests for typed interfaces
3. Verify no runtime type errors

## Estimated Effort

- Phase 1 (Critical): 8-12 hours
- Phase 2 (Business Logic): 12-16 hours
- Phase 3 (Utilities): 4-6 hours
- Testing & Validation: 4-6 hours

**Total Estimated Time: 28-40 hours**

## Risks & Mitigations

### Risk 1: Breaking Changes
- **Mitigation**: Start with non-critical files
- **Mitigation**: Use incremental approach
- **Mitigation**: Comprehensive testing

### Risk 2: Type Definition Complexity
- **Mitigation**: Start with simple types
- **Mitigation**: Reuse existing types
- **Mitigation**: Document type decisions

### Risk 3: Development Time
- **Mitigation**: Prioritize high-impact areas
- **Mitigation**: Use automated tools where possible
- **Mitigation**: Accept partial completion

## Success Criteria

1. Reduced `any` type usage by 80% (from 501 to ~100)
2. All critical paths (auth, database) have proper types
3. TypeScript strict mode enabled
4. No runtime type errors
5. Improved IDE autocomplete and type hints

## Next Steps

1. Review this plan with the team
2. Get approval for the approach
3. Create type definition modules
4. Start with Phase 1 (Critical files)
5. Monitor progress and adjust as needed

## Notes

- This is a long-term improvement, not urgent
- Can be done incrementally alongside feature work
- Focus on preventing new `any` types from being added
- Consider using TypeScript ESLint rules to enforce type safety
- Document type decisions for future maintainers
