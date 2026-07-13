import { StorageProvider } from '../storage/StorageProvider.js';
import { Logger } from './Logger.js';

export interface FollowUpRecommendation {
  id: string;
  company: string;
  jobHash: string;
  actionRequired: string;
  recommendedDate: string;
  reason: string;
  daysDelayed: number;
}

export class FollowUpAssistant {
  public static async checkFollowUps(userId: string, storage: StorageProvider): Promise<FollowUpRecommendation[]> {
    try {
      const applications = await storage.getApplications(userId);
      const recommendations: FollowUpRecommendation[] = [];

      applications.forEach(app => {
        const lastUpdated = new Date(app.lastUpdated || 0);
        const days = Math.round((Date.now() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24));

        if (app.status === 'Applied' && days >= 7) {
          recommendations.push({
            id: `follow-${app.jobHash}`,
            company: app.company,
            jobHash: app.jobHash,
            actionRequired: 'Send Recruiter Follow-up Email',
            recommendedDate: new Date(lastUpdated.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            reason: `It has been ${days} days since you submitted your application without receiving feedback.`,
            daysDelayed: days - 7
          });
        } else if (app.status === 'Interview' && days >= 3) {
          recommendations.push({
            id: `follow-${app.jobHash}`,
            company: app.company,
            jobHash: app.jobHash,
            actionRequired: 'Send Post-Interview Thank-You Note',
            recommendedDate: new Date(lastUpdated.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString(),
            reason: `Send a quick thank-you email to check in on the next steps of the interview loop.`,
            daysDelayed: days - 1
          });
        } else if (app.status === 'Offer' && days >= 2) {
          recommendations.push({
            id: `follow-${app.jobHash}`,
            company: app.company,
            jobHash: app.jobHash,
            actionRequired: 'Review Offer Package & Respond',
            recommendedDate: new Date(lastUpdated.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
            reason: `It has been ${days} days since you received the offer letter. Review key negotiation variables.`,
            daysDelayed: days - 2
          });
        }
      });

      return recommendations;
    } catch (e) {
      Logger.error(`Error calculating follow-up timings for user ${userId}`, e as Error);
      return [];
    }
  }
}
