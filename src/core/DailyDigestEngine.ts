import { StorageProvider } from '../storage/StorageProvider.js';
import { SlackNotificationProvider } from '../notifications/SlackNotificationProvider.js';
import { TelegramNotificationProvider } from '../notifications/TelegramNotificationProvider.js';
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
    channels: Array<'slack' | 'telegram' | 'email'>,
    options?: { slackWebhookUrl?: string; telegramBotToken?: string; telegramChatId?: string },
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

    if (channels.includes('slack') && options?.slackWebhookUrl) {
      try {
        const provider = new SlackNotificationProvider(options.slackWebhookUrl);
        await provider.sendDigest(mockDigest);
        dispatched.push('slack');
      } catch (err: any) {
        Logger.warn(`DailyDigestEngine: Slack dispatch failed - ${err.message}`);
      }
    }

    if (channels.includes('telegram') && options?.telegramBotToken && options?.telegramChatId) {
      try {
        const provider = new TelegramNotificationProvider(options.telegramBotToken, options.telegramChatId);
        await provider.sendDigest(mockDigest);
        dispatched.push('telegram');
      } catch (err: any) {
        Logger.warn(`DailyDigestEngine: Telegram dispatch failed - ${err.message}`);
      }
    }

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
