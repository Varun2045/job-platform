import { StorageProvider } from '../storage/StorageProvider.js';
import { Logger } from './Logger.js';

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
   * Helper to parse notes field into details.
   */
  private static parseNotes(notesStr: string | undefined): {
    phone?: string;
    notes?: string;
    conversation_history: RecruiterContact['conversation_history'];
  } {
    if (!notesStr) {
      return { conversation_history: [] };
    }
    try {
      if (notesStr.trim().startsWith('{')) {
        const parsed = JSON.parse(notesStr);
        return {
          phone: parsed.phone,
          notes: parsed.notes,
          conversation_history: parsed.conversation_history || [],
        };
      }
    } catch (error) {
      Logger.warn('Failed to parse interview notes', error as Error);
    }
    return { notes: notesStr, conversation_history: [] };
  }

  /**
   * Helper to serialize details into notes string.
   */
  private static serializeNotes(
    phone: string | undefined,
    notes: string | undefined,
    history: RecruiterContact['conversation_history'],
  ): string {
    return JSON.stringify({
      phone: phone || '',
      notes: notes || '',
      conversation_history: history,
    });
  }

  /**
   * Adds a new recruiter contact to CRM.
   */
  public static async addContact(
    storage: StorageProvider,
    userId: string,
    contact: Omit<RecruiterContact, 'conversation_history'>,
  ): Promise<void> {
    const notesStr = this.serializeNotes(contact.phone, contact.notes, []);
    const referral = {
      id: contact.id || crypto.randomUUID().substring(0, 11),
      userId,
      name: contact.name,
      role: 'Recruiter',
      category: 'Recruiter' as const,
      company: contact.company,
      linkedInUrl: contact.linkedin,
      email: contact.email,
      notes: notesStr,
      tags: [],
      connectionStatus: 'Connected' as const,
      referralStatus: 'Connected',
      nextFollowUp: contact.follow_up_date,
      lastContacted: contact.last_contacted,
      createdAt: contact.last_contacted || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await storage.saveReferral(userId, referral);
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
    const referrals = await storage.getReferrals(userId);
    const referral = referrals.find((r) => r.id === recruiterId);

    if (!referral) {
      throw new Error(`Recruiter with ID ${recruiterId} not found`);
    }

    const { phone, notes, conversation_history } = this.parseNotes(referral.notes);
    const timestamp = new Date().toISOString();
    conversation_history.push({ timestamp, message, direction });

    // Automatically suggest next follow-up in 7 days
    const followUp = new Date();
    followUp.setDate(followUp.getDate() + 7);

    referral.notes = this.serializeNotes(phone, notes, conversation_history);
    referral.lastContacted = timestamp;
    referral.nextFollowUp = followUp.toISOString();

    await storage.saveReferral(userId, referral);
  }
}
