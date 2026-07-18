import { jest } from '@jest/globals';

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

describe('Express REST API Server Integration Tests', () => {
  let client: any;
  const testPort = '4500';

  beforeAll(async () => {
    process.env.PORT = testPort;
    process.env.NODE_ENV = 'development';
    process.env.SUPABASE_URL = '';
    process.env.SUPABASE_SERVICE_KEY = '';
    process.env.LOCAL_ADMIN_EMAIL = 'admin@jobmonitor.com';
    process.env.LOCAL_ADMIN_PASSWORD = 'admin123';
    process.env.LOCAL_USER_EMAIL = 'user@jobmonitor.com';
    process.env.LOCAL_USER_PASSWORD = 'user123';
    process.env.LOCAL_VIEWER_EMAIL = 'viewer@jobmonitor.com';
    process.env.LOCAL_VIEWER_PASSWORD = 'viewer123';

    // Load server which triggers app.listen on testPort
    await import('../core/server.js');

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

  it('should reject requests without authorization token on protected routes', async () => {
    // Dynamically toggle config.isLocal to false to trigger auth checks
    const { config } = await import('../config/config.js');
    config.isLocal = false;

    try {
      await expect(
        client.request(`http://localhost:${testPort}/api/dashboard`, {
          method: 'GET',
          retries: 1,
        }),
      ).rejects.toThrow();
    } finally {
      config.isLocal = true;
    }
  });

  it('should authenticate user with valid credentials', async () => {
    // POST /api/auth/login
    const res = await client.request(`http://localhost:${testPort}/api/auth/login`, {
      method: 'POST',
      body: {
        email: 'user@jobmonitor.com',
        password: 'user123',
      },
      retries: 1,
    });

    expect(res.status).toBe(200);
    expect(res.data).toHaveProperty('token');
    expect(res.data.user.email).toBe('user@jobmonitor.com');
  });

  it('should reject invalid auth credentials', async () => {
    await expect(
      client.request(`http://localhost:${testPort}/api/auth/login`, {
        method: 'POST',
        body: {
          email: 'user@jobmonitor.com',
          password: 'wrongpassword',
        },
        retries: 1,
      }),
    ).rejects.toThrow();
  });

  it('should allow accessing protected routes with authorization header', async () => {
    // GET /api/dashboard with user-token
    const res = await client.request(`http://localhost:${testPort}/api/dashboard`, {
      method: 'GET',
      headers: {
        Authorization: 'Bearer user-token',
      },
      retries: 1,
    });

    expect(res.status).toBe(200);
    expect(res.data).toHaveProperty('stats');
  });

  it('should parse raw files correctly in parse endpoint', async () => {
    const rawContent = 'Resume content text to verify.';
    const res = await client.request(`http://localhost:${testPort}/api/resumes/parse`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer user-token',
        'Content-Type': 'text/plain',
      },
      body: rawContent,
      retries: 1,
    });

    expect(res.status).toBe(200);
    expect(res.data.text).toBe(rawContent);
  });
});
