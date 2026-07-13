import { CompanyConfig, Job, Application } from '../companies/Scraper.js';

export interface StorageProvider {
  /**
   * Initializes the storage provider (e.g. loads fallback JSONs or checks DB connection).
   */
  initialize(): Promise<void>;

  /**
   * Fetches a company config by ID.
   */
  getCompanyConfig(id: string): Promise<CompanyConfig | null>;

  /**
   * Fetches all enabled companies.
   */
  getEnabledCompanies(): Promise<CompanyConfig[]>;

  /**
   * Fetches all companies in the registry (enabled and disabled).
   */
  getAllCompanies(): Promise<CompanyConfig[]>;

  /**
   * Saves or updates a company configuration.
   */
  saveCompanyConfig(company: CompanyConfig): Promise<void>;

  /**
   * Updates company metrics and scrape states after a scraping attempt.
   */
  updateCompanyScrapeState(
    id: string,
    state: {
      last_successful_scrape?: string | null;
      last_failed_scrape?: string | null;
      last_scraper_used?: string | null;
      detected_ats?: string | null;
      detected_ats_at?: string | null;
      api_suspended_until?: string | null;
      consecutive_failures?: number;
      enabled?: boolean;
      avg_response_time_ms?: number;
      total_scrapes?: number;
      total_failures?: number;
      last_seen_timestamp?: string | null;
      interval_minutes?: number;
      priority?: number;
    }
  ): Promise<void>;

  /**
   * Permanently removes a company config and its job data.
   */
  deleteCompanyConfig(id: string): Promise<void>;

  /**
   * Retrieves previous job listings saved for a company.
   */
  getCompanyJobs(companyId: string): Promise<Job[]>;

  /**
   * Overwrites the stored job listings for a company.
   */
  saveCompanyJobs(companyId: string, jobs: Job[]): Promise<void>;

  /**
   * Checks if a job has already generated an alert notification.
   */
  isJobNotified(jobHash: string): Promise<boolean>;

  /**
   * Saves a job hash into the notifications history table.
   */
  saveJobNotified(jobHash: string): Promise<void>;

  /**
   * Retrieves a cached score for a job against a specific resume profile.
   */
  getCachedScore(jobHash: string, resumeProfile: string, matcherVersion: string, userId?: string): Promise<number | null>;

  /**
   * Caches a calculated resume match score.
   */
  saveCachedScore(jobHash: string, resumeProfile: string, score: number, matcherVersion: string, userId?: string): Promise<void>;

  /**
   * Saves run execution metrics.
   */
  saveRunStats(metrics: Record<string, any>): Promise<void>;

  /**
   * Fetches all job application tracking items.
   */
  getApplications(userId?: string): Promise<Application[]>;

  /**
   * Saves or updates a job application status tracking record.
   */
  saveApplication(app: Application, userId?: string): Promise<void>;

  /**
   * Retrieves stored analysis for a job hash.
   */
  getJobAnalysis(jobHash: string): Promise<JobAnalysis | null>;

  /**
   * Saves or updates a job analysis.
   */
  saveJobAnalysis(analysis: JobAnalysis): Promise<void>;

  /**
   * Retrieves extended preferences settings.
   */
  getExtendedSettings(userId?: string): Promise<ExtendedSettings | null>;

  /**
   * Saves extended preferences settings.
   */
  saveExtendedSettings(settings: ExtendedSettings, userId?: string): Promise<void>;

  // Profile Management
  getProfile(userId: string): Promise<any | null>;
  saveProfile(userId: string, profile: any): Promise<void>;
  getAllProfiles(): Promise<any[]>;

  // User-isolated Resumes
  getUserResumes(userId: string): Promise<any[]>;
  saveUserResume(userId: string, profileName: string, content: string, pdfData?: string): Promise<void>;
  deleteUserResume(userId: string, profileName: string): Promise<void>;

  // Saved Searches
  getSavedSearches(userId: string): Promise<any[]>;
  saveSavedSearch(userId: string, name: string, filters: any): Promise<void>;
  deleteSavedSearch(userId: string, id: string): Promise<void>;

  // Watchlists
  getWatchlists(userId: string): Promise<any[]>;
  saveWatchlist(userId: string, name: string, filters: any): Promise<void>;
  deleteWatchlist(userId: string, id: string): Promise<void>;

  // In-App User Notifications
  getUserNotifications(userId: string): Promise<any[]>;
  saveUserNotification(userId: string, title: string, message: string, priority?: string): Promise<void>;
  markNotificationRead(userId: string, id: string): Promise<void>;
  clearUserNotifications(userId: string): Promise<void>;

