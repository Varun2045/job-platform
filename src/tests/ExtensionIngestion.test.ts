import { describe, it, expect, beforeEach } from '@jest/globals';
import { FileStorage } from '../storage/FileStorage.js';

describe('Chrome Extension Ingestion Unit Tests', () => {
  let storage: FileStorage;

  beforeEach(() => {
    storage = new FileStorage();
  });

  it('should save a job captured from LinkedIn via extension', async () => {
    const job = await storage.saveExtensionJob({
      id: '',
      userId: 'test-ext-user',
      companyName: 'Stripe',
      jobTitle: 'Senior Backend Engineer',
      location: 'San Francisco, CA',
      jobUrl: 'https://www.linkedin.com/jobs/view/123456',
      description: 'Building global financial infrastructure using Ruby and Go.',
      platformSource: 'LinkedIn',
      status: 'Captured',
      createdAt: new Date().toISOString(),
    });

    expect(job.id).toBeDefined();
    expect(job.id.startsWith('ext-')).toBe(true);
    expect(job.companyName).toBe('Stripe');
    expect(job.platformSource).toBe('LinkedIn');

    const list = await storage.getExtensionJobs('test-ext-user');
    expect(list.length).toBeGreaterThan(0);
    expect(list.some((j) => j.companyName === 'Stripe')).toBe(true);
  });

  it('should save a job captured from Greenhouse via extension', async () => {
    const job = await storage.saveExtensionJob({
      id: '',
      userId: 'test-ext-user',
      companyName: 'Figma',
      jobTitle: 'Software Engineer - Infrastructure',
      location: 'Remote - US',
      jobUrl: 'https://boards.greenhouse.io/figma/jobs/987654',
      description: 'Scaling real-time collaborative canvas algorithms.',
      platformSource: 'Greenhouse',
      status: 'Captured',
      createdAt: new Date().toISOString(),
    });

    expect(job.companyName).toBe('Figma');
    expect(job.platformSource).toBe('Greenhouse');
  });
});
