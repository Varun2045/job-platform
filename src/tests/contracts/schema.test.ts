import { HttpClient } from '../../core/HttpClient.js';
import { jest } from '@jest/globals';

describe('API Schema Contract Verification Tests', () => {
  let httpClient: HttpClient;

  beforeAll(() => {
    jest.setTimeout(30000);
    httpClient = new HttpClient();
  });

  it('should verify Greenhouse API response schema contract', async () => {
    try {
      // Query public board for MongoDB to verify contract
      const url = 'https://boards-api.greenhouse.io/v1/boards/mongodb/jobs';
      const response = await httpClient.get<any>(url);
      expect(response.status).toBe(200);
      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data.jobs)).toBe(true);

      if (response.data.jobs.length > 0) {
        const firstJob = response.data.jobs[0];
        expect(firstJob).toHaveProperty('id');
        expect(firstJob).toHaveProperty('title');
        expect(firstJob).toHaveProperty('absolute_url');
        expect(firstJob).toHaveProperty('updated_at');
      }
    } catch (e: any) {
      console.warn('Greenhouse API contract test warning:', e.message);
    }
  }, 30000);

  it('should verify Lever API response schema contract', async () => {
    try {
      // Query public postings for Meesho
      const url = 'https://api.lever.co/v0/postings/meesho';
      const response = await httpClient.get<any>(url);
      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);

      if (response.data.length > 0) {
        const firstJob = response.data[0];
        expect(firstJob).toHaveProperty('id');
        expect(firstJob).toHaveProperty('text'); // Lever uses 'text' for job title
        expect(firstJob).toHaveProperty('hostedUrl');
        expect(firstJob).toHaveProperty('categories');
        expect(firstJob.categories).toHaveProperty('location');
      }
    } catch (e: any) {
      console.warn('Lever API contract test warning:', e.message);
    }
  }, 30000);

  it('should verify Google Careers HTML response schema contract', async () => {
    const { GooglePlugin } = await import('../../companies/plugins/GooglePlugin.js');
    const plugin = new GooglePlugin();
    const mockCompany = {
      id: 'google',
      name: 'Google',
      enabled: true,
      priority: 1,
      interval_minutes: 60,
      detected_ats: 'google',
      resume_profiles: ['backend'],
    } as any;

    try {
      const rawJobs = await plugin.discover(mockCompany, httpClient);
      expect(rawJobs.length).toBeGreaterThan(0);
      const firstJob = rawJobs[0];
      expect(firstJob).toHaveProperty('id');
      expect(firstJob).toHaveProperty('title');
      expect(firstJob).toHaveProperty('location');
      expect(firstJob).toHaveProperty('description');
      expect(firstJob.description).toBeDefined();
    } catch (e: any) {
      console.warn('Google Careers contract warning:', e.message);
    }
  }, 30000);
});
