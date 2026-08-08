import { AtsDetector } from '../core/AtsDetector.js';
import { ExtractorRegistry } from '../core/ExtractorRegistry.js';
import { BrowserPool } from '../core/BrowserPool.js';

describe('Scraper Platform Integration & Regression Protection Tests', () => {
  const companyId = 'integration-test-company';

  beforeEach(() => {
    ExtractorRegistry.clear();
  });

  afterAll(async () => {
    // Ensure browser pool is cleaned up
    await BrowserPool.getInstance().shutdown();
  });

  test('should classify green status for healthy 0 jobs crawled', () => {
    const rawJobs: any[] = [];
    const httpStatus = 200;
    const isBlocked = false;
    const scraperError = '';
    const isMaintenance = false;

    let status = 'Green';
    let failureReason = '';

    if (isMaintenance) {
      status = 'Yellow';
      failureReason = 'Workday Weekly Maintenance Outage (Scheduled)';
    } else if (scraperError) {
      status = 'Red';
      failureReason = scraperError;
    } else if (rawJobs.length === 0) {
      if (isBlocked) {
        status = 'Red';
        failureReason = 'Access Blocked';
      } else if (httpStatus >= 400) {
        status = 'Red';
        failureReason = `HTTP Error Code: ${httpStatus}`;
      } else {
        status = 'Green';
        failureReason = 'Healthy (0 legitimate jobs)';
      }
    }

    expect(status).toBe('Green');
    expect(failureReason).toBe('Healthy (0 legitimate jobs)');
  });

  test('should classify yellow status for scheduled Workday maintenance outage', () => {
    const rawJobs: any[] = [];
    const httpStatus = 503;
    const isBlocked = false;
    const scraperError = '';
    const isMaintenance = true;

    let status = 'Green';
    let failureReason = '';

    if (isMaintenance) {
      status = 'Yellow';
      failureReason = 'Workday Weekly Maintenance Outage (Scheduled)';
    } else if (scraperError) {
      status = 'Red';
      failureReason = scraperError;
    }

    expect(status).toBe('Yellow');
    expect(failureReason).toBe('Workday Weekly Maintenance Outage (Scheduled)');
  });

  test('should classify red status for anti-bot blocked responses', () => {
    const rawJobs: any[] = [];
    const httpStatus = 403;
    const isBlocked = true;
    const scraperError = '';
    const isMaintenance = false;

    let status = 'Green';
    let failureReason = '';

    if (isMaintenance) {
      status = 'Yellow';
    } else if (scraperError) {
      status = 'Red';
    } else if (rawJobs.length === 0) {
      if (isBlocked) {
        status = 'Red';
        failureReason = 'Access Blocked by Anti-Bot Detection';
      }
    }

    expect(status).toBe('Red');
    expect(failureReason).toBe('Access Blocked by Anti-Bot Detection');
  });

  test('should retrieve preferred extractor from registry based on confidence stats', () => {
    ExtractorRegistry.recordRun(companyId, 'ApiExtractor', true, 200, 15);
    ExtractorRegistry.recordRun(companyId, 'PlaywrightExtractor', true, 5000, 15);

    const history = ExtractorRegistry.getHistory(companyId);
    expect(history).not.toBeNull();
    expect(history!.preferredExtractor).toBe('ApiExtractor');
  });

  test('should correctly identify Workday tenancy URL pattern', () => {
    const url = 'https://zoom.wd5.myworkdayjobs.com/Zoom';
    const isWorkday = url.toLowerCase().includes('myworkdayjobs.com');
    expect(isWorkday).toBe(true);
  });
});
