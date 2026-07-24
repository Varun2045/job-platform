import { JobNormalizer } from '../core/JobNormalizer.js';
import { ExplainableScoringEngine } from '../core/ExplainableScoringEngine.js';

describe('Ranking & Classification Regression Tests', () => {
  const companyConfig = {
    id: 'test',
    name: 'TestComp',
    enabled: true,
    priority: 5,
    interval_minutes: 60,
    resume_profiles: ['backend'],
    avg_response_time_ms: 100,
    total_scrapes: 1,
    total_failures: 0,
  };

  it('should rank entry-level roles higher than senior roles for junior candidates', () => {
    const rawJunior = {
      company: 'Amazon',
      id: 'j1',
      title: 'Junior Software Development Engineer',
      location: 'Bangalore',
      description: 'Entry level 0-2 years experience required.',
      url: 'https://amazon.jobs/j1',
      source: 'greenhouse',
    };

    const rawSenior = {
      company: 'Amazon',
      id: 's1',
      title: 'Principal Software Engineer (L7)',
      location: 'Bangalore',
      description: 'Requires 10+ years leading large tech organizations.',
      url: 'https://amazon.jobs/s1',
      source: 'greenhouse',
    };

    const normJunior = JobNormalizer.normalize(rawJunior, companyConfig);
    const normSenior = JobNormalizer.normalize(rawSenior, companyConfig);

    expect(normJunior.experienceLevel).toMatch(/Entry Level|Internship/);
    expect(normSenior.experienceLevel).toMatch(/Principal Engineer|Staff Engineer/);

    const juniorCandidateScore = ExplainableScoringEngine.calculateMatch(
      normJunior,
      90,
      'Bangalore',
      'Entry Level (0–2 Years)'
    );

    const seniorCandidateScore = ExplainableScoringEngine.calculateMatch(
      normSenior,
      90,
      'Bangalore',
      'Entry Level (0–2 Years)'
    );

    expect(juniorCandidateScore.totalScore).toBeGreaterThan(seniorCandidateScore.totalScore);
  });
});
