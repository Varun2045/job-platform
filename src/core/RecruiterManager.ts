import { StorageProvider } from '../storage/StorageProvider.js';

export interface RecruiterContact {
  id?: string;
  name: string;
  company: string;
  linkedin?: string;
  email?: string;
  phone?: string;
  notes?: string;
  conversation_history: Array<{
    timestamp: string;
    message: string;
    direction: 'incoming' | 'outgoing';
  }>;
  follow_up_date?: string;
  last_contacted?: string;
}

export class RecruiterManager {
  /**
   * Adds a new recruiter contact to CRM.
   */
  public static async addContact(
    storage: StorageProvider,
    userId: string,
    contact: Omit<RecruiterContact, 'conversation_history'>,
  ): Promise<void> {
    const record: RecruiterContact = {
      ...contact,
      conversation_history: [],
    };
    await storage.saveRecruiter(userId, record);
  }

  /**
   * Logs a touchpoint message and automatically schedules a default 7-day follow-up.
   */
  public static async logTouchpoint(
    storage: StorageProvider,
    userId: string,
    recruiterId: string,
    message: string,
    direction: 'incoming' | 'outgoing',
  ): Promise<void> {
    const recruiters = await storage.getRecruiters(userId);
    const recruiter = recruiters.find((r) => r.id === recruiterId);

    if (!recruiter) {
      throw new Error(`Recruiter with ID ${recruiterId} not found`);
    }

    const timestamp = new Date().toISOString();
    recruiter.conversation_history.push({ timestamp, message, direction });
    recruiter.last_contacted = timestamp;

    // Automatically suggest next follow-up in 7 days
    const followUp = new Date();
    followUp.setDate(followUp.getDate() + 7);
    recruiter.follow_up_date = followUp.toISOString();

    await storage.saveRecruiter(userId, recruiter);
  }
}
