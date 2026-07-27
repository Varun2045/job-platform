import { jest } from '@jest/globals';
import { HttpClient } from '../core/HttpClient.js';

let serverInstance: any;

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

describe('Version 1.1 REST API Routes Integration Tests', () => {
  const testPort = '4510';
  const baseUrl = `http://localhost:${testPort}`;
  let httpClient: HttpClient;

  beforeAll(async () => {
    process.env.PORT = testPort;
    process.env.NODE_ENV = 'development';
    process.env.SUPABASE_URL = '';
    process.env.SUPABASE_SERVICE_KEY = '';

    await import('../core/server.js');
    httpClient = new HttpClient();
  });

  afterAll(async () => {
    if (serverInstance) {
      await new Promise<void>((resolve) => {
        serverInstance.close(() => resolve());
      });
    }
  });

  // ==========================================
  // APPLICATIONS (KANBAN) ENDPOINTS
  // ==========================================

  it('GET /api/v1/applications/board should return full Kanban board', async () => {
    const httpRes = await httpClient.request(`${baseUrl}/api/v1/applications/board`);
    expect(httpRes.status).toBe(200);
    const body = httpRes.data;
    expect(body.success).toBe(true);
    expect(body.data.columns).toBeDefined();
    expect(body.data.columns.Saved).toBeDefined();
  });

  it('PUT /api/v1/applications/:id/stage should update application stage', async () => {
    // Save app via V1 route first
    await httpClient.request(`${baseUrl}/api/applications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jobHash: 'hash-api-test-1',
        company: 'ApiCorp',
        jobId: 'api-job-1',
        status: 'Saved',
        notes: 'Testing V1.1 route',
      }),
    });

    const httpRes = await httpClient.request(`${baseUrl}/api/v1/applications/api-job-1/stage`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        targetStatus: 'Interview',
        targetStageOrder: 15.5,
      }),
    });

    expect(httpRes.status).toBe(200);
    const body = httpRes.data;
    expect(body.success).toBe(true);
    expect(body.data.status).toBe('Interview');
    expect(body.data.stageOrder).toBe(15.5);
  });

  it('PATCH /api/v1/applications/:id/reorder should reorder application within stage', async () => {
    const httpRes = await httpClient.request(`${baseUrl}/api/v1/applications/api-job-1/reorder`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        targetStageOrder: 42.0,
      }),
    });

    expect(httpRes.status).toBe(200);
    const body = httpRes.data;
    expect(body.success).toBe(true);
    expect(body.data.stageOrder).toBe(42.0);
  });

  // ==========================================
  // OFFERS ENDPOINTS
  // ==========================================

  it('POST /api/v1/offers/analyze should return calculated comp breakdown', async () => {
    const httpRes = await httpClient.request(`${baseUrl}/api/v1/offers/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: 'offer-api-1',
        applicationId: 'app-api-1',
        baseSalary: 150000,
        signingBonus: 10000,
        annualBonusPct: 10,
        equityValue: 40000,
        vestingYears: 4,
        location: 'Remote',
        remoteStatus: 'Remote',
        status: 'Active',
      }),
    });

    expect(httpRes.status).toBe(200);
    const body = httpRes.data;
    expect(body.success).toBe(true);
    expect(body.data.breakdown.firstYearTotalComp).toBe(185000);
    expect(body.data.negotiationScript).toBeDefined();
  });

  it('POST /api/v1/offers/compare should return compared offers list', async () => {
    const httpRes = await httpClient.request(`${baseUrl}/api/v1/offers/compare`, {
      method: 'POST',
    });

    expect(httpRes.status).toBe(200);
    const body = httpRes.data;
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data.offers)).toBe(true);
  });

  // ==========================================
  // FOLLOW-UPS ENDPOINTS
  // ==========================================

  it('POST, GET, PUT, DELETE /api/v1/followups CRUD lifecycle', async () => {
    // 1. Create FollowUp
    const createRes = await httpClient.request(`${baseUrl}/api/v1/followups`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: 'followup-api-1',
        applicationId: 'api-job-1',
        scheduledDate: new Date().toISOString(),
        status: 'Pending',
        note: 'Follow up with HR',
      }),
    });
    expect(createRes.status).toBe(201);
    expect(createRes.data.success).toBe(true);
    expect(createRes.data.data.id).toBe('followup-api-1');

    // 2. Get FollowUps
    const listRes = await httpClient.request(`${baseUrl}/api/v1/followups`);
    expect(listRes.status).toBe(200);
    expect(listRes.data.success).toBe(true);
    expect(listRes.data.data.length).toBeGreaterThan(0);

    // 3. Update FollowUp
    const updateRes = await httpClient.request(`${baseUrl}/api/v1/followups/followup-api-1`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        applicationId: 'api-job-1',
        scheduledDate: new Date().toISOString(),
        status: 'Completed',
        note: 'Followed up via email',
      }),
    });
    expect(updateRes.status).toBe(200);
    expect(updateRes.data.success).toBe(true);
    expect(updateRes.data.data.status).toBe('Completed');

    // 4. Delete FollowUp
    const deleteRes = await httpClient.request(`${baseUrl}/api/v1/followups/followup-api-1`, {
      method: 'DELETE',
    });
    expect(deleteRes.status).toBe(200);
    expect(deleteRes.data.success).toBe(true);
  });

  // ==========================================
  // VISA INTELLIGENCE ENDPOINTS
  // ==========================================

  it('GET /api/v1/visa/company and /api/v1/visa/search', async () => {
    const searchRes = await httpClient.request(`${baseUrl}/api/v1/visa/search?query=Goo`);
    expect(searchRes.status).toBe(200);
    expect(searchRes.data.success).toBe(true);

    const statsRes = await httpClient.request(`${baseUrl}/api/v1/visa/company?name=Google`);
    expect(statsRes.status).toBe(200);
    expect(statsRes.data.success).toBe(true);
    expect(statsRes.data.data.isVerifiedSponsor).toBeDefined();
  });

  // ==========================================
  // NOTIFICATION ENDPOINTS
  // ==========================================

  it('POST /api/v1/notifications/test-slack should reject invalid webhook URL with 400', async () => {
    try {
      await httpClient.request(`${baseUrl}/api/v1/notifications/test-slack`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          webhookUrl: 'http://127.0.0.1/bad-hook',
          message: 'Test alert',
        }),
      });
      fail('Should have thrown HTTP 400');
    } catch (err: any) {
      expect(err.message).toContain('HTTP Error 400');
    }
  });

  it('POST /api/v1/notifications/test-telegram should reject invalid bot token with 400', async () => {
    try {
      await httpClient.request(`${baseUrl}/api/v1/notifications/test-telegram`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          botToken: 'invalid_token',
          chatId: '-100123456789',
          message: 'Test alert',
        }),
      });
      fail('Should have thrown HTTP 400');
    } catch (err: any) {
      expect(err.message).toContain('HTTP Error 400');
    }
  });

  // ==========================================
  // KEYWORD HEATMAP ENDPOINTS
  // ==========================================

  it('POST /api/v1/heatmap and GET /api/v1/heatmap/:applicationId', async () => {
    const postRes = await httpClient.request(`${baseUrl}/api/v1/heatmap`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jobId: 'job-h1',
        resumeProfileId: 'resume-h1',
        jobDescription: 'Seeking TypeScript Node.js engineer',
        resumeContent: 'Experienced TypeScript Node.js developer',
      }),
    });
    expect(postRes.status).toBe(200);
    expect(postRes.data.success).toBe(true);
    expect(postRes.data.data.matchedKeywords).toContain('typescript');

    const getRes = await httpClient.request(`${baseUrl}/api/v1/heatmap/api-job-1`);
    expect(getRes.status).toBe(200);
    expect(getRes.data.success).toBe(true);
    expect(getRes.data.data.matchDensityPct).toBeDefined();
  });
});
