import { StatsReporter } from '../core/Telemetry.js';
import { CompanyConfig } from '../companies/Scraper.js';

describe('StatsReporter Unit Tests', () => {
  const createMockCompany = (overrides: Partial<CompanyConfig>): CompanyConfig => ({
    id: 'mock_company',
    name: 'Mock Company',
    enabled: true,
    priority: 3,
    interval_minutes: 360,
    detected_ats: 'lever',
    resume_profiles: ['backend'],
    total_scrapes: 0,
    total_failures: 0,
    avg_response_time_ms: 0,
    ...overrides,
  });

  it('should return default zero metrics for an empty registry', () => {
    const stats = StatsReporter.calculate([]);
    expect(stats.totalCompanies).toBe(0);
    expect(stats.totalScrapes).toBe(0);
    expect(stats.totalFailures).toBe(0);
    expect(stats.failureRate).toBe(0);
    expect(stats.avgResponseTimeSec).toBe(0);
  });

  it('should handle companies with no statistics (undefined or zero values)', () => {
    const companies = [
      createMockCompany({ total_scrapes: undefined, total_failures: undefined, avg_response_time_ms: undefined }),
      createMockCompany({ total_scrapes: 0, total_failures: 0, avg_response_time_ms: 0 }),
    ];

    const stats = StatsReporter.calculate(companies);
    expect(stats.totalCompanies).toBe(2);
    expect(stats.totalScrapes).toBe(0);
    expect(stats.totalFailures).toBe(0);
    expect(stats.failureRate).toBe(0);
    expect(stats.avgResponseTimeSec).toBe(0);
  });

  it('should correctly calculate metrics for companies with partial statistics', () => {
    const companies = [
      createMockCompany({ total_scrapes: 5, total_failures: undefined, avg_response_time_ms: 2000 }),
      createMockCompany({ total_scrapes: undefined, total_failures: 2, avg_response_time_ms: undefined }),
    ];

    const stats = StatsReporter.calculate(companies);
    expect(stats.totalCompanies).toBe(2);
    expect(stats.totalScrapes).toBe(5);
    expect(stats.totalFailures).toBe(2);
    expect(stats.failureRate).toBe(40); // 2 / 5 = 40%
    expect(stats.avgResponseTimeSec).toBe(2); // only 2000ms is recorded
  });

  it('should correctly calculate metrics for multiple companies with mixed data', () => {
    const companies = [
      createMockCompany({ total_scrapes: 10, total_failures: 2, avg_response_time_ms: 1500 }),
      createMockCompany({ total_scrapes: 20, total_failures: 5, avg_response_time_ms: 2500 }),
      createMockCompany({ total_scrapes: 0, total_failures: 0, avg_response_time_ms: 0 }),
    ];

    const stats = StatsReporter.calculate(companies);
    expect(stats.totalCompanies).toBe(3);
    expect(stats.totalScrapes).toBe(30);
    expect(stats.totalFailures).toBe(7);
    expect(stats.failureRate).toBe(23.3); // 7 / 30 = 23.333%
    expect(stats.avgResponseTimeSec).toBe(2); // (1500 + 2500) / 2 = 2000ms = 2s
  });

  it('should avoid divide-by-zero errors when total scrapes are zero but failures are positive', () => {
    // Edge case that shouldn't happen normally, but tests robustness
    const companies = [createMockCompany({ total_scrapes: 0, total_failures: 5, avg_response_time_ms: 1000 })];

    const stats = StatsReporter.calculate(companies);
    expect(stats.totalScrapes).toBe(0);
    expect(stats.totalFailures).toBe(5);
    expect(stats.failureRate).toBe(0); // avoided NaN/Infinity
    expect(stats.avgResponseTimeSec).toBe(1);
  });
});
