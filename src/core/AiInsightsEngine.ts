import { StorageProvider } from '../storage/StorageProvider.js';
import { Logger } from './Logger.js';

export interface ApplicationInsights {
  totalApplications: number;
  interviewConversionRatePct: number;
  offerConversionRatePct: number;
  averageResponseTimeDays: number;
  topPerformingProfile: string;
  stageCounts: Record<string, number>;
  recommendations: string[];
}

export class AiInsightsEngine {
  private storage: StorageProvider;

  constructor(storage: StorageProvider) {
    this.storage = storage;
  }

  public async generateInsights(userId: string): Promise<ApplicationInsights> {
    const apps = await this.storage.getApplications(userId);
    const totalApps = apps.length;

    const stageCounts: Record<string, number> = {};
    apps.forEach((a) => {
      stageCounts[a.status] = (stageCounts[a.status] || 0) + 1;
    });

    const interviews = stageCounts['Interview'] || 0;
    const offers = stageCounts['Offer'] || 0;

    const interviewConversionRatePct = totalApps > 0 ? Math.round((interviews / totalApps) * 100) : 0;
    const offerConversionRatePct = totalApps > 0 ? Math.round((offers / totalApps) * 100) : 0;

    // Profile performance calculation
    const profileCounts: Record<string, number> = {};
    apps.forEach((a) => {
      const prof = a.resumeProfileId || 'Default Profile';
      if (a.status === 'Interview' || a.status === 'Offer') {
        profileCounts[prof] = (profileCounts[prof] || 0) + 1;
      }
    });

    let topProfile = 'Default Profile';
    let maxWins = 0;
    Object.entries(profileCounts).forEach(([prof, count]) => {
      if (count > maxWins) {
        maxWins = count;
        topProfile = prof;
      }
    });

    const recommendations: string[] = [
      `Your interview conversion rate is currently ${interviewConversionRatePct}%.`,
      `The resume profile "${topProfile}" has generated the highest interview response rate.`,
      'Submit job applications on Tuesday through Thursday mornings for optimal recruiter view rates.',
    ];

    Logger.info(`AiInsightsEngine: Generated insights for user [${userId}] (${totalApps} apps tracked)`);

    return {
      totalApplications: totalApps,
      interviewConversionRatePct,
      offerConversionRatePct,
      averageResponseTimeDays: 7,
      topPerformingProfile: topProfile,
      stageCounts,
      recommendations,
    };
  }
}
