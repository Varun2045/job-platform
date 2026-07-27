import { StorageProvider, SavedExtensionJob } from '../storage/StorageProvider.js';
import { Logger } from './Logger.js';

export class JobInboxService {
  private storage: StorageProvider;

  constructor(storage: StorageProvider) {
    this.storage = storage;
  }

  public async getInboxJobs(userId?: string): Promise<SavedExtensionJob[]> {
    const all = await this.storage.getExtensionJobs(userId);
    return all.filter((j) => j.status === 'Captured' || j.status === 'Inbox');
  }

  public async promoteToApplication(inboxJobId: string, userId: string): Promise<any> {
    const inboxJobs = await this.storage.getExtensionJobs(userId);
    const target = inboxJobs.find((j) => j.id === inboxJobId);

    if (!target) {
      throw new Error(`Inbox job [${inboxJobId}] not found.`);
    }

    const appRecord = {
      company: target.companyName,
      jobId: `job-${target.id}`,
      jobHash: target.id,
      title: target.jobTitle,
      status: 'Saved',
      notes: target.description || '',
      location: target.location || 'Remote',
      url: target.jobUrl,
      appliedDate: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
    };

    await this.storage.saveApplication(appRecord, userId);

    target.status = 'Promoted';
    await this.storage.saveExtensionJob(target);

    Logger.info(`JobInboxService: Promoted job [${target.jobTitle} at ${target.companyName}] to active application.`);
    return appRecord;
  }
}
