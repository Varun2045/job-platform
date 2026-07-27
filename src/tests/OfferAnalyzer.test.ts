import { OfferAnalyzer } from '../core/OfferAnalyzer.js';
import { FileStorage } from '../storage/FileStorage.js';
import { Offer } from '../storage/StorageProvider.js';

describe('OfferAnalyzer Unit Tests', () => {
  let storage: FileStorage;
  let analyzer: OfferAnalyzer;
  const testUserId = 'offer-test-user-uuid';

  beforeAll(async () => {
    storage = new FileStorage();
    await storage.initialize();
    analyzer = new OfferAnalyzer(storage);
  });

  it('should calculate total compensation correctly', () => {
    const comp = analyzer.calculateTotalCompensation(150000, 20000, 10, 100000, 4);
    expect(comp.baseSalary).toBe(150000);
    expect(comp.signingBonus).toBe(20000);
    expect(comp.annualBonusAmount).toBe(15000);
    expect(comp.annualizedEquity).toBe(25000);
    expect(comp.firstYearTotalComp).toBe(210000); // 150k + 20k + 15k + 25k
    expect(comp.annualizedTotalComp).toBe(190000); // 150k + 15k + 25k
  });

  it('should analyze offer and generate negotiation script', () => {
    const mockOffer: Offer = {
      id: 'offer-1',
      applicationId: 'app-1',
      baseSalary: 160000,
      signingBonus: 10000,
      annualBonusPct: 15,
      equityValue: 80000,
      vestingYears: 4,
      location: 'San Francisco, CA',
      remoteStatus: 'Hybrid',
      status: 'Active',
    };

    const res = analyzer.analyzeOffer(mockOffer);
    expect(res.breakdown.firstYearTotalComp).toBe(214000);
    expect(res.negotiationScript).toContain('San Francisco, CA');
    expect(res.percentileRank).toBeGreaterThan(0);
  });

  it('should compare multiple saved offers for user', async () => {
    const mockOfferA: Offer = {
      id: 'offer-a',
      applicationId: 'app-a',
      baseSalary: 140000,
      signingBonus: 5000,
      annualBonusPct: 10,
      equityValue: 40000,
      vestingYears: 4,
      location: 'Remote',
      remoteStatus: 'Remote',
      status: 'Active',
    };
    const mockOfferB: Offer = {
      id: 'offer-b',
      applicationId: 'app-b',
      baseSalary: 180000,
      signingBonus: 25000,
      annualBonusPct: 15,
      equityValue: 120000,
      vestingYears: 4,
      location: 'New York, NY',
      remoteStatus: 'Onsite',
      status: 'Active',
    };

    await storage.saveOffer(testUserId, mockOfferA);
    await storage.saveOffer(testUserId, mockOfferB);

    const comparison = await analyzer.compareOffers(testUserId);
    expect(comparison.offers.length).toBe(2);
    expect(comparison.highestFirstYear?.offer.id).toBe('offer-b');

    await storage.deleteOffer(testUserId, 'offer-a');
    await storage.deleteOffer(testUserId, 'offer-b');
  });
});
