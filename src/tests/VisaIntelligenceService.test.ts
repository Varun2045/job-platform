import { VisaIntelligenceService } from '../core/VisaIntelligenceService.js';
import { FileStorage } from '../storage/FileStorage.js';
import { VisaSponsor } from '../storage/StorageProvider.js';

describe('VisaIntelligenceService Unit Tests', () => {
  let storage: FileStorage;
  let service: VisaIntelligenceService;

  beforeAll(async () => {
    storage = new FileStorage();
    await storage.initialize();
    service = new VisaIntelligenceService(storage);

    const mockSponsor: VisaSponsor = {
      id: 'sponsor-test-1',
      companyName: 'Google',
      normalizedName: 'google',
      totalLcas: 1200,
      approvalRatePct: 99.2,
      avgSalary: 165000,
      fiscalYear: 2025,
    };
    await storage.saveVisaSponsor(mockSponsor);
  });

  it('should search visa sponsors by query', async () => {
    const results = await service.searchCompany('Goo');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].companyName).toBe('Google');
  });

  it('should return company visa statistics for verified sponsor', async () => {
    const stats = await service.getCompanyStatistics('Google');
    expect(stats.isVerifiedSponsor).toBe(true);
    expect(stats.approvalRating).toBe('High');
    expect(stats.sponsor?.totalLcas).toBe(1200);
  });

  it('should handle unverified company lookup gracefully', async () => {
    const stats = await service.getCompanyStatistics('NonExistentCorp123');
    expect(stats.isVerifiedSponsor).toBe(false);
    expect(stats.approvalRating).toBe('Unknown');
  });
});
