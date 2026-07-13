import { StorageProvider } from '../storage/StorageProvider.js';
import { Logger } from './Logger.js';

export class AuditLogger {
  private static storage: StorageProvider;

  public static initialize(storage: StorageProvider): void {
    this.storage = storage;
  }

  public static async log(
    userId: string | null,
    action: string,
    details: Record<string, any>,
    ipAddress?: string
  ): Promise<void> {
    try {
      Logger.info(`[AUDIT LOG] User=${userId || 'system'} Action=${action} Details=${JSON.stringify(details)} IP=${ipAddress || 'N/A'}`);
      if (this.storage) {
        await this.storage.saveAuditLog(userId, action, details, ipAddress);
      }
    } catch (e: any) {
      Logger.error(`Failed to write audit log for ${action}`, e as Error);
    }
  }
}
