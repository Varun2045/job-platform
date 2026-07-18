import { jest } from '@jest/globals';
import { RecruiterManager } from '../core/RecruiterManager.js';
import { StorageProvider } from '../storage/StorageProvider.js';

describe('RecruiterManager', () => {
  let list: any[] = [];

  const mockStorage = {
    getReferrals: (jest.fn() as any).mockImplementation(() => Promise.resolve(list)),
    saveReferral: (jest.fn() as any).mockImplementation((userId: string, referral: any) => {
      const idx = list.findIndex((r) => r.id === referral.id);
      if (idx !== -1) {
        list[idx] = referral;
      } else {
        list.push({ ...referral, id: referral.id || 'r1' });
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
    expect(list[0].notes).toContain('conversation_history');
  });

  test('should append touchpoint logs and schedule followups', async () => {
    list.push({
      id: 'rec_stripe',
      name: 'John Recruiter',
      company: 'Stripe',
      notes: JSON.stringify({ phone: '', notes: '', conversation_history: [] }),
    });

    await RecruiterManager.logTouchpoint(mockStorage, 'u1', 'rec_stripe', 'Had a quick phone intro call.', 'outgoing');

    const parsedNotes = JSON.parse(list[0].notes);
    expect(parsedNotes.conversation_history.length).toBe(1);
    expect(parsedNotes.conversation_history[0].message).toBe('Had a quick phone intro call.');
    expect(list[0].lastContacted).toBeDefined();
    expect(list[0].nextFollowUp).toBeDefined();

    // Verify scheduled followup is roughly 7 days in future
    const followUpDate = new Date(list[0].nextFollowUp!);
    const diffDays = Math.ceil((followUpDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    expect(diffDays).toBeGreaterThanOrEqual(6);
    expect(diffDays).toBeLessThanOrEqual(7);
  });
});
