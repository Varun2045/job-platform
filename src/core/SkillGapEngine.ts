import { StorageProvider } from '../storage/StorageProvider.js';
import { Logger } from './Logger.js';

export interface SkillGapItem {
  skill: string;
  priority: 'High' | 'Medium' | 'Low';
  effortWeeks: number;
  trendingTrend: 'Up' | 'Stable' | 'Down';
}

export interface LearningRoadmap {
  missingSkills: SkillGapItem[];
  roadmapTasks: {
    id: string;
    title: string;
    description: string;
    estimatedHours: number;
    completed: boolean;
  }[];
}

export class SkillGapEngine {
  public static async analyzeGap(userId: string, storage: StorageProvider): Promise<LearningRoadmap> {
    try {
      const profile = await storage.getProfile(userId);
      const userResumes = await storage.getUserResumes(userId);
      const companies = await storage.getAllCompanies();

      // Aggregate all active jobs from registry to determine market trends
      const marketSkills: Record<string, number> = {};
      let totalJobsCount = 0;

      for (const comp of companies) {
        const jobs = await storage.getCompanyJobs(comp.id);
        totalJobsCount += jobs.length;
        jobs.forEach(j => {
          const desc = (j.description || '').toLowerCase();
          const words = ['typescript', 'node.js', 'react', 'go', 'golang', 'kubernetes', 'docker', 'postgresql', 'aws', 'python'];
          words.forEach(w => {
            if (desc.includes(w)) {
              marketSkills[w] = (marketSkills[w] || 0) + 1;
            }
          });
        });
      }

      // Read user tech stack
      const userSkills = new Set<string>((profile?.tech_stack || []).map((s: string) => s.toLowerCase()));
      if (userResumes.length > 0) {
        // Simple heuristic: extract skills found in the first resume content
        const resumeContent = userResumes[0].content.toLowerCase();
        const commonSkills = ['typescript', 'node.js', 'react', 'go', 'golang', 'kubernetes', 'docker', 'postgresql', 'aws', 'python'];
        commonSkills.forEach(s => {
          if (resumeContent.includes(s)) {
            userSkills.add(s);
          }
        });
      }

      const missingSkills: SkillGapItem[] = [];
      const roadmapTasks: any[] = [];

      // Detect gaps
      const allPossibleSkills = ['typescript', 'node.js', 'react', 'go', 'golang', 'kubernetes', 'docker', 'postgresql', 'aws', 'python'];
      allPossibleSkills.forEach(skill => {
        const normalizedSkill = skill === 'golang' ? 'go' : skill;
        if (!userSkills.has(normalizedSkill)) {
          const marketDemand = marketSkills[skill] || 0;
          let priority: 'High' | 'Medium' | 'Low' = 'Low';
          let effortWeeks = 2;

          if (marketDemand > (totalJobsCount * 0.3)) {
            priority = 'High';
            effortWeeks = 4;
          } else if (marketDemand > (totalJobsCount * 0.1)) {
            priority = 'Medium';
            effortWeeks = 3;
          }

          missingSkills.push({
            skill: skill.charAt(0).toUpperCase() + skill.slice(1),
            priority,
            effortWeeks,
            trendingTrend: priority === 'High' ? 'Up' : 'Stable'
          });

          // Generate task steps
          roadmapTasks.push({
            id: `task-${skill}`,
            title: `Learn ${skill.toUpperCase()} fundamentals`,
            description: `Review official documentation, setup a Hello World environment, and build a prototype project.`,
            estimatedHours: effortWeeks * 10,
            completed: false
          });
        }
      });

      const roadmap: LearningRoadmap = {
        missingSkills,
        roadmapTasks
      };

      await storage.saveLearningRoadmap(userId, roadmap);
      return roadmap;
    } catch (e) {
      Logger.error(`Error in SkillGapEngine analysis for user ${userId}`, e as Error);
      return { missingSkills: [], roadmapTasks: [] };
    }
  }
}
