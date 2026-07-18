import { CompanyConfig } from '../companies/Scraper.js';

export interface SystemStats {
  totalCompanies: number;
  totalScrapes: number;
  totalFailures: number;
  failureRate: number;
  avgResponseTimeSec: number;
}

export class StatsReporter {
  /**
   * Safely aggregates scraper run statistics across all active companies,
   * handling missing or partial statistics and preventing divide-by-zero.
   */
  public static calculate(companies: CompanyConfig[]): SystemStats {
    const totalCompanies = companies.length;
    const totalScrapes = companies.reduce((acc, c) => acc + (c.total_scrapes ?? 0), 0);
    const totalFailures = companies.reduce((acc, c) => acc + (c.total_failures ?? 0), 0);

    const failureRate = totalScrapes > 0 ? Number(((totalFailures / totalScrapes) * 100).toFixed(1)) : 0;

    // Filter to only companies that have been scraped and have a response time recorded
    const companiesWithStats = companies.filter((c) => (c.avg_response_time_ms ?? 0) > 0);

    const avgResponseTimeMs =
      companiesWithStats.length > 0
        ? Math.round(
            companiesWithStats.reduce((acc, c) => acc + (c.avg_response_time_ms ?? 0), 0) / companiesWithStats.length,
          )
        : 0;

    const avgResponseTimeSec = Number((avgResponseTimeMs / 1000).toFixed(2));

    return {
      totalCompanies,
      totalScrapes,
      totalFailures,
      failureRate,
      avgResponseTimeSec,
    };
  }
}
