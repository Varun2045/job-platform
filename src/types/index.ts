/**
 * Shared TypeScript Types
 * 
 * Centralized type definitions for use across the application
 */

// Express Request/Response extensions
export interface AuthenticatedRequest extends Express.Request {
  user: {
    id: string;
    email: string;
    role: 'Admin' | 'User' | 'Viewer';
    name?: string;
  };
}

// API Request/Response types
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
  employmentType?: string;
  isRemote?: boolean;
}

// Database Entity types
export interface User {
  id: string;
  email: string;
  role: 'Admin' | 'User' | 'Viewer';
  name?: string;
  photoUrl?: string;
  preferredRoles?: string[];
  preferredCities?: string[];
  experienceLevel?: string;
  techStack?: string[];
  linkedin?: string;
  github?: string;
  portfolio?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Company {
  id: string;
  name: string;
  enabled: boolean;
  priority: 1 | 2 | 3;
  interval_minutes: number;
  last_successful_scrape?: string | null;
  last_failed_scrape?: string | null;
  last_scraper_used?: string | null;
  detected_ats?: string | null;
  detected_ats_at?: string | null;
  api_endpoint?: string | null;
  api_suspended_until?: string | null;
  consecutive_failures?: number;
  resume_profiles: string[];
  avg_response_time_ms: number;
  cron_expression?: string | null;
  total_scrapes: number;
  total_failures: number;
  last_seen_timestamp?: string | null;
  max_jobs_to_fetch?: number | null;
  max_pages?: number | null;
  scrape_timeout?: number | null;
  retry_count?: number | null;
  preferred_scraper?: string | null;
}

export interface ScoredJob {
  job: Job;
  score: number;
  opportunityScore: number;
  weightedScore?: number;
}

export interface Job {
  id: string;
  company: string;
  title: string;
  location: string;
  country?: string;
  experience?: string;
  employmentType?: string;
  url: string;
  datePosted?: string | Date;
  team?: string;
  source?: string;
  description?: string;
  isRemote?: boolean;
  salary?: string;
  skills?: string[];
  tags?: string[];
  jobHash?: string;
  score?: number;
  opportunityScore?: number;
  weightedScore?: number;
}

export interface Application {
  jobHash: string;
  company: string;
  jobId: string;
  status: 'New' | 'Saved' | 'Applied' | 'OA Scheduled' | 'OA Completed' | 'Interview' | 'Offer' | 'Rejected' | 'Closed';
  appliedDate?: Date;
  resumeUsed?: string;
  notes?: string;
  lastUpdated: Date;
}

// Scraper types
export interface ScraperConfig {
  id: string;
  name: string;
  enabled: boolean;
  priority: 1 | 2 | 3;
  intervalMinutes: number;
  resumeProfiles: string[];
  maxJobsToFetch?: number;
  maxPages?: number;
  scrapeTimeout?: number;
  retryCount?: number;
  preferredScraper?: string;
}

export interface ScraperResult {
  success: boolean;
  jobsFound: number;
  durationMs: number;
  error?: string;
  jobs?: Job[];
}

// AI Service types
export interface AIRequest {
  prompt: string;
  context?: Record<string, unknown>;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface AIResponse {
  content: string;
  model: string;
  tokensUsed: number;
  finishReason?: string;
}

// Error types
export interface AppError extends Error {
  code: string;
  statusCode: number;
  details?: Record<string, unknown>;
}

export function isAppError(error: unknown): error is AppError {
  return (
    error instanceof Error &&
    'code' in error &&
    'statusCode' in error
  );
}

// Result types for better error handling
export type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E };

export function success<T>(data: T): Result<T> {
  return { success: true, data };
}

export function failure<E>(error: E): Result<never, E> {
  return { success: false, error };
}