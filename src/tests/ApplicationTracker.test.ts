import { FileStorage } from '../storage/FileStorage.js';
import { Application } from '../companies/Scraper.js';

describe('ApplicationTracker (FileStorage)', () => {
  let storage: FileStorage;

  beforeAll(async () => {
    storage = new FileStorage();
    await storage.initialize();
  });

  it('should save and fetch application tracking statuses successfully', async () => {
    const app: Application = {
      jobHash: 'hash123',
      company: 'Google',
      jobId: '12345',
      status: 'Applied',
      appliedDate: new Date().toISOString(),
      resumeUsed: 'resume_v1.pdf',
      notes: 'First round scheduled.',
      lastUpdated: new Date().toISOString()
    };

    await storage.saveApplication(app);
    const list = await storage.getApplications();

    expect(list.length).toBeGreaterThan(0);
    const found = list.find((a) => a.jobHash === 'hash123');
    expect(found).toBeDefined();
    expect(found?.status).toBe('Applied');
    expect(found?.notes).toBe('First round scheduled.');
  });
});
