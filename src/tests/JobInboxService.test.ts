import { describe, it, expect, beforeEach } from '@jest/globals';
import { JobInboxService } from '../core/JobInboxService.js';
import { FileStorage } from '../storage/FileStorage.js';

describe('JobInboxService Unit Tests', () => {
  let storage: FileStorage;
  let service: JobInboxService;

  beforeEach(() => {
    storage = new FileStorage();
    service = new JobInboxService(storage);
  });

  it('should fetch inbox jobs and promote to active application', async () => {
    const job = await storage.saveExtensionJob({
      id: '',
      userId: 'test-inbox-user',
      companyName: 'Linear',
      jobTitle: 'Senior Frontend Engineer',
      location: 'Remote',
      jobUrl: 'https://ashbyhq.com/linear/jobs/111',
      platformSource: 'Ashby',
      status: 'Inbox',
      createdAt: new Date().toISOString(),
    });

    const inbox = await service.getInboxJobs('test-inbox-user');
    expect(inbox.some((j) => j.companyName === 'Linear')).toBe(true);

    const app = await service.promoteToApplication(job.id, 'test-inbox-user');
    expect(app).toBeDefined();
    expect(app.company).toBe('Linear');
    expect(app.status).toBe('Saved');
  });
});
