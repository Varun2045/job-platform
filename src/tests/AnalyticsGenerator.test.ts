import { jest } from '@jest/globals';
import { AnalyticsGenerator } from '../core/AnalyticsGenerator.js';
import { WeeklyReportGenerator } from '../core/WeeklyReportGenerator.js';
import { GlobalMetrics } from '../core/MetricsExporter.js';
import { Application } from '../companies/Scraper.js';
import fs from 'fs';
import path from 'path';

describe('Analytics and Report Generators', () => {
  const statsPath = path.join(process.cwd(), 'storage', 'stats.json');
  let originalStatsContent: string | null = null;

  const metrics: GlobalMetrics = {
    runTimestamp: new Date().toISOString(),
    totalDurationMs: 5000,
    companiesChecked: 2,
    totalJobs: 10,
    totalNewMatches: 2,
    totalFailures: 0,
    companies: [
      {
        id: 'google',
        name: 'Google',
        status: 'healthy',
        jobsFound: 10,
        newJobs: 2,
        durationMs: 5000,
        failures: 0,
      },
      {
        id: 'facebook',
        name: 'Facebook',
        status: 'healthy',
        jobsFound: 5,
        newJobs: 1,
        durationMs: 2000,
        failures: 0,
      },
    ],
  };

  const applications: Application[] = [
    {
      jobHash: 'hash123',
      company: 'Google',
      jobId: '12345',
      status: 'Interview',
      appliedDate: '2026-07-01T00:00:00Z',
      resumeUsed: 'resume.pdf',
      notes: 'Final round scheduled.',
      lastUpdated: new Date().toISOString(),
    },
  ];

  beforeAll(() => {
    if (fs.existsSync(statsPath)) {
      originalStatsContent = fs.readFileSync(statsPath, 'utf-8');
    }
    // Write clean mock stats for the test run
    fs.writeFileSync(
      statsPath,
      JSON.stringify([
        {
          timestamp: new Date().toISOString(),
          jobsScraped: 10,
          matchesFound: 2,
          companiesChecked: 1,
          failuresCount: 0,
        },
      ]),
      'utf-8',
    );
  });

  afterAll(() => {
    if (originalStatsContent !== null) {
      fs.writeFileSync(statsPath, originalStatsContent, 'utf-8');
    } else if (fs.existsSync(statsPath)) {
      fs.unlinkSync(statsPath);
    }
  });

  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it('should compile analytics trend profile correctly', () => {
    AnalyticsGenerator.generate(metrics);
    const analyticsPath = path.join(process.cwd(), 'storage', 'analytics.json');
    expect(fs.existsSync(analyticsPath)).toBe(true);

    const data = JSON.parse(fs.readFileSync(analyticsPath, 'utf-8'));
    expect(data.averageScore).toBeDefined();
    expect(data.failureRate).toBe(0);
  });

  it('should compile weekly report markdown successfully', () => {
    // Mock fs.existsSync to simulate missing storage directory
    const existsSpy = jest.spyOn(fs, 'existsSync').mockImplementation((p: any) => {
      if (p.toString().endsWith('storage')) return false;
      return true;
    });
    const mkdirSpy = jest.spyOn(fs, 'mkdirSync').mockImplementation((_p: any) => null as any);

    WeeklyReportGenerator.generate(metrics, applications, [
      { job: { title: 'Engineer' }, score: 85 },
      { job: { title: 'Architect' }, score: 95 },
    ]);

    expect(mkdirSpy).toHaveBeenCalled();

    existsSpy.mockRestore();
    mkdirSpy.mockRestore();

    // Verify it actually writes file successfully when not mocked
    WeeklyReportGenerator.generate(metrics, applications, [{ job: { title: 'Engineer' }, score: 85 }]);
    const reportPath = path.join(process.cwd(), 'storage', 'weekly-report.md');
    expect(fs.existsSync(reportPath)).toBe(true);

    const content = fs.readFileSync(reportPath, 'utf-8');
    expect(content).toContain('# Weekly Job Monitor Report');
    expect(content).toContain('Interviews Scheduled');
    expect(content).toContain('85%'); // avg score of 85 in the second run
  });
});
