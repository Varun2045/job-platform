import { StorageProvider } from '../storage/StorageProvider.js';
import { Logger } from './Logger.js';

export interface MarketIntelReport {
  fastestGrowingCompanies: { name: string; openRolesCount: number }[];
  technologyDemand: { name: string; percentage: number }[];
  hiringVelocity: 'High' | 'Moderate' | 'Low';
  regionalDemand: { city: string; openRolesCount: number }[];
  roleSaturationIndex: number; // 0-100 where higher means highly saturated/competitive
}

export class MarketIntelligence {
  public static async analyzeMarket(storage: StorageProvider): Promise<MarketIntelReport> {
    try {
      const companies = await storage.getAllCompanies();
      const companyJobsCount: Record<string, number> = {};
      const techDemandCounts: Record<string, number> = {};
      const regionalCounts: Record<string, number> = {};
      let totalJobs = 0;
      let seniorRolesCount = 0;

      for (const comp of companies) {
        const jobs = await storage.getCompanyJobs(comp.id);
        companyJobsCount[comp.name] = jobs.length;
        totalJobs += jobs.length;

        jobs.forEach((j) => {
          // Track regions
          const loc = j.location || 'Remote';
          regionalCounts[loc] = (regionalCounts[loc] || 0) + 1;

          // Track seniority
          if (/senior|lead|principal|staff|manager/i.test(j.title)) {
            seniorRolesCount++;
          }

          // Track technologies
          const desc = (j.description || '').toLowerCase();
          const techList = [
            'typescript',
            'node.js',
            'react',
            'go',
            'golang',
            'kubernetes',
            'docker',
            'postgresql',
            'aws',
            'python',
          ];
          techList.forEach((t) => {
            if (desc.includes(t)) {
              techDemandCounts[t] = (techDemandCounts[t] || 0) + 1;
            }
          });
        });
      }

      // Fastest growing
      const fastestGrowingCompanies = Object.entries(companyJobsCount)
        .map(([name, openRolesCount]) => ({ name, openRolesCount }))
        .sort((a, b) => b.openRolesCount - a.openRolesCount)
        .slice(0, 5);

      // Tech demand percentage
      const technologyDemand = Object.entries(techDemandCounts)
        .map(([name, count]) => ({
          name: name.charAt(0).toUpperCase() + name.slice(1),
          percentage: totalJobs > 0 ? Math.round((count / totalJobs) * 100) : 0,
        }))
        .sort((a, b) => b.percentage - a.percentage)
        .slice(0, 5);

      // Regional demand
      const regionalDemand = Object.entries(regionalCounts)
        .map(([city, openRolesCount]) => ({ city, openRolesCount }))
        .sort((a, b) => b.openRolesCount - a.openRolesCount)
        .slice(0, 5);

      // Velocity
      let hiringVelocity: 'High' | 'Moderate' | 'Low' = 'Moderate';
      if (totalJobs > 50) {
        hiringVelocity = 'High';
      } else if (totalJobs < 10) {
        hiringVelocity = 'Low';
      }

      // Role Saturation (ratio of non-senior roles to total roles)
      const nonSeniorCount = totalJobs - seniorRolesCount;
      const roleSaturationIndex = totalJobs > 0 ? Math.round((nonSeniorCount / totalJobs) * 100) : 50;

      return {
        fastestGrowingCompanies,
        technologyDemand,
        hiringVelocity,
        regionalDemand,
        roleSaturationIndex,
      };
    } catch (e) {
      Logger.error('Failed to run MarketIntelligence analysis', e as Error);
      return {
        fastestGrowingCompanies: [],
        technologyDemand: [],
        hiringVelocity: 'Moderate',
        regionalDemand: [],
        roleSaturationIndex: 50,
      };
    }
  }
}
