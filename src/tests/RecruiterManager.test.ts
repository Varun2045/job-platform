import { jest } from '@jest/globals';
import { RecruiterManager, RecruiterContact } from '../core/RecruiterManager.js';
import { StorageProvider } from '../storage/StorageProvider.js';

describe('RecruiterManager', () => {
  let list: RecruiterContact[] = [];

  const mockStorage = {
    getRecruiters: (jest.fn() as any).mockImplementation(() => Promise.resolve(list)),
    saveRecruiter: (jest.fn() as any).mockImplementation((userId: string, contact: any) => {
      const idx = list.findIndex((r) => r.id === contact.id);
      if (idx !== -1) {
        list[idx] = contact;
      } else {
        list.push({ ...contact, id: contact.id || 'r1' });
      }
      return Promise.resolve();
    }),
  } as unknown as StorageProvider;

  beforeEach(() => {
    list = [];
  });

  test('should add recruiter contact to storage provider', async () => {
    await RecruiterManager.addContact(mockStorage, 'u1', {
      name: 'John Recruiter',
      company: 'Stripe',
      email: 'john@stripe.com',
    });

    expect(list.length).toBe(1);
    expect(list[0].name).toBe('John Recruiter');
    expect(list[0].conversation_history.length).toBe(0);
  });

  test('should append touchpoint logs and schedule followups', async () => {
    list.push({
      id: 'rec_stripe',
      name: 'John Recruiter',
      company: 'Stripe',
      conversation_history: [],
    });

    await RecruiterManager.logTouchpoint(mockStorage, 'u1', 'rec_stripe', 'Had a quick phone intro call.', 'outgoing');

    expect(list[0].conversation_history.length).toBe(1);
    expect(list[0].conversation_history[0].message).toBe('Had a quick phone intro call.');
    expect(list[0].last_contacted).toBeDefined();
    expect(list[0].follow_up_date).toBeDefined();

    // Verify scheduled followup is roughly 7 days in future
    const followUpDate = new Date(list[0].follow_up_date!);
    const diffDays = Math.ceil((followUpDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    expect(diffDays).toBeGreaterThanOrEqual(6);
    expect(diffDays).toBeLessThanOrEqual(7);
  });
});
