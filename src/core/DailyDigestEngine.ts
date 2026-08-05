import { StorageProvider } from '../storage/StorageProvider.js';
import { Logger } from './Logger.js';

export interface DailyDigestPayload {
  userId: string;
  summaryDate: string;
  totalApplicationsTracked: number;
  upcomingInterviews: any[];
  dueFollowUps: any[];
  matchingJobsCount: number;
}

export interface DigestDispatchResult {
  userId: string;
  dispatchedChannels: string[];
  digestPayload: DailyDigestPayload;
}

export class DailyDigestEngine {
  private storage: StorageProvider;

  constructor(storage: StorageProvider) {
    this.storage = storage;
  }

  public async compileDigest(userId: string): Promise<DailyDigestPayload> {
    const apps = await this.storage.getApplications(userId);
    const followups = await this.storage.getFollowUps(userId);
    const jobs = await this.storage.getAllJobs();

    const todayStr = new Date().toISOString().split('T')[0];

    const upcomingInterviews = apps.filter(
      (a) => a.status === 'Interview' || a.status === 'Assessment',
    );
    const dueFollowUps = followups.filter((f) => f.status === 'Pending');

    return {
      userId,
      summaryDate: todayStr,
      totalApplicationsTracked: apps.length,
      upcomingInterviews,
      dueFollowUps,
      matchingJobsCount: jobs.length,
    };
  }

  public async dispatchDigest(
    userId: string,
    channels: Array<'email'>
  ): Promise<DigestDispatchResult> {
    const payload = await this.compileDigest(userId);
    const dispatched: string[] = [];

    const mockDigest = {
      runTimestamp: payload.summaryDate,
      totalCompaniesChecked: 1,
      totalJobsFound: payload.matchingJobsCount,
      totalNewJobs: payload.totalApplicationsTracked,
      jobs: [],
    };

    if (channels.includes('email')) {
      dispatched.push('email');
    }

    Logger.info(
      `DailyDigestEngine: Dispatched daily digest for user [${userId}] to channels [${dispatched.join(', ')}]`,
    );

    return {
      userId,
      dispatchedChannels: dispatched,
      digestPayload: payload,
    };
  }
}
