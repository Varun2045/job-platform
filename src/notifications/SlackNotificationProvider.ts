import { NotificationProvider, JobDigest } from './NotificationProvider.js';
import { HttpClient } from '../core/HttpClient.js';
import { Logger } from '../core/Logger.js';

export class SlackNotificationProvider implements NotificationProvider {
  public id = 'slack';
  private httpClient: HttpClient;

  constructor(private webhookUrl: string, httpClient?: HttpClient) {
    this.httpClient = httpClient || new HttpClient();
  }

  /**
   * Validates whether the provided webhook URL is a valid, non-private external URL (prevents SSRF).
   */
  public isValidWebhookUrl(url: string): boolean {
    if (!url || typeof url !== 'string') return false;
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return false;

      const hostname = parsed.hostname.toLowerCase();
      if (
        hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        hostname === '0.0.0.0' ||
        hostname.startsWith('10.') ||
        hostname.startsWith('192.168.') ||
        hostname.endsWith('.internal')
      ) {
        return false;
      }
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Builds the formatted Slack Block Kit JSON message payload.
   */
  public buildSlackPayload(digest: JobDigest): any {
    const blocks: any[] = [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `🚀 Job Alert Digest (${digest.jobs.length} High-Match Jobs)`,
          emoji: true,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Run Time:* ${digest.runTimestamp}\n*Companies Checked:* ${digest.totalCompaniesChecked} | *Jobs Found:* ${digest.totalJobsFound}`,
        },
      },
      { type: 'divider' },
    ];

    for (const job of digest.jobs.slice(0, 10)) {
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*<${job.applyUrl}|${job.title}>* at *${job.companyName}*\n📍 Location: ${job.location} | 🎯 Match Score: *${job.matchScore}%*`,
        },
      });
    }

    return { blocks };
  }

  /**
   * Dispatches the job digest to Slack via Webhook.
   */
  public async sendDigest(digest: JobDigest): Promise<void> {
    if (!digest.jobs || digest.jobs.length === 0) {
      Logger.info('SlackNotificationProvider: No jobs in digest. Skipping Slack alert.');
      return;
    }

    if (!this.isValidWebhookUrl(this.webhookUrl)) {
      Logger.warn(`SlackNotificationProvider: Invalid or restricted Slack Webhook URL provided: "${this.webhookUrl}"`);
      throw new Error('Invalid or restricted Slack Webhook URL');
    }

    const payload = this.buildSlackPayload(digest);

    try {
      await this.httpClient.request(this.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        retries: 3,
      });
      Logger.info(`SlackNotificationProvider: Successfully dispatched digest with ${digest.jobs.length} jobs to Slack.`);
    } catch (err: any) {
      Logger.error(`SlackNotificationProvider: Failed to send Slack notification`, err);
      throw err;
    }
  }
}
