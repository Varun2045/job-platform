import fs from 'fs';
import path from 'path';
import { GlobalMetrics } from './MetricsExporter.js';
import { Logger } from './Logger.js';

export interface AnalyticsTrend {
  jobsPerDay: { [date: string]: number };
  matchesPerDay: { [date: string]: number };
  averageScore: number;
  mostActiveCompanies: { name: string; jobsCount: number }[];
  fastestScrapers: { name: string; avgRuntimeMs: number }[];
  slowestScrapers: { name: string; avgRuntimeMs: number }[];
  failureRate: number;
}

export class AnalyticsGenerator {
  public static generate(metrics: GlobalMetrics): void {
    const storageDir = path.join(process.cwd(), 'storage');
    const statsPath = path.join(storageDir, 'stats.json');
    const scoresPath = path.join(storageDir, 'scores.json');
    const analyticsPath = path.join(storageDir, 'analytics.json');

    let history: any[] = [];
    try {
      if (fs.existsSync(statsPath)) {
        history = JSON.parse(fs.readFileSync(statsPath, 'utf-8'));
      }
    } catch (e) {
      Logger.error('Failed to read stats.json for analytics', e as any);
    }

    // Group jobs and matches by day
    const jobsPerDay: { [date: string]: number } = {};
    const matchesPerDay: { [date: string]: number } = {};
    let totalFailures = 0;
    let totalScrapes = 0;

    history.forEach((run: any) => {
      if (run.timestamp) {
        const dateStr = new Date(run.timestamp).toISOString().split('T')[0];
        jobsPerDay[dateStr] = (jobsPerDay[dateStr] ?? 0) + (run.jobsScraped ?? 0);
        matchesPerDay[dateStr] = (matchesPerDay[dateStr] ?? 0) + (run.matchesFound ?? 0);
      }
      totalFailures += run.failuresCount ?? 0;
      totalScrapes += (run.companiesChecked ?? 1);
    });

    // Calculate failure rate
    const failureRate = totalScrapes > 0 ? Math.round((totalFailures / totalScrapes) * 100) : 0;

    // Calculate average score from scores.json cache
    let averageScore = 78; // Default fallback
    try {
      if (fs.existsSync(scoresPath)) {
        const scoresObj = JSON.parse(fs.readFileSync(scoresPath, 'utf-8'));
        const scores = Object.values(scoresObj).map((v: any) => typeof v === 'object' ? (v.score ?? 70) : Number(v)).filter(v => !isNaN(v));
        if (scores.length > 0) {
          averageScore = Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length);
        }
      }
    } catch (e) {
      // Ignore
    }

    // Active companies, fastest, and slowest scrapers
    const sortedByJobs = [...metrics.companies].sort((a, b) => b.jobsFound - a.jobsFound);
    const mostActiveCompanies = sortedByJobs.slice(0, 5).map(c => ({
      name: c.name,
      jobsCount: c.jobsFound
    }));

    const durations = metrics.companies.filter(c => c.durationMs > 0);
    const fastest = [...durations].sort((a, b) => a.durationMs - b.durationMs).slice(0, 5).map(c => ({
      name: c.name,
      avgRuntimeMs: c.durationMs
    }));

    const slowest = [...durations].sort((a, b) => b.durationMs - a.durationMs).slice(0, 5).map(c => ({
      name: c.name,
      avgRuntimeMs: c.durationMs
    }));

    const analyticsJson: AnalyticsTrend = {
      jobsPerDay,
      matchesPerDay,
      averageScore,
      mostActiveCompanies,
      fastestScrapers: fastest,
      slowestScrapers: slowest,
      failureRate
    };

    fs.writeFileSync(analyticsPath, JSON.stringify(analyticsJson, null, 2), 'utf-8');
    Logger.debug(`Analytics trends JSON written to: ${analyticsPath}`);
  }
}
