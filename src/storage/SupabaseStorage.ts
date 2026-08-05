import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { StorageProvider, Offer, FollowUp, NotificationPreference, VisaSponsor, SavedExtensionJob } from './StorageProvider.js';
import { CompanyConfig, Job, Application } from '../companies/Scraper.js';
import { config } from '../config/config.js';
import { Logger } from '../core/Logger.js';
import fs from 'fs';
import path from 'path';

export class SupabaseStorage implements StorageProvider {
  private client!: SupabaseClient;

  public async initialize(): Promise<void> {
    if (!config.supabaseUrl || !config.supabaseServiceKey) {
      throw new Error('Supabase credentials missing. Cannot initialize SupabaseStorage.');
    }

    this.client = createClient(config.supabaseUrl, config.supabaseServiceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      realtime: {
        transport: (typeof globalThis.WebSocket !== 'undefined'
          ? globalThis.WebSocket
          : class WebSocket {
              constructor() {}
              addEventListener() {}
              removeEventListener() {}
              send() {}
              close() {}
            }) as any,
      },
      global: {
        headers: { 'x-client-info': 'job-monitor-production' },
        fetch: (url: any, options: any) => {
          return fetch(url, {
            ...options,
            signal: AbortSignal.timeout(15000),
          });
        },
      },
    });

    // 1. Connection retry logic
    let attempts = 3;
    let success = false;
    let lastError: any = null;

    while (attempts > 0) {
      try {
        // Run a simple query to verify connection
        const { error } = await this.client.from('job_monitor_companies').select('id').limit(1);
        if (error) throw error;
        success = true;
        break;
      } catch (err: any) {
        lastError = err;
        attempts--;
        if (attempts > 0) {
          Logger.warn(`Supabase connection failed. Retrying in 2 seconds... (Attempts remaining: ${attempts})`, err);
          await new Promise((r) => setTimeout(r, 2000));
        }
      }
    }

    if (!success) {
      throw new Error(`Failed to connect to Supabase after retries: ${lastError?.message || lastError}`);
    }

    // 2. Migration checks
    const requiredTables = [
      'job_monitor_companies',
      'job_monitor_state',
      'job_monitor_notifications',
      'job_monitor_stats',
      'job_monitor_scores',
      'job_monitor_analyses',
      'job_monitor_extended_settings',
      'job_monitor_cover_letters',
    ];

    for (const table of requiredTables) {
      try {
        const { error } = await this.client.from(table).select('*').limit(0);
        if (error) {
          if (error.code === '42P01' || (error.message && error.message.includes('does not exist'))) {
            throw new Error(
              `Migration check failed: Table "${table}" does not exist in Supabase. Please apply migrations (001_setup.sql).`,
            );
          }
          throw error;
        }
      } catch (err: any) {
        Logger.critical(`Migration check failed for table "${table}"`, err);
        throw err;
      }
    }
    Logger.info('Supabase migration check: All required tables exist.');

