import { SearchEngine } from '../core/SearchEngine.js';
import { Job } from '../companies/Scraper.js';

describe('SearchEngine', () => {
  const jobs: { job: Job; score: number }[] = [
    {
      job: {
        company: 'Google',
        id: '1',
        title: 'Backend Engineer',
        location: 'Bangalore, India',
        country: 'India',
        experience: 'Senior',
        employmentType: 'Full-time',
        url: 'https://careers.google.com/jobs/1',
        datePosted: '2026-07-01T00:00:00Z',
        team: 'Engineering',
        source: 'google',
        isRemote: false,
        salary: 'Not Specified',
        description: 'Node.js and TypeScript backend engineer position.',
        jobHash: 'hash1'
      },
      score: 95
    },
    {
      job: {
        company: 'Microsoft',
        id: '2',
        title: 'Frontend Developer',
        location: 'Redmond, USA',
        country: 'USA',
        experience: 'Mid Level',
        employmentType: 'Full-time',
        url: 'https://careers.microsoft.com/jobs/2',
        datePosted: '2026-06-25T00:00:00Z',
        team: 'Engineering',
        source: 'microsoft',
        isRemote: true,
        salary: 'Not Specified',
        description: 'React developer position.',
        jobHash: 'hash2'
      },
      score: 75
    }
  ];

  it('should search by company', () => {
    const results = SearchEngine.search(jobs, { company: 'Google' });
    expect(results.length).toBe(1);
    expect(results[0].job.company).toBe('Google');
  });

  it('should search by technology', () => {
    const results = SearchEngine.search(jobs, { technology: 'React' });
    expect(results.length).toBe(1);
    expect(results[0].job.company).toBe('Microsoft');
  });

  it('should search by remote status', () => {
    const results = SearchEngine.search(jobs, { remote: true });
    expect(results.length).toBe(1);
    expect(results[0].job.company).toBe('Microsoft');
  });

  it('should search by minScore', () => {
    const results = SearchEngine.search(jobs, { minScore: 90 });
    expect(results.length).toBe(1);
    expect(results[0].score).toBe(95);
  });
});
