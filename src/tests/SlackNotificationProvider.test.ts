import { SlackNotificationProvider } from '../notifications/SlackNotificationProvider.js';
import { JobDigest } from '../notifications/NotificationProvider.js';

describe('SlackNotificationProvider Unit Tests', () => {
  let provider: SlackNotificationProvider;
  const validWebhook = 'https://hooks.slack.com/services/T00/B00/X00';

  beforeEach(() => {
    provider = new SlackNotificationProvider(validWebhook);
  });

  it('should validate external webhooks and block SSRF localhost/private IPs', () => {
    expect(provider.isValidWebhookUrl(validWebhook)).toBe(true);
    expect(provider.isValidWebhookUrl('http://localhost:8080/hook')).toBe(false);
    expect(provider.isValidWebhookUrl('http://127.0.0.1/hook')).toBe(false);
    expect(provider.isValidWebhookUrl('http://192.168.1.1/hook')).toBe(false);
    expect(provider.isValidWebhookUrl('invalid-url')).toBe(false);
  });

  it('should build Slack Block Kit payload from digest', () => {
    const mockDigest: JobDigest = {
      runTimestamp: new Date().toISOString(),
      totalCompaniesChecked: 5,
      totalJobsFound: 10,
      totalNewJobs: 2,
      jobs: [
        {
          companyName: 'Google',
          title: 'Software Engineer',
          location: 'Mountain View, CA',
          experience: '0-2 years',
          employmentType: 'Full-time',
          datePosted: '2026-07-28',
          applyUrl: 'https://careers.google.com/jobs/123',
          jobId: 'g-123',
          matchScore: 95,
          isRemote: false,
        },
      ],
    };

    const payload = provider.buildSlackPayload(mockDigest);
    expect(payload.blocks).toBeDefined();
    expect(payload.blocks.length).toBeGreaterThan(0);
  });

  it('should throw error when sending to invalid webhook URL', async () => {
    const invalidProvider = new SlackNotificationProvider('http://127.0.0.1/bad-webhook');
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

    await expect(invalidProvider.sendDigest(mockDigest)).rejects.toThrow('Invalid or restricted Slack Webhook URL');
  });
});
