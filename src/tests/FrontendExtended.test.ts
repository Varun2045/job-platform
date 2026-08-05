// import { AiAnalyzer } from '../core/ResumeMatcher.js';
import { ResumeTailor } from '../core/ResumeTailor.js';
import { CoverLetterGenerator } from '../core/CoverLetterGenerator.js';
import { InterviewGenerator } from '../core/InterviewGenerator.js';
// import { RecommendationEngine } from '../core/RecommendationEngine.js';

describe('Version 2.1.0 Logic Modules Verification', () => {
  const mockJob: any = {
    company: 'TestCorp',
    id: 'job-999',
    title: 'Senior TypeScript Developer',
    location: 'Bangalore',
    country: 'India',
    experience: 'Senior',
    employmentType: 'Full-time',
    url: 'https://testcorp.com/careers/999',
    datePosted: new Date().toISOString(),
    team: 'Platform engineering',
    source: 'test',
    isRemote: true,
    salary: 'Competitive',
    description: 'Looking for a Senior software engineer with strong TypeScript, React, and Node.js skills.',
    jobHash: 'hash999',
  };

  it.skip('should verify AI Job Analyzer outputs', async () => {
    // const analysis = await AiAnalyzer.analyze(mockJob, 'backend');

    // expect(analysis.jobHash).toBe('hash999');
    // expect(analysis.summary).toContain('TestCorp');
    // expect(analysis.summary).toContain('Senior TypeScript Developer');
    // expect(analysis.whyMatches).toContain('match index');
    // expect(analysis.difficulty).toBe('Hard'); // Senior job
    // expect(analysis.prepTopics.length).toBeGreaterThan(0);
    // expect(analysis.resumeImprovements.length).toBeGreaterThan(0);
  });

  it('should verify AI Resume Tailoring bullet and keyword output', () => {
    const tailoring = ResumeTailor.tailor(mockJob, 'backend');

    expect(tailoring.tailoredResume).toContain('TAILORED FOR TESTCORP');
    expect(tailoring.betterBulletPoints.length).toBeGreaterThan(0);
    expect(tailoring.skillsToEmphasize).toContain('typescript');
  });

  it('should verify Cover Letter Generator layout templates', () => {
    const letter = CoverLetterGenerator.generate(mockJob, 'backend');

    expect(letter).toContain('Dear Hiring Team');
    expect(letter).toContain('Senior TypeScript Developer position at TestCorp');
    expect(letter).toContain('Sincerely');
  });

  it('should verify Interview Preparation questions, STAR outlines, and checklist items', () => {
    const prep = InterviewGenerator.generate(mockJob, 'backend');

    expect(prep.difficultyScore).toBe(8); // Senior title
    expect(prep.technicalQuestions.length).toBeGreaterThan(0);
    expect(prep.behavioralQuestions.length).toBeGreaterThan(0);
    expect(prep.starExamples.length).toBe(2);
    expect(prep.prepChecklist.length).toBeGreaterThan(0);
  });

  it.skip('should verify Recommendation Engine Opportunity Score calculations and breakdown values', () => {
    // const mockCompany: any = {
    //   id: 'comp-1',
    //   name: 'TestCorp',
    //   priority: 2, // High quality priority config
    // };

    // const mockSettings: any = {
    //   preferredCompanies: ['TestCorp'],
    //   preferredTechnologies: ['TypeScript'],
    //   preferredCities: ['Bangalore'],
    //   remotePreference: 'remote',
    //   notificationFrequency: 'daily',
    //   digestFormat: 'markdown',
    // };

    // const result = RecommendationEngine.calculateOpportunityScore(mockJob, 85, mockCompany, mockSettings);

    // expect(result.job.jobHash).toBe('hash999');
    // expect(result.opportunityScore).toBeGreaterThanOrEqual(50);
    // expect(result.breakdown.match).toBe(85);
    // expect(result.breakdown.quality).toBe(100); // Priority 2
    // expect(result.breakdown.remote).toBe(100); // Remote job & remote preferred
    // expect(result.breakdown.location).toBe(100); // Bangalore preferred & job matches
  });
});
