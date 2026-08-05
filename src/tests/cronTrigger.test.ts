import { jest } from '@jest/globals';

let serverInstance: any;
let mockRunOrchestratorCalled = false;

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

// Mock runOrchestrator
jest.unstable_mockModule('../core/index.js', () => {
  return {
    runOrchestrator: async () => {
      mockRunOrchestratorCalled = true;
    },
  };
});

describe('Secure Cron Trigger Webhook API Integration Tests', () => {
  let client: any;
  const testPort = '4600';

  beforeAll(async () => {
    process.env.PORT = testPort;
    process.env.NODE_ENV = 'development';
    process.env.CRON_SECRET = 'my_test_secret_token';
    process.env.SUPABASE_URL = '';
    process.env.SUPABASE_SERVICE_KEY = '';

    // Load server
    await import('../server.js');

    // Import HttpClient dynamically to avoid loading before mock setup
    const { HttpClient } = await import('../core/HttpClient.js');
    client = new HttpClient();
  });

  afterAll(async () => {
    if (serverInstance) {
      await new Promise<void>((resolve) => {
        serverInstance.close(() => resolve());
      });
    }
  });

  beforeEach(() => {
    mockRunOrchestratorCalled = false;
  });

  it('should reject requests with missing token', async () => {
    await expect(
      client.request(`http://localhost:${testPort}/api/monitoring/cron-trigger`, {
        method: 'POST',
        retries: 1,
      }),
    ).rejects.toThrow();
    expect(mockRunOrchestratorCalled).toBe(false);
  });

  it('should reject requests with invalid token', async () => {
    await expect(
      client.request(`http://localhost:${testPort}/api/monitoring/cron-trigger?token=wrong_token`, {
        method: 'POST',
        retries: 1,
      }),
    ).rejects.toThrow();
    expect(mockRunOrchestratorCalled).toBe(false);
  });

  it('should accept requests with valid token in query param and trigger orchestrator', async () => {
    const res = await client.request(
      `http://localhost:${testPort}/api/monitoring/cron-trigger?token=my_test_secret_token`,
      {
        method: 'POST',
        retries: 1,
      },
    );

    expect(res.status).toBe(200);
    expect(res.data).toHaveProperty('success', true);
    expect(res.data.message).toContain('triggered via webhook successfully');
    
    // Give a brief moment for async task to trigger
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(mockRunOrchestratorCalled).toBe(true);
  });

  it('should accept requests with valid token in headers and trigger orchestrator', async () => {
    const res = await client.request(
      `http://localhost:${testPort}/api/monitoring/cron-trigger`,
      {
        method: 'POST',
        headers: {
          'x-cron-token': 'my_test_secret_token',
        },
        retries: 1,
      },
    );

    expect(res.status).toBe(200);
    expect(res.data).toHaveProperty('success', true);
    expect(res.data.message).toContain('triggered via webhook successfully');
    
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(mockRunOrchestratorCalled).toBe(true);
  });
});

