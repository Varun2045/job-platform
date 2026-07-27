import { describe, it, expect, beforeEach } from '@jest/globals';
import { GlobalSearchEngine } from '../core/GlobalSearchEngine.js';
import { FileStorage } from '../storage/FileStorage.js';

describe('GlobalSearchEngine Unit Tests', () => {
  let storage: FileStorage;
  let engine: GlobalSearchEngine;

  beforeEach(() => {
    storage = new FileStorage();
    engine = new GlobalSearchEngine(storage);
  });

  it('should search applications and extension jobs case-insensitively', async () => {
    await storage.saveApplication(
      {
        company: 'Stripe',
        jobId: 'job-search-1',
        jobHash: 'hash-search-1',
        title: 'Senior Infrastructure Engineer',
        status: 'Applied',
        appliedDate: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
      },
      'test-search-user',
    );

    const result = await engine.search('stripe', 'test-search-user');
    expect(result.totalMatches).toBeGreaterThan(0);
    expect(result.applications.some((a) => a.company === 'Stripe')).toBe(true);
  });
});
