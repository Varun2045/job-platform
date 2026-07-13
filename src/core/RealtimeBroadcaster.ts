import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from '../config/config.js';
import { Logger } from './Logger.js';

export class RealtimeBroadcaster {
  private static client: SupabaseClient | null = null;

  public static initialize(): void {
    if (!config.isLocal && config.supabaseUrl && config.supabaseServiceKey) {
      this.client = createClient(config.supabaseUrl, config.supabaseServiceKey);
    }
  }

  /**
   * Broadcasts a real-time message on a specific channel.
   */
  public static async send(channelName: string, eventName: string, payload: Record<string, any>): Promise<void> {
    try {
      Logger.info(`[REALTIME BROADCAST] Channel=${channelName} Event=${eventName} Payload=${JSON.stringify(payload)}`);
      if (this.client) {
        const channel = this.client.channel(channelName);
        await channel.subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            await channel.send({
              type: 'broadcast',
              event: eventName,
              payload
            });
            await channel.unsubscribe();
          }
        });
      }
    } catch (e: any) {
      Logger.error(`Failed to broadcast realtime event ${eventName} on ${channelName}`, e as Error);
    }
  }
}
