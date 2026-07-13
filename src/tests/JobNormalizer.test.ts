import { JobNormalizer } from '../core/JobNormalizer.js';
import { RawJob, CompanyConfig } from '../companies/Scraper.js';

describe('JobNormalizer Unit Tests', () => {
  const mockCompany: CompanyConfig = {
    id: 'google',
    name: 'Google',
    enabled: true,
    priority: 1,
    interval_minutes: 60,
    resume_profiles: ['backend'],
    avg_response_time_ms: 0,
    total_scrapes: 0,
    total_failures: 0
  };

  it('should clean HTML tags and entities from raw fields', () => {
    const rawJob: RawJob = {
      company: 'Google',
      id: '123',
      title: '<b>Software Engineer</b>',
      location: 'Bangalore, &nbsp; India',
      url: 'https://careers.google.com',
      description: '<p>We are hiring. Join &amp; collaborate.</p>',
      source: 'api'
    };

    const normalized = JobNormalizer.normalize(rawJob, mockCompany);
    expect(normalized.title).toBe('Software Engineer');
    expect(normalized.location).toBe('Bangalore, India');
    expect(normalized.description).toBe('We are hiring. Join & collaborate.');
  });

  it('should detect remote status from keywords in title or location', () => {
    const rawJob: RawJob = {
      company: 'Google',
      id: '124',
      title: 'Backend Engineer (Remote)',
      location: 'Pune, India',
      url: 'https://careers.google.com',
      source: 'api'
    };

    const normalized = JobNormalizer.normalize(rawJob, mockCompany);
    expect(normalized.isRemote).toBe(true);
  });

  it('should resolve India location defaults correctly', () => {
    const rawJob: RawJob = {
      company: 'Google',
      id: '125',
      title: 'SDE II',
      location: 'Hyderabad, Telangana',
      url: 'https://careers.google.com',
      source: 'api'
    };

    const normalized = JobNormalizer.normalize(rawJob, mockCompany);
    expect(normalized.country).toBe('India');
  });

  it('should generate stable unique hash for deduplication', () => {
    const rawJob1: RawJob = {
      company: 'Google',
      id: '999',
      title: 'Eng',
      location: 'India',
      url: 'https://careers.google.com',
      source: 'api'
    };

    const rawJob2: RawJob = {
      company: 'google',
      id: '999',
      title: 'Eng II', // different details
      location: 'India',
      url: 'https://careers.google.com',
      source: 'api'
    };

    const normalized1 = JobNormalizer.normalize(rawJob1, mockCompany);
    const normalized2 = JobNormalizer.normalize(rawJob2, mockCompany);
    
    // Hash should be identical since company and ID match
    expect(normalized1.jobHash).toBe(normalized2.jobHash);
  });
});
