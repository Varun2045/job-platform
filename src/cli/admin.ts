import { runOrchestrator } from '../core/index.js';
import { FileStorage } from '../storage/FileStorage.js';
import { SupabaseStorage } from '../storage/SupabaseStorage.js';
import { StorageProvider } from '../storage/StorageProvider.js';
import { config } from '../config/config.js';
import { ConfigValidator } from '../core/ConfigValidator.js';
import { Logger } from '../core/Logger.js';
import { SecureLogger } from '../utils/SecureLogger.js';
import { StatsReporter } from '../core/Telemetry.js';

async function main() {
  const args = process.argv.slice(2);
  const command = args[0]?.toLowerCase();

  if (!command) {
    printHelp();
    return;
  }

  const storage: StorageProvider = config.isLocal ? new FileStorage() : new SupabaseStorage();
  await storage.initialize();

  switch (command) {
    case 'monitor': {
      const target = args[1];
      if (!target) {
        SecureLogger.logError('ERROR: Missing target. Specify a company ID, "all", or "priority <number>". Example: npm run monitor google');
        process.exit(1);
      }

      if (target.toLowerCase() === 'all') {
        const force = args[2] === 'force' || args[2] === '--force';
        Logger.info(`CLI Triggered: Running monitor for ${force ? 'ALL forced' : 'all due'} companies...`);
        await runOrchestrator({ forceAll: force });
      } else if (target.toLowerCase() === 'priority') {
        const priorityNum = Number(args[2]);
        if (isNaN(priorityNum) || priorityNum < 1 || priorityNum > 3) {
          SecureLogger.logError('ERROR: Missing or invalid priority. Specify a number: 1, 2, or 3.');
          process.exit(1);
        }
        Logger.info(`CLI Triggered: Running monitor for due priority ${priorityNum} companies...`);
        await runOrchestrator({ targetPriority: priorityNum });
      } else {
        Logger.info(`CLI Triggered: Running monitor for single company: ${target}`);
        await runOrchestrator({ targetCompanyId: target, forceAll: true });
      }
      break;
    }

    case 'health': {
      SecureLogger.logInfo('\n================ SCRAPER COVERAGE HEALTH ================');
      const companies = await storage.getAllCompanies();
      if (companies.length === 0) {
        SecureLogger.logInfo('No companies registered.');
        return;
      }

      SecureLogger.logInfo(
        String('COMPANY').padEnd(15) +
          ' | ' +
          String('ATS/SCRAPER').padEnd(12) +
          ' | ' +
          String('STATUS').padEnd(10) +
          ' | ' +
          String('RUNS').padEnd(8) +
          ' | ' +
          String('ERRORS').padEnd(8) +
          ' | ' +
          'LAST SCRAPE',
      );
      SecureLogger.logInfo('-'.repeat(80));

      companies
        .sort((a, b) => a.name.localeCompare(b.name))
        .forEach((c) => {
          const status = !c.enabled
            ? '\x1b[90mDISABLED\x1b[0m'
            : c.total_failures > 0 &&
                c.last_failed_scrape &&
                (!c.last_successful_scrape || new Date(c.last_failed_scrape) > new Date(c.last_successful_scrape))
              ? '\x1b[31mDEGRADED\x1b[0m'
              : c.last_scraper_used && c.last_scraper_used !== 'none' && c.last_scraper_used !== c.detected_ats
                ? '\x1b[33mDEGRADED\x1b[0m'
                : '\x1b[32mHEALTHY\x1b[0m';

          SecureLogger.logInfo(
            c.name.padEnd(15) +
              ' | ' +
              (c.detected_ats || 'auto').padEnd(12) +
              ' | ' +
              status.padEnd(19) +
              ' | ' + // adjusted for ansi escape chars padding
              String(c.total_scrapes ?? 0).padEnd(8) +
              ' | ' +
              String(c.total_failures ?? 0).padEnd(8) +
              ' | ' +
              (c.last_successful_scrape ? new Date(c.last_successful_scrape).toLocaleString() : 'Never'),
          );
        });
      SecureLogger.logInfo('=========================================================\n');
      break;
    }

    case 'stats': {
      SecureLogger.logInfo('\n================ SYSTEM RUN METRICS ================');
      const companies = await storage.getEnabledCompanies();
      const stats = StatsReporter.calculate(companies);

      SecureLogger.logInfo(`Total Companies Active:  ${stats.totalCompanies}`);
      SecureLogger.logInfo(`Aggregated Scrapes Run:  ${stats.totalScrapes}`);
      SecureLogger.logInfo(`Aggregated Failures:     ${stats.totalFailures} (Rate: ${stats.failureRate}%)`);
      SecureLogger.logInfo(`Average Response Time:   ${stats.avgResponseTimeSec} seconds`);
      SecureLogger.logInfo('====================================================\n');
      break;
    }

    case 'resume-score': {
      const target = args[1];
      if (!target) {
        SecureLogger.logError(
          'ERROR: Missing target. Specify a company ID to score existing jobs. Example: npm run resume-score microsoft',
        );
        process.exit(1);
      }

      Logger.info(`CLI Triggered: Resume Score test check for company: ${target}`);
      const companyConfig = await storage.getCompanyConfig(target);
      if (!companyConfig) {
        SecureLogger.logError(`ERROR: Company config "${target}" not found.`);
        process.exit(1);
      }

      const jobs = await storage.getCompanyJobs(target);
      SecureLogger.logInfo(`\nFound ${jobs.length} stored jobs for ${companyConfig.name}. Running score evaluation:`);
      SecureLogger.logInfo('-'.repeat(70));

      const profiles = companyConfig.resume_profiles.length > 0 ? companyConfig.resume_profiles : [];

      jobs.forEach((job) => {
        SecureLogger.logInfo(`\nJob: ${job.title} | Location: ${job.location}`);
        SecureLogger.logInfo(`  - Score Evaluation: [REMOVED - AI Matching Disabled]`);
      });
      SecureLogger.logInfo('-'.repeat(70) + '\n');
      break;
    }

    case 'track': {
      const jobHash = args[1];
      const status = args[2];
      const notes = args.slice(3).join(' ') || '';

      if (!jobHash || !status) {
        SecureLogger.logError('ERROR: Missing arguments. Usage: node dist/cli/admin.js track <job_hash> <status> [notes]');
        process.exit(1);
      }

      const validStatuses = [
        'New',
        'Saved',
        'Applied',
        'OA Scheduled',
        'OA Completed',
        'Interview',
        'Offer',
        'Rejected',
        'Closed',
      ];
      const normalizedStatus = validStatuses.find((s) => s.toLowerCase() === status.toLowerCase());
      if (!normalizedStatus) {
        SecureLogger.logError(`ERROR: Invalid status. Must be one of: ${validStatuses.join(', ')}`);
        process.exit(1);
      }

      // Check if job is stored in company registries
      const companies = await storage.getAllCompanies();
      let foundJob = null;
      for (const comp of companies) {
        const jobs = await storage.getCompanyJobs(comp.id);
        const j = jobs.find((x) => x.jobHash === jobHash);
        if (j) {
          foundJob = j;
          break;
        }
      }

      const company = foundJob ? foundJob.company : 'Unknown';
      const jobId = foundJob ? foundJob.id : 'Unknown';

      await storage.saveApplication({
        jobHash,
        company,
        jobId,
        status: normalizedStatus as any,
        notes,
        lastUpdated: new Date().toISOString(),
      });

      Logger.info(`Successfully tracked application for job hash ${jobHash} as "${normalizedStatus}".`);
      break;
    }

    case 'search': {
      const queryType = args[1]?.toLowerCase();
      const val = args[2];

      if (!queryType || !val) {
        SecureLogger.logError(
          'ERROR: Missing arguments. Usage: node dist/cli/admin.js search <company|tech|score|location|remote|date> <value>',
        );
        process.exit(1);
      }

      const companies = await storage.getEnabledCompanies();
      const allScoredJobs: { job: any; score: number }[] = [];

      for (const comp of companies) {
        const jobs = await storage.getCompanyJobs(comp.id);
        const scored = jobs.map((j) => {
          return { job: j, score: 0 };
        });
        allScoredJobs.push(...scored);
      }

      const criteria: any = {};
      if (queryType === 'company') criteria.company = val;
      else if (queryType === 'tech') criteria.technology = val;
      else if (queryType === 'score') criteria.minScore = Number(val);
      else if (queryType === 'location') criteria.location = val;
      else if (queryType === 'remote') criteria.remote = val.toLowerCase() === 'true';
      else if (queryType === 'date') criteria.dateFound = val;

      const { SearchEngine } = await import('../core/SearchEngine.js');
      const results = SearchEngine.search(allScoredJobs, criteria);

      SecureLogger.logInfo(`\n================ SEARCH RESULTS (${results.length} found) ================`);
      results.forEach(({ job, score }) => {
        SecureLogger.logInfo(`- [${score}% Match] ${job.title} at ${job.company} (${job.location})`);
        SecureLogger.logInfo(`  URL: ${job.url}`);
        SecureLogger.logInfo(`  Hash: ${job.jobHash}\n`);
      });
      SecureLogger.logInfo('=======================================================\n');
      break;
    }

    default:
      SecureLogger.logError(`ERROR: Unknown command "${command}"`);
      printHelp();
      process.exit(1);
  }
  process.exit(0);
}

function printHelp() {
  SecureLogger.logInfo(`
Job Monitor Admin CLI Utility
-----------------------------
Usage:
  npm run monitor <company_id>      Run scraper for specific company immediately
  npm run monitor all               Run scheduling loop for all due companies
  npm run health                    Show scraper coverage & health summary
  npm run stats                     Display system execution metrics
  npm run resume-score <company_id> Dry-run resume score matching for existing company jobs
  node dist/cli/admin.js track <hash> <status> [notes] Track job application status
  node dist/cli/admin.js search <type> <val>           Search job catalog
  `);
}

main().catch((e) => {
  SecureLogger.logError('CLI Command execution crashed:', e);
  process.exit(1);
});
