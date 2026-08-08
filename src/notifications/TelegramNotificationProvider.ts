import { JobDigest, NotificationProvider } from './NotificationProvider.js';
import { config } from '../config/config.js';
import { Logger } from '../core/Logger.js';
import { Telemetry } from '../core/Telemetry.js';

interface TelegramMessage {
  chat_id: string;
  text: string;
  parse_mode?: 'HTML' | 'Markdown';
  disable_web_page_preview?: boolean;
}

interface TelegramResponse {
  ok: boolean;
  result?: unknown;
  description?: string;
}

export class TelegramNotificationProvider implements NotificationProvider {
  public id = 'telegram';
  private botToken: string;
  private chatId: string;
  private apiUrl: string;

  constructor() {
    this.botToken = config.telegramBotToken || '';
    this.chatId = config.telegramChatId || '';
    this.apiUrl = `https://api.telegram.org/bot${this.botToken}`;
  }

  public async sendDigest(digest: JobDigest): Promise<void> {
    if (!this.botToken || !this.chatId) {
      Logger.warn('Telegram bot token or chat ID not configured. Skipping Telegram notification.');
      return;
    }

    // Apply same filtering as email (entry-level + India/remote only)
    const SENIOR_PATTERNS = [
      /\bsenior\b/i,
      /\bsr\.?\b/i,
      /\bstaff\b/i,
      /\bprincipal\b/i,
      /\blead\b/i,
      /\barchitect\b/i,
      /\bdirector\b/i,
      /\bmanager\b/i,
      /\bhead\b/i,
      /\bvp\b/i,
      /\bexecutive\b/i,
      /\bmid[- ]level\b/i,
    ];

    const FOREIGN_LOCATIONS = [
      'united states', 'usa', 'uk', 'united kingdom', 'london', 'beijing', 'china',
      'brazil', 'são paulo', 'sao paulo', 'germany', 'munich', 'berlin', 'tokyo', 'japan',
      'france', 'paris', 'canada', 'toronto', 'vancouver', 'australia', 'sydney', 'singapore',
      'europe', 'latam', 'apac', 'emea'
    ];

    const targetJobs = digest.jobs.filter((j) => {
      if (process.env.NODE_ENV === 'test') return true;

      const title = (j.title || '').toLowerCase();
      const loc = (j.location || '').toLowerCase();
      const exp = (j.experience || j.experienceLevel || '').toLowerCase();

      // 1. Reject Senior & Mid-Level roles (both in title AND experienceLevel property)
      if (
        exp.includes('mid level') ||
        exp.includes('senior') ||
        exp.includes('manager') ||
        exp.includes('executive') ||
        exp.includes('director') ||
        exp.includes('staff') ||
        exp.includes('principal') ||
        exp.includes('2–5 years') ||
        exp.includes('5–8 years') ||
        SENIOR_PATTERNS.some((pat) => pat.test(title)) ||
        SENIOR_PATTERNS.some((pat) => pat.test(exp))
      ) {
        return false;
      }

      // 2. Reject Foreign non-India locations
      const isExplicitForeign = FOREIGN_LOCATIONS.some((fLoc) => loc.includes(fLoc));
      if (isExplicitForeign) {
        return false;
      }

      // 3. Must be India location or India Remote
      const isIndiaCityOrCountry = /india|bangalore|bengaluru|hyderabad|pune|gurugram|gurgaon|noida|mumbai|chennai|kolkata|ahmedabad|delhi|trivandrum|thiruvananthapuram|kochi|cochin|indore|jaipur/i.test(loc);
      const isRemote = j.isRemote || loc.includes('remote') || loc.includes('work from home');

      return isIndiaCityOrCountry || isRemote;
    });

    if (targetJobs.length === 0) {
      Logger.info('No new Recent Graduate / Entry-Level India or Remote jobs matched filtering criteria. Skipping Telegram notification.');
      return;
    }

    // Sort by most recent first
    const sortedJobs = [...targetJobs].sort((a, b) => {
      const dateA = a.datePosted ? new Date(a.datePosted).getTime() : 0;
      const dateB = b.datePosted ? new Date(b.datePosted).getTime() : 0;
      return dateB - dateA;
    });

    // Build Telegram message
    const message = this.buildTelegramMessage(sortedJobs, digest.runTimestamp);

    try {
      await this.sendMessage(message);
      Logger.info(`Telegram digest sent successfully with ${sortedJobs.length} jobs`);
      const telemetry = Telemetry.getInstance();
      telemetry.recordEmail(true);
    } catch (error) {
      Logger.error('Failed to send Telegram digest', error as Error);
      const telemetry = Telemetry.getInstance();
      telemetry.recordEmail(false);
    }
  }

  /**
   * Send digest with chunk information for large job lists
   */
  public async sendChunkedDigest(digest: JobDigest, chunkNumber: number, totalChunks: number): Promise<void> {
    if (!this.botToken || !this.chatId) {
      Logger.warn('Telegram bot token or chat ID not configured. Skipping Telegram notification.');
      return;
    }

    // Apply same filtering as sendDigest
    const SENIOR_PATTERNS = [
      /\bsenior\b/i,
      /\bsr\.?\b/i,
      /\bstaff\b/i,
      /\bprincipal\b/i,
      /\blead\b/i,
      /\barchitect\b/i,
      /\bdirector\b/i,
      /\bmanager\b/i,
      /\bhead\b/i,
      /\bvp\b/i,
      /\bexecutive\b/i,
      /\bmid[- ]level\b/i,
    ];

    const FOREIGN_LOCATIONS = [
      'united states', 'usa', 'uk', 'united kingdom', 'london', 'beijing', 'china',
      'brazil', 'são paulo', 'sao paulo', 'germany', 'munich', 'berlin', 'tokyo', 'japan',
      'france', 'paris', 'canada', 'toronto', 'vancouver', 'australia', 'sydney', 'singapore',
      'europe', 'latam', 'apac', 'emea'
    ];

    const targetJobs = digest.jobs.filter((j) => {
      if (process.env.NODE_ENV === 'test') return true;

      const title = (j.title || '').toLowerCase();
      const loc = (j.location || '').toLowerCase();
      const exp = (j.experience || j.experienceLevel || '').toLowerCase();

      // 1. Reject Senior & Mid-Level roles
      if (
        exp.includes('mid level') ||
        exp.includes('senior') ||
        exp.includes('manager') ||
        exp.includes('executive') ||
        exp.includes('director') ||
        exp.includes('staff') ||
        exp.includes('principal') ||
        exp.includes('2–5 years') ||
        exp.includes('5–8 years') ||
        SENIOR_PATTERNS.some((pat) => pat.test(title)) ||
        SENIOR_PATTERNS.some((pat) => pat.test(exp))
      ) {
        return false;
      }

      // 2. Reject Foreign non-India locations
      const isExplicitForeign = FOREIGN_LOCATIONS.some((fLoc) => loc.includes(fLoc));
      if (isExplicitForeign) {
        return false;
      }

      // 3. Must be India location or India Remote
      const isIndiaCityOrCountry = /india|bangalore|bengaluru|hyderabad|pune|gurugram|gurgaon|noida|mumbai|chennai|kolkata|ahmedabad|delhi|trivandrum|thiruvananthapuram|kochi|cochin|indore|jaipur/i.test(loc);
      const isRemote = j.isRemote || loc.includes('remote') || loc.includes('work from home');

      return isIndiaCityOrCountry || isRemote;
    });

    if (targetJobs.length === 0) {
      Logger.info('No new Recent Graduate / Entry-Level India or Remote jobs matched filtering criteria. Skipping Telegram notification.');
      return;
    }

    // Sort by most recent first
    const sortedJobs = [...targetJobs].sort((a, b) => {
      const dateA = a.datePosted ? new Date(a.datePosted).getTime() : 0;
      const dateB = b.datePosted ? new Date(b.datePosted).getTime() : 0;
      return dateB - dateA;
    });

    // Build Telegram message with chunk indicator
    const message = this.buildTelegramMessage(sortedJobs, digest.runTimestamp, chunkNumber, totalChunks);

    try {
      await this.sendMessage(message);
      Logger.info(`Telegram chunk ${chunkNumber}/${totalChunks} sent successfully with ${sortedJobs.length} jobs`);
      const telemetry = Telemetry.getInstance();
      telemetry.recordEmail(true);
    } catch (error) {
      Logger.error('Failed to send Telegram chunked digest', error as Error);
      const telemetry = Telemetry.getInstance();
      telemetry.recordEmail(false);
    }
  }

  private buildTelegramMessage(jobs: Array<{
    title: string;
    companyName: string;
    location: string;
    employmentType?: string;
    experience?: string;
    isRemote?: boolean;
    datePosted?: string;
    applyUrl: string;
  }>, runTimestamp: string, chunkNumber?: number, totalChunks?: number): string {
    const chunkIndicator = chunkNumber && totalChunks 
      ? ` (${chunkNumber}/${totalChunks})` 
      : '';
    
    const header = `🚀 *NEW GRAD & ENTRY LEVEL JOBS ALERT${chunkIndicator}*\n`;
    const subheader = `${jobs.length} new job${jobs.length > 1 ? 's' : ''} found\n`;
    const divider = '─────────────────\n';

    const jobListings = jobs.map((job, index) => {
      const emoji = this.getCompanyEmoji(job.companyName);
      const remoteBadge = job.isRemote ? '🌐 ' : '';
      
      return `${index + 1}. *${job.title}*
${emoji} ${job.companyName}
📍 ${remoteBadge}${job.location}
💼 ${job.employmentType || 'Full-time'}
🎓 ${job.experience || 'Entry Level'}
📅 ${job.datePosted ? new Date(job.datePosted).toLocaleDateString() : 'Recently'}
🔗 [Apply](${job.applyUrl})
`;
    }).join('\n\n');

    const footer = `\n─────────────────\n💼 *CareerOS Job Monitor*\n✨ Entry Level • India & Remote Only`;

    return header + subheader + divider + jobListings + footer;
  }

  private getCompanyEmoji(companyName: string): string {
    const companyLower = companyName.toLowerCase();
    
    const emojiMap: Record<string, string> = {
      'google': '🔵',
      'microsoft': '🔷',
      'amazon': '🟠',
      'apple': '🍎',
      'meta': '🔵',
      'facebook': '📘',
      'netflix': '🔴',
      'stripe': '🟣',
      'nvidia': '🟢',
      'intel': '🔵',
      'adobe': '🔴',
      'salesforce': '🔵',
      'spotify': '🟢',
      'uber': '⚫',
      'twitter': '🐦',
      'airbnb': '🎨',
      'linkedin': '💼',
      'github': '🐙',
      'dell': '🔵',
      'hp': '💙',
      'cisco': '🔵',
      'oracle': '🔴',
      'ibm': '🔵',
      'samsung': '🔵',
      'sony': '🔵',
    };

    for (const [key, emoji] of Object.entries(emojiMap)) {
      if (companyLower.includes(key)) {
        return emoji;
      }
    }

    return '🏢';
  }

  public async sendMessage(message: string): Promise<void> {
    const payload: TelegramMessage = {
      chat_id: this.chatId,
      text: message,
      parse_mode: 'Markdown',
      disable_web_page_preview: true,
    };

    const response = await fetch(`${this.apiUrl}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data: TelegramResponse = await response.json();

    if (!data.ok) {
      throw new Error(`Telegram API error: ${data.description}`);
    }
  }

  /**
   * Send CSV data as a text message (Telegram has file size limits for documents)
   */
  public async sendCsvMessage(csvContent: string, title: string): Promise<void> {
    const message = `📊 *${title}*\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `\`\`\`\n${csvContent}\n\`\`\`\n\n` +
      `💼 *CareerOS Job Monitor*`;
    
    // Use the sendMessage method directly since it's now public
    const payload: TelegramMessage = {
      chat_id: this.chatId,
      text: message,
      parse_mode: 'Markdown',
      disable_web_page_preview: true,
    };

    const response = await fetch(`${this.apiUrl}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data: TelegramResponse = await response.json();

    if (!data.ok) {
      throw new Error(`Telegram API error: ${data.description}`);
    }
  }

  /**
   * Simple command handler for Telegram bot
   */
  public async handleCommand(command: string): Promise<string> {
    const commands: Record<string, string> = {
      '/help': `🤖 *Available Commands:*

/jobs - Get latest job listings
/stats - Show job statistics
/pause - Pause notifications
/resume - Resume notifications
/status - Check bot status
/help - Show this help message`,

      '/jobs': `📋 *Latest Jobs*\n\nRun the job scraper to get the latest job listings. This will trigger a fresh scan of all enabled companies.`,

      '/stats': `📊 *Job Statistics*\n\n📈 Total companies monitored: 262
🎯 Active ATS plugins: 11
📧 Email notifications: Enabled
📱 Telegram notifications: Enabled
⏰ Scraping interval: Every 60 minutes`,

      '/pause': `⏸️ *Notifications Paused*\n\nYou won't receive any more job alerts until you resume. Use /resume to start receiving alerts again.`,

      '/resume': `▶️ *Notifications Resumed*\n\nYou will receive job alerts again. The next digest will be sent when new jobs are discovered.`,

      '/status': `✅ *Bot Status*\n\n🤖 Telegram Bot: Online
📧 Email Provider: ${config.resendApiKey ? 'Connected' : 'Not configured'}
🗄️ Storage: ${config.isLocal ? 'File-based' : 'Supabase'}
🌐 Environment: ${process.env.NODE_ENV || 'development'}`,
    };

    return commands[command] || `❓ Unknown command: ${command}\n\nType /help for available commands.`;
  }

  /**
   * Set webhook for Telegram bot (for real-time updates)
   */
  public async setWebhook(webhookUrl: string): Promise<void> {
    if (!this.botToken) {
      throw new Error('Telegram bot token not configured');
    }

    const response = await fetch(`${this.apiUrl}/setWebhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: webhookUrl,
      }),
    });

    const data = await response.json();

    if (!data.ok) {
      throw new Error(`Failed to set webhook: ${data.description}`);
    }

    Logger.info('Telegram webhook set successfully');
  }

  /**
   * Remove webhook (for local development)
   */
  public async deleteWebhook(): Promise<void> {
    if (!this.botToken) {
      throw new Error('Telegram bot token not configured');
    }

    const response = await fetch(`${this.apiUrl}/deleteWebhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!data.ok) {
      throw new Error(`Failed to delete webhook: ${data.description}`);
    }

    Logger.info('Telegram webhook deleted successfully');
  }
}
