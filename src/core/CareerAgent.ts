import { StorageProvider } from '../storage/StorageProvider.js';
import { Logger } from './Logger.js';

export interface Recommendation {
  type: 'job' | 'skill' | 'application' | 'general';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
}

export class CareerAgent {
  public static async analyzeAndRecommend(userId: string, storage: StorageProvider): Promise<Recommendation[]> {
    try {
      const profile = await storage.getProfile(userId);
      const applications = await storage.getApplications(userId);
      const resumes = await storage.getUserResumes(userId);
      const companies = await storage.getAllCompanies();

      const recommendations: Recommendation[] = [];

      // 1. Process profile tech stack & experience recommendations
      if (profile) {
        const techStack = profile.tech_stack || [];
        if (techStack.length === 0) {
          recommendations.push({
            type: 'general',
            title: 'Setup Tech Stack',
            description: 'Define your technology stack in profile settings to refine match accuracy.',
            priority: 'high',
          });
        }

        if (techStack.includes('TypeScript') && !techStack.includes('Node.js')) {
          recommendations.push({
            type: 'skill',
            title: 'Add Node.js competency',
            description:
              'Since you know TypeScript, adding Node.js will significantly broaden your backend opportunities.',
            priority: 'medium',
          });
        }
      }

      // 2. Process applications follow-up recommendations
      const activeApps = applications.filter((a) => a.status === 'Applied');
      if (activeApps.length > 0) {
        recommendations.push({
          type: 'application',
          title: 'Review Active Applications',
          description: `You have ${activeApps.length} active applications. We recommend checking in on their statuses.`,
          priority: 'medium',
        });
      }

      // 3. Process resumes check
      if (resumes.length === 0) {
        recommendations.push({
          type: 'general',
          title: 'Upload Target Resume',
          description: 'No resumes found. Upload your master resume in the Resume Manager to run AI match scores.',
          priority: 'high',
        });
      }

      // 4. Job market & company health recommendations
      const disabledComps = companies.filter((c) => !c.enabled);
      if (disabledComps.length > 0) {
        recommendations.push({
          type: 'general',
          title: 'Optimize Scraper Channels',
          description: `You have ${disabledComps.length} target scraper targets disabled. Check Company Monitor.`,
          priority: 'low',
        });
      }

      // Default recommendations fallback
      if (recommendations.length === 0) {
        recommendations.push({
          type: 'general',
          title: 'Looking Good!',
          description: 'Your profile settings and resume mappings are fully aligned. Daily scraper is active.',
          priority: 'low',
        });
      }

      // Save to database/local file
      await storage.saveCopilotRecommendations(userId, recommendations);
      return recommendations;
    } catch (error) {
      Logger.error('Failed to run CareerAgent analysis', error as Error);
      return [];
    }
  }
}
