import { RecommendationEngine, OpportunityEngine } from '../core/RecommendationEngine.js';
import { Job, CompanyConfig } from '../companies/Scraper.js';
import { ExtendedSettings } from '../storage/StorageProvider.js';

describe('RecommendationEngine Unit Tests', () => {
  const createMockJob = (extra: Partial<Job> = {}): Job => ({
    company: 'Generic Corp',
    id: '1',
    title: 'Software Engineer',
    location: 'Remote',
    country: 'US',
    experience: 'Mid Level',
    employmentType: 'Full-time',
    url: 'https://test.com',
    datePosted: new Date().toISOString(),
    team: 'Engineering',
    source: 'web',
    isRemote: true,
    salary: 'N/A',
    description: 'Job description text.',
    jobHash: 'hash123',
    ...extra,
  });

  const mockCompany: CompanyConfig = {
    id: 'generic',
    name: 'Generic Corp',
    enabled: true,
    priority: 5,
    interval_minutes: 60,
    resume_profiles: [],
    avg_response_time_ms: 0,
    total_scrapes: 0,
    total_failures: 0,
  };

  const mockSettings: ExtendedSettings = {
    preferredCompanies: [],
    preferredTechnologies: [],
    preferredCities: [],
    remotePreference: 'all',
    notificationFrequency: 'daily',
    digestFormat: 'markdown',
  };

  it('should compute opportunity score with high-growth and priority companies', () => {
    const job = createMockJob({ title: 'Lead Architect', company: 'Google' });
    const company = { ...mockCompany, priority: 1 };
    const settings = { ...mockSettings, remotePreference: 'remote' };

    const rec = RecommendationEngine.calculateOpportunityScore(job, 90, company, settings);
    expect(rec.breakdown.growth).toBe(100);
    expect(rec.breakdown.quality).toBe(100);
    expect(rec.breakdown.competition).toBe(30); // Google is highly competitive
    expect(rec.breakdown.remote).toBe(100); // remote preference matched
  });

  it('should compute opportunity score for junior roles, lower company priority, and onsite preference', () => {
    const job = createMockJob({ title: 'Junior Frontend Developer', isRemote: false, location: 'New York' });
    const company = { ...mockCompany, priority: 9 };
    const settings = { ...mockSettings, remotePreference: 'onsite' };

    const rec = RecommendationEngine.calculateOpportunityScore(job, 80, company, settings);
    expect(rec.breakdown.growth).toBe(40);
    expect(rec.breakdown.quality).toBe(40);
    expect(rec.breakdown.remote).toBe(100); // onsite matches non-remote job
  });

  it('should match preferred cities lists', () => {
    const job = createMockJob({ location: 'San Francisco, CA' });
    const settings = { ...mockSettings, preferredCities: ['San Francisco'] };

    const rec = RecommendationEngine.calculateOpportunityScore(job, 80, null, settings);
    expect(rec.breakdown.location).toBe(100);
  });

  it('should fall back to defaults if preferred cities is empty', () => {
    const job = createMockJob({ location: 'Bangalore, India' });
    const rec = RecommendationEngine.calculateOpportunityScore(job, 80, null, mockSettings);
    expect(rec.breakdown.location).toBe(90);
  });

  it('should handle freshness date posted intervals', () => {
    // 5 days ago
    const pastDate = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();
    const job = createMockJob({ datePosted: pastDate });
    const rec = RecommendationEngine.calculateOpportunityScore(job, 80, null, mockSettings);
    expect(rec.breakdown.freshness).toBe(65);
  });

  it('should match hybrid preference correctly', () => {
    const job = createMockJob({ location: 'Hybrid - Seattle' });
    const settings = { ...mockSettings, remotePreference: 'hybrid' };
    const rec = RecommendationEngine.calculateOpportunityScore(job, 80, null, settings);
    expect(rec.breakdown.remote).toBe(100);
  });
});

describe('OpportunityEngine Unit Tests (Merged)', () => {
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
