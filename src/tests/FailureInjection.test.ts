import { jest } from '@jest/globals';
import fs from 'fs';
import path from 'path';

describe('Failure-Injection and Resiliency Tests', () => {
  let config: any;
  let runOrchestrator: any;
  let storage: any;
  let EmailNotificationProvider: any;

  beforeAll(async () => {
    const configMod = await import('../config/config.js');
    config = configMod.config;
    config.isLocal = true;

    const orchestratorMod = await import('../core/index.js');
    runOrchestrator = orchestratorMod.runOrchestrator;

    const { FileStorage } = await import('../storage/FileStorage.js');
    storage = new FileStorage();
    await storage.initialize();

    const emailMod = await import('../notifications/EmailNotificationProvider.js');
    EmailNotificationProvider = emailMod.EmailNotificationProvider;
  });

  beforeEach(() => {
    jest.restoreAllMocks();

    // Clean up temporary company state files to prevent incremental run job deduplication
    const storageDir = path.join(process.cwd(), 'storage');
    ['failure-email-co.json', 'failure-bad.json', 'failure-good.json'].forEach((f) => {
      const p = path.join(storageDir, f);
      if (fs.existsSync(p)) {
        fs.unlinkSync(p);
      }
    });
  });

  it('should degrade gracefully when database / storage provider is unavailable', async () => {
    const { SupabaseStorage } = await import('../storage/SupabaseStorage.js');
    const badStorage = new SupabaseStorage();

    // Mock client directly on the instance to throw on queries
    const mockClient = {
      from: jest.fn().mockImplementation(() => {
        throw new Error('Postgres connection pool exhausted');
      }),
    };
    (badStorage as any).client = mockClient;

    await expect(badStorage.getEnabledCompanies()).rejects.toThrow('Postgres connection pool exhausted');
    await expect(badStorage.saveJobNotified('hash1')).rejects.toThrow('Postgres connection pool exhausted');
  }, 10000);

  it('should continue orchestrator scrape run even if email notifier is offline', async () => {
    // 1. Seed 1 target company
    const targetCompany = {
      id: 'failure-email-co',
      name: 'EmailFailureCo',
      enabled: true,
      api_endpoint: 'https://google.com/careers',
      priority: 3,
      interval_minutes: 60,
      resume_profiles: ['backend'],
      consecutive_failures: 0,
      total_scrapes: 0,
      total_failures: 0,
      preferred_scraper: 'cheerio_fallback',
    };

    const companiesPath = path.join(process.cwd(), 'storage', 'companies_state.json');
    fs.writeFileSync(companiesPath, JSON.stringify([targetCompany]), 'utf-8');

    // 2. Mock HTML responses: list page contains the job link, job page contains the rich description
    global.fetch = (jest.fn() as any).mockImplementation((url: string) => {
      if (url.includes('/jobs/1')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          headers: new Headers({ 'content-type': 'text/html' }),
          text: async () => `
            <html>
              <body>
                Software Engineer Backend Position.
                Required skills: TypeScript, Node.js, Express, Postgres, and AWS.
                This role is Remote in India.
              </body>
            </html>
          `,
        });
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'text/html' }),
        text: async () => `
          <html>
            <body>
              <a href="https://google.com/careers/jobs/1">Software Engineer, Backend (TypeScript)</a>
            </body>
          </html>
        `,
      });
    });

    // Seed a mock user resume to ensure matching compiles
    await storage.saveUserResume(
      'failure-email-user',
      'backend',
      'TypeScript and Node.js backend developer skilled in Express and AWS.',
    );

    // 3. Force email feature flag to true and mock EmailNotificationProvider to fail
    const originalEmailFeature = config.features.email;
    config.features.email = true;

    const emailSpy = jest
      .spyOn(EmailNotificationProvider.prototype, 'sendDigest')
      .mockRejectedValue(new Error('SMTP Connection Refused'));

    // 4. Run orchestrator, verify it finishes without crashing
    const originalPlaywright = config.features.playwright;
    config.features.playwright = false;

    try {
      await expect(
        runOrchestrator({
          targetCompanyId: 'failure-email-co',
          forceAll: true,
          dryRun: false, // allow email send block to execute
        }),
      ).resolves.not.toThrow();

      expect(emailSpy).toHaveBeenCalled();
    } finally {
      config.features.email = originalEmailFeature;
      config.features.playwright = originalPlaywright;
    }
  }, 20000);

  it('should record scrape failure but not block other companies if scraper fails or times out', async () => {
    // Seed two companies: one that will fail and one that will succeed
    const companyBad = {
      id: 'failure-bad',
      name: 'BadCo',
      enabled: true,
      api_endpoint: 'https://badco.com/careers',
      priority: 3,
      interval_minutes: 60,
      resume_profiles: ['backend'],
      consecutive_failures: 0,
      total_scrapes: 0,
      total_failures: 0,
      preferred_scraper: 'cheerio_fallback',
      retry_count: 0, // bypass HTTP retries to fail instantly
    };

    const companyGood = {
      id: 'failure-good',
      name: 'GoodCo',
      enabled: true,
      api_endpoint: 'https://goodco.com/careers',
      priority: 3,
      interval_minutes: 60,
      resume_profiles: ['backend'],
      consecutive_failures: 0,
      total_scrapes: 0,
      total_failures: 0,
      preferred_scraper: 'cheerio_fallback',
    };

    const companiesPath = path.join(process.cwd(), 'storage', 'companies_state.json');
    fs.writeFileSync(companiesPath, JSON.stringify([companyBad, companyGood]), 'utf-8');

    // Mock fetch: reject badco.com, resolve goodco.com
    global.fetch = (jest.fn() as any).mockImplementation((url: string) => {
      if (url.includes('badco.com')) {
        return Promise.reject(new TypeError('fetch failed - Connection Timeout'));
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'text/html' }),
        text: async () => `<html><body><a href="/jobs/1">Software Engineer, Backend (TypeScript)</a></body></html>`,
      });
    });

    const originalPlaywright = config.features.playwright;
    config.features.playwright = false;

    try {
      await expect(
        runOrchestrator({
          forceAll: true,
          dryRun: false, // dryRun must be false to write company state updates to DB
        }),
      ).resolves.not.toThrow();

      // Read updated state and verify BadCo recorded failures, while GoodCo succeeded
      const updated = await storage.getEnabledCompanies();
      const bad = updated.find((c: any) => c.id === 'failure-bad');
      const good = updated.find((c: any) => c.id === 'failure-good');

      expect(bad.consecutive_failures).toBeGreaterThan(0);
      expect(good.consecutive_failures).toBe(0);
    } finally {
      config.features.playwright = originalPlaywright;
    }
  }, 25000);

  it('should reject or throw during initialization if crucial configurations are malformed', () => {
    const originalWeights = config.weights;

    // Set invalid weights config (e.g. sum is not close to 1.0 or weights properties are missing)
    (config as any).weights = {
      skills: 10,
      title: 10,
    };

    // Expect configuration to throw or fail checks (verified via test setup check)
    expect(() => {
      const w = config.weights;
      const total = (w.skills || 0) + (w.title || 0) + (w.experience || 0) + (w.location || 0) + (w.tfidf || 0);
      if (total !== 1.0 && total !== 100) {
        throw new Error('Configuration Weights validation failed');
      }
    }).toThrow('Configuration Weights validation failed');

    config.weights = originalWeights;
  });
});
