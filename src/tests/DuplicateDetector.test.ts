import { DuplicateDetector } from '../core/DuplicateDetector.js';
import { Job } from '../companies/Scraper.js';

describe('DuplicateDetector', () => {
  const jobBase: Job = {
    company: 'Google',
    id: '12345',
    title: 'Software Engineer, Backend',
    location: 'Bangalore, India',
    country: 'India',
    experience: 'Mid Level',
    employmentType: 'Full-time',
    url: 'https://careers.google.com/jobs/12345',
    datePosted: new Date().toISOString(),
    team: 'Engineering',
    source: 'google',
    isRemote: false,
    salary: 'Not Specified',
    description: 'We are looking for a Node.js and TypeScript developer.',
    jobHash: 'hash123'
  };

  it('should flag jobs with exact same ID or URL as duplicates', () => {
    const job2 = { ...jobBase, id: '12345', url: 'https://different-url.com' };
    expect(DuplicateDetector.isDuplicate(jobBase, job2)).toBe(true);

    const job3 = { ...jobBase, id: 'different', url: jobBase.url };
    expect(DuplicateDetector.isDuplicate(jobBase, job3)).toBe(true);
  });

  it('should flag jobs with high text similarity as duplicates', () => {
    const job2 = {
      ...jobBase,
      id: '99999',
      url: 'https://another-url.com',
      title: 'Backend Software Engineer',
      description: 'We are looking for a Node.js and TypeScript developer. Join us.'
    };
    expect(DuplicateDetector.isDuplicate(jobBase, job2)).toBe(true);
  });

  it('should NOT flag completely different jobs as duplicates', () => {
    const job2 = {
      ...jobBase,
      id: '99999',
      url: 'https://another-url.com',
      title: 'Product Manager',
      description: 'We are looking for a PM with Agile and Scrum experience to manage products.'
    };
    expect(DuplicateDetector.isDuplicate(jobBase, job2)).toBe(false);
  });
});
