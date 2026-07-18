import fs from 'fs';
import path from 'path';
import { GlobalMetrics } from './MetricsExporter.js';

export class DailyReportGenerator {
  public static generate(
    metrics: GlobalMetrics,
    addedMatches: { job: any; score: number }[],
    updatedMatches: { job: any; score: number }[],
  ): void {
    const storageDir = path.join(process.cwd(), 'storage');
    if (!fs.existsSync(storageDir)) {
      fs.mkdirSync(storageDir, { recursive: true });
    }

    const reportPath = path.join(storageDir, 'daily-report.md');
    const todayStr = new Date().toLocaleDateString(undefined, { dateStyle: 'long' });

    // Compute top companies (by jobs found)
    const sortedComp = [...metrics.companies].sort((a, b) => b.jobsFound - a.jobsFound);
    const topCompanies = sortedComp
      .slice(0, 5)
      .map((c) => `- **${c.name}**: ${c.jobsFound} jobs found (Status: ${c.status})`);

    // Compute top scores
    const allMatches = [...addedMatches, ...updatedMatches].sort((a, b) => b.score - a.score);
    const topScores = allMatches
      .slice(0, 5)
      .map((m) => `- **${m.job.company}** - ${m.job.title} (**${m.score}%** match) [Link](${m.job.url})`);

    // Compute failures
    const failures = metrics.companies.filter((c) => c.status === 'failed');
    const failureList =
      failures.length > 0
        ? failures.map((f) => `- **${f.name}**: Scraper failed during execution.`)
        : ['- No scraper failures encountered!'];

    // Performance
    const durations = metrics.companies.filter((c) => c.durationMs > 0).sort((a, b) => b.durationMs - a.durationMs);
    const slowest = durations.slice(0, 3).map((c) => `- **${c.name}**: ${(c.durationMs / 1000).toFixed(2)}s`);
    const fastest = [...durations]
      .reverse()
      .slice(0, 3)
      .map((c) => `- **${c.name}**: ${(c.durationMs / 1000).toFixed(2)}s`);

    const mdContent = `# Daily Job Monitor Report - ${todayStr}

## Executive Summary
- **Companies Scanned**: ${metrics.companiesChecked}
- **Total Jobs Discovered**: ${metrics.totalJobs}
- **New Jobs Found**: ${addedMatches.length}
- **Updated Jobs Detected**: ${updatedMatches.length}
- **High-Score Matches**: ${allMatches.length}
- **Scraper Failures**: ${metrics.totalFailures}
- **Execution Runtime**: ${(metrics.totalDurationMs / 1000).toFixed(1)}s

## Top Companies (Jobs Found)
${topCompanies.length > 0 ? topCompanies.join('\n') : '- No jobs found.'}

## Highest-Matching Job Postings
${topScores.length > 0 ? topScores.join('\n') : '- No matching job postings found.'}

## Scraper Failures & Exceptions
${failureList.join('\n')}

## Scraper Performance Profile
### Slowest Scrapers
${slowest.length > 0 ? slowest.join('\n') : '- N/A'}

### Fastest Scrapers
${fastest.length > 0 ? fastest.join('\n') : '- N/A'}

---
*Report generated automatically by Job Monitor Platform v1.1.0*
`;

    fs.writeFileSync(reportPath, mdContent, 'utf-8');
  }
}
