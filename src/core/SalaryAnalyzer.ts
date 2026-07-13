import { StorageProvider } from '../storage/StorageProvider.js';
import { Logger } from './Logger.js';

export interface SalaryAnalysis {
  expectedSalary: number;
  percentile: number;
  negotiationMin: number;
  negotiationMax: number;
  growthPotential: 'High' | 'Moderate' | 'Low';
  marketAverage: number;
}

export class SalaryAnalyzer {
  public static async analyzeSalary(userId: string, storage: StorageProvider): Promise<SalaryAnalysis> {
    try {
      const profile = await storage.getProfile(userId);
      const experience = profile?.experience_level || 'Mid Level';
      const techStack = profile?.tech_stack || [];

      let baseSalary = 100000;
      let percentile = 65;
      let growthPotential: 'High' | 'Moderate' | 'Low' = 'Moderate';

      if (experience === 'Early Career') {
        baseSalary = 85000;
        percentile = 55;
        growthPotential = 'High';
      } else if (experience === 'Mid Level') {
        baseSalary = 130000;
        percentile = 70;
        growthPotential = 'High';
      } else {
        // Senior / Lead
        baseSalary = 185000;
        percentile = 85;
        growthPotential = 'Moderate';
      }

      // Add technology bonuses
      if (techStack.includes('Go') || techStack.includes('Golang') || techStack.includes('Kubernetes')) {
        baseSalary += 15000;
        percentile += 5;
      }

      if (techStack.includes('TypeScript') || techStack.includes('Node.js')) {
        baseSalary += 5000;
      }

      const negotiationMin = Math.round(baseSalary * 0.95);
      const negotiationMax = Math.round(baseSalary * 1.2);
      const marketAverage = Math.round(baseSalary * 0.9);

      return {
        expectedSalary: baseSalary,
        percentile: Math.min(percentile, 99),
        negotiationMin,
        negotiationMax,
        growthPotential,
        marketAverage
      };
    } catch (e) {
      Logger.error(`Failed to analyze salary expected range for user ${userId}`, e as Error);
      return {
        expectedSalary: 110000,
        percentile: 60,
        negotiationMin: 100000,
        negotiationMax: 125000,
        growthPotential: 'Moderate',
        marketAverage: 105000
      };
    }
  }
}
