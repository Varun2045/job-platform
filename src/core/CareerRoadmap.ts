import { StorageProvider } from '../storage/StorageProvider.js';
import { Logger } from './Logger.js';

export interface RoadmapTimeline {
  plan6Month: string[];
  plan12Month: string[];
  promotionChecklist: string[];
  salaryPath: { year: number; baseMin: number; baseMax: number }[];
  technologyPath: string[];
}

export class CareerRoadmap {
  public static async generateRoadmap(userId: string, storage: StorageProvider): Promise<RoadmapTimeline> {
    try {
      const profile = await storage.getProfile(userId);
      const experience = profile?.experience_level || 'Mid Level';
      const techStack = profile?.tech_stack || [];

      // Determine technology transitions
      const technologyPath: string[] = [...techStack];
      if (techStack.includes('TypeScript') && !techStack.includes('Go')) {
        technologyPath.push('Go (Golang)');
      }
      if (!techStack.includes('Kubernetes')) {
        technologyPath.push('Kubernetes & Cloud Native Architecture');
      }

      // Generate timeline plans based on experience level
      let plan6Month: string[] = [];
      let plan12Month: string[] = [];
      let promotionChecklist: string[] = [];
      let baseSalary = 100000;

      if (experience === 'Early Career') {
        plan6Month = [
          'Master advanced asynchronous programming and memory management in TypeScript.',
          'Contribute to core codebase modules under mentor guidance.',
          'Complete fundamentals of system design: database schemas and indexing strategies.',
        ];
        plan12Month = [
          'Take full ownership of a minor product feature or service component.',
          'Deploy services to containerized environments using Docker and basic Kubernetes.',
          'Conduct at least 15 technical code reviews.',
        ];
        promotionChecklist = [
          'Demonstrate proficiency in unit testing and test coverage metrics.',
          'Exhibit technical ownership of features.',
          'Receive positive peer reviews on codebase collaboration.',
        ];
        baseSalary = 90000;
      } else if (experience === 'Mid Level') {
        plan6Month = [
          'Design and implement robust APIs with rate limiting and database connection pooling.',
          'Deploy multi-tenant services with Row Level Security (RLS) configurations.',
          'Optimize database queries to reduce slow-query latencies by 30%.',
        ];
        plan12Month = [
          'Lead small feature streams from architecture design to rollout.',
          'Adopt cloud-native infrastructure tooling (Kubernetes, AWS/GCP services).',
          'Mentor junior team members on system debug operations.',
        ];
        promotionChecklist = [
          'Successfully design and ship a high-concurrency backend service.',
          'Drive cross-functional project deliverables.',
          'Demonstrate clear system troubleshooting skills.',
        ];
        baseSalary = 135000;
      } else {
        // Senior / Lead
        plan6Month = [
          'Establish centralized telemetry dashboard systems and alerting pipelines.',
          'Define multi-tenant security architecture principles for the organization.',
          'Conduct system-wide performance tuning audits on legacy microservices.',
        ];
        plan12Month = [
          'Define the long-term engineering roadmaps and architectural standards.',
          'Sponsor and drive major infrastructure migrations (e.g. monolith to microservices).',
          'Represent engineering teams in alignment/planning syncs with product headers.',
        ];
        promotionChecklist = [
          'Establish clear ROI impact on system availability or developer velocity.',
          'Exhibit technical leadership across multiple engineering pods.',
          'Mentor senior engineers into architect/managerial tracks.',
        ];
        baseSalary = 190000;
      }

      const salaryPath = [
        { year: 1, baseMin: baseSalary, baseMax: Math.round(baseSalary * 1.1) },
        { year: 2, baseMin: Math.round(baseSalary * 1.15), baseMax: Math.round(baseSalary * 1.25) },
        { year: 3, baseMin: Math.round(baseSalary * 1.3), baseMax: Math.round(baseSalary * 1.45) },
      ];

      const roadmap: RoadmapTimeline = {
        plan6Month,
        plan12Month,
        promotionChecklist,
        salaryPath,
        technologyPath,
      };

      await storage.saveCareerRoadmap(userId, roadmap);
      return roadmap;
    } catch (e) {
      Logger.error(`Failed to generate career roadmap for user ${userId}`, e as Error);
      return {
        plan6Month: [],
        plan12Month: [],
        promotionChecklist: [],
        salaryPath: [],
        technologyPath: [],
      };
    }
  }
}
