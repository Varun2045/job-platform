import fs from 'fs';
import path from 'path';
import { Logger } from './Logger.js';

export interface CompanyMetric {
  id: string;
  name: string;
  durationMs: number;
  jobsFound: number;
  newJobs: number;
  failures: number;
  status: string;
}

export interface GlobalMetrics {
  runTimestamp: string;
  totalDurationMs: number;
  companiesChecked: number;
  totalJobs: number;
  totalNewMatches: number;
  totalFailures: number;
  companies: CompanyMetric[];
}

export class MetricsExporter {
  /**
   * Exports Prometheus-compatible metrics to storage/metrics.prom
   */
  public static exportPrometheus(metrics: GlobalMetrics): void {
    try {
      const filePath = path.join(process.cwd(), 'storage', 'metrics.prom');
      const lines: string[] = [];

      lines.push('# HELP job_monitor_run_duration_seconds Total execution time of the monitor run in seconds');
      lines.push('# TYPE job_monitor_run_duration_seconds gauge');
      lines.push(`job_monitor_run_duration_seconds ${(metrics.totalDurationMs / 1000).toFixed(3)}`);

      lines.push('# HELP job_monitor_companies_checked_total Total number of companies processed in this run');
      lines.push('# TYPE job_monitor_companies_checked_total gauge');
      lines.push(`job_monitor_companies_checked_total ${metrics.companiesChecked}`);

      lines.push('# HELP job_monitor_new_matches_total Total new jobs matching criteria detected in this run');
      lines.push('# TYPE job_monitor_new_matches_total gauge');
      lines.push(`job_monitor_new_matches_total ${metrics.totalNewMatches}`);

      // Company specific metrics
      lines.push('# HELP job_monitor_company_jobs_found Number of jobs found on the company career board');
      lines.push('# TYPE job_monitor_company_jobs_found gauge');
      metrics.companies.forEach((c) => {
        lines.push(`job_monitor_company_jobs_found{company="${c.id}",name="${c.name}"} ${c.jobsFound}`);
      });

      lines.push('# HELP job_monitor_company_scrape_duration_seconds Scrape duration for the company in seconds');
      lines.push('# TYPE job_monitor_company_scrape_duration_seconds gauge');
      metrics.companies.forEach((c) => {
        lines.push(
          `job_monitor_company_scrape_duration_seconds{company="${c.id}",name="${c.name}"} ${(c.durationMs / 1000).toFixed(3)}`,
        );
      });

      lines.push('# HELP job_monitor_company_scrape_failures_total Total scraper failures for this company');
      lines.push('# TYPE job_monitor_company_scrape_failures_total counter');
      metrics.companies.forEach((c) => {
        lines.push(`job_monitor_company_scrape_failures_total{company="${c.id}",name="${c.name}"} ${c.failures}`);
      });

      fs.writeFileSync(filePath, lines.join('\n') + '\n', 'utf-8');
      Logger.debug(`Prometheus metrics successfully exported to: ${filePath}`);
    } catch (e) {
      Logger.error('Failed to export Prometheus metrics', e as any);
    }
  }

  /**
   * Exports a quick health-check JSON file storage/status.json
   */
  public static exportStatus(metrics: GlobalMetrics): void {
    try {
      const filePath = path.join(process.cwd(), 'storage', 'status.json');

      const failedCompanies = metrics.companies.filter((c) => c.status === 'failed').map((c) => c.name);

      const statusObj = {
        status:
          metrics.totalFailures === metrics.companiesChecked
            ? 'unhealthy'
            : metrics.totalFailures > 0
              ? 'degraded'
              : 'healthy',
        lastRun: metrics.runTimestamp,
        totalDurationMs: metrics.totalDurationMs,
        companiesChecked: metrics.companiesChecked,
        failuresCount: metrics.totalFailures,
        failedCompanies,
        newJobsFound: metrics.totalNewMatches,
      };

      fs.writeFileSync(filePath, JSON.stringify(statusObj, null, 2), 'utf-8');
      Logger.debug(`Quick status health check exported to: ${filePath}`);
    } catch (e) {
      Logger.error('Failed to export quick status check', e as any);
    }
  }
}
