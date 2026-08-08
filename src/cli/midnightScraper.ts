import { runOrchestrator } from '../core/index.js';
import { Logger } from '../core/Logger.js';

/**
 * Midnight Scraper - Forces all companies to be scraped at 12 AM
 * This ensures the database gets completely refreshed daily
 */
export class MidnightScraper {

  /**
   * Run forced scrape for all companies
   */
  async runMidnightScrape(): Promise<void> {
    Logger.info('Starting midnight database refresh...');
    Logger.info('Forcing scrape for all companies regardless of schedule');

    try {
      // Use the orchestrator with forceAll option
      await runOrchestrator({ forceAll: true });
      
      Logger.info('✅ Midnight database refresh completed successfully');
    } catch (error) {
      Logger.error('❌ Midnight scrape failed', error as Error);
      throw error;
    }
  }

  /**
   * Start the midnight scheduler - runs every day at 12 AM
   */
  startScheduler(): void {
    const now = new Date();
    const targetTime = new Date();
    targetTime.setHours(0, 0, 0, 0); // 12 AM (midnight)
    
    // If it's already past midnight, schedule for tomorrow
    if (now > targetTime) {
      targetTime.setDate(targetTime.getDate() + 1);
    }
    
    const delay = targetTime.getTime() - now.getTime();
    
    Logger.info(`Midnight database refresh scheduled for ${targetTime.toLocaleString()} (in ${Math.round(delay / 1000 / 60)} minutes)`);
    
    setTimeout(async () => {
      await this.runMidnightScrape();
      
      // Schedule next day's midnight scrape
      this.startScheduler();
    }, delay);
  }

  /**
   * Run immediately (for testing or manual triggering)
   */
  async runNow(): Promise<void> {
    Logger.info('Running midnight database refresh immediately...');
    await this.runMidnightScrape();
  }
}

/**
 * CLI entry point for midnight scraper
 */
export async function runMidnightScraper(): Promise<void> {
  const scraper = new MidnightScraper();
  
  // Check if we should run immediately or start scheduler
  const args = process.argv.slice(2);
  const runNow = args.includes('--now') || args.includes('-n');
  
  if (runNow) {
    await scraper.runNow();
  } else {
    Logger.info('Starting midnight scheduler (runs at 12 AM every night)...');
    scraper.startScheduler();
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runMidnightScraper().catch((error) => {
    Logger.error('Midnight scraper failed', error);
    process.exit(1);
  });
}