import { NotificationProvider, JobDigest } from './NotificationProvider.js';
import { HttpClient } from '../core/HttpClient.js';
import { Logger } from '../core/Logger.js';

export class TelegramNotificationProvider implements NotificationProvider {
  public id = 'telegram';
  private httpClient: HttpClient;

  constructor(
    private botToken: string,
    private chatId: string,
    httpClient?: HttpClient,
  ) {
    this.httpClient = httpClient || new HttpClient();
  }

  /**
   * Validates Bot Token format (numeric bot_id + secret string).
   */
  public isValidBotToken(token: string): boolean {
    if (!token || typeof token !== 'string') return false;
    return /^[0-9]+:[a-zA-Z0-9_-]{35,}$/.test(token.trim());
  }

  /**
   * Validates Telegram Chat ID format.
   */
  public isValidChatId(chatId: string): boolean {
    if (!chatId || typeof chatId !== 'string') return false;
    return /^-?[0-9]{5,}$/.test(chatId.trim());
  }

  /**
   * Builds formatted Telegram Bot API text message.
   */
  public buildTelegramMessage(digest: JobDigest): string {
    let message = `🚀 *Job Alert Digest*\n\n`;
    message += `📊 *Jobs Found:* ${digest.totalJobsFound} | *New:* ${digest.totalNewJobs}\n\n`;

    for (const job of digest.jobs.slice(0, 10)) {
      message += `• *${job.title}* at *${job.companyName}*\n`;
      message += `  📍 ${job.location} | Match: *${job.matchScore}%*\n`;
      message += `  🔗 [Apply Now](${job.applyUrl})\n\n`;
    }

    return message;
  }

  /**
   * Dispatches the job digest to Telegram Bot API endpoint.
   */
  public async sendDigest(digest: JobDigest): Promise<void> {
    if (!digest.jobs || digest.jobs.length === 0) {
      Logger.info('TelegramNotificationProvider: No jobs in digest. Skipping Telegram alert.');
      return;
    }

    if (!this.isValidBotToken(this.botToken)) {
      Logger.warn('TelegramNotificationProvider: Invalid Telegram Bot Token format');
      throw new Error('Invalid Telegram Bot Token');
    }

    if (!this.isValidChatId(this.chatId)) {
      Logger.warn('TelegramNotificationProvider: Invalid Telegram Chat ID format');
      throw new Error('Invalid Telegram Chat ID');
    }

    const text = this.buildTelegramMessage(digest);
    const apiUrl = `https://api.telegram.org/bot${this.botToken}/sendMessage`;
    const payload = {
      chat_id: this.chatId,
      text,
      parse_mode: 'Markdown',
      disable_web_page_preview: false,
    };

    try {
      await this.httpClient.request(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        retries: 3,
      });
      Logger.info(`TelegramNotificationProvider: Successfully dispatched digest to Telegram chat ${this.chatId}`);
    } catch (err: any) {
      Logger.error('TelegramNotificationProvider: Failed to send Telegram notification', err);
      throw err;
    }
  }
}
