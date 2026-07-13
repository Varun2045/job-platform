import { jest } from '@jest/globals';

// Mock Resend client
const mockSend = jest.fn<any>();
jest.unstable_mockModule('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: {
      send: mockSend,
    },
  })),
}));

const { EmailNotificationProvider } = await import('../notifications/EmailNotificationProvider.js');
const { config } = await import('../config/config.js');

describe('EmailNotificationProvider Unit Tests', () => {
  let provider: any;

  beforeAll(() => {
    config.resendApiKey = 're_test_key';
    config.senderEmail = 'sender@test.com';
    config.recipientEmail = 'recipient@test.com';
    provider = new EmailNotificationProvider();
  });

  beforeEach(() => {
    mockSend.mockClear();
    mockSend.mockResolvedValue({ data: { id: 'msg123' }, error: null } as any);
  });

  it('should skip sending if no jobs exist in digest', async () => {
    const digest = {
      jobs: [],
      totalNewJobs: 0,
      timestamp: new Date().toISOString(),
    };

    await provider.sendDigest(digest);
    expect(mockSend).not.toHaveBeenCalled();
  });

  it('should format, sort, and group jobs by company in the email content', async () => {
    const digest = {
      totalNewJobs: 3,
      timestamp: new Date().toISOString(),
      jobs: [
        {
          jobId: 'job_b',
          title: 'Backend Engineer',
          companyName: 'Microsoft',
          location: 'Redmond, WA',
          applyUrl: 'https://microsoft.com',
          matchScore: 82,
          isRemote: true,
          experience: 'Mid',
          employmentType: 'Full-time',
          datePosted: 'Today',
        },
        {
          jobId: 'job_a',
          title: 'Software Engineer',
          companyName: 'Google',
          location: 'Mountain View, CA',
          applyUrl: 'https://google.com',
          matchScore: 95,
          isRemote: false,
          experience: 'Junior',
          employmentType: 'Full-time',
          datePosted: 'Yesterday',
        },
        {
          jobId: 'job_c',
          title: 'ML Engineer',
          companyName: 'Google',
          location: 'Bangalore, India',
          applyUrl: 'https://google.com/ml',
          matchScore: 75,
          isRemote: false,
          experience: 'Graduate',
          employmentType: 'Full-time',
          datePosted: 'Today',
        },
      ],
    };

    await provider.sendDigest(digest);

    expect(mockSend).toHaveBeenCalledTimes(1);
    const sendArgs = mockSend.mock.calls[0][0] as any;

    expect(sendArgs.from).toBe('sender@test.com');
    expect(sendArgs.to).toBe('recipient@test.com');
    expect(sendArgs.subject).toContain('NEW JOBS ALERT');
    expect(sendArgs.subject).toContain('95%'); // Highest score in subject

    // Verify HTML content sorting and grouping
    const html = sendArgs.html;
    expect(html).toContain('Google');
    expect(html).toContain('Microsoft');

    // Google has 95% (highest), so it must appear first
    const googleIndex = html.indexOf('Google');
    const microsoftIndex = html.indexOf('Microsoft');
    expect(googleIndex).toBeLessThan(microsoftIndex);

    // Verify plain text version formatting
    const text = sendArgs.text;
    expect(text).toContain('GOOGLE');
    expect(text).toContain('MICROSOFT');
    expect(text).toContain('95%');
    expect(text).toContain('82%');
  });
});
