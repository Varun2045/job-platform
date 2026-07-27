import fs from 'fs';
import path from 'path';
import { StorageProvider, Offer, FollowUp, NotificationPreference, VisaSponsor, SavedExtensionJob } from './StorageProvider.js';
import { CompanyConfig, Job, Application } from '../companies/Scraper.js';
import { Logger } from '../core/Logger.js';

export class FileStorage implements StorageProvider {
  private storageDir: string;
  private companiesPath: string;
  private notificationsPath: string;
  private scoresPath: string;
  private statsPath: string;
  private applicationsPath: string;
  private analysesPath: string;
  private extendedSettingsPath: string;

  constructor() {
    this.storageDir = path.join(process.cwd(), 'storage');
    this.companiesPath = path.join(this.storageDir, 'companies_state.json');
    this.notificationsPath = path.join(this.storageDir, 'notification_history.json');
    this.scoresPath = path.join(this.storageDir, 'scores.json');
    this.statsPath = path.join(this.storageDir, 'stats.json');
    this.applicationsPath = path.join(this.storageDir, 'applications.json');
    this.analysesPath = path.join(this.storageDir, 'analyses.json');
    this.extendedSettingsPath = path.join(this.storageDir, 'extended_settings.json');
  }

  public async initialize(): Promise<void> {
    if (!fs.existsSync(this.storageDir)) {
      fs.mkdirSync(this.storageDir, { recursive: true });
    }

    if (!fs.existsSync(this.applicationsPath)) {
      fs.writeFileSync(this.applicationsPath, '[]', 'utf-8');
    }

    // Seed companies state if it doesn't exist
    if (!fs.existsSync(this.companiesPath)) {
      const seedPath = path.join(process.cwd(), 'config', 'companies.json');
      if (fs.existsSync(seedPath)) {
        fs.copyFileSync(seedPath, this.companiesPath);
        Logger.info('Seeded companies state from config/companies.json');
      } else {
        fs.writeFileSync(this.companiesPath, '[]', 'utf-8');
      }
    }

    if (!fs.existsSync(this.notificationsPath)) {
      fs.writeFileSync(this.notificationsPath, '[]', 'utf-8');
    }

    if (!fs.existsSync(this.scoresPath)) {
      fs.writeFileSync(this.scoresPath, '{}', 'utf-8');
    }

    if (!fs.existsSync(this.statsPath)) {
      fs.writeFileSync(this.statsPath, '[]', 'utf-8');
    }

    if (!fs.existsSync(this.analysesPath)) {
      fs.writeFileSync(this.analysesPath, '{}', 'utf-8');
    }

    if (!fs.existsSync(this.extendedSettingsPath)) {
      fs.writeFileSync(
        this.extendedSettingsPath,
        JSON.stringify(
          {
            preferredCompanies: [],
            preferredTechnologies: [],
            preferredCities: [],
            remotePreference: 'all',
            notificationFrequency: 'daily',
            digestFormat: 'markdown',
          },
          null,
          2,
        ),
        'utf-8',
      );
    }

    // Auto-create missing V1.1 JSON files
    const v11JsonFiles = [
      'offers.json',
      'followups.json',
      'notification_preferences.json',
      'visa_sponsors.json',
      'export_jobs.json',
      'keyword_heatmaps.json',
      'recruiter_interactions.json',
    ];
    for (const file of v11JsonFiles) {
      const p = path.join(this.storageDir, file);
      if (!fs.existsSync(p)) {
        fs.writeFileSync(p, '[]', 'utf-8');
      }
    }

    // Migration helper: Gracefully populate stageOrder = 0.0 for V1.0 applications missing stageOrder
    try {
      const rawApps = this.readJsonFile<any[]>(this.applicationsPath, []);
      let appMigrated = false;
      const updatedApps = rawApps.map((app) => {
        if (typeof app.stageOrder === 'undefined') {
          appMigrated = true;
          return { ...app, stageOrder: 0.0 };
        }
        return app;
      });
      if (appMigrated) {
        this.writeJsonFile(this.applicationsPath, updatedApps);
      }
    } catch {
      // Ignore migration errors during initialization
    }
  }

