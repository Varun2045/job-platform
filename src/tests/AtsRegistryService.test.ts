import { describe, it, expect } from '@jest/globals';
import { AtsRegistryService } from '../core/AtsRegistryService.js';

describe('AtsRegistryService Unit Tests', () => {
  const service = new AtsRegistryService();

  it('should return dynamically generated ATS registry overview with 2 public category groups', () => {
    const overview = service.getRegistryOverview();

    expect(overview.totalCategories).toBe(2);
    expect(overview.totalCompanies).toBeGreaterThan(0);
    expect(overview.totalCompanyPlugins).toBe(50);
    expect(Array.isArray(overview.groups)).toBe(true);
    expect(overview.groups.length).toBe(2);
  });

  it('should detect Greenhouse URLs cleanly with Priority 1', () => {
    const result = service.detectUrl('https://boards.greenhouse.io/openai/jobs/123456');

    expect(result.platform).toBe('Greenhouse');
    expect(result.category).toBe('Native ATS');
    expect(result.parser).toBe('Native ATS');
    expect(result.priority).toBe(1);
    expect(result.supported).toBe('YES');
  });

  it('should detect 50 company plugins (e.g. OpenAI, Stripe, Google) with Priority 2', () => {
    const googleResult = service.detectUrl('https://careers.google.com/jobs/results/11');
    expect(googleResult.platform).toBe('Google Careers');
    expect(googleResult.category).toBe('Company Career Portals');
    expect(googleResult.parser).toBe('Company Plugin');
    expect(googleResult.priority).toBe(2);

    const stripeResult = service.detectUrl('https://stripe.com/jobs/listing/11');
    expect(stripeResult.platform).toBe('Stripe Careers');
    expect(stripeResult.category).toBe('Company Career Portals');
    expect(stripeResult.parser).toBe('Company Plugin');
    expect(stripeResult.priority).toBe(2);
  });

  it('should fall back cleanly to Generic Playwright for unknown URLs with Priority 3', () => {
    const unknownResult = service.detectUrl('https://random-company-jobs.org/posting/1');

    expect(unknownResult.platform).toBe('Custom Career Portal');
    expect(unknownResult.category).toBe('Generic Parsers');
    expect(unknownResult.parser).toBe('Generic Playwright');
    expect(unknownResult.priority).toBe(3);
    expect(unknownResult.supported).toBe('Best Effort');
  });
});
