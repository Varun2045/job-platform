import { jest } from '@jest/globals';
import { AutoApplyEngine } from '../core/AutoApplyEngine.js';
import { Job } from '../companies/Scraper.js';
import { StorageProvider } from '../storage/StorageProvider.js';

describe('AutoApplyEngine', () => {
  const mockJob: Job = {
    jobHash: 'h123',
    company: 'TestCorp',
    title: 'Software Engineer',
    url: 'https://boards.greenhouse.io/testcorp/jobs/1234',
    isRemote: true,
    location: 'Remote',
    datePosted: 'Today',
    description: 'We are looking for a Node.js developer with TypeScript experience.',
  } as unknown as Job;

  const mockProfile = {
    fullName: 'Jane Doe',
    email: 'jane@example.com',
    phone: '12345678',
  };

  test('should determine automated support correctly', () => {
    expect(AutoApplyEngine.determineAutomatedSupport(mockJob)).toBe(true);

    const manualJob = { ...mockJob, url: 'https://testcorp.com/careers' };
    expect(AutoApplyEngine.determineAutomatedSupport(manualJob)).toBe(false);
  });

  test('should detect external workday redirects', () => {
    expect(AutoApplyEngine.detectExternalRedirect('https://myworkdayjobs.com/test')).toBe(true);
    expect(AutoApplyEngine.detectExternalRedirect('https://boards.greenhouse.io/test')).toBe(false);
  });

  test('should validate application payloads correctly', () => {
    const payload = AutoApplyEngine.preparePayload(
      mockJob,
      mockProfile,
      'Jane Doe Resume with extensive Node.js, React and TypeScript engineering experience.'.repeat(5),
    );
    const errors = AutoApplyEngine.validatePayload(payload);
    expect(errors.length).toBe(0);

    const invalidPayload = { ...payload, email: 'invalid-email' };
    expect(AutoApplyEngine.validatePayload(invalidPayload)).toContain('Valid email address is required');
  });

  test('should process application queue and advance states', async () => {
    const queue: any[] = [
      {
        id: 'q1',
        job_hash: 'h123',
        company: 'TestCorp',
        title: 'Software Engineer',
        state: 'QUEUED',
        payload: AutoApplyEngine.preparePayload(
          mockJob,
          mockProfile,
          'Jane Doe Resume with extensive Node.js, React and TypeScript engineering experience.'.repeat(5),
        ),
        validation_errors: [],
        retries: 0,
      },
    ];

    const mockStorage = {
      getApplicationQueue: (jest.fn() as any).mockResolvedValue(queue),
      saveApplicationQueueItem: (jest.fn() as any).mockImplementation((userId: string, item: any) => {
        const idx = queue.findIndex((q) => q.id === item.id);
        if (idx !== -1) queue[idx] = item;
        return Promise.resolve();
      }),
      saveApplication: (jest.fn() as any).mockResolvedValue(undefined),
    } as unknown as StorageProvider;

    await AutoApplyEngine.processQueue(mockStorage, 'u1');

    expect(queue[0].state).toBe('SUBMITTED');
    expect(mockStorage.saveApplication).toHaveBeenCalled();
  });
});
