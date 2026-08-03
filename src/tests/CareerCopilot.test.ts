import { FileStorage } from '../storage/FileStorage.js';
import { CareerAgent } from '../core/CareerAgent.js';
import { SkillGapEngine } from '../core/SkillGapEngine.js';
import { InterviewCopilot } from '../core/InterviewCopilot.js';
import { SalaryAnalyzer } from '../core/SalaryAnalyzer.js';
import { DailyBriefService } from '../core/DailyBriefService.js';
import fs from 'fs';
import path from 'path';

describe('Version 4.0.0 Autonomous Career Copilot Integration Checks', () => {
  const storage = new FileStorage();
  const userId = 'copilot-test-user-id';

  beforeAll(async () => {
    const testFiles = [
      'copilot_recommendations.json',
      'learning_roadmaps.json',
      'interview_sessions.json',
      'career_roadmaps.json',
      'daily_briefs.json',
      'profiles.json',
      'user_resumes.json',
      'applications.json',
      'companies_state.json',
    ];
    for (const f of testFiles) {
      const fp = path.join(process.cwd(), 'storage', f);
      if (fs.existsSync(fp)) {
        try {
          fs.unlinkSync(fp);
        } catch {}
      }
    }

    await storage.initialize();

    // Seed target company
    const seedCompany = {
      id: 'mockcorp',
      name: 'MockCorp',
      enabled: true,
      url: 'https://mockcorp.com',
      last_successful_scrape: new Date().toISOString(),
      total_failures: 0,
      total_scrapes: 1,
    };
    const companyList = [seedCompany];
    fs.writeFileSync(
      path.join(process.cwd(), 'storage', 'companies_state.json'),
      JSON.stringify(companyList, null, 2),
      'utf-8',
    );

    // Seed mock jobs for MockCorp
    const mockJobs = [
      {
        id: '1',
        jobHash: 'mock-hash-1',
        title: 'Senior TypeScript Engineer',
        company: 'MockCorp',
        location: 'Remote',
        country: 'US',
        experience: 'Senior',
        employmentType: 'Full-time',
        url: 'https://mockcorp.com/jobs/1',
        datePosted: new Date().toISOString(),
        team: 'Engineering',
        source: 'MockCorp Careers',
        isRemote: true,
        salary: '$150,000 - $180,000',
        description:
          'We are seeking a Senior TypeScript Engineer proficient in Node.js, Go, and Kubernetes to scale our infrastructure.',
      },
    ];
    await storage.saveCompanyJobs('mockcorp', mockJobs);

    // Seed user profile
    await storage.saveProfile(userId, {
      name: 'Jane Doe',
      experience_level: 'Mid Level',
      tech_stack: ['TypeScript', 'Node.js'],
    });

    // Seed user resume
    await storage.saveUserResume(
      userId,
      'Default Resume',
      'Jane Doe is a Software Engineer experienced in TypeScript and Node.js.',
    );
  });

  it('should run CareerAgent analysis and fetch recommendations', async () => {
    const recs = await CareerAgent.analyzeAndRecommend(userId, storage);
    expect(recs.length).toBeGreaterThan(0);
    expect(recs[0]).toHaveProperty('priority');
  });

  it('should compute Skill Gaps and suggest roadmap tasks', async () => {
    const gap = await SkillGapEngine.analyzeGap(userId, storage);
    expect(gap).toHaveProperty('missingSkills');
    expect(gap).toHaveProperty('roadmapTasks');
    const missing = gap.missingSkills.map((s) => s.skill.toLowerCase());
    expect(missing).toContain('go');
    expect(missing).toContain('kubernetes');
  });

  it('should initiate and evaluate Interview Simulator sessions', async () => {
    const session = await InterviewCopilot.startSession(userId, 'Coding', storage);
    expect(session.session_type).toBe('Coding');
    expect(session.questions.length).toBeGreaterThan(0);

    const responses = {
      [session.questions[0].id]:
        'I would implement a sliding window limiter leveraging redis/memory and test it under scale.',
    };

    const evaluated = await InterviewCopilot.evaluateSession(userId, session.id, responses, storage);
    expect(evaluated.score).toBeGreaterThan(0);
    expect(evaluated.feedback.starCritique[session.questions[0].id].rating).toBeGreaterThanOrEqual(2);
  });

  it('should estimate expected salary bounds and negotiation metrics', async () => {
    const analysis = await SalaryAnalyzer.analyzeSalary(userId, storage);
    expect(analysis.expectedSalary).toBeGreaterThan(100000);
    expect(analysis.percentile).toBeGreaterThan(60);
    expect(analysis.negotiationMin).toBeLessThan(analysis.negotiationMax);
  });

  it('should compile daily briefing indicators', async () => {
    await storage.saveApplication(
      {
        jobHash: 'mock-hash-1',
        company: 'MockCorp',
        jobId: '1',
        status: 'Applied',
        notes: 'Applied last week',
        lastUpdated: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
      },
      userId,
    );

    const brief = await DailyBriefService.compileDailyBrief(userId, storage);
    expect(brief.applicationsToFollowUp.length).toBeGreaterThan(0);
    expect(brief.applicationsToFollowUp[0].company).toBe('MockCorp');
  });

});
