import { TelegramNotificationProvider } from '../notifications/TelegramNotificationProvider.js';
import { JobDigest } from '../notifications/NotificationProvider.js';

describe('TelegramNotificationProvider Unit Tests', () => {
  let provider: TelegramNotificationProvider;
  const validToken = '123456789:ABCdefGHIjklMNOpqrsTUVwxyz123456789';
  const validChatId = '-100123456789';

  beforeEach(() => {
    provider = new TelegramNotificationProvider(validToken, validChatId);
  });

  it('should validate Telegram Bot Token and Chat ID formats', () => {
    expect(provider.isValidBotToken(validToken)).toBe(true);
    expect(provider.isValidBotToken('invalid_token')).toBe(false);

    expect(provider.isValidChatId(validChatId)).toBe(true);
    expect(provider.isValidChatId('123')).toBe(false);
  });

  it('should build Telegram Markdown message from digest', () => {
    const mockDigest: JobDigest = {
      runTimestamp: new Date().toISOString(),
      totalCompaniesChecked: 5,
      totalJobsFound: 10,
      totalNewJobs: 2,
      jobs: [
        {
          companyName: 'Amazon',
          title: 'SDE II',
          location: 'Seattle, WA',
          experience: '2-5 years',
          employmentType: 'Full-time',
          datePosted: '2026-07-28',
          applyUrl: 'https://amazon.jobs/123',
          jobId: 'a-123',
          matchScore: 92,
          isRemote: false,
        },
      ],
    };

    const message = provider.buildTelegramMessage(mockDigest);
    expect(message).toContain('Job Alert Digest');
    expect(message).toContain('Amazon');
    expect(message).toContain('SDE II');
  });

  it('should throw error when configured with invalid bot token or chat ID', async () => {
    const invalidProvider = new TelegramNotificationProvider('badToken', 'badChat');
    const mockDigest: JobDigest = {
      runTimestamp: new Date().toISOString(),
      totalCompaniesChecked: 1,
      totalJobsFound: 1,
      totalNewJobs: 1,
      jobs: [
        {
          companyName: 'Test',
          title: 'Dev',
          location: 'Remote',
          experience: 'Mid',
          employmentType: 'Full-time',
          datePosted: '2026-07-28',
          applyUrl: 'https://test.com',
          jobId: 't-1',
          matchScore: 90,
          isRemote: true,
        },
      ],
    };

    await expect(invalidProvider.sendDigest(mockDigest)).rejects.toThrow('Invalid Telegram Bot Token');
  });
});