    // Self-seeding & sync check: if database has fewer companies than config/companies.json, sync all companies
    try {
      const seedPath = path.join(process.cwd(), 'config', 'companies.json');
      if (fs.existsSync(seedPath)) {
        const raw = fs.readFileSync(seedPath, 'utf-8');
        const seedConfigs = JSON.parse(raw) as CompanyConfig[];
        const validIds = new Set(seedConfigs.map((c) => c.id));

        const { error, count } = await this.client
          .from('job_monitor_companies')
          .select('id', { count: 'exact', head: true });

        if (error) {
          throw error;
        }

        if (count === null || count === 0 || count < seedConfigs.length) {
          Logger.info(`Syncing ${seedConfigs.length} companies from config/companies.json into database (current DB count: ${count ?? 0})...`);
        const dbRows = seedConfigs.map((c) => ({
          id: c.id,
          name: c.name,
          enabled: c.enabled,
          priority: c.priority,
          interval_minutes: c.interval_minutes,
          api_endpoint: c.api_endpoint || null,
          detected_ats: c.detected_ats || null,
          resume_profiles: c.resume_profiles || [],
          consecutive_failures: c.consecutive_failures || 0,
          max_jobs_to_fetch: c.max_jobs_to_fetch ?? null,
          max_pages: c.max_pages ?? null,
          scrape_timeout: c.scrape_timeout ?? null,
          retry_count: c.retry_count ?? null,
          preferred_scraper: c.preferred_scraper ?? null,
        }));

        const { error: upsertError } = await this.client
          .from('job_monitor_companies')
          .upsert(dbRows, { onConflict: 'id' });

        if (upsertError) {
          Logger.error('Failed to sync companies in database', upsertError);
        } else {
          Logger.info(`Successfully synced ${dbRows.length} companies into database.`);
        }

        // Clean up any obsolete entries not present in config/companies.json
        const { data: allDbCompanies } = await this.client
          .from('job_monitor_companies')
          .select('id');

        if (allDbCompanies) {
          const obsoleteIds = allDbCompanies
            .map((c) => c.id)
            .filter((id) => !validIds.has(id));

          if (obsoleteIds.length > 0) {
            Logger.info(`Pruning ${obsoleteIds.length} obsolete company entries from database: ${obsoleteIds.join(', ')}`);
            await this.client.from('job_monitor_companies').delete().in('id', obsoleteIds);
          }
        }
      }
    }
    } catch (e: any) {
      Logger.error('Supabase initialization & seeding failed', e);
      throw e;
    }
  }

  public async getCompanyConfig(id: string): Promise<CompanyConfig | null> {
    const { data, error } = await this.client.from('job_monitor_companies').select('*').eq('id', id).single();

    if (error) {
      if (error.code === 'PGRST116') return null; // not found
      Logger.error(`Error fetching company config for ${id}`, error);
      return null;
    }

    return data as CompanyConfig;
  }

  public async getEnabledCompanies(): Promise<CompanyConfig[]> {
    const { data, error } = await this.client.from('job_monitor_companies').select('*').eq('enabled', true);

    if (error) {
      Logger.error('Error fetching enabled companies', error);
      return [];
    }

    return (data || []) as CompanyConfig[];
  }

  public async getAllCompanies(): Promise<CompanyConfig[]> {
    const { data, error } = await this.client.from('job_monitor_companies').select('*');

    if (error) {
      Logger.error('Error fetching all companies', error);
      return [];
    }

    return (data || []) as CompanyConfig[];
  }

  public async saveCompanyConfig(company: CompanyConfig): Promise<void> {
    const payload = {
      id: company.id,
      name: company.name,
      enabled: company.enabled,
      priority: company.priority,
      interval_minutes: company.interval_minutes,
      api_endpoint: company.api_endpoint || null,
      detected_ats: company.detected_ats || null,
      resume_profiles: company.resume_profiles || [],
      consecutive_failures: company.consecutive_failures || 0,
      max_jobs_to_fetch: company.max_jobs_to_fetch ?? null,
      max_pages: company.max_pages ?? null,
      scrape_timeout: company.scrape_timeout ?? null,
      retry_count: company.retry_count ?? null,
      preferred_scraper: company.preferred_scraper ?? null,
    };

    const { error } = await this.client.from('job_monitor_companies').upsert(payload, { onConflict: 'id' });

    if (error) {
      Logger.error(`Error saving company config for ${company.id} to Supabase`, error);
      throw error;
    }
  }

  public async updateCompanyScrapeState(id: string, state: Partial<CompanyConfig>): Promise<void> {
    const { error } = await this.client.from('job_monitor_companies').update(state).eq('id', id);

    if (error) {
      Logger.error(`Error updating company scrape state for ${id}`, error);
    }
  }

  public async deleteCompanyConfig(id: string): Promise<void> {
    // Remove company jobs first
    await this.client.from('job_monitor_state').delete().eq('company_id', id);
    // Remove company config
    const { error } = await this.client.from('job_monitor_companies').delete().eq('id', id);
    if (error) {
      Logger.error(`Error deleting company config for ${id}`, error);
    }
  }

  public async getCompanyJobs(companyId: string): Promise<Job[]> {
    const { data, error } = await this.client
      .from('job_monitor_state')
      .select('jobs_data')
      .eq('company_id', companyId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return []; // no state record yet
      Logger.error(`Error fetching jobs state for ${companyId}`, error);
      return [];
    }

    return (data?.jobs_data || []) as Job[];
  }

  public async getAllJobs(): Promise<Job[]> {
    const { data, error } = await this.client
      .from('job_monitor_state')
      .select('jobs_data');

    if (error) {
      Logger.error('Error fetching all jobs state', error);
      return [];
    }

    const allJobs: Job[] = [];
    for (const row of data || []) {
      if (row.jobs_data) {
        allJobs.push(...(row.jobs_data as Job[]));
      }
    }
    return allJobs;
  }

  /**
   * Get jobs with database-level filtering for better performance
   * This reduces the amount of data loaded from the database
   */
  public async getFilteredJobs(companyIds?: string[]): Promise<Job[]> {
    let query = this.client
      .from('job_monitor_state')
      .select('jobs_data, company_id');

    // Filter by specific companies if provided
    if (companyIds && companyIds.length > 0) {
      query = query.in('company_id', companyIds);
    }

    const { data, error } = await query;

    if (error) {
      Logger.error('Error fetching filtered jobs state', error);
      return [];
    }

    const filteredJobs: Job[] = [];
    for (const row of data || []) {
      if (row.jobs_data) {
        filteredJobs.push(...(row.jobs_data as Job[]));
      }
    }
    return filteredJobs;
  }

  /**
   * Get jobs with pagination support
   * @param page Page number (0-indexed)
   * @param limit Number of companies to fetch per page
   */
  public async getJobsPaginated(page: number = 0, limit: number = 50): Promise<Job[]> {
    const { data, error } = await this.client
      .from('job_monitor_state')
      .select('jobs_data')
      .order('updated_at', { ascending: false })
      .range(page * limit, (page + 1) * limit - 1);

    if (error) {
      Logger.error('Error fetching paginated jobs state', error);
      return [];
    }

    const paginatedJobs: Job[] = [];
    for (const row of data || []) {
      if (row.jobs_data) {
        paginatedJobs.push(...(row.jobs_data as Job[]));
      }
    }
    return paginatedJobs;
  }

  /**
   * Get jobs with both filtering and pagination
   */
  public async getFilteredJobsPaginated(
    companyIds?: string[],
    page: number = 0,
    limit: number = 50
  ): Promise<Job[]> {
    let query = this.client
      .from('job_monitor_state')
      .select('jobs_data')
      .order('updated_at', { ascending: false });

    // Filter by specific companies if provided
    if (companyIds && companyIds.length > 0) {
      query = query.in('company_id', companyIds);
    }

    query = query.range(page * limit, (page + 1) * limit - 1);

    const { data, error } = await query;

    if (error) {
      Logger.error('Error fetching filtered paginated jobs state', error);
      return [];
    }

    const filteredPaginatedJobs: Job[] = [];
    for (const row of data || []) {
      if (row.jobs_data) {
        filteredPaginatedJobs.push(...(row.jobs_data as Job[]));
      }
    }
    return filteredPaginatedJobs;
  }

  public async saveCompanyJobs(companyId: string, jobs: Job[]): Promise<void> {
    // Use upsert to overwrite or create state
    const { error } = await this.client.from('job_monitor_state').upsert({
      company_id: companyId,
      jobs_data: jobs,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      Logger.error(`Error saving jobs state for ${companyId}`, error);
    }
  }

  public async isJobNotified(jobHash: string): Promise<boolean> {
    const { error, count } = await this.client
      .from('job_monitor_notifications')
      .select('job_hash', { count: 'exact', head: true })
      .eq('job_hash', jobHash);

    if (error) {
      Logger.error(`Error checking notification status for ${jobHash}`, error);
      return false;
    }

    return (count ?? 0) > 0;
  }

  public async saveJobNotified(jobHash: string): Promise<void> {
    const { error } = await this.client.from('job_monitor_notifications').insert({
      job_hash: jobHash,
      notified_at: new Date().toISOString(),
    });

    if (error) {
      // 23505 is standard postgres unique violation code (already exists)
      if ((error as any).code !== '23505') {
        Logger.error(`Error saving notified hash for ${jobHash}`, error);
      }
    }
  }

  public async getCachedScore(
    jobHash: string,
    resumeProfile: string,
    matcherVersion: string,
    userId?: string,
  ): Promise<number | null> {
    let query = this.client
      .from('job_monitor_scores')
      .select('score')
      .eq('job_hash', jobHash)
      .eq('resume_profile', resumeProfile)
      .eq('matcher_version', matcherVersion);

    if (userId) {
      query = query.eq('user_id', userId);
    } else {
      query = query.is('user_id', null);
    }

    const { data, error } = await query.single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      Logger.error(`Error checking cached score for ${jobHash}`, error);
      return null;
    }

    return data?.score ?? null;
  }

  public async saveCachedScore(
    jobHash: string,
    resumeProfile: string,
    score: number,
    matcherVersion: string,
    userId?: string,
  ): Promise<void> {
    const payload: any = {
      job_hash: jobHash,
      resume_profile: resumeProfile,
      score,
      matcher_version: matcherVersion,
      scored_at: new Date().toISOString(),
    };
    if (userId) {
      payload.user_id = userId;
    }
    const { error } = await this.client.from('job_monitor_scores').upsert(payload);

    if (error) {
      Logger.error(`Error saving cached score for ${jobHash}`, error);
    }
  }

  public async saveRunStats(metrics: Record<string, any>): Promise<void> {
    const { error } = await this.client.from('job_monitor_stats').insert({
      run_metrics: metrics,
      created_at: new Date().toISOString(),
    });

    if (error) {
      Logger.error('Error saving execution stats to Supabase', error);
    }
  }

  public async getApplications(userId?: string): Promise<Application[]> {
    let query = this.client.from('job_monitor_applications').select('*');
    if (userId) {
      query = query.eq('user_id', userId);
    }
    const { data, error } = await query;

    if (error) {
      Logger.error('Error fetching applications from Supabase', error);
      return [];
    }

    return (data || []).map((row: any) => ({
      jobHash: row.job_hash,
      company: row.company,
      jobId: row.job_id,
      status: row.status,
      appliedDate: row.applied_date,
      resumeUsed: row.resume_used,
      notes: row.notes,
      lastUpdated: row.last_updated,
    }));
  }

  public async saveApplication(app: Application, userId?: string): Promise<void> {
    const payload: any = {
      job_hash: app.jobHash,
      company: app.company,
      job_id: app.jobId,
      status: app.status,
      applied_date: app.appliedDate || null,
      resume_used: app.resumeUsed || null,
      notes: app.notes || null,
      last_updated: new Date().toISOString(),
    };
    if (userId) {
      payload.user_id = userId;
    }
    const { error } = await this.client.from('job_monitor_applications').upsert(payload);

    if (error) {
      Logger.error(`Error saving application for ${app.jobHash} to Supabase`, error);
    }
  }

  public async getJobAnalysis(jobHash: string): Promise<any | null> {
    const { data, error } = await this.client.from('job_monitor_analyses').select('*').eq('job_hash', jobHash).single();

    if (error) {
      if (error.code !== 'PGRST116') {
        Logger.error(`Error fetching job analysis for ${jobHash} from Supabase`, error);
      }
      return null;
    }

    return {
      jobHash: data.job_hash,
      summary: data.summary,
      whyMatches: data.why_matches,
      missingSkills: data.missing_skills || [],
      resumeImprovements: data.resume_improvements || [],
      difficulty: data.difficulty,
      prepTopics: data.prep_topics || [],
      lastUpdated: data.last_updated,
    };
  }

  public async saveJobAnalysis(analysis: any): Promise<void> {
    const { error } = await this.client.from('job_monitor_analyses').upsert({
      job_hash: analysis.jobHash,
      summary: analysis.summary,
      why_matches: analysis.whyMatches,
      missing_skills: analysis.missing_skills || [],
      resume_improvements: analysis.resumeImprovements || [],
      difficulty: analysis.difficulty,
      prep_topics: analysis.prepTopics || [],
      last_updated: new Date().toISOString(),
    });

    if (error) {
      Logger.error(`Error saving job analysis for ${analysis.jobHash} to Supabase`, error);
    }
  }

  public async getExtendedSettings(userId?: string): Promise<any | null> {
    let query = this.client.from('job_monitor_extended_settings').select('*');
    if (userId) {
      query = query.eq('user_id', userId);
    } else {
      query = query.eq('id', 'default');
    }
    const { data, error } = await query.single();

    if (error) {
      if (error.code !== 'PGRST116') {
        Logger.error('Error fetching extended settings from Supabase', error);
      }
      return null;
    }

    return {
      preferredCompanies: data.preferred_companies || [],
      preferredTechnologies: data.preferred_technologies || [],
      preferredCities: data.preferred_cities || [],
      remotePreference: data.remote_preference || 'all',
      notificationFrequency: data.notification_frequency || 'daily',
      digestFormat: data.digest_format || 'markdown',
    };
  }

  public async saveExtendedSettings(settings: any, userId?: string): Promise<void> {
    const payload: any = {
      preferred_companies: settings.preferredCompanies || [],
      preferred_technologies: settings.preferredTechnologies || [],
      preferred_cities: settings.preferredCities || [],
      remote_preference: settings.remotePreference || 'all',
      notification_frequency: settings.notificationFrequency || 'daily',
      digest_format: settings.digestFormat || 'markdown',
      last_updated: new Date().toISOString(),
    };
    if (userId) {
      payload.user_id = userId;
    } else {
      payload.id = 'default';
    }
    const { error } = await this.client.from('job_monitor_extended_settings').upsert(payload);

    if (error) {
      Logger.error('Error saving extended settings to Supabase', error);
    }
  }

  // Profile Management
  public async getProfile(userId: string): Promise<any | null> {
    const { data, error } = await this.client.from('job_monitor_profiles').select('*').eq('id', userId).single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      Logger.error('Error getting profile from Supabase', error);
      return null;
    }
    return data;
  }

  public async saveProfile(userId: string, profile: any): Promise<void> {
    const { error } = await this.client.from('job_monitor_profiles').upsert({
      id: userId,
      name: profile.name,
      photo_url: profile.photo_url || null,
      preferred_roles: profile.preferred_roles || [],
      preferred_cities: profile.preferred_cities || [],
      experience_level: profile.experience_level || null,
      tech_stack: profile.tech_stack || [],
      linkedin: profile.linkedin || null,
      github: profile.github || null,
      portfolio: profile.portfolio || null,
      role: profile.role || 'User',
    });

    if (error) {
      Logger.error('Error saving profile to Supabase', error);
    }
  }

  public async getAllProfiles(): Promise<any[]> {
    const { data, error } = await this.client.from('job_monitor_profiles').select('*');

    if (error) {
      Logger.error('Error listing all profiles', error);
      return [];
    }
    return data || [];
  }

  // User-isolated Resumes
  public async getUserResumes(userId: string): Promise<any[]> {
    const { data, error } = await this.client.from('job_monitor_resumes').select('*').eq('user_id', userId);

    if (error) {
      Logger.error('Error getting resumes', error);
      return [];
    }
    return (data || []).map((r: any) => ({
      profileName: r.profile_name,
      content: r.content,
      pdf_data: r.pdf_data,
      created_at: r.created_at,
    }));
  }

  public async saveUserResume(userId: string, profileName: string, content: string, pdfData?: string): Promise<void> {
    const { error } = await this.client.from('job_monitor_resumes').upsert({
      user_id: userId,
      profile_name: profileName,
      content,
      pdf_data: pdfData,
    });

    if (error) {
      Logger.error('Error saving resume to Supabase', error);
    }
  }

  public async deleteUserResume(userId: string, profileName: string): Promise<void> {
    const { error } = await this.client
      .from('job_monitor_resumes')
      .delete()
      .eq('user_id', userId)
      .eq('profile_name', profileName);

    if (error) {
      Logger.error('Error deleting resume from Supabase', error);
    }
  }

  // Saved Searches
  public async getSavedSearches(userId: string): Promise<any[]> {
    const { data, error } = await this.client.from('job_monitor_saved_searches').select('*').eq('user_id', userId);

    if (error) {
      Logger.error('Error getting saved searches', error);
      return [];
    }
    return data || [];
  }

  public async saveSavedSearch(userId: string, name: string, filters: any): Promise<void> {
    const { error } = await this.client.from('job_monitor_saved_searches').insert({
      user_id: userId,
      name,
      filters,
    });

    if (error) {
      Logger.error('Error saving search parameters to Supabase', error);
    }
  }

  public async deleteSavedSearch(userId: string, id: string): Promise<void> {
    const { error } = await this.client.from('job_monitor_saved_searches').delete().eq('user_id', userId).eq('id', id);

    if (error) {
      Logger.error('Error deleting saved search', error);
    }
  }

  // Watchlists
  public async getWatchlists(userId: string): Promise<any[]> {
    const { data, error } = await this.client.from('job_monitor_watchlists').select('*').eq('user_id', userId);

    if (error) {
      Logger.error('Error getting watchlists', error);
      return [];
    }
    return data || [];
  }

  public async saveWatchlist(userId: string, name: string, filters: any): Promise<void> {
    const { error } = await this.client.from('job_monitor_watchlists').insert({
      user_id: userId,
      name,
      filters,
    });

    if (error) {
      Logger.error('Error saving watchlist to Supabase', error);
    }
  }

  public async deleteWatchlist(userId: string, id: string): Promise<void> {
    const { error } = await this.client.from('job_monitor_watchlists').delete().eq('user_id', userId).eq('id', id);

    if (error) {
      Logger.error('Error deleting watchlist', error);
    }
  }

  // In-App User Notifications
  public async getUserNotifications(userId: string): Promise<any[]> {
    const { data, error } = await this.client
      .from('job_monitor_user_notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      Logger.error('Error getting user notifications', error);
      return [];
    }
    return data || [];
  }

  public async saveUserNotification(userId: string, title: string, message: string, priority?: string): Promise<void> {
    const { error } = await this.client.from('job_monitor_user_notifications').insert({
      user_id: userId,
      title,
      message,
      priority: priority || 'medium',
    });

    if (error) {
      Logger.error('Error generating user notification', error);
    }
  }

  public async markNotificationRead(userId: string, id: string): Promise<void> {
    const { error } = await this.client
      .from('job_monitor_user_notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('id', id);

    if (error) {
      Logger.error('Error marking notification read', error);
    }
  }

  public async clearUserNotifications(userId: string): Promise<void> {
    const { error } = await this.client.from('job_monitor_user_notifications').delete().eq('user_id', userId);

    if (error) {
      Logger.error('Error clearing notifications', error);
    }
  }

  // Audit Logging
  public async getAuditLogs(userId?: string): Promise<any[]> {
    let query = this.client.from('job_monitor_audit_logs').select('*');
    if (userId) {
      query = query.eq('user_id', userId);
    }
    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      Logger.error('Error fetching audit logs', error);
      return [];
    }
    return data || [];
  }

  public async saveAuditLog(userId: string | null, action: string, details: any, ipAddress?: string): Promise<void> {
    const { error } = await this.client.from('job_monitor_audit_logs').insert({
      user_id: userId,
      action,
      details,
      ip_address: ipAddress || '127.0.0.1',
    });

    if (error) {
      Logger.error('Error saving audit log', error);
    }
  }

  // Feature Flags
  public async getFeatureFlags(): Promise<any[]> {
    const { data, error } = await this.client.from('job_monitor_feature_flags').select('*');

    if (error) {
      Logger.error('Error getting feature flags', error);
      return [];
    }
    return data || [];
  }

  public async getFeatureFlag(key: string): Promise<boolean> {
    const { data, error } = await this.client
      .from('job_monitor_feature_flags')
      .select('enabled')
      .eq('key', key)
      .single();

    if (error) {
      if (error.code !== 'PGRST116') {
        Logger.error(`Error querying feature flag: ${key}`, error);
      }
      return true; // Default fallback to enabled
    }
    return data?.enabled ?? true;
  }

  public async setFeatureFlag(key: string, enabled: boolean): Promise<void> {
    const { error } = await this.client
      .from('job_monitor_feature_flags')
      .update({ enabled, updated_at: new Date().toISOString() })
      .eq('key', key);

    if (error) {
      Logger.error(`Error saving feature flag: ${key}`, error);
    }
  }

  // Copilot Recommendations
  public async getCopilotRecommendations(userId: string): Promise<any[]> {
    const { data, error } = await this.client
      .from('job_monitor_copilot_recommendations')
      .select('recommendations')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      Logger.error(`Error fetching recommendations for ${userId}`, error);
      return [];
    }
    return data && data.length > 0 ? data[0].recommendations : [];
  }

  public async saveCopilotRecommendations(userId: string, recommendations: any[]): Promise<void> {
    // Upsert recommendations
    const { error } = await this.client
      .from('job_monitor_copilot_recommendations')
      .upsert({ user_id: userId, recommendations, created_at: new Date().toISOString() }, { onConflict: 'user_id' });

    if (error) {
      Logger.error(`Error saving recommendations for ${userId}`, error);
    }
  }

  // Learning Roadmaps
  public async getLearningRoadmap(userId: string): Promise<any | null> {
    const { data, error } = await this.client
      .from('job_monitor_learning_roadmaps')
      .select('roadmap')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code !== 'PGRST116') {
        Logger.error(`Error fetching learning roadmap for ${userId}`, error);
      }
      return null;
    }
    return data?.roadmap ?? null;
  }

  public async saveLearningRoadmap(userId: string, roadmap: any): Promise<void> {
    const { error } = await this.client
      .from('job_monitor_learning_roadmaps')
      .upsert({ user_id: userId, roadmap, created_at: new Date().toISOString() }, { onConflict: 'user_id' });

    if (error) {
      Logger.error(`Error saving learning roadmap for ${userId}`, error);
    }
  }

  // Mock Interview Sessions
  public async getInterviewSessions(userId: string): Promise<any[]> {
    const { data, error } = await this.client
      .from('job_monitor_interview_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      Logger.error(`Error fetching interview sessions for ${userId}`, error);
      return [];
    }
    return data || [];
  }

  public async saveInterviewSession(userId: string, session: any): Promise<void> {
    const { error } = await this.client.from('job_monitor_interview_sessions').upsert({
      id: session.id,
      user_id: userId,
      session_type: session.session_type || session.sessionType,
      questions: session.questions,
      responses: session.responses,
      feedback: session.feedback,
      score: session.score,
      created_at: session.created_at || new Date().toISOString(),
    });

    if (error) {
      Logger.error(`Error saving interview session for ${userId}`, error);
    }
  }

  // Career Roadmaps
  public async getCareerRoadmap(userId: string): Promise<any | null> {
    const { data, error } = await this.client
      .from('job_monitor_career_roadmaps')
      .select('roadmap_data')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code !== 'PGRST116') {
        Logger.error(`Error fetching career roadmap for ${userId}`, error);
      }
      return null;
    }
    return data?.roadmap_data ?? null;
  }

  public async saveCareerRoadmap(userId: string, roadmap: any): Promise<void> {
    const { error } = await this.client
      .from('job_monitor_career_roadmaps')
      .upsert(
        { user_id: userId, roadmap_data: roadmap, created_at: new Date().toISOString() },
        { onConflict: 'user_id' },
      );

    if (error) {
      Logger.error(`Error saving career roadmap for ${userId}`, error);
    }
  }

  // Daily Briefs
  public async getDailyBrief(userId: string): Promise<any | null> {
    const { data, error } = await this.client
      .from('job_monitor_daily_briefs')
      .select('brief_data')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code !== 'PGRST116') {
        Logger.error(`Error fetching daily brief for ${userId}`, error);
      }
      return null;
    }
    return data?.brief_data ?? null;
  }

  public async saveDailyBrief(userId: string, brief: any): Promise<void> {
    const { error } = await this.client
      .from('job_monitor_daily_briefs')
      .upsert({ user_id: userId, brief_data: brief, created_at: new Date().toISOString() }, { onConflict: 'user_id' });

    if (error) {
      Logger.error(`Error saving daily brief for ${userId}`, error);
    }
  }

  // Resume Profiles
  public async getResumeProfiles(userId: string): Promise<any[]> {
    const { data, error } = await this.client.from('job_monitor_resume_profiles').select('*').eq('user_id', userId);
    if (error) {
      Logger.error(`Error fetching resume profiles for ${userId}`, error);
      return [];
    }
    return data || [];
  }

  public async saveResumeProfile(
    userId: string,
    profileName: string,
    content: string,
    pdfData?: string,
  ): Promise<void> {
    const { error } = await this.client
      .from('job_monitor_resume_profiles')
      .upsert(
        { user_id: userId, profile_name: profileName, content, pdf_data: pdfData },
        { onConflict: 'user_id,profile_name' },
      );
    if (error) {
      Logger.error(`Error saving resume profile for ${userId}`, error);
    }
  }

  public async deleteResumeProfile(userId: string, id: string): Promise<void> {
    const { error } = await this.client.from('job_monitor_resume_profiles').delete().eq('id', id).eq('user_id', userId);
    if (error) {
      Logger.error(`Error deleting resume profile ${id}`, error);
    }
  }

  // Application Queue
  public async getApplicationQueue(userId: string): Promise<any[]> {
    const { data, error } = await this.client.from('job_monitor_application_queue').select('*').eq('user_id', userId);
    if (error) {
      Logger.error(`Error fetching application queue for ${userId}`, error);
      return [];
    }
    return data || [];
  }

  public async saveApplicationQueueItem(userId: string, item: any): Promise<void> {
    const payload = {
      ...item,
      user_id: userId,
      updated_at: new Date().toISOString(),
    };
    const { error } = await this.client
      .from('job_monitor_application_queue')
      .upsert(payload, { onConflict: 'user_id,job_hash' });
    if (error) {
      Logger.error(`Error saving application queue item for ${userId}`, error);
    }
  }

  public async deleteApplicationQueueItem(userId: string, id: string): Promise<void> {
    const { error } = await this.client
      .from('job_monitor_application_queue')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
    if (error) {
      Logger.error(`Error deleting application queue item ${id}`, error);
    }
  }

  // Recruiters CRM
  public async getRecruiters(userId: string): Promise<any[]> {
    const { data, error } = await this.client
      .from('job_monitor_referrals')
      .select('*')
      .eq('user_id', userId)
      .eq('category', 'Recruiter');
    if (error) {
      Logger.error(`Error fetching recruiters for ${userId}`, error);
      return [];
    }
    return (data || []).map((row: any) => ({
      id: row.id,
      name: row.name,
      company: row.company,
      email: row.email,
      linkedin: row.linkedin_url,
      ...this.parseRecruiterNotes(row.notes),
      follow_up_date: row.next_follow_up,
      last_contacted: row.last_contacted,
    }));
  }

  private parseRecruiterNotes(notesStr: string | undefined): any {
    if (!notesStr) return {};
    try {
      if (notesStr.trim().startsWith('{')) {
        const parsed = JSON.parse(notesStr);
        return {
          phone: parsed.phone,
          notes: parsed.notes,
          conversation_history: parsed.conversation_history || [],
        };
      }
    } catch {}
    return { notes: notesStr, conversation_history: [] };
  }

  public async saveRecruiter(userId: string, recruiter: any): Promise<void> {
    const payload = {
      id: recruiter.id,
      user_id: userId,
      name: recruiter.name,
      role: 'Recruiter',
      category: 'Recruiter',
      company: recruiter.company,
      linkedin_url: recruiter.linkedin || recruiter.linkedin_url,
      email: recruiter.email,
      notes: JSON.stringify({
        phone: recruiter.phone || '',
        notes: recruiter.notes || '',
        conversation_history: recruiter.conversation_history || [],
      }),
      connection_status: 'Connected',
      next_follow_up: recruiter.follow_up_date || recruiter.next_follow_up,
      last_contacted: recruiter.last_contacted,
    };
    const { error } = await this.client.from('job_monitor_referrals').upsert(payload, { onConflict: 'id' });
    if (error) {
      Logger.error(`Error saving recruiter for ${userId}`, error);
    }
  }

  public async deleteRecruiter(userId: string, id: string): Promise<void> {
    const { error } = await this.client.from('job_monitor_referrals').delete().eq('id', id).eq('user_id', userId);
    if (error) {
      Logger.error(`Error deleting recruiter ${id}`, error);
    }
  }

  // Referrals CRM
  public async getReferrals(userId: string): Promise<any[]> {
    const { data, error } = await this.client.from('job_monitor_referrals').select('*').eq('user_id', userId);
    if (error) {
      Logger.error(`Error fetching referrals for ${userId}`, error);
      return [];
    }
    return data || [];
  }

  public async saveReferral(userId: string, referral: any): Promise<void> {
    const payload = {
      ...referral,
      user_id: userId,
      updated_at: new Date().toISOString(),
    };
    const { error } = await this.client.from('job_monitor_referrals').upsert(payload, { onConflict: 'id' });
    if (error) {
      Logger.error(`Error saving referral for ${userId}`, error);
    }
  }

  public async deleteReferral(userId: string, id: string): Promise<void> {
    const { error } = await this.client.from('job_monitor_referrals').delete().eq('id', id).eq('user_id', userId);
    if (error) {
      Logger.error(`Error deleting referral ${id}`, error);
    }
  }

  public async updateReferralStatus(userId: string, id: string, status: string): Promise<void> {
    const { error } = await this.client
      .from('job_monitor_referrals')
      .update({ connection_status: status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId);
    if (error) {
      Logger.error(`Error updating referral status for ${id}`, error);
    }
  }

  public async getReferralsByCategory(userId: string, category: string): Promise<any[]> {
    const { data, error } = await this.client
      .from('job_monitor_referrals')
      .select('*')
      .eq('user_id', userId)
      .eq('category', category);
    if (error) {
      Logger.error(`Error fetching referrals by category for ${userId}`, error);
      return [];
    }
    return data || [];
  }

  public async getReferralAnalytics(userId: string): Promise<any> {
    const { data, error } = await this.client.from('job_monitor_referrals').select('*').eq('user_id', userId);

    if (error) {
      Logger.error(`Error fetching referral analytics for ${userId}`, error);
      return {
        totalContacts: 0,
        connectionsSent: 0,
        acceptedConnections: 0,
        referralRequests: 0,
        referralsReceived: 0,
        interviewsViaReferrals: 0,
        offersViaReferrals: 0,
        successRate: 0,
        topCompanies: [],
        contactsByCategory: {},
      };
    }

    const referrals = data || [];
    const totalContacts = referrals.length;
    const connectionsSent = referrals.filter((r: any) => r.connection_status === 'Connection Sent').length;
    const acceptedConnections = referrals.filter((r: any) => r.connection_status === 'Connected').length;
    const referralRequests = referrals.filter((r: any) => r.connection_status === 'Referral Requested').length;
    const referralsReceived = referrals.filter((r: any) => r.connection_status === 'Referral Submitted').length;
    const interviewsViaReferrals = referrals.filter((r: any) => r.connection_status === 'Interview').length;
    const offersViaReferrals = referrals.filter((r: any) => r.connection_status === 'Offer').length;

    const successRate = referralRequests > 0 ? (referralsReceived / referralRequests) * 100 : 0;

    const companyCounts: Record<string, number> = {};
    referrals.forEach((r: any) => {
      companyCounts[r.company] = (companyCounts[r.company] || 0) + 1;
    });
    const topCompanies = Object.entries(companyCounts)
      .map(([company, count]) => ({ company, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const categoryCounts: Record<string, number> = {};
    referrals.forEach((r: any) => {
      categoryCounts[r.category] = (categoryCounts[r.category] || 0) + 1;
    });

    return {
      totalContacts,
      connectionsSent,
      acceptedConnections,
      referralRequests,
      referralsReceived,
      interviewsViaReferrals,
      offersViaReferrals,
      successRate,
      topCompanies,
      contactsByCategory: categoryCounts,
    };
  }

  // Calendar Events
  public async getCalendarEvents(userId: string): Promise<any[]> {
    const { data, error } = await this.client.from('job_monitor_calendar_events').select('*').eq('user_id', userId);
    if (error) {
      Logger.error(`Error fetching calendar events for ${userId}`, error);
      return [];
    }
    return data || [];
  }

  public async saveCalendarEvent(userId: string, event: any): Promise<void> {
    const payload = {
      ...event,
      user_id: userId,
    };
    const { error } = await this.client.from('job_monitor_calendar_events').upsert(payload);
    if (error) {
      Logger.error(`Error saving calendar event for ${userId}`, error);
    }
  }

  public async deleteCalendarEvent(userId: string, id: string): Promise<void> {
    const { error } = await this.client.from('job_monitor_calendar_events').delete().eq('id', id).eq('user_id', userId);
    if (error) {
      Logger.error(`Error deleting calendar event ${id}`, error);
    }
  }

  // Exports
  public async getExports(userId: string): Promise<any[]> {
    const { data, error } = await this.client.from('job_monitor_exports').select('*').eq('user_id', userId);
    if (error) {
      Logger.error(`Error fetching exports for ${userId}`, error);
      return [];
    }
    return data || [];
  }

  public async saveExport(userId: string, exportItem: any): Promise<void> {
    const payload = {
      ...exportItem,
      user_id: userId,
    };
    const { error } = await this.client.from('job_monitor_exports').upsert(payload);
    if (error) {
      Logger.error(`Error saving export for ${userId}`, error);
    }
  }

  public async deleteExport(userId: string, id: string): Promise<void> {
    const { error } = await this.client.from('job_monitor_exports').delete().eq('id', id).eq('user_id', userId);
    if (error) {
      Logger.error(`Error deleting export ${id}`, error);
    }
  }

  // Cover Letters
  public async getCoverLetters(userId: string): Promise<any[]> {
    const { data, error } = await this.client
      .from('job_monitor_cover_letters')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) {
      Logger.error(`Error fetching cover letters for ${userId}`, error);
      return [];
    }
    return data || [];
  }

  public async saveCoverLetter(userId: string, coverLetter: any): Promise<void> {
    const payload = {
      ...coverLetter,
      user_id: userId,
    };
    const { error } = await this.client.from('job_monitor_cover_letters').upsert(payload);
    if (error) {
      Logger.error(`Error saving cover letter for ${userId}`, error);
    }
  }

  public async deleteCoverLetter(userId: string, id: string): Promise<void> {
    const { error } = await this.client.from('job_monitor_cover_letters').delete().eq('id', id).eq('user_id', userId);
    if (error) {
      Logger.error(`Error deleting cover letter ${id}`, error);
    }
  }

  // V1.1 Offers Management
  public async getOffers(userId: string): Promise<Offer[]> {
    const { data, error } = await this.client.from('offers').select('*').eq('user_id', userId);
    if (error) return [];
    return (data || []).map((row: any) => ({
      id: row.id,
      applicationId: row.application_id,
      baseSalary: Number(row.base_salary),
      signingBonus: Number(row.signing_bonus || 0),
      annualBonusPct: Number(row.annual_bonus_pct || 0),
      equityValue: Number(row.equity_value || 0),
      vestingYears: Number(row.vesting_years || 4),
      location: row.location,
      remoteStatus: row.remote_status,
      status: row.status,
      offerDeadline: row.offer_deadline,
      createdAt: row.created_at,
    }));
  }

  public async getOfferByApplicationId(applicationId: string): Promise<Offer | null> {
    const { data, error } = await this.client.from('offers').select('*').eq('application_id', applicationId).single();
    if (error || !data) return null;
    return {
      id: data.id,
      applicationId: data.application_id,
      baseSalary: Number(data.base_salary),
      signingBonus: Number(data.signing_bonus || 0),
      annualBonusPct: Number(data.annual_bonus_pct || 0),
      equityValue: Number(data.equity_value || 0),
      vestingYears: Number(data.vesting_years || 4),
      location: data.location,
      remoteStatus: data.remote_status,
      status: data.status,
      offerDeadline: data.offer_deadline,
      createdAt: data.created_at,
    };
  }

  public async saveOffer(userId: string, offer: Offer): Promise<void> {
    const payload = {
      id: offer.id,
      application_id: offer.applicationId,
      user_id: userId,
      base_salary: offer.baseSalary,
      signing_bonus: offer.signingBonus || 0,
      annual_bonus_pct: offer.annualBonusPct || 0,
      equity_value: offer.equityValue || 0,
      vesting_years: offer.vestingYears || 4,
      location: offer.location,
      remote_status: offer.remoteStatus,
      status: offer.status,
      offer_deadline: offer.offerDeadline,
    };
    await this.client.from('offers').upsert(payload);
  }

  public async deleteOffer(userId: string, id: string): Promise<void> {
    await this.client.from('offers').delete().eq('id', id).eq('user_id', userId);
  }

  // V1.1 Follow-Ups
  public async getFollowUps(userId: string): Promise<FollowUp[]> {
    const { data, error } = await this.client.from('followups').select('*').eq('user_id', userId);
    if (error) return [];
    return (data || []).map((r: any) => ({
      id: r.id,
      applicationId: r.application_id,
      scheduledDate: r.scheduled_date,
      status: r.status,
      note: r.note,
    }));
  }

  public async saveFollowUp(userId: string, followUp: FollowUp): Promise<void> {
    const payload = {
      id: followUp.id,
      application_id: followUp.applicationId,
      user_id: userId,
      scheduled_date: followUp.scheduledDate,
      status: followUp.status,
      note: followUp.note,
    };
    await this.client.from('followups').upsert(payload);
  }

  public async deleteFollowUp(userId: string, id: string): Promise<void> {
    await this.client.from('followups').delete().eq('id', id).eq('user_id', userId);
  }

  // V1.1 Notification Preferences
  public async getNotificationPreference(userId: string): Promise<NotificationPreference | null> {
    const { data, error } = await this.client.from('notification_preferences').select('*').eq('user_id', userId).single();
    if (error || !data) return null;
    return {
      userId: data.user_id,
      emailEnabled: data.email_enabled,
      slackWebhookUrl: data.slack_webhook_url,
      telegramBotToken: data.telegram_bot_token,
      telegramChatId: data.telegram_chat_id,
      digestFrequency: data.digest_frequency,
    };
  }

  public async saveNotificationPreference(userId: string, pref: NotificationPreference): Promise<void> {
    const payload = {
      user_id: userId,
      email_enabled: pref.emailEnabled,
      slack_webhook_url: pref.slackWebhookUrl,
      telegram_bot_token: pref.telegramBotToken,
      telegram_chat_id: pref.telegramChatId,
      digest_frequency: pref.digestFrequency,
    };
    await this.client.from('notification_preferences').upsert(payload);
  }

  // V1.1 Visa Sponsors
  public async getVisaSponsor(companyName: string): Promise<VisaSponsor | null> {
    const norm = companyName.trim().toLowerCase();
    const { data, error } = await this.client.from('visa_sponsors').select('*').eq('normalized_name', norm).single();
    if (error || !data) return null;
    return {
      id: data.id,
      companyName: data.company_name,
      normalizedName: data.normalized_name,
      totalLcas: data.total_lcas,
      approvalRatePct: data.approval_rate_pct,
      avgSalary: data.avg_salary,
      fiscalYear: data.fiscal_year,
    };
  }

  public async searchVisaSponsors(query: string): Promise<VisaSponsor[]> {
    const q = `%${query.trim().toLowerCase()}%`;
    const { data, error } = await this.client.from('visa_sponsors').select('*').ilike('company_name', q);
    if (error) return [];
    return (data || []).map((row: any) => ({
      id: row.id,
      companyName: row.company_name,
      normalizedName: row.normalized_name,
      totalLcas: row.total_lcas,
      approvalRatePct: row.approval_rate_pct,
      avgSalary: row.avg_salary,
      fiscalYear: row.fiscal_year,
    }));
  }

  public async saveVisaSponsor(sponsor: VisaSponsor): Promise<void> {
    const payload = {
      id: sponsor.id,
      company_name: sponsor.companyName,
      normalized_name: sponsor.normalizedName,
      total_lcas: sponsor.totalLcas,
      approval_rate_pct: sponsor.approvalRatePct,
      avg_salary: sponsor.avgSalary,
      fiscal_year: sponsor.fiscalYear,
    };
    await this.client.from('visa_sponsors').upsert(payload);
  }

  // Extension Jobs
  public async saveExtensionJob(job: SavedExtensionJob): Promise<SavedExtensionJob> {
    const payload = {
      id: job.id || `ext-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      user_id: job.userId,
      company_name: job.companyName,
      job_title: job.jobTitle,
      location: job.location,
      salary_range: job.salaryRange,
      job_url: job.jobUrl,
      description: job.description,
      skills: job.skills,
      platform_source: job.platformSource,
      status: job.status || 'Captured',
      created_at: job.createdAt || new Date().toISOString(),
    };
    await this.client.from('extension_saved_jobs').upsert(payload);
    return {
      id: payload.id,
      userId: payload.user_id,
      companyName: payload.company_name,
      jobTitle: payload.job_title,
      location: payload.location,
      salaryRange: payload.salary_range,
      jobUrl: payload.job_url,
      description: payload.description,
      skills: payload.skills,
      platformSource: payload.platform_source,
      status: payload.status,
      createdAt: payload.created_at,
    };
  }

  public async getExtensionJobs(userId?: string): Promise<SavedExtensionJob[]> {
    let query = this.client.from('extension_saved_jobs').select('*');
    if (userId) {
      query = query.eq('user_id', userId);
    }
    const { data, error } = await query;
    if (error || !data) return [];
    return data.map((r: any) => ({
      id: r.id,
      userId: r.user_id,
      companyName: r.company_name,
      jobTitle: r.job_title,
      location: r.location,
      salaryRange: r.salary_range,
      jobUrl: r.job_url,
      description: r.description,
      skills: r.skills,
      platformSource: r.platform_source,
      status: r.status,
      createdAt: r.created_at,
    }));
  }
}
