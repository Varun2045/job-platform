import { ComparisonEngine } from '../core/ComparisonEngine.js';
import { Job } from '../companies/Scraper.js';

describe('ComparisonEngine Unit Tests', () => {
  const createMockJob = (id: string, title: string, location: string, extra: Partial<Job> = {}): Job => ({
    company: 'Test Company',
    id,
    title,
    location,
    country: 'India',
    experience: 'Entry Level',
    employmentType: 'Full-time',
    url: `https://test.com/jobs/${id}`,
    datePosted: '2026-07-07T12:00:00Z',
    team: 'Engineering',
    source: 'test',
    isRemote: false,
    salary: 'Not Specified',
    description: 'Mock description for test.',
    jobHash: `hash_${id}`,
    ...extra,
  });

  it('should detect added jobs', () => {
    const previous: Job[] = [];
    const current = [createMockJob('1', 'Software Engineer', 'India'), createMockJob('2', 'Backend Engineer', 'India')];

    const result = ComparisonEngine.compare(previous, current);
    expect(result.added.length).toBe(2);
    expect(result.expired.length).toBe(0);
    expect(result.modified.length).toBe(0);
  });

  it('should detect expired jobs', () => {
    const previous = [
      createMockJob('1', 'Software Engineer', 'India'),
      createMockJob('2', 'Backend Engineer', 'India'),
    ];
    const current = [createMockJob('1', 'Software Engineer', 'India')];

    const result = ComparisonEngine.compare(previous, current);
    expect(result.expired.length).toBe(1);
    expect(result.expired[0].id).toBe('2');
  });

  it('should detect all individual modified job properties', () => {
    const previous = [
      createMockJob('1', 'Software Engineer', 'India', {
        isRemote: false,
        experience: 'Entry Level',
        salary: '100k',
        description: 'First version',
        url: 'https://prev.com',
      }),
    ];
    const current = [
      createMockJob('1', 'SDE 1', 'Remote', {
        isRemote: true,
        experience: 'Mid Level',
        salary: '120k',
        description: 'Second version',
        url: 'https://curr.com',
      }),
    ];

    const result = ComparisonEngine.compare(previous, current);
    expect(result.modified.length).toBe(1);
    const mod = result.modified[0];
    expect(mod.changes).toContain('title ("Software Engineer" -> "SDE 1")');
    expect(mod.changes).toContain('location ("India" -> "Remote")');
    expect(mod.changes).toContain('isRemote (false -> true)');
    expect(mod.changes).toContain('experience ("Entry Level" -> "Mid Level")');
    expect(mod.changes).toContain('salary ("100k" -> "120k")');
    expect(mod.changes).toContain('description');
    expect(mod.changes).toContain('url ("https://prev.com" -> "https://curr.com")');
  });

  it('should detect fuzzy match duplicate reposts', () => {
    const previous = [
      createMockJob('1', 'Software Engineer', 'India', {
        description: 'We need a software engineer proficient in Node.js.',
      }),
    ];
    const current = [
      createMockJob('100', 'Software Engineer', 'India', {
        description: 'We need a software engineer proficient in Node.js.',
        url: 'https://repost.com',
      }),
    ];

    const result = ComparisonEngine.compare(previous, current);
    expect(result.modified.length).toBe(1);
    expect(result.added.length).toBe(0);
    expect(result.modified[0].changes[0]).toContain('fuzzy matching detected');
  });
});
