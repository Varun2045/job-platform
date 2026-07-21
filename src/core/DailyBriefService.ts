import { StorageProvider } from '../storage/StorageProvider.js';
import { Logger } from './Logger.js';
import { CareerAgent } from './CareerAgent.js';
import { SkillGapEngine } from './SkillGapEngine.js';

export interface DailyBrief {
  userId: string;
  newJobsCount: number;
  bestOpportunities: { title: string; company: string; score: number; url: string }[];
  applicationsToFollowUp: { company: string; status: string; daysSinceApplied: number }[];
  interviewReminders: { company: string; status: string; date: string }[];
  learningRecommendations: string[];
  careerInsights: string[];
}

export class DailyBriefService {
  public static async compileDailyBrief(userId: string, storage: StorageProvider): Promise<DailyBrief> {
    try {
      const applications = await storage.getApplications(userId);
      const companies = await storage.getAllCompanies();

      // Gather recommendations & gaps
      const recs = await CareerAgent.analyzeAndRecommend(userId, storage);
      const gaps = await SkillGapEngine.analyzeGap(userId, storage);

      // Gather all jobs efficiently
      const allJobs = await storage.getAllJobs();

      // 1. Calculate new jobs today
      const todayStr = new Date().toISOString().split('T')[0];
      const newJobsCount = allJobs.filter((j) => {
        if (!j.datePosted) return false;
        try {
          const d = new Date(j.datePosted);
          if (isNaN(d.getTime())) return false;
          return d.toISOString().split('T')[0] === todayStr;
        } catch {
          return false;
        }
      }).length;

      // 2. Fetch best opportunities (simulated query scores)
      const bestOpportunities = allJobs.slice(0, 3).map((j) => ({
        title: j.title,
        company: j.company,
        score: 85 + Math.round(Math.random() * 10), // mock matching score
        url: j.url,
      }));

      // 3. Applications requiring follow-up
      const applicationsToFollowUp: any[] = [];
      applications.forEach((app) => {
        if (app.status === 'Applied') {
          const days = Math.round((Date.now() - new Date(app.lastUpdated || 0).getTime()) / (1000 * 60 * 60 * 24));
          if (days >= 7) {
            applicationsToFollowUp.push({
              company: app.company,
              status: app.status,
              daysSinceApplied: days,
            });
          }
        }
      });

      // 4. Interview reminders
      const interviewReminders = applications
        .filter((app) => app.status === 'Interview' || app.status === 'OA Scheduled')
        .map((app) => ({
          company: app.company,
          status: app.status,
          date: app.lastUpdated || new Date().toISOString(),
        }));

      // 5. Learning recommendations
      const learningRecommendations = gaps.roadmapTasks.slice(0, 2).map((t) => t.title);

      // 6. Career insights
      const careerInsights = recs.slice(0, 2).map((r) => r.description);

      const brief: DailyBrief = {
        userId,
        newJobsCount,
        bestOpportunities,
        applicationsToFollowUp,
        interviewReminders,
        learningRecommendations,
        careerInsights,
      };

      await storage.saveDailyBrief(userId, brief);
      return brief;
    } catch (e) {
      Logger.error(`Failed to compile daily brief for user ${userId}`, e as Error);
      throw e;
    }
  }
}