  // Audit Logging
  getAuditLogs(userId?: string): Promise<any[]>;
  saveAuditLog(userId: string | null, action: string, details: any, ipAddress?: string): Promise<void>;

  // Feature Flags
  getFeatureFlags(): Promise<any[]>;
  getFeatureFlag(key: string): Promise<boolean>;
  setFeatureFlag(key: string, enabled: boolean): Promise<void>;

  // Copilot Recommendations
  getCopilotRecommendations(userId: string): Promise<any[]>;
  saveCopilotRecommendations(userId: string, recommendations: any[]): Promise<void>;

  // Learning Roadmaps (Skill Gap Engine)
  getLearningRoadmap(userId: string): Promise<any | null>;
  saveLearningRoadmap(userId: string, roadmap: any): Promise<void>;

  // Mock Interview Sessions
  getInterviewSessions(userId: string): Promise<any[]>;
  saveInterviewSession(userId: string, session: any): Promise<void>;

  // Career Roadmaps
  getCareerRoadmap(userId: string): Promise<any | null>;
  saveCareerRoadmap(userId: string, roadmap: any): Promise<void>;

  // Daily Briefs
  getDailyBrief(userId: string): Promise<any | null>;
  saveDailyBrief(userId: string, brief: any): Promise<void>;

  // Resume Profiles
  getResumeProfiles(userId: string): Promise<any[]>;
  saveResumeProfile(userId: string, profileName: string, content: string, pdfData?: string): Promise<void>;
  deleteResumeProfile(userId: string, id: string): Promise<void>;

  // Application Queue
  getApplicationQueue(userId: string): Promise<any[]>;
  saveApplicationQueueItem(userId: string, item: any): Promise<void>;
  deleteApplicationQueueItem(userId: string, id: string): Promise<void>;

  // Recruiters CRM
  getRecruiters(userId: string): Promise<any[]>;
  saveRecruiter(userId: string, recruiter: any): Promise<void>;
  deleteRecruiter(userId: string, id: string): Promise<void>;

  // Referrals CRM
  getReferrals(userId: string): Promise<ReferralContact[]>;
  saveReferral(userId: string, referral: ReferralContact): Promise<void>;
  deleteReferral(userId: string, id: string): Promise<void>;
  updateReferralStatus(userId: string, id: string, status: string): Promise<void>;
  getReferralsByCategory(userId: string, category: string): Promise<ReferralContact[]>;
  getReferralAnalytics(userId: string): Promise<ReferralAnalytics>;

  // Calendar Events
  getCalendarEvents(userId: string): Promise<any[]>;
  saveCalendarEvent(userId: string, event: any): Promise<void>;
  deleteCalendarEvent(userId: string, id: string): Promise<void>;

  // Exports
  getExports(userId: string): Promise<any[]>;
  saveExport(userId: string, exportItem: any): Promise<void>;
  deleteExport(userId: string, id: string): Promise<void>;
}

export interface JobAnalysis {
  jobHash: string;
  summary: string;
  whyMatches: string;
  missingSkills: string[];
  resumeImprovements: string[];
  difficulty: string;
  prepTopics: string[];
  lastUpdated?: string;
}

export interface ExtendedSettings {
  preferredCompanies: string[];
  preferredTechnologies: string[];
  preferredCities: string[];
  remotePreference: string;
  notificationFrequency: string;
  digestFormat: string;
  google_refresh_token?: string;
}

export interface ReferralContact {
  id: string;
  userId: string;
  name: string;
  role: string;
  category: 'Recruiter' | 'Hiring Manager' | 'Engineering Manager' | 'University Alumni' | 'Employee' | 'Talent Acquisition' | 'HR';
  company: string;
  linkedInUrl?: string;
  email?: string;
  location?: string;
  notes?: string;
  tags: string[];
  connectionStatus: 'Potential Contact' | 'LinkedIn Opened' | 'Connection Sent' | 'Connected' | 'Referral Requested' | 'Referral Submitted' | 'Applied' | 'Interview' | 'Offer';
  referralStatus: string;
  lastContacted?: string;
  nextFollowUp?: string;
  reminder?: string;
  outcome?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReferralAnalytics {
  totalContacts: number;
  connectionsSent: number;
  acceptedConnections: number;
  referralRequests: number;
  referralsReceived: number;
  interviewsViaReferrals: number;
  offersViaReferrals: number;
  successRate: number;
  topCompanies: Array<{ company: string; count: number }>;
  contactsByCategory: Record<string, number>;
}
