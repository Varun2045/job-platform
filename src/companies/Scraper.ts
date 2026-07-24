import { HttpClient } from '../core/HttpClient.js';

export interface CompanyConfig {
  id: string;
  name: string;
  enabled: boolean;
  priority: number;
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

export interface RawJob {
  company: string;
  id: string;
  title: string;
  location: string;
  country?: string;
  experience?: string;
  employmentType?: string;
  url: string;
  datePosted?: string;
  team?: string;
  source: string;
  description?: string;
  isRemote?: boolean;
  salary?: string;
  // Extra dynamic metadata
  raw?: any;
}

export interface Job {
  company: string;
  id: string;
  title: string;
  location: string;
  country: string;
  experience: string;
  employmentType: string;
  url: string;
  datePosted: string;
  team: string;
  source: string;
  isRemote: boolean;
  salary: string;
  description: string;
  jobHash: string; // sha256(company + "_" + id)
  // Production-grade classification metadata (Immutable Job Data)
  classificationVersion?: string;
  configVersionsMap?: Record<string, string>;
  experienceLevel?: string;
  experienceReason?: string;
  experienceSource?: string;
  primaryDepartment?: string;
  secondaryDepartments?: string[];
  tags?: string[];
  qualityFlags?: string[];
  confidenceBreakdown?: {
    overall: number;
    experience: number;
    department: number;
    location: number;
    tags: number;
  };
  freshnessScore?: number;
  classificationHistory?: Array<{
    classificationVersion: string;
    timestamp: string;
    level: string;
    primaryDepartment: string;
    confidence: number;
  }>;
  // User-derived dynamic match metadata
  scoreExplanation?: {
    skills: number;
    experience: number;
    department: number;
    location: number;
    company: number;
    resume: number;
    title: number;
    total: number;
  };
  recommendationBadges?: string[];
  whyRecommended?: string[];
  explanation?: {
    overallScore: number;
    matchedSkills: string[];
    missingSkills: string[];
    strengths: string[];
    weaknesses: string[];
  };
  // Metadata-driven precomputed search fields
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  requiredSkills?: string[];
  preferredSkills?: string[];
  locationHierarchy?: {
    country: string;
    state: string;
    city: string;
  };
}

export interface Application {
  jobHash: string;
  company: string;
  jobId: string;
  status: 'New' | 'Saved' | 'Applied' | 'OA Scheduled' | 'OA Completed' | 'Interview' | 'Offer' | 'Rejected' | 'Closed';
  appliedDate?: string | null;
  resumeUsed?: string | null;
  notes?: string | null;
  lastUpdated: string;
  title?: string;
  location?: string;
  employmentType?: string;
  isRemote?: boolean;
  salary?: string;
}

export interface PluginCapabilities {
  supportsPagination: boolean;
  supportsIncrementalSync: boolean;
  supportsJobDescriptions: boolean;
  supportsRemoteFiltering: boolean;
}

export interface PluginMetadata {
  id: string;
  version: string;
  ats: string;
  author: string;
}

export interface ScraperPlugin {
  metadata: PluginMetadata;
  capabilities: PluginCapabilities;
  supports(company: CompanyConfig): boolean;
  discover(company: CompanyConfig, httpClient: HttpClient): Promise<RawJob[]>;
  enrich(rawJob: RawJob, httpClient: HttpClient): Promise<RawJob>;
  normalize(rawJob: RawJob, company: CompanyConfig): Job;
}
