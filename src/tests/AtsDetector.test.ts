import { AtsDetector } from '../core/AtsDetector.js';
import { CompanyConfig } from '../companies/Scraper.js';
import { HttpClient } from '../core/HttpClient.js';

describe('AtsDetector Unit Tests', () => {
  const mockCompany: CompanyConfig = {
    id: 'test-co',
    name: 'Test Co',
    enabled: true,
    priority: 3,
    interval_minutes: 60,
    resume_profiles: ['backend'],
    avg_response_time_ms: 0,
    total_scrapes: 0,
    total_failures: 0
  };

  it('should evaluate shouldDetect properly', () => {
    expect(AtsDetector.shouldDetect(mockCompany, false, true)).toBe(true);
    expect(AtsDetector.shouldDetect(mockCompany, true, false)).toBe(true);
    expect(AtsDetector.shouldDetect({ ...mockCompany, detected_ats: undefined }, false, false)).toBe(true);
    expect(AtsDetector.shouldDetect({ ...mockCompany, detected_ats: 'auto' }, false, false)).toBe(true);
    expect(AtsDetector.shouldDetect({ ...mockCompany, detected_ats: 'workday' }, false, false)).toBe(false);
  });

  it('should detect Workday via URL', async () => {
    const workdayCompany = { ...mockCompany, api_endpoint: 'https://test.myworkdayjobs.com/Careers' };
    const mockHttpClient = {} as HttpClient;

    const result = await AtsDetector.detect(workdayCompany, mockHttpClient);
    expect(result).toBe('workday');
  });

  it('should detect Greenhouse via URL', async () => {
    const greenhouseCompany = { ...mockCompany, api_endpoint: 'https://boards.greenhouse.io/test-co' };
    const mockHttpClient = {} as HttpClient;

    const result = await AtsDetector.detect(greenhouseCompany, mockHttpClient);
    expect(result).toBe('greenhouse');
  });

  it('should detect Lever via URL', async () => {
    const leverCompany = { ...mockCompany, api_endpoint: 'https://lever.co/test-co' };
    const mockHttpClient = {} as HttpClient;

    const result = await AtsDetector.detect(leverCompany, mockHttpClient);
    expect(result).toBe('lever');
  });

  it('should detect Workday via HTML contents', async () => {
    const company = { ...mockCompany, api_endpoint: 'https://test.com/careers' };
    const mockHttpClient = {
      get: async () => ({
        data: '<html><body>wday/cxs/jobs</body></html>',
        status: 200,
        headers: new Headers(),
        durationMs: 120
      })
    } as unknown as HttpClient;

    const result = await AtsDetector.detect(company, mockHttpClient);
    expect(result).toBe('workday');
  });

  it('should detect Greenhouse via HTML contents', async () => {
    const company = { ...mockCompany, api_endpoint: 'https://test.com/careers' };
    const mockHttpClient = {
      get: async () => ({
        data: '<html><body><script src="https://boards.greenhouse.io/embed/client"></script></body></html>',
        status: 200,
        headers: new Headers(),
        durationMs: 120
      })
    } as unknown as HttpClient;

    const result = await AtsDetector.detect(company, mockHttpClient);
    expect(result).toBe('greenhouse');
  });

  it('should detect Lever via HTML contents', async () => {
    const company = { ...mockCompany, api_endpoint: 'https://test.com/careers' };
    const mockHttpClient = {
      get: async () => ({
        data: '<html><body><div id="lever-jobs-container"><a href="https://lever.co/test/job-1">Job</a></div></body></html>',
        status: 200,
        headers: new Headers(),
        durationMs: 120
      })
    } as unknown as HttpClient;

    const result = await AtsDetector.detect(company, mockHttpClient);
    expect(result).toBe('lever');
  });

  it('should detect SmartRecruiters via HTML contents', async () => {
    const company = { ...mockCompany, api_endpoint: 'https://test.com/careers' };
    const mockHttpClient = {
      get: async () => ({
        data: '<html><body>smartrecruiters.com/test</body></html>',
        status: 200,
        headers: new Headers(),
        durationMs: 120
      })
    } as unknown as HttpClient;

    const result = await AtsDetector.detect(company, mockHttpClient);
    expect(result).toBe('fallback');
  });

  it('should detect Ashby via HTML contents', async () => {
    const company = { ...mockCompany, api_endpoint: 'https://test.com/careers' };
    const mockHttpClient = {
      get: async () => ({
        data: '<html><body>ashbyhq.com/test-careers</body></html>',
        status: 200,
        headers: new Headers(),
        durationMs: 120
      })
    } as unknown as HttpClient;

    const result = await AtsDetector.detect(company, mockHttpClient);
    expect(result).toBe('fallback');
  });

  it('should fall back to default when no signature matches', async () => {
    const company = { ...mockCompany, api_endpoint: 'https://test.com/careers' };
    const mockHttpClient = {
      get: async () => ({
        data: '<html><body>generic careers site</body></html>',
        status: 200,
        headers: new Headers(),
        durationMs: 120
      })
    } as unknown as HttpClient;

    const result = await AtsDetector.detect(company, mockHttpClient);
    expect(result).toBe('fallback');
  });

  it('should handle network timeout/error gracefully', async () => {
    const company = { ...mockCompany, api_endpoint: 'https://test.com/careers' };
    const mockHttpClient = {
      get: async () => {
        throw new Error('Connection refused');
      }
    } as unknown as HttpClient;

    const result = await AtsDetector.detect(company, mockHttpClient);
    expect(result).toBe('fallback');
  });
});
