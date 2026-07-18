import { OpportunityEngine } from '../core/OpportunityEngine.js';
import { Job, CompanyConfig } from '../companies/Scraper.js';

describe('OpportunityEngine', () => {
  const mockJob: Job = {
    jobHash: 'h1',
    company: 'Google',
    title: 'Senior Software Engineer',
    url: 'https://careers.google.com/123',
    isRemote: true,
    location: 'Remote',
    datePosted: 'Posted today',
    description: 'Looking for a Senior backend engineer.',
  } as unknown as Job;

  const mockCompany: CompanyConfig = {
    id: 'google',
    name: 'Google',
    priority: 5, // Top priority
    scrapers: [],
  } as unknown as CompanyConfig;

  test('should compute high scores for aligned opportunities', () => {
    const result = OpportunityEngine.calculate(
      mockJob,
      mockCompany,
      90, // Match score
      85, // Salary weight preference
      'remote', // Remote preferred
      'Remote', // Location preferred
    );

    expect(result.overallScore).toBeGreaterThanOrEqual(80);
    expect(result.strengths).toContain('High resume technical similarity matching score (90%).');
    expect(result.strengths).toContain('Company is classified as high-priority target (Tier 5).');
    expect(result.weaknesses.length).toBe(0);
  });

  test('should compute lower scores for unaligned opportunities', () => {
    const poorCompany = { ...mockCompany, priority: 1 };
    const poorJob = { ...mockJob, isRemote: false, location: 'New York' };

    const result = OpportunityEngine.calculate(
      poorJob,
      poorCompany,
      40, // Match score
      30, // Salary weight preference
      'remote', // Remote preferred
      'San Francisco', // Location preferred
    );

    expect(result.overallScore).toBeLessThan(50);
    expect(result.weaknesses).toContain('Low technical skill alignment score (40%).');
    expect(result.weaknesses).toContain('Salary offering is below user baseline preferences.');
  });
});
