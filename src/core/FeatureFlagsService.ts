import { StorageProvider } from '../storage/StorageProvider.js';
import { Logger } from './Logger.js';

export class FeatureFlagsService {
  private static storage: StorageProvider;

  public static initialize(storage: StorageProvider): void {
    this.storage = storage;
  }

  public static async isEnabled(key: string): Promise<boolean> {
    try {
      if (!this.storage) {
        return true;
      }
      return await this.storage.getFeatureFlag(key);
    } catch (e) {
      Logger.warn(`Error resolving feature flag: ${key}. Defaulting to true.`);
      return true;
    }
  }

  public static async setFlag(key: string, enabled: boolean): Promise<void> {
    try {
      if (this.storage) {
        await this.storage.setFeatureFlag(key, enabled);
      }
    } catch (e: any) {
      Logger.error(`Error toggling feature flag: ${key}`, e as Error);
    }
  }
}
