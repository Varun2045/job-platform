import { FileStorage } from '../storage/FileStorage.js';
import fs from 'fs';
import path from 'path';

describe('FileStorage Unit Tests', () => {
  let storage: FileStorage;
  const tempFile = path.join(process.cwd(), 'storage', 'temp_test.json');

  beforeAll(async () => {
    storage = new FileStorage();
    await storage.initialize();
  });

  afterEach(() => {
    if (fs.existsSync(tempFile)) {
      try {
        fs.unlinkSync(tempFile);
      } catch {}
    }
  });

  it('should write and read json files successfully', async () => {
    const payload = { test: 'data' };
    (storage as any).writeJsonFile(tempFile, payload);
    const read = (storage as any).readJsonFile(tempFile, {});
    expect(read).toEqual(payload);
  });

  it('should fall back to default when reading a non-existing file', () => {
    const read = (storage as any).readJsonFile('non_existent.json', { fallback: true });
    expect(read).toEqual({ fallback: true });
  });

  it('should handle corrupted json file by falling back to default', () => {
    fs.writeFileSync(tempFile, '{corrupted_json', 'utf-8');
    const read = (storage as any).readJsonFile(tempFile, { fallback: true });
    expect(read).toEqual({ fallback: true });
  });

  it('should handle write failures and log errors', () => {
    const invalidPath = path.join(process.cwd(), 'non_existent_folder_abc', 'file.json');
    // This should catch the error and log it without throwing
    expect(() => (storage as any).writeJsonFile(invalidPath, { ok: true })).not.toThrow();
  });

  it('should handle company get/save config', async () => {
    const companyConfig = {
      id: 'test',
      name: 'Test Corp',
      enabled: true,
      priority: 3,
      interval_minutes: 60,
      resume_profiles: [],
      avg_response_time_ms: 0,
      total_scrapes: 0,
      total_failures: 0,
    };

    // Seed company list
    const companiesPath = path.join(process.cwd(), 'storage', 'companies_state.json');
    fs.writeFileSync(companiesPath, JSON.stringify([companyConfig]), 'utf-8');

    await storage.saveCompanyJobs('test', []);
    await storage.updateCompanyScrapeState('test', { total_scrapes: 10 });

    const c = await storage.getCompanyConfig('test');
    expect(c?.total_scrapes).toBe(10);
  });

  it('should return null config for unknown company', async () => {
    const c = await storage.getCompanyConfig('unknown');
    expect(c).toBeNull();
  });

  it('should fetch and update match scores', async () => {
    await storage.saveCachedScore('hash1', 'profile1', 88, 'v1');
    const score = await storage.getCachedScore('hash1', 'profile1', 'v1');
    expect(score).toBe(88);

    const missing = await storage.getCachedScore('hash-missing', 'profile1', 'v1');
    expect(missing).toBeNull();
  });

  it('should manage notified job hashes', async () => {
    await storage.saveJobNotified('notif1');
    expect(await storage.isJobNotified('notif1')).toBe(true);
    expect(await storage.isJobNotified('notif-missing')).toBe(false);
  });

  it('should query enabled companies list', async () => {
    const enabled = await storage.getEnabledCompanies();
    expect(Array.isArray(enabled)).toBe(true);
  });
});
