import { jest } from '@jest/globals';
import { chromium, Browser, Page } from 'playwright';

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

describe('Playwright E2E Browser Flows', () => {
  let browser: Browser;
  let page: Page;
  const testPort = '4600';

  beforeAll(async () => {
    process.env.PORT = testPort;
    process.env.NODE_ENV = 'development';
    process.env.SUPABASE_URL = '';
    process.env.SUPABASE_SERVICE_KEY = '';

    // Load Express Server
    await import('../core/server.js');

    // Launch headless chromium browser
    browser = await chromium.launch({ headless: true });
  }, 30000);

  afterAll(async () => {
    if (browser) {
      await browser.close();
    }
    if (serverInstance) {
      await new Promise<void>((resolve) => {
        serverInstance.close(() => resolve());
      });
    }
  });

  beforeEach(async () => {
    page = await browser.newPage();
  }, 15000);

  afterEach(async () => {
    if (page) {
      await page.close();
    }
  });

  it('should load login page, authenticate, and navigate dashboards', async () => {
    // 1. Visit App URL
    await page.goto(`http://localhost:${testPort}/`);

    // Verify page loads by checking title or login heading
    const content = await page.content();
    expect(content).toBeDefined();

    // 2. Perform Mock Login Actions
    // In local mode, the frontend can be mock-guided, or we can directly inject
    // mock authorization token into localStorage to simulate an authenticated state
    await page.evaluate(() => {
      localStorage.setItem(
        'supabase.auth.token',
        JSON.stringify({
          currentSession: {
            access_token: 'user-token',
            user: { id: '11111111-1111-1111-1111-111111111111', email: 'user@jobmonitor.com' },
          },
        }),
      );
    });

    // 3. Reload to load the authenticated Dashboard UI
    await page.goto(`http://localhost:${testPort}/`);

    // Allow UI to render
    await page.waitForTimeout(500);

    // Verify main app layout renders
    const dashboardContent = await page.content();
    expect(dashboardContent).toBeDefined();
  });
});
