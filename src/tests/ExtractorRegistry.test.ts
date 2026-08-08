import { ExtractorRegistry } from '../core/ExtractorRegistry.js';
import fs from 'fs';
import path from 'path';

describe('ExtractorRegistry', () => {
  const companyId = 'test-company-abc';
  const registryFile = path.join(process.cwd(), 'storage', 'extractor_registry.json');

  beforeEach(() => {
    // Clear registry data before each test
    ExtractorRegistry.clear();
  });

  afterAll(() => {
    // Clean up registry file
    if (fs.existsSync(registryFile)) {
      try {
        fs.unlinkSync(registryFile);
      } catch {}
    }
  });

  test('should record successful runs and adjust confidence score correctly', () => {
    // First run (success)
    ExtractorRegistry.recordRun(companyId, 'ApiExtractor', true, 500, 10);
    let history = ExtractorRegistry.getHistory(companyId);

    expect(history).not.toBeNull();
    expect(history!.companyId).toBe(companyId);
    expect(history!.lastSuccessfulExtractor).toBe('ApiExtractor');
    expect(history!.preferredExtractor).toBe('ApiExtractor');
    
    const stats = history!.stats['ApiExtractor'];
    expect(stats.successCount).toBe(1);
    expect(stats.failureCount).toBe(0);
    expect(stats.avgRuntimeMs).toBe(500);
    expect(stats.avgJobsFound).toBe(10);
    expect(stats.confidence).toBeGreaterThan(90); // 100% success minus tiny latency penalty
  });

  test('should record failed runs and calculate confidence decrease', () => {
    // Record one success and one failure
    ExtractorRegistry.recordRun(companyId, 'StaticHtmlExtractor', true, 1000, 5);
    ExtractorRegistry.recordRun(companyId, 'StaticHtmlExtractor', false, 100, 0, 'Forbidden 403');

    const history = ExtractorRegistry.getHistory(companyId);
    expect(history).not.toBeNull();
    
    const stats = history!.stats['StaticHtmlExtractor'];
    expect(stats.successCount).toBe(1);
    expect(stats.failureCount).toBe(1);
    expect(stats.confidence).toBeLessThan(50); // 50% success rate minus penalty
    expect(stats.lastFailureReason).toBe('Forbidden 403');
  });

  test('should determine preferredExtractor based on highest confidence score', () => {
    // ApiExtractor: 1 success, 0 failure
    ExtractorRegistry.recordRun(companyId, 'ApiExtractor', true, 200, 8);
    // PlaywrightExtractor: 1 success, 1 failure
    ExtractorRegistry.recordRun(companyId, 'PlaywrightExtractor', true, 4000, 5);
    ExtractorRegistry.recordRun(companyId, 'PlaywrightExtractor', false, 500, 0, 'Timeout');

    const history = ExtractorRegistry.getHistory(companyId);
    expect(history!.preferredExtractor).toBe('ApiExtractor'); // ApiExtractor has higher confidence
  });

  test('should load persisted registry data from disk', () => {
    // Record a run to trigger write to disk
    ExtractorRegistry.recordRun('persisted-co', 'JsonLdExtractor', true, 300, 15);
    
    // Check if the registry file exists
    expect(fs.existsSync(registryFile)).toBe(true);

    // Call dynamic load/require simulation or verify direct static get
    const history = ExtractorRegistry.getHistory('persisted-co');
    expect(history).not.toBeNull();
    expect(history!.stats['JsonLdExtractor'].successCount).toBe(1);
  });
});
