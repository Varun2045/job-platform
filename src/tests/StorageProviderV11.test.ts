import { FileStorage } from '../storage/FileStorage.js';
import { Offer, FollowUp, NotificationPreference, VisaSponsor } from '../storage/StorageProvider.js';

describe('StorageProvider V1.1 Domain Models Unit Tests', () => {
  let storage: FileStorage;
  const testUserId = 'test-user-v11-uuid';

  beforeAll(async () => {
    storage = new FileStorage();
    await storage.initialize();
  });

  it('should save and retrieve Offer entity', async () => {
    const mockOffer: Offer = {
      id: 'offer-101',
      applicationId: 'app-999',
      baseSalary: 160000,
      signingBonus: 15000,
      annualBonusPct: 10,
      equityValue: 80000,
      vestingYears: 4,
      location: 'Remote',
      remoteStatus: 'Remote',
      status: 'Active',
    };

    await storage.saveOffer(testUserId, mockOffer);
    const offers = await storage.getOffers(testUserId);
    expect(offers.length).toBeGreaterThan(0);
    const retrieved = await storage.getOfferByApplicationId('app-999');
    expect(retrieved).not.toBeNull();
    expect(retrieved?.baseSalary).toBe(160000);

    await storage.deleteOffer(testUserId, 'offer-101');
  });

  it('should save and retrieve FollowUp entity', async () => {
    const mockFollowUp: FollowUp = {
      id: 'followup-101',
      applicationId: 'app-999',
      scheduledDate: new Date().toISOString(),
      status: 'Pending',
      note: 'Follow up with recruiter via email',
    };

    await storage.saveFollowUp(testUserId, mockFollowUp);
    const followups = await storage.getFollowUps(testUserId);
    expect(followups.length).toBeGreaterThan(0);

    await storage.deleteFollowUp(testUserId, 'followup-101');
  });

  it('should save and retrieve NotificationPreference entity', async () => {
    const mockPref: NotificationPreference = {
      userId: testUserId,
      emailEnabled: true,
      slackWebhookUrl: 'https://hooks.slack.com/services/test',
      telegramBotToken: '123456:ABC',
      telegramChatId: '987654',
      digestFrequency: 'Daily',
    };

    await storage.saveNotificationPreference(testUserId, mockPref);
    const retrieved = await storage.getNotificationPreference(testUserId);
    expect(retrieved).not.toBeNull();
    expect(retrieved?.slackWebhookUrl).toBe('https://hooks.slack.com/services/test');
  });

  it('should save, retrieve, and search VisaSponsor entity', async () => {
    const mockSponsor: VisaSponsor = {
      id: 'sponsor-101',
      companyName: 'Acme Corporation',
      normalizedName: 'acme corporation',
      totalLcas: 450,
      approvalRatePct: 98.5,
      avgSalary: 155000,
      fiscalYear: 2025,
    };

    await storage.saveVisaSponsor(mockSponsor);
    const retrieved = await storage.getVisaSponsor('Acme Corporation');
    expect(retrieved).not.toBeNull();
    expect(retrieved?.totalLcas).toBe(450);

    const searchResults = await storage.searchVisaSponsors('Acme');
    expect(searchResults.length).toBeGreaterThan(0);
  });
});
