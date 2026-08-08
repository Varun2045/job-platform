import { FileStorage } from '../storage/FileStorage.js';
import { SupabaseStorage } from '../storage/SupabaseStorage.js';
import { StorageProvider } from '../storage/StorageProvider.js';
import { config } from '../config/config.js';
import { Logger } from '../core/Logger.js';
import { TelegramNotificationProvider } from '../notifications/TelegramNotificationProvider.js';
import { JobDigest, DigestJob } from '../notifications/NotificationProvider.js';
import { Job } from '../companies/Scraper.js';

/**
 * Daily Scheduler - Runs at 10 PM every night to send daily job digest via Telegram
 */
export class DailyScheduler {
  private storage: StorageProvider;
  private telegramProvider: TelegramNotificationProvider;

  constructor() {
    this.storage = config.isLocal ? new FileStorage() : new SupabaseStorage();
    this.telegramProvider = new TelegramNotificationProvider();
  }

  /**
   * Initialize the scheduler
   */
  async initialize(): Promise<void> {
    await this.storage.initialize();
    Logger.info('Daily Scheduler initialized');
  }

  /**
   * Run the daily job digest at 10 PM
   */
  async runDailyDigest(): Promise<void> {
    try {
      Logger.info('Starting daily job digest generation...');
      
      // Get jobs from the last 24 hours
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(22, 0, 0, 0); // 10 PM yesterday
      
      const today = new Date();
      today.setHours(22, 0, 0, 0); // 10 PM today
      
      Logger.info(`Fetching jobs between ${yesterday.toISOString()} and ${today.toISOString()}`);
      
      // Get all jobs from storage
      const allJobs = await this.storage.getAllJobs();
      
      // Filter jobs from the last 24 hours and convert to DigestJob format
      const recentJobs: DigestJob[] = allJobs
        .filter((job: Job) => {
          if (!job.datePosted) return false;
          const jobDate = new Date(job.datePosted);
          return jobDate >= yesterday && jobDate <= today;
        })
        .map((job: Job) => ({
          companyName: job.company,
          title: job.title,
          location: job.location,
          experience: job.experience || job.experienceLevel || 'Entry Level',
          experienceLevel: job.experienceLevel,
          employmentType: job.employmentType || 'Full-time',
          datePosted: job.datePosted || new Date().toISOString(),
          applyUrl: job.url,
          jobId: job.id,
          matchScore: 0,
          isRemote: job.isRemote || false,
        }));
      
      Logger.info(`Found ${recentJobs.length} jobs in the last 24 hours`);
      
      if (recentJobs.length === 0) {
        Logger.info('No new jobs found in the last 24 hours. Skipping daily digest.');
        await this.sendEmptyDigest();
        return;
      }
      
      // Create job digest
      const digest: JobDigest = {
        jobs: recentJobs,
        runTimestamp: new Date().toISOString(),
        totalCompaniesChecked: recentJobs.length,
        totalJobsFound: recentJobs.length,
        totalNewJobs: recentJobs.length,
      };
      
      // Send digest via Telegram
      await this.telegramProvider.sendDigest(digest);
      
      // Also send CSV version if requested
      await this.sendCsvDigest(recentJobs);
      
      Logger.info(`Daily digest sent successfully with ${recentJobs.length} jobs`);
      
    } catch (error) {
      Logger.error('Failed to run daily digest', error as Error);
      throw error;
    }
  }

  /**
   * Send empty digest when no jobs found
   */
  private async sendEmptyDigest(): Promise<void> {
    const message = `📊 *Daily Job Digest - ${new Date().toLocaleDateString()}*\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `No new jobs found in the last 24 hours.\n\n` +
      `💼 *CareerOS Job Monitor*\n` +
      `✨ Next update: Tomorrow at 10 PM`;
    
    try {
      // Since sendMessage is now private, we need to use the public interface
      // We'll need to make sendMessage public or create a public method
      // For now, let's create a simple text message via the digest
      const emptyDigest: JobDigest = {
        jobs: [],
        runTimestamp: new Date().toISOString(),
        totalCompaniesChecked: 0,
        totalJobsFound: 0,
        totalNewJobs: 0,
      };
      
      await this.telegramProvider.sendDigest(emptyDigest);
      Logger.info('Empty digest sent successfully');
    } catch (error) {
      Logger.error('Failed to send empty digest', error as Error);
    }
  }

  /**
   * Send CSV version of the job digest
   */
  private async sendCsvDigest(jobs: DigestJob[]): Promise<void> {
    // Create CSV content
    const headers = ['Title', 'Company', 'Location', 'Experience', 'Employment Type', 'Remote', 'Date Posted', 'Apply URL'];
    const csvRows = [headers.join(',')];
    
    jobs.forEach(job => {
      const row = [
        `"${job.title.replace(/"/g, '""')}"`,
        `"${job.companyName.replace(/"/g, '""')}"`,
        `"${job.location.replace(/"/g, '""')}"`,
        `"${job.experience || job.experienceLevel || 'Entry Level'}"`,
        `"${job.employmentType || 'Full-time'}"`,
        job.isRemote ? 'Yes' : 'No',
        job.datePosted ? new Date(job.datePosted).toLocaleDateString() : 'Recently',
        `"${job.applyUrl}"`,
      ];
      csvRows.push(row.join(','));
    });
    
    const csvContent = csvRows.join('\n');
    
    // Send CSV as a formatted message
    const title = `Daily Job Digest - CSV Format (${new Date().toLocaleDateString()})`;
    try {
      await this.telegramProvider.sendCsvMessage(csvContent, title);
      Logger.info('CSV digest sent successfully');
    } catch (error) {
      Logger.error('Failed to send CSV digest', error as Error);
    }
  }

  /**
   * Start the scheduler - runs every day at 10 PM
   */
  startScheduler(): void {
    const now = new Date();
    const targetTime = new Date();
    targetTime.setHours(22, 0, 0, 0); // 10 PM
    
    // If it's already past 10 PM, schedule for tomorrow
    if (now > targetTime) {
      targetTime.setDate(targetTime.getDate() + 1);
    }
    
    const delay = targetTime.getTime() - now.getTime();
    
    Logger.info(`Daily digest scheduled for ${targetTime.toLocaleString()} (in ${Math.round(delay / 1000 / 60)} minutes)`);
    
    setTimeout(async () => {
      await this.runDailyDigest();
      
      // Schedule next day's digest
      this.startScheduler();
    }, delay);
  }
}

/**
 * CLI entry point for daily scheduler
 */
export async function runDailyScheduler(): Promise<void> {
  const scheduler = new DailyScheduler();
  await scheduler.initialize();
  
  // Check if we should run immediately or start scheduler
  const args = process.argv.slice(2);
  const runNow = args.includes('--now') || args.includes('-n');
  
  if (runNow) {
    Logger.info('Running daily digest immediately...');
    await scheduler.runDailyDigest();
  } else {
    Logger.info('Starting daily scheduler (runs at 10 PM every night)...');
    scheduler.startScheduler();
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runDailyScheduler().catch((error) => {
    Logger.error('Daily scheduler failed', error);
    process.exit(1);
  });
}
