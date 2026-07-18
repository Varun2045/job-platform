import { SalaryAnalyzer } from '../core/SalaryAnalyzer.js';
import { StorageProvider } from '../storage/StorageProvider.js';

describe('SalaryAnalyzer Unit Tests', () => {
  it('should analyze salary for Early Career and no tech stack bonuses', async () => {
    const mockStorage = {
      getProfile: async () => ({
        experience_level: 'Early Career',
        tech_stack: [],
      }),
    } as unknown as StorageProvider;

    const res = await SalaryAnalyzer.analyzeSalary('u1', mockStorage);
    expect(res.expectedSalary).toBe(85000);
    expect(res.percentile).toBe(55);
    expect(res.growthPotential).toBe('High');
  });

  it('should analyze salary for Senior and technology bonuses', async () => {
    const mockStorage = {
      getProfile: async () => ({
        experience_level: 'Senior',
        tech_stack: ['Go', 'Kubernetes', 'TypeScript'],
      }),
    } as unknown as StorageProvider;

    const res = await SalaryAnalyzer.analyzeSalary('u1', mockStorage);
    // 185,000 + 15,000 (Go) + 5,000 (TypeScript) = 205,000
    expect(res.expectedSalary).toBe(205000);
    // 85 (Senior) + 5 (Go/K8s) = 90
    expect(res.percentile).toBe(90);
    expect(res.growthPotential).toBe('Moderate');
  });

  it('should analyze salary for Mid Level and Golang/Node.js tech bonuses', async () => {
    const mockStorage = {
      getProfile: async () => ({
        experience_level: 'Mid Level',
        tech_stack: ['Golang', 'Node.js'],
      }),
    } as unknown as StorageProvider;

    const res = await SalaryAnalyzer.analyzeSalary('u1', mockStorage);
    // 130,000 + 15,000 (Golang) + 5,000 (Node.js) = 150,000
    expect(res.expectedSalary).toBe(150000);
    // 70 + 5 = 75
    expect(res.percentile).toBe(75);
  });

  it('should handle errors and fall back gracefully', async () => {
    const mockStorage = {
      getProfile: async () => {
        throw new Error('Database disconnected');
      },
    } as unknown as StorageProvider;

    const res = await SalaryAnalyzer.analyzeSalary('u1', mockStorage);
    expect(res.expectedSalary).toBe(110000);
    expect(res.percentile).toBe(60);
    expect(res.growthPotential).toBe('Moderate');
  });
});
