import fs from 'fs';
import path from 'path';
import { GlobalMetrics } from './MetricsExporter.js';
import { Application } from '../companies/Scraper.js';

export class WeeklyReportGenerator {
  public static generate(
    metrics: GlobalMetrics,
    applications: Application[],
    newMatches: { job: any; score: number }[],
  ): void {
    const storageDir = path.join(process.cwd(), 'storage');
    if (!fs.existsSync(storageDir)) {
      fs.mkdirSync(storageDir, { recursive: true });
    }

    const reportPath = path.join(storageDir, 'weekly-report.md');

    // 1. Compile Match statistics
    const totalNewMatches = newMatches.length;
    const avgMatchScore =
      newMatches.length > 0 ? Math.round(newMatches.reduce((sum, m) => sum + m.score, 0) / newMatches.length) : 0;

    // 2. Compile Application Tracking Pipeline
    const appsCount = applications.length;
    const interviewsCount = applications.filter((a) => a.status === 'Interview').length;
    const offersCount = applications.filter((a) => a.status === 'Offer').length;
    const pendingCount = applications.filter((a) =>
      ['Saved', 'Applied', 'OA Scheduled', 'OA Completed'].includes(a.status),
    ).length;
    const rejectedCount = applications.filter((a) => a.status === 'Rejected').length;

    // 3. Top Companies
    const companyJobsMap: Record<string, number> = {};
    metrics.companies.forEach((c) => {
      companyJobsMap[c.name] = (companyJobsMap[c.name] ?? 0) + c.jobsFound;
    });
    const topCompanies = Object.entries(companyJobsMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => `- **${name}**: ${count} jobs discovered`);

    // 4. Scraper Performance Metrics
    const failureRate =
      metrics.companiesChecked > 0 ? Math.round((metrics.totalFailures / metrics.companiesChecked) * 100) : 0;

    // 5. Build weekly-report.md content
    const reportContent = `# Weekly Job Monitor Report

## Executive Summary
- **Total Scraped Postings**: ${metrics.totalJobs}
- **New High-Match Roles Found**: ${totalNewMatches}
- **Average Resume Match Score**: ${avgMatchScore}%
- **Scraper Failure Rate**: ${failureRate}%
- **System Scrape Duration**: ${(metrics.totalDurationMs / 1000).toFixed(1)}s

## Application Pipeline Status
- **Total Tracked Applications**: ${appsCount}
- **Pending/Applied**: ${pendingCount}
- **Interviews Scheduled**: ${interviewsCount}
- **Offers Received**: ${offersCount}
- **Rejections/Closed**: ${rejectedCount}

### Current Pipeline Details
${
  applications
    .map(
      (a) =>
        `- **${a.company}** (ID: ${a.jobId}) -> **${a.status}** (Last Updated: ${new Date(a.lastUpdated).toLocaleDateString()})`,
    )
    .slice(0, 15)
    .join('\n') || '- No applications tracked yet.'
}

## Top Hiring Companies This Week
${topCompanies.join('\n') || '- No jobs discovered.'}

## Performance Metrics Profile
- **Total Boards Scanned**: ${metrics.companiesChecked}
- **Success Rate**: ${100 - failureRate}%
- **Slowest Scraper Run**: ${[...metrics.companies].sort((a, b) => b.durationMs - a.durationMs)[0]?.name || 'N/A'}
- **Fastest Scraper Run**: ${[...metrics.companies].sort((a, b) => a.durationMs - b.durationMs)[0]?.name || 'N/A'}

---
*Report generated automatically by Job Monitor Platform v1.2.0*
`;

    fs.writeFileSync(reportPath, reportContent, 'utf-8');
  }
}
