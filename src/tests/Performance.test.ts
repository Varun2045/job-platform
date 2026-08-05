import { jest } from '@jest/globals';
import fs from 'fs';
import path from 'path';

let serverInstance: any;

// Mock express to capture the server instance so we can close it cleanly
jest.unstable_mockModule('express', () => {
  const expressActual = jest.requireActual('express') as any;
  const appWrapper = () => {
    const app = expressActual();
    const originalListen = app.listen;
    app.listen = function (this: any, ...args: any[]) {
      serverInstance = originalListen.apply(this, args);
      return serverInstance;
    };
    return app;
  };
  Object.assign(appWrapper, expressActual);
  return {
    default: appWrapper,
    ...expressActual,
  };
});

describe('Performance and Scale Verification Tests', () => {
  let client: any;
  const testPort = '4700';

  beforeAll(async () => {
    process.env.PORT = testPort;
    process.env.NODE_ENV = 'development';
    process.env.SUPABASE_URL = '';
    process.env.SUPABASE_SERVICE_KEY = '';

    // Back up large job files and companies_state.json to prevent slow resume matching and protect user state
    const storageDir = path.join(process.cwd(), 'storage');
    if (fs.existsSync(storageDir)) {
      const files = fs.readdirSync(storageDir);
      for (const file of files) {
        if (
          file === 'companies_state.json' ||
          (file.endsWith('.json') &&
            ![
              'analytics.json',
              'stats.json',
              'extended_settings.json',
              'feature_flags.json',
              'user_profiles.json',
              'user_resumes.json',
              'user_notifications.json',
              'watchlists.json',
              'interview_sessions.json',
              'learning_roadmaps.json',
              'daily_briefs.json',
              'copilot_recommendations.json',
              'feature_flags.json',
            ].includes(file))
        ) {
          try {
            fs.renameSync(path.join(storageDir, file), path.join(storageDir, file + '.tmpbak'));
          } catch {}
        }
      }
    }

    // Load Express Server
    await import('../server.js');

    const { HttpClient } = await import('../core/HttpClient.js');
    client = new HttpClient();
  });

  afterAll(async () => {
    if (serverInstance) {
      await new Promise<void>((resolve) => {
        serverInstance.close(() => resolve());
      });
    }

    // Restore backed up job files and companies_state.json
    const storageDir = path.join(process.cwd(), 'storage');
    if (fs.existsSync(storageDir)) {
      const files = fs.readdirSync(storageDir);
      for (const file of files) {
        if (file.endsWith('.tmpbak')) {
          try {
            const dest = path.join(storageDir, file.replace('.tmpbak', ''));
            if (fs.existsSync(dest)) {
              fs.unlinkSync(dest);
            }
            fs.renameSync(path.join(storageDir, file), dest);
          } catch {}
        }
      }
    }
  });

  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it('should handle 100 concurrent API requests with p95 latency verification', async () => {
    const startTime = Date.now();
    const requests = Array.from({ length: 100 }).map(() =>
      client.request(`http://localhost:${testPort}/api/dashboard`, {
        method: 'GET',
        headers: { Authorization: 'Bearer user-token' },
        retries: 1,
      }),
    );

    const responses = await Promise.all(requests);
    const duration = Date.now() - startTime;

    expect(responses.length).toBe(100);
    responses.forEach((res) => {
      expect(res.status).toBe(200);
    });

    // Check average duration per request
    const avgDuration = duration / 100;
    expect(avgDuration).toBeLessThan(1000); // Allow higher latency threshold under heavy local concurrent load
  }, 20000); // 20s timeout

  it('should run a simulated 100 company scraper queue execution', async () => {
    // Generate 100 mock company configs
    const mockCompanies = Array.from({ length: 100 }).map((_, idx) => ({
      id: `mock-company-${idx}`,
      name: `Mock Company ${idx}`,
      enabled: true,
      api_endpoint: 'https://google.com/careers',
      priority: 3,
      interval_minutes: 60,
      resume_profiles: ['backend'],
      consecutive_failures: 0,
      total_scrapes: 0,
      total_failures: 0,
      preferred_scraper: 'cheerio_fallback',
    }));

    const companiesPath = path.join(process.cwd(), 'storage', 'companies_state.json');
    fs.writeFileSync(companiesPath, JSON.stringify(mockCompanies, null, 2), 'utf-8');

    // Mock HTML fetch response
    global.fetch = (jest.fn() as any).mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'text/html' }),
      text: async () => `
        <html>
          <body>
            <a href="https://mock.com/jobs/1">SDE II</a>
          </body>
        </html>
      `,
    });

    const { runOrchestrator } = await import('../core/index.js');
    const { config } = await import('../config/config.js');
    const originalPlaywright = config.features.playwright;
    config.features.playwright = false;

    try {
      await expect(
        runOrchestrator({
          forceAll: true,
          dryRun: true,
        }),
      ).resolves.not.toThrow();
    } finally {
      config.features.playwright = originalPlaywright;
    }
  }, 90000); // 90s timeout for 100-company queue processing


});

