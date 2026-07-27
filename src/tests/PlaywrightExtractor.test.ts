import { describe, it, expect } from '@jest/globals';
import { PlaywrightExtractor } from '../playwright/PlaywrightExtractor.js';
import { ExtractorRegistry } from '../playwright/ExtractorRegistry.js';
import { BrowserPool } from '../playwright/BrowserPool.js';

describe('Playwright Extractor Plugin Registry & Company Tests', () => {
  const extractor = new PlaywrightExtractor();

  it('should acquire and release worker in BrowserPool', async () => {
    const pool = BrowserPool.getInstance();
    const acquired = await pool.acquireWorker();
    expect(acquired).toBe(true);

    const stats = pool.getStats();
    expect(stats.activeWorkers).toBeGreaterThan(0);

    pool.releaseWorker();
    expect(pool.getStats().activeWorkers).toBe(stats.activeWorkers - 1);
  });

  it('should verify 50 companies registered in ExtractorRegistry', () => {
    const registry = ExtractorRegistry.getInstance();
    const registered = registry.getAllRegistered();
    expect(registered.length).toBe(50);
    expect(registered).toContain('OpenAI');
    expect(registered).toContain('Stripe');
    expect(registered).toContain('Snowflake');
    expect(registered).toContain('Netflix');
    expect(registered).toContain('CrowdStrike');
  });

  it('should route OpenAI career URL through dedicated company extractor', async () => {
    const extracted = await extractor.extractJob('https://openai.com/careers/research-engineer');
    expect(extracted.company).toBe('OpenAI');
    expect(extracted.source).toBe('CompanyExtractor:OpenAI');
  });

  it('should route Stripe career URL through dedicated company extractor', async () => {
    const extracted = await extractor.extractJob('https://stripe.com/jobs/listing/software-engineer');
    expect(extracted.company).toBe('Stripe');
    expect(extracted.source).toBe('CompanyExtractor:Stripe');
  });

  it('should route Netflix career URL through dedicated company extractor', async () => {
    const extracted = await extractor.extractJob('https://jobs.netflix.com/jobs/123456');
    expect(extracted.company).toBe('Netflix');
    expect(extracted.source).toBe('CompanyExtractor:Netflix');
  });

  it('should route unknown custom domain to generic Playwright fallback', async () => {
    const extracted = await extractor.extractJob('https://unknown-startup-careers.io/jobs/1');
    expect(extracted.company).toBe('Custom Career Portal');
    expect(extracted.source).toBe('PlaywrightFallback:GenericPortal');
  });
});
