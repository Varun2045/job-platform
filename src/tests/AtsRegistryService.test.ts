import { describe, it, expect } from '@jest/globals';
import { AtsRegistryService } from '../core/AtsRegistryService.js';

describe('AtsRegistryService Unit Tests', () => {
  const service = new AtsRegistryService();

  it('should return dynamically generated ATS registry overview', () => {
    const overview = service.getRegistryOverview();

    expect(overview.totalPlatforms).toBeGreaterThan(0);
    expect(overview.totalCompanies).toBeGreaterThan(0);
    expect(overview.totalCompanyPlugins).toBe(50);
    expect(Array.isArray(overview.platforms)).toBe(true);
  });

  it('should detect Greenhouse URLs cleanly', () => {
    const result = service.detectUrl('https://boards.greenhouse.io/openai/jobs/123456');

    expect(result.platform).toBe('Greenhouse');
    expect(result.parser).toBe('Native ATS');
    expect(result.supported).toBe('YES');
  });

  it('should detect 50 company plugins (e.g. OpenAI, Stripe, Google)', () => {
    const googleResult = service.detectUrl('https://careers.google.com/jobs/results/11');
    expect(googleResult.platform).toBe('Google Careers');
    expect(googleResult.parser).toBe('Company Plugin');

    const stripeResult = service.detectUrl('https://stripe.com/jobs/listing/11');
    expect(stripeResult.platform).toBe('Stripe Careers');
    expect(stripeResult.parser).toBe('Company Plugin');
  });

  it('should fall back cleanly to Generic Playwright for unknown URLs', () => {
    const unknownResult = service.detectUrl('https://random-company-jobs.org/posting/1');

    expect(unknownResult.platform).toBe('Custom Career Portal');
    expect(unknownResult.parser).toBe('Generic Playwright');
    expect(unknownResult.supported).toBe('Best Effort');
  });
});