  private readJsonFile<T>(filePath: string, defaultVal: T): T {
    try {
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(raw) as T;
      }
    } catch (e) {
      Logger.error(`Failed to read file ${filePath}`, e as any);
    }
    return defaultVal;
  }

  private writeJsonFile(filePath: string, data: any): void {
    try {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (e) {
      Logger.error(`Failed to write file ${filePath}`, e as any);
    }
  }

  public async getCompanyConfig(id: string): Promise<CompanyConfig | null> {
    const configs = this.readJsonFile<CompanyConfig[]>(this.companiesPath, []);
    return configs.find((c) => c.id === id) ?? null;
  }

  public async getEnabledCompanies(): Promise<CompanyConfig[]> {
    const configs = this.readJsonFile<CompanyConfig[]>(this.companiesPath, []);
    return configs.filter((c) => c.enabled);
  }

  public async getAllCompanies(): Promise<CompanyConfig[]> {
    return this.readJsonFile<CompanyConfig[]>(this.companiesPath, []);
  }

  public async saveCompanyConfig(company: CompanyConfig): Promise<void> {
    const configs = this.readJsonFile<CompanyConfig[]>(this.companiesPath, []);
    const idx = configs.findIndex((c) => c.id === company.id);
    if (idx !== -1) {
      configs[idx] = {
        ...configs[idx],
        ...company,
      };
    } else {
      configs.push(company);
    }
    this.writeJsonFile(this.companiesPath, configs);
  }

  public async updateCompanyScrapeState(id: string, state: Partial<CompanyConfig>): Promise<void> {
    const configs = this.readJsonFile<CompanyConfig[]>(this.companiesPath, []);
    const idx = configs.findIndex((c) => c.id === id);
    if (idx !== -1) {
      configs[idx] = {
        ...configs[idx],
        ...state,
      };
      this.writeJsonFile(this.companiesPath, configs);
    }
  }

  public async deleteCompanyConfig(id: string): Promise<void> {
    const configs = this.readJsonFile<CompanyConfig[]>(this.companiesPath, []);
    const filtered = configs.filter((c) => c.id !== id);
    this.writeJsonFile(this.companiesPath, filtered);
    // Also remove cached jobs for this company
    const companyJobsPath = path.join(this.storageDir, `${id}.json`);
    if (fs.existsSync(companyJobsPath)) {
      fs.unlinkSync(companyJobsPath);
    }
  }

  public async getCompanyJobs(companyId: string): Promise<Job[]> {
    const companyJobsPath = path.join(this.storageDir, `${companyId}.json`);
    return this.readJsonFile<Job[]>(companyJobsPath, []);
  }

  public async getAllJobs(): Promise<Job[]> {
    const configs = await this.getAllCompanies();
    const allJobs: Job[] = [];
    for (const c of configs) {
      const jobs = await this.getCompanyJobs(c.id);
      allJobs.push(...jobs);
    }
    return allJobs;
  }

  public async saveCompanyJobs(companyId: string, jobs: Job[]): Promise<void> {
    const companyJobsPath = path.join(this.storageDir, `${companyId}.json`);
    this.writeJsonFile(companyJobsPath, jobs);
  }

  public async isJobNotified(jobHash: string): Promise<boolean> {
    const notified = this.readJsonFile<string[]>(this.notificationsPath, []);
    return notified.includes(jobHash);
  }

  public async saveJobNotified(jobHash: string): Promise<void> {
    const notified = this.readJsonFile<string[]>(this.notificationsPath, []);
    if (!notified.includes(jobHash)) {
      notified.push(jobHash);
      this.writeJsonFile(this.notificationsPath, notified);
    }
  }

  public async getCachedScore(
    jobHash: string,
    resumeProfile: string,
    matcherVersion: string,
    userId?: string,
  ): Promise<number | null> {
    const scores = this.readJsonFile<Record<string, number>>(this.scoresPath, {});
    const key = userId
      ? `${userId}_${jobHash}_${resumeProfile}_${matcherVersion}`
      : `${jobHash}_${resumeProfile}_${matcherVersion}`;
    return scores[key] ?? null;
  }

  public async saveCachedScore(
    jobHash: string,
    resumeProfile: string,
    score: number,
    matcherVersion: string,
    userId?: string,
  ): Promise<void> {
    const scores = this.readJsonFile<Record<string, number>>(this.scoresPath, {});
    const key = userId
      ? `${userId}_${jobHash}_${resumeProfile}_${matcherVersion}`
      : `${jobHash}_${resumeProfile}_${matcherVersion}`;
    scores[key] = score;
    this.writeJsonFile(this.scoresPath, scores);
  }

  public async saveRunStats(metrics: Record<string, any>): Promise<void> {
    const stats = this.readJsonFile<any[]>(this.statsPath, []);
    stats.push({
      timestamp: new Date().toISOString(),
      ...metrics,
    });
    this.writeJsonFile(this.statsPath, stats);
  }

  public async getApplications(userId?: string): Promise<Application[]> {
    const apps = this.readJsonFile<any[]>(this.applicationsPath, []);
    if (userId) {
      return apps.filter((a) => a.userId === userId);
    }
    return apps;
  }

  public async saveApplication(app: Application, userId?: string): Promise<void> {
    const apps = this.readJsonFile<any[]>(this.applicationsPath, []);
    const idx = apps.findIndex((a) => a.jobHash === app.jobHash && (!userId || a.userId === userId));
    const record = { ...app, userId };
    if (idx !== -1) {
      apps[idx] = record;
    } else {
      apps.push(record);
    }
    this.writeJsonFile(this.applicationsPath, apps);
  }

  public async getJobAnalysis(jobHash: string): Promise<any | null> {
    const analyses = this.readJsonFile<Record<string, any>>(this.analysesPath, {});
    return analyses[jobHash] ?? null;
  }

  public async saveJobAnalysis(analysis: any): Promise<void> {
    const analyses = this.readJsonFile<Record<string, any>>(this.analysesPath, {});
    analyses[analysis.jobHash] = {
      ...analysis,
      lastUpdated: new Date().toISOString(),
    };
    this.writeJsonFile(this.analysesPath, analyses);
  }

  public async getExtendedSettings(userId?: string): Promise<any | null> {
    const key = userId || 'default';
    const settingsMap = this.readJsonFile<Record<string, any>>(this.extendedSettingsPath, {});
    return settingsMap[key] ?? null;
  }

  public async saveExtendedSettings(settings: any, userId?: string): Promise<void> {
    const key = userId || 'default';
    const settingsMap = this.readJsonFile<Record<string, any>>(this.extendedSettingsPath, {});
    settingsMap[key] = {
      ...settings,
      userId,
      lastUpdated: new Date().toISOString(),
    };
    this.writeJsonFile(this.extendedSettingsPath, settingsMap);
  }

  // Profile Management
  public async getProfile(userId: string): Promise<any | null> {
    const profiles = this.readJsonFile<Record<string, any>>(
      path.join(process.cwd(), 'storage', 'user_profiles.json'),
      {},
    );
    return profiles[userId] ?? null;
  }

  public async saveProfile(userId: string, profile: any): Promise<void> {
    const profiles = this.readJsonFile<Record<string, any>>(
      path.join(process.cwd(), 'storage', 'user_profiles.json'),
      {},
    );
    profiles[userId] = { ...profile, id: userId, updated_at: new Date().toISOString() };
    this.writeJsonFile(path.join(process.cwd(), 'storage', 'user_profiles.json'), profiles);
  }

  public async getAllProfiles(): Promise<any[]> {
    const profiles = this.readJsonFile<Record<string, any>>(
      path.join(process.cwd(), 'storage', 'user_profiles.json'),
      {},
    );
    return Object.values(profiles);
  }

  // User-isolated Resumes
  public async getUserResumes(userId: string): Promise<any[]> {
    const resumes = this.readJsonFile<any[]>(path.join(process.cwd(), 'storage', 'user_resumes.json'), []);
    return resumes.filter((r) => r.userId === userId);
  }

  public async saveUserResume(userId: string, profileName: string, content: string, pdfData?: string): Promise<void> {
    const resumes = this.readJsonFile<any[]>(path.join(process.cwd(), 'storage', 'user_resumes.json'), []);
    const idx = resumes.findIndex((r) => r.userId === userId && r.profileName === profileName);
    const item = { userId, profileName, content, pdf_data: pdfData, created_at: new Date().toISOString() };
    if (idx !== -1) {
      resumes[idx] = item;
    } else {
      resumes.push(item);
    }
    this.writeJsonFile(path.join(process.cwd(), 'storage', 'user_resumes.json'), resumes);
  }

  public async deleteUserResume(userId: string, profileName: string): Promise<void> {
    let resumes = this.readJsonFile<any[]>(path.join(process.cwd(), 'storage', 'user_resumes.json'), []);
    resumes = resumes.filter((r) => !(r.userId === userId && r.profileName === profileName));
    this.writeJsonFile(path.join(process.cwd(), 'storage', 'user_resumes.json'), resumes);
  }

  // Saved Searches
  public async getSavedSearches(userId: string): Promise<any[]> {
    const list = this.readJsonFile<any[]>(path.join(process.cwd(), 'storage', 'saved_searches.json'), []);
    return list.filter((s) => s.userId === userId);
  }

  public async saveSavedSearch(userId: string, name: string, filters: any): Promise<void> {
    const list = this.readJsonFile<any[]>(path.join(process.cwd(), 'storage', 'saved_searches.json'), []);
    list.push({
      id: Math.random().toString(36).substring(7),
      userId,
      name,
      filters,
      created_at: new Date().toISOString(),
    });
    this.writeJsonFile(path.join(process.cwd(), 'storage', 'saved_searches.json'), list);
  }

  public async deleteSavedSearch(userId: string, id: string): Promise<void> {
    let list = this.readJsonFile<any[]>(path.join(process.cwd(), 'storage', 'saved_searches.json'), []);
    list = list.filter((s) => !(s.userId === userId && s.id === id));
    this.writeJsonFile(path.join(process.cwd(), 'storage', 'saved_searches.json'), list);
  }

  // Watchlists
  public async getWatchlists(userId: string): Promise<any[]> {
    const list = this.readJsonFile<any[]>(path.join(process.cwd(), 'storage', 'watchlists.json'), []);
    return list.filter((w) => w.userId === userId);
  }

  public async saveWatchlist(userId: string, name: string, filters: any): Promise<void> {
    const list = this.readJsonFile<any[]>(path.join(process.cwd(), 'storage', 'watchlists.json'), []);
    list.push({
      id: Math.random().toString(36).substring(7),
      userId,
      name,
      filters,
      created_at: new Date().toISOString(),
    });
    this.writeJsonFile(path.join(process.cwd(), 'storage', 'watchlists.json'), list);
  }

  public async deleteWatchlist(userId: string, id: string): Promise<void> {
    let list = this.readJsonFile<any[]>(path.join(process.cwd(), 'storage', 'watchlists.json'), []);
    list = list.filter((w) => !(w.userId === userId && w.id === id));
    this.writeJsonFile(path.join(process.cwd(), 'storage', 'watchlists.json'), list);
  }

  // In-App User Notifications
  public async getUserNotifications(userId: string): Promise<any[]> {
    const list = this.readJsonFile<any[]>(path.join(process.cwd(), 'storage', 'user_notifications.json'), []);
    return list.filter((n) => n.userId === userId);
  }

  public async saveUserNotification(userId: string, title: string, message: string, priority?: string): Promise<void> {
    const list = this.readJsonFile<any[]>(path.join(process.cwd(), 'storage', 'user_notifications.json'), []);
    list.push({
      id: Math.random().toString(36).substring(7),
      userId,
      title,
      message,
      priority: priority || 'medium',
      is_read: false,
      created_at: new Date().toISOString(),
    });
    this.writeJsonFile(path.join(process.cwd(), 'storage', 'user_notifications.json'), list);
  }

  public async markNotificationRead(userId: string, id: string): Promise<void> {
    const list = this.readJsonFile<any[]>(path.join(process.cwd(), 'storage', 'user_notifications.json'), []);
    const item = list.find((n) => n.userId === userId && n.id === id);
    if (item) {
      item.is_read = true;
      this.writeJsonFile(path.join(process.cwd(), 'storage', 'user_notifications.json'), list);
    }
  }

  public async clearUserNotifications(userId: string): Promise<void> {
    let list = this.readJsonFile<any[]>(path.join(process.cwd(), 'storage', 'user_notifications.json'), []);
    list = list.filter((n) => n.userId !== userId);
    this.writeJsonFile(path.join(process.cwd(), 'storage', 'user_notifications.json'), list);
  }

  // Audit Logging
  public async getAuditLogs(userId?: string): Promise<any[]> {
    const logs = this.readJsonFile<any[]>(path.join(process.cwd(), 'storage', 'audit_logs.json'), []);
    const normalized = logs.map((l) => ({
      id: l.id,
      user_id: l.user_id ?? l.userId,
      action: l.action,
      details: l.details,
      ip_address: l.ip_address ?? l.ipAddress ?? '127.0.0.1',
      created_at: l.created_at,
    }));
    if (userId) {
      return normalized.filter((l) => l.user_id === userId);
    }
    return normalized;
  }

  public async saveAuditLog(userId: string | null, action: string, details: any, ipAddress?: string): Promise<void> {
    const logs = this.readJsonFile<any[]>(path.join(process.cwd(), 'storage', 'audit_logs.json'), []);
    logs.push({
      id: Math.random().toString(36).substring(7),
      user_id: userId,
      userId,
      action,
      details,
      ip_address: ipAddress || '127.0.0.1',
      ipAddress: ipAddress || '127.0.0.1',
      created_at: new Date().toISOString(),
    });
    this.writeJsonFile(path.join(process.cwd(), 'storage', 'audit_logs.json'), logs);
  }

  // Feature Flags
  public async getFeatureFlags(): Promise<any[]> {
    const flags = this.readJsonFile<any[]>(path.join(process.cwd(), 'storage', 'feature_flags.json'), [
      { key: 'AI', enabled: true, description: 'AI Services' },
      { key: 'Email', enabled: true, description: 'Email Notifications' },
      { key: 'Reports', enabled: true, description: 'Reporting Generators' },
      { key: 'Dashboard', enabled: true, description: 'Real-time Dashboard' },
      { key: 'Notifications', enabled: true, description: 'In-app Notifications' },
      { key: 'Analytics', enabled: true, description: 'Analytics Charts' },
    ]);
    return flags;
  }

  public async getFeatureFlag(key: string): Promise<boolean> {
    const flags = await this.getFeatureFlags();
    const flag = flags.find((f) => f.key === key);
    return flag ? flag.enabled : true;
  }

  public async setFeatureFlag(key: string, enabled: boolean): Promise<void> {
    const flags = await this.getFeatureFlags();
    const flag = flags.find((f) => f.key === key);
    if (flag) {
      flag.enabled = enabled;
    } else {
      flags.push({ key, enabled, description: `${key} dynamic flag` });
    }
    this.writeJsonFile(path.join(process.cwd(), 'storage', 'feature_flags.json'), flags);
  }

  // Copilot Recommendations
  public async getCopilotRecommendations(userId: string): Promise<any[]> {
    const list = this.readJsonFile<any[]>(path.join(process.cwd(), 'storage', 'copilot_recommendations.json'), []);
    return list.filter((r) => r.user_id === userId);
  }

  public async saveCopilotRecommendations(userId: string, recommendations: any[]): Promise<void> {
    let list = this.readJsonFile<any[]>(path.join(process.cwd(), 'storage', 'copilot_recommendations.json'), []);
    list = list.filter((r) => r.user_id !== userId);
    list.push({ user_id: userId, recommendations, created_at: new Date().toISOString() });
    this.writeJsonFile(path.join(process.cwd(), 'storage', 'copilot_recommendations.json'), list);
  }

  // Learning Roadmaps (Skill Gap Engine)
  public async getLearningRoadmap(userId: string): Promise<any | null> {
    const list = this.readJsonFile<any[]>(path.join(process.cwd(), 'storage', 'learning_roadmaps.json'), []);
    const match = list.find((r) => r.user_id === userId);
    return match ? match.roadmap : null;
  }

  public async saveLearningRoadmap(userId: string, roadmap: any): Promise<void> {
    let list = this.readJsonFile<any[]>(path.join(process.cwd(), 'storage', 'learning_roadmaps.json'), []);
    list = list.filter((r) => r.user_id !== userId);
    list.push({ user_id: userId, roadmap, created_at: new Date().toISOString() });
    this.writeJsonFile(path.join(process.cwd(), 'storage', 'learning_roadmaps.json'), list);
  }

  // Mock Interview Sessions
  public async getInterviewSessions(userId: string): Promise<any[]> {
    const list = this.readJsonFile<any[]>(path.join(process.cwd(), 'storage', 'interview_sessions.json'), []);
    return list.filter((s) => s.user_id === userId);
  }

  public async saveInterviewSession(userId: string, session: any): Promise<void> {
    let list = this.readJsonFile<any[]>(path.join(process.cwd(), 'storage', 'interview_sessions.json'), []);
    const idx = list.findIndex((s) => s.id === session.id && s.user_id === userId);
    const item = { ...session, user_id: userId, created_at: session.created_at || new Date().toISOString() };
    if (idx !== -1) {
      list[idx] = item;
    } else {
      list.push(item);
    }
    this.writeJsonFile(path.join(process.cwd(), 'storage', 'interview_sessions.json'), list);
  }

  // Career Roadmaps
  public async getCareerRoadmap(userId: string): Promise<any | null> {
    const list = this.readJsonFile<any[]>(path.join(process.cwd(), 'storage', 'career_roadmaps.json'), []);
    const match = list.find((r) => r.user_id === userId);
    return match ? match.roadmap_data : null;
  }

  public async saveCareerRoadmap(userId: string, roadmap: any): Promise<void> {
    let list = this.readJsonFile<any[]>(path.join(process.cwd(), 'storage', 'career_roadmaps.json'), []);
    list = list.filter((r) => r.user_id !== userId);
    list.push({ user_id: userId, roadmap_data: roadmap, created_at: new Date().toISOString() });
    this.writeJsonFile(path.join(process.cwd(), 'storage', 'career_roadmaps.json'), list);
  }

  // Daily Briefs
  public async getDailyBrief(userId: string): Promise<any | null> {
    const list = this.readJsonFile<any[]>(path.join(process.cwd(), 'storage', 'daily_briefs.json'), []);
    const match = list.find((b) => b.user_id === userId);
    return match ? match.brief_data : null;
  }

  public async saveDailyBrief(userId: string, brief: any): Promise<void> {
    let list = this.readJsonFile<any[]>(path.join(process.cwd(), 'storage', 'daily_briefs.json'), []);
    list = list.filter((b) => b.user_id !== userId);
    list.push({ user_id: userId, brief_data: brief, created_at: new Date().toISOString() });
    this.writeJsonFile(path.join(process.cwd(), 'storage', 'daily_briefs.json'), list);
  }

  // Resume Profiles
  public async getResumeProfiles(userId: string): Promise<any[]> {
    const list = this.readJsonFile<any[]>(path.join(process.cwd(), 'storage', 'resume_profiles.json'), []);
    return list.filter((r) => r.user_id === userId);
  }

  public async saveResumeProfile(
    userId: string,
    profileName: string,
    content: string,
    pdfData?: string,
  ): Promise<void> {
    let list = this.readJsonFile<any[]>(path.join(process.cwd(), 'storage', 'resume_profiles.json'), []);
    const idx = list.findIndex((r) => r.user_id === userId && r.profile_name === profileName);
    const item = {
      id: idx !== -1 ? list[idx].id : Math.random().toString(36).substring(2, 11),
      user_id: userId,
      profile_name: profileName,
      content,
      pdf_data: pdfData,
      created_at: idx !== -1 ? list[idx].created_at : new Date().toISOString(),
    };
    if (idx !== -1) {
      list[idx] = item;
    } else {
      list.push(item);
    }
    this.writeJsonFile(path.join(process.cwd(), 'storage', 'resume_profiles.json'), list);
  }

  public async deleteResumeProfile(userId: string, id: string): Promise<void> {
    let list = this.readJsonFile<any[]>(path.join(process.cwd(), 'storage', 'resume_profiles.json'), []);
    list = list.filter((r) => !(r.id === id && r.user_id === userId));
    this.writeJsonFile(path.join(process.cwd(), 'storage', 'resume_profiles.json'), list);
  }

  // Application Queue
  public async getApplicationQueue(userId: string): Promise<any[]> {
    const list = this.readJsonFile<any[]>(path.join(process.cwd(), 'storage', 'application_queue.json'), []);
    return list.filter((a) => a.user_id === userId);
  }

  public async saveApplicationQueueItem(userId: string, item: any): Promise<void> {
    let list = this.readJsonFile<any[]>(path.join(process.cwd(), 'storage', 'application_queue.json'), []);
    const idx = list.findIndex((a) => a.id === item.id && a.user_id === userId);
    const record = {
      ...item,
      id: item.id || Math.random().toString(36).substring(2, 11),
      user_id: userId,
      created_at: item.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    if (idx !== -1) {
      list[idx] = record;
    } else {
      list.push(record);
    }
    this.writeJsonFile(path.join(process.cwd(), 'storage', 'application_queue.json'), list);
  }

  public async deleteApplicationQueueItem(userId: string, id: string): Promise<void> {
    let list = this.readJsonFile<any[]>(path.join(process.cwd(), 'storage', 'application_queue.json'), []);
    list = list.filter((a) => !(a.id === id && a.user_id === userId));
    this.writeJsonFile(path.join(process.cwd(), 'storage', 'application_queue.json'), list);
  }

  // Recruiters CRM
  public async getRecruiters(userId: string): Promise<any[]> {
    const list = await this.getReferrals(userId);
    return list.filter((r) => r.category === 'Recruiter');
  }

  public async saveRecruiter(userId: string, recruiter: any): Promise<void> {
    const referral = {
      ...recruiter,
      userId,
      category: 'Recruiter',
      role: recruiter.role || 'Recruiter',
      linkedin_url: recruiter.linkedin_url || recruiter.linkedin,
    };
    await this.saveReferral(userId, referral);
  }

  public async deleteRecruiter(userId: string, id: string): Promise<void> {
    await this.deleteReferral(userId, id);
  }

  // Referrals CRM
  public async getReferrals(userId: string): Promise<any[]> {
    const list = this.readJsonFile<any[]>(path.join(process.cwd(), 'storage', 'referrals.json'), []);
    return list.filter((r) => r.userId === userId);
  }

  public async saveReferral(userId: string, referral: any): Promise<void> {
    let list = this.readJsonFile<any[]>(path.join(process.cwd(), 'storage', 'referrals.json'), []);
    const idx = list.findIndex((r) => r.id === referral.id && r.userId === userId);
    const record = {
      ...referral,
      id: referral.id || Math.random().toString(36).substring(2, 11),
      userId,
      createdAt: referral.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    if (idx !== -1) {
      list[idx] = record;
    } else {
      list.push(record);
    }
    this.writeJsonFile(path.join(process.cwd(), 'storage', 'referrals.json'), list);
  }

  public async deleteReferral(userId: string, id: string): Promise<void> {
    let list = this.readJsonFile<any[]>(path.join(process.cwd(), 'storage', 'referrals.json'), []);
    list = list.filter((r) => !(r.id === id && r.userId === userId));
    this.writeJsonFile(path.join(process.cwd(), 'storage', 'referrals.json'), list);
  }

  public async updateReferralStatus(userId: string, id: string, status: string): Promise<void> {
    let list = this.readJsonFile<any[]>(path.join(process.cwd(), 'storage', 'referrals.json'), []);
    const idx = list.findIndex((r) => r.id === id && r.userId === userId);
    if (idx !== -1) {
      list[idx].connectionStatus = status;
      list[idx].updatedAt = new Date().toISOString();
      this.writeJsonFile(path.join(process.cwd(), 'storage', 'referrals.json'), list);
    }
  }

  public async getReferralsByCategory(userId: string, category: string): Promise<any[]> {
    const list = this.readJsonFile<any[]>(path.join(process.cwd(), 'storage', 'referrals.json'), []);
    return list.filter((r) => r.userId === userId && r.category === category);
  }

  public async getReferralAnalytics(userId: string): Promise<any> {
    const list = this.readJsonFile<any[]>(path.join(process.cwd(), 'storage', 'referrals.json'), []);
    const userReferrals = list.filter((r) => r.userId === userId);

    const totalContacts = userReferrals.length;
    const connectionsSent = userReferrals.filter((r) => r.connectionStatus === 'Connection Sent').length;
    const acceptedConnections = userReferrals.filter((r) => r.connectionStatus === 'Connected').length;
    const referralRequests = userReferrals.filter((r) => r.connectionStatus === 'Referral Requested').length;
    const referralsReceived = userReferrals.filter((r) => r.connectionStatus === 'Referral Submitted').length;
    const interviewsViaReferrals = userReferrals.filter((r) => r.connectionStatus === 'Interview').length;
    const offersViaReferrals = userReferrals.filter((r) => r.connectionStatus === 'Offer').length;

    const successRate = referralRequests > 0 ? (referralsReceived / referralRequests) * 100 : 0;

    const companyCounts: Record<string, number> = {};
    userReferrals.forEach((r) => {
      companyCounts[r.company] = (companyCounts[r.company] || 0) + 1;
    });
    const topCompanies = Object.entries(companyCounts)
      .map(([company, count]) => ({ company, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const categoryCounts: Record<string, number> = {};
    userReferrals.forEach((r) => {
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
    const list = this.readJsonFile<any[]>(path.join(process.cwd(), 'storage', 'calendar_events.json'), []);
    return list.filter((e) => e.user_id === userId);
  }

  public async saveCalendarEvent(userId: string, event: any): Promise<void> {
    let list = this.readJsonFile<any[]>(path.join(process.cwd(), 'storage', 'calendar_events.json'), []);
    const idx = list.findIndex((e) => e.id === event.id && e.user_id === userId);
    const record = {
      ...event,
      id: event.id || Math.random().toString(36).substring(2, 11),
      user_id: userId,
      created_at: event.created_at || new Date().toISOString(),
    };
    if (idx !== -1) {
      list[idx] = record;
    } else {
      list.push(record);
    }
    this.writeJsonFile(path.join(process.cwd(), 'storage', 'calendar_events.json'), list);
  }

  public async deleteCalendarEvent(userId: string, id: string): Promise<void> {
    let list = this.readJsonFile<any[]>(path.join(process.cwd(), 'storage', 'calendar_events.json'), []);
    list = list.filter((e) => !(e.id === id && e.user_id === userId));
    this.writeJsonFile(path.join(process.cwd(), 'storage', 'calendar_events.json'), list);
  }

  // Exports
  public async getExports(userId: string): Promise<any[]> {
    const list = this.readJsonFile<any[]>(path.join(process.cwd(), 'storage', 'exports.json'), []);
    return list.filter((e) => e.user_id === userId);
  }

  public async saveExport(userId: string, exportItem: any): Promise<void> {
    let list = this.readJsonFile<any[]>(path.join(process.cwd(), 'storage', 'exports.json'), []);
    const idx = list.findIndex((e) => e.id === exportItem.id && e.user_id === userId);
    const record = {
      ...exportItem,
      id: exportItem.id || Math.random().toString(36).substring(2, 11),
      user_id: userId,
      created_at: exportItem.created_at || new Date().toISOString(),
    };
    if (idx !== -1) {
      list[idx] = record;
    } else {
      list.push(record);
    }
    this.writeJsonFile(path.join(process.cwd(), 'storage', 'exports.json'), list);
  }

  public async deleteExport(userId: string, id: string): Promise<void> {
    let list = this.readJsonFile<any[]>(path.join(process.cwd(), 'storage', 'exports.json'), []);
    list = list.filter((e) => !(e.id === id && e.user_id === userId));
    this.writeJsonFile(path.join(process.cwd(), 'storage', 'exports.json'), list);
  }

  // Cover Letters
  public async getCoverLetters(userId: string): Promise<any[]> {
    const list = this.readJsonFile<any[]>(path.join(process.cwd(), 'storage', 'cover_letters.json'), []);
    return list.filter((e) => e.user_id === userId);
  }

  public async saveCoverLetter(userId: string, coverLetter: any): Promise<void> {
    let list = this.readJsonFile<any[]>(path.join(process.cwd(), 'storage', 'cover_letters.json'), []);
    const idx = list.findIndex((e) => e.id === coverLetter.id && e.user_id === userId);
    const record = {
      ...coverLetter,
      id: coverLetter.id || Math.random().toString(36).substring(2, 11),
      user_id: userId,
      created_at: coverLetter.created_at || new Date().toISOString(),
    };
    if (idx !== -1) {
      list[idx] = record;
    } else {
      list.push(record);
    }
    this.writeJsonFile(path.join(process.cwd(), 'storage', 'cover_letters.json'), list);
  }

  public async deleteCoverLetter(userId: string, id: string): Promise<void> {
    let list = this.readJsonFile<any[]>(path.join(process.cwd(), 'storage', 'cover_letters.json'), []);
    list = list.filter((e) => !(e.id === id && e.user_id === userId));
    this.writeJsonFile(path.join(process.cwd(), 'storage', 'cover_letters.json'), list);
  }

  // V1.1 Offers
  public async getOffers(userId: string): Promise<Offer[]> {
    const list = this.readJsonFile<any[]>(path.join(process.cwd(), 'storage', 'offers.json'), []);
    return list.filter((o) => o.userId === userId || o.user_id === userId);
  }

  public async getOfferByApplicationId(applicationId: string): Promise<Offer | null> {
    const list = this.readJsonFile<any[]>(path.join(process.cwd(), 'storage', 'offers.json'), []);
    return list.find((o) => o.applicationId === applicationId || o.application_id === applicationId) || null;
  }

  public async saveOffer(userId: string, offer: Offer): Promise<void> {
    const filePath = path.join(process.cwd(), 'storage', 'offers.json');
    const list = this.readJsonFile<any[]>(filePath, []);
    const idx = list.findIndex((o) => o.id === offer.id);
    const item = { ...offer, userId, updatedAt: new Date().toISOString() };
    if (idx >= 0) {
      list[idx] = item;
    } else {
      list.push(item);
    }
    this.writeJsonFile(filePath, list);
  }

  public async deleteOffer(userId: string, id: string): Promise<void> {
    const filePath = path.join(process.cwd(), 'storage', 'offers.json');
    let list = this.readJsonFile<any[]>(filePath, []);
    list = list.filter((o) => !(o.id === id && (o.userId === userId || o.user_id === userId)));
    this.writeJsonFile(filePath, list);
  }

  // V1.1 Follow-Ups
  public async getFollowUps(userId: string): Promise<FollowUp[]> {
    const list = this.readJsonFile<any[]>(path.join(process.cwd(), 'storage', 'followups.json'), []);
    return list.filter((f) => f.userId === userId || f.user_id === userId);
  }

  public async saveFollowUp(userId: string, followUp: FollowUp): Promise<void> {
    const filePath = path.join(process.cwd(), 'storage', 'followups.json');
    const list = this.readJsonFile<any[]>(filePath, []);
    const idx = list.findIndex((f) => f.id === followUp.id);
    const item = { ...followUp, userId, updatedAt: new Date().toISOString() };
    if (idx >= 0) {
      list[idx] = item;
    } else {
      list.push(item);
    }
    this.writeJsonFile(filePath, list);
  }

  public async deleteFollowUp(userId: string, id: string): Promise<void> {
    const filePath = path.join(process.cwd(), 'storage', 'followups.json');
    let list = this.readJsonFile<any[]>(filePath, []);
    list = list.filter((f) => !(f.id === id && (f.userId === userId || f.user_id === userId)));
    this.writeJsonFile(filePath, list);
  }

  // V1.1 Notification Preferences
  public async getNotificationPreference(userId: string): Promise<NotificationPreference | null> {
    const list = this.readJsonFile<any[]>(path.join(process.cwd(), 'storage', 'notification_preferences.json'), []);
    return list.find((p) => p.userId === userId || p.user_id === userId) || null;
  }

  public async saveNotificationPreference(userId: string, pref: NotificationPreference): Promise<void> {
    const filePath = path.join(process.cwd(), 'storage', 'notification_preferences.json');
    const list = this.readJsonFile<any[]>(filePath, []);
    const idx = list.findIndex((p) => p.userId === userId || p.user_id === userId);
    const item = { ...pref, userId, updatedAt: new Date().toISOString() };
    if (idx >= 0) {
      list[idx] = item;
    } else {
      list.push(item);
    }
    this.writeJsonFile(filePath, list);
  }

  // V1.1 Visa Sponsors
  public async getVisaSponsor(companyName: string): Promise<VisaSponsor | null> {
    const list = this.readJsonFile<any[]>(path.join(process.cwd(), 'storage', 'visa_sponsors.json'), []);
    const norm = companyName.trim().toLowerCase();
    return list.find((v) => v.normalizedName === norm || v.companyName.toLowerCase() === norm) || null;
  }

  public async searchVisaSponsors(query: string): Promise<VisaSponsor[]> {
    const list = this.readJsonFile<any[]>(path.join(process.cwd(), 'storage', 'visa_sponsors.json'), []);
    const q = query.trim().toLowerCase();
    return list.filter((v) => v.companyName.toLowerCase().includes(q) || v.normalizedName.includes(q));
  }

  public async saveVisaSponsor(sponsor: VisaSponsor): Promise<void> {
    const filePath = path.join(process.cwd(), 'storage', 'visa_sponsors.json');
    const list = this.readJsonFile<any[]>(filePath, []);
    const idx = list.findIndex((v) => v.id === sponsor.id);
    if (idx >= 0) {
      list[idx] = sponsor;
    } else {
      list.push(sponsor);
    }
    this.writeJsonFile(filePath, list);
  }

  // Extension Jobs
  public async saveExtensionJob(job: SavedExtensionJob): Promise<SavedExtensionJob> {
    const filePath = path.join(process.cwd(), 'storage', 'extension_saved_jobs.json');
    const list = this.readJsonFile<SavedExtensionJob[]>(filePath, []);
    const record: SavedExtensionJob = {
      ...job,
      id: job.id || `ext-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: job.createdAt || new Date().toISOString(),
      status: job.status || 'Captured',
    };
    list.push(record);
    this.writeJsonFile(filePath, list);
    return record;
  }

  public async getExtensionJobs(userId?: string): Promise<SavedExtensionJob[]> {
    const filePath = path.join(process.cwd(), 'storage', 'extension_saved_jobs.json');
    const list = this.readJsonFile<SavedExtensionJob[]>(filePath, []);
    if (userId) {
      return list.filter((j) => j.userId === userId);
    }
    return list;
  }
}
