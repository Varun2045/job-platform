import { SearchEngine } from '../core/SearchEngine.js';
import { DuplicateDetector } from '../core/DuplicateDetector.js';

describe('Frontend UI Logic Verification', () => {
  it('should verify search engine capabilities match frontend specifications', () => {
    const jobs = [
      {
        job: {
          company: 'Test Company',
          id: '1',
          title: 'Staff Software Engineer',
          location: 'Remote',
          country: 'India',
          experience: 'Senior',
          employmentType: 'Full-time',
          url: 'https://test.com',
          datePosted: new Date().toISOString(),
          team: 'Engineering',
          source: 'test',
          isRemote: true,
          salary: 'Not Specified',
          description: 'Looking for a React developer with Node.js experience.',
          jobHash: 'hash1'
        },
        score: 90
      }
    ];

    const locResults = SearchEngine.search(jobs, { location: 'Remote' });
    expect(locResults.length).toBe(1);

    const techResults = SearchEngine.search(jobs, { technology: 'React' });
    expect(techResults.length).toBe(1);

    const scoreResults = SearchEngine.search(jobs, { minScore: 95 });
    expect(scoreResults.length).toBe(0);
  });

  it('should verify duplicate detection matches frontend expectations', () => {
    const job1: any = {
      id: '123',
      company: 'Apple',
      title: 'Senior iOS Software Engineer',
      location: 'Cupertino',
      description: 'Design and build application features for iOS platforms.',
      url: 'https://apple.com/jobs/123'
    };
    const job2: any = {
      id: '456',
      company: 'Apple',
      title: 'Senior iOS Software Engineer (Swift)',
      location: 'Cupertino, CA',
      description: 'Design  and  build\napplication features for iOS platforms.',
      url: 'https://apple.com/jobs/456'
    };

    expect(DuplicateDetector.isDuplicate(job1, job2)).toBe(true);
  });
});
