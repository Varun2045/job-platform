import { ResumeProfileManager } from '../core/ResumeProfileManager.js';
import { Job } from '../companies/Scraper.js';

describe('ResumeProfileManager', () => {
  const mockJob: Job = {
    jobHash: 'h1',
    company: 'Stripe',
    title: 'Senior React Engineer',
    url: '',
    isRemote: true,
    location: '',
    datePosted: '',
    description: 'Looking for a frontend specialist with extensive React and TypeScript skills.'
  } as unknown as Job;

  test('should return default profile Backend if profiles list is empty', () => {
    const rec = ResumeProfileManager.recommendProfile(mockJob, []);
    expect(rec.recommendedProfile).toBe('Backend');
  });

  test('should recommend Frontend profile when matching frontend job requirements', () => {
    const profiles = [
      { profile_name: 'Backend', content: 'Node.js, Postgres, Kubernetes backend developer.' },
      { profile_name: 'Frontend', content: 'React, TypeScript, CSS, UI frontend specialist developer.' }
    ];

    const rec = ResumeProfileManager.recommendProfile(mockJob, profiles);
    expect(rec.recommendedProfile).toBe('Frontend');
    expect(rec.score).toBeGreaterThan(60);
  });
});
