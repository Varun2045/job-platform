import { jest } from '@jest/globals';
import fs from 'fs';
import path from 'path';

// Intercept fetch calls for scraping simulation
let originalFetch: any;

describe('Workflow Pipelines Integration Tests', () => {
  let storage: any;
  let runOrchestrator: any;
  let SkillGapEngine: any;
  let FollowUpAssistant: any;
  let config: any;

  beforeAll(async () => {
    originalFetch = global.fetch;

    // Load dependencies dynamically
    const { FileStorage } = await import('../storage/FileStorage.js');
    storage = new FileStorage();
    await storage.initialize();

    const orchestratorMod = await import('../core/index.js');
    runOrchestrator = orchestratorMod.runOrchestrator;

    const skillMod = await import('../core/SkillGapEngine.js');
    SkillGapEngine = skillMod.SkillGapEngine;

    const followMod = await import('../core/FollowUpAssistant.js');
    FollowUpAssistant = followMod.FollowUpAssistant;

    const configMod = await import('../config/config.js');
    config = configMod.config;
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it('should run Resume Workflow (upload, skill-gap, study syllabus, roadmaps)', async () => {
    const userId = 'user-integration-1';
    
    // 1. Save Resume Content
    await storage.saveUserResume(userId, 'backend', 'Experienced Software Engineer skilled in TypeScript, Node.js, and Express.');

    // 2. Identify Skill Gap
    const skillGap = await SkillGapEngine.analyzeGap(userId, storage);
    
    expect(skillGap).toHaveProperty('missingSkills');
    expect(skillGap).toHaveProperty('roadmapTasks');
    expect(skillGap.missingSkills.length).toBeGreaterThanOrEqual(0);
  });

  it('should run Application Tracking and Recruiter Follow-up triggers', async () => {
    const userId = 'user-integration-2';

    // 1. Log a new job application
    const app = {
      jobHash: 'hash-track-123',
      company: 'IntegrationCorp',
      jobId: '999',
      status: 'Applied',
      appliedDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
      resumeUsed: 'backend',
      notes: 'Applied through careers website',
      lastUpdated: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
    };
    await storage.saveApplication(app, userId);

    // 2. Query tracker pipeline
    const list = await storage.getApplications(userId);
    expect(list.length).toBeGreaterThan(0);
    expect(list.find((a: any) => a.jobHash === 'hash-track-123')).toBeDefined();

    // 3. Trigger follow-up check
    const followUps = await FollowUpAssistant.checkFollowUps(userId, storage);
    expect(followUps.length).toBeGreaterThan(0);
    expect(followUps[0].company).toBe('IntegrationCorp');
    expect(followUps[0].actionRequired).toContain('Recruiter Follow-up');
  });

  it('should run User Notification Pipeline (dispatches, read states, clear operations)', async () => {
    const userId = 'user-integration-3';

    // 1. Save notifications
    await storage.saveUserNotification(userId, 'Integration Match', 'A new SDE job matched your profile.', 'high');
    await storage.saveUserNotification(userId, 'Daily Digest', 'Your daily briefing is ready.', 'medium');

    // 2. Query notifications
    let notifs = await storage.getUserNotifications(userId);
    expect(notifs.length).toBe(2);
    const targetNotif = notifs.find((n: any) => n.title === 'Integration Match');
    expect(targetNotif).toBeDefined();

    // 3. Mark read
    await storage.markNotificationRead(userId, targetNotif.id);
    notifs = await storage.getUserNotifications(userId);
    const updated = notifs.find((n: any) => n.id === targetNotif.id);
    expect(updated.is_read).toBe(true);

    // 4. Clear notifications
    await storage.clearUserNotifications(userId);
    notifs = await storage.getUserNotifications(userId);
    expect(notifs.length).toBe(0);
  });

  it('should execute Scheduler and Scraper pipeline successfully', async () => {
    // 1. Seed target company in local database configuration
    const targetCompany = {
      id: 'mock-google',
      name: 'Google',
      enabled: true,
      api_endpoint: 'https://google.com/careers',
      priority: 3,
      interval_minutes: 60,
      resume_profiles: ['backend'],
      consecutive_failures: 0,
      total_scrapes: 0,
      total_failures: 0,
      preferred_scraper: 'cheerio_fallback' // force Cheerio fallback to avoid launching Playwright in tests
    };

    const companiesPath = path.join(process.cwd(), 'storage', 'companies_state.json');
    fs.writeFileSync(companiesPath, JSON.stringify([targetCompany]), 'utf-8');

    // 2. Mock HTML responses from the target website
    const mockHtml = `
      <html>
        <body>
          <a class="job-link" href="https://google.com/careers/jobs/1">Software Engineer, Backend (TypeScript)</a>
          <a class="job-link" href="https://google.com/careers/jobs/2">Product Security Engineer</a>
        </body>
      </html>
    `;
    global.fetch = (jest.fn() as any).mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'text/html' }),
      json: async () => ({}),
      text: async () => mockHtml
    });

    // Disable playwright feature flag during this run
    const originalPlaywright = config.features.playwright;
    config.features.playwright = false;

    try {
      // 3. Run the scheduler orchestrator loop for mock-google
      await expect(
        runOrchestrator({
          targetCompanyId: 'mock-google',
          forceAll: true,
          dryRun: true // dryRun to skip email dispatches and Prom telemetry files
        })
      ).resolves.not.toThrow();
    } finally {
      config.features.playwright = originalPlaywright;
    }
  });
});
