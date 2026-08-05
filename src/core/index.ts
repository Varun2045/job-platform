import { config } from '../config/config.js';
import { Logger } from './Logger.js';
import { FileStorage } from '../storage/FileStorage.js';
import { SupabaseStorage } from '../storage/SupabaseStorage.js';
import fs from 'fs';
import path from 'path';
import { StorageProvider } from '../storage/StorageProvider.js';
import { TaskQueue } from './Queue.js';
import { ScraperRegistry } from '../companies/ScraperRegistry.js';
import { JobNormalizer } from './JobNormalizer.js';
import { ComparisonEngine } from './ComparisonEngine.js';
import { EmailNotificationProvider } from '../notifications/EmailNotificationProvider.js';
import { TelegramNotificationProvider } from '../notifications/TelegramNotificationProvider.js';
import { MetricsExporter, GlobalMetrics } from './MetricsExporter.js';
import { DashboardGenerator } from './DashboardGenerator.js';
import { CompanyConfig, Job, RawJob } from '../companies/Scraper.js';
import { PlaywrightScraper } from '../companies/PlaywrightScraper.js';
import { FallbackScraper } from '../companies/FallbackScraper.js';
import { AtsDetector } from './AtsDetector.js';
import { JobFilter } from './JobFilter.js';
import { CsvExporter } from './CsvExporter.js';
import { ExperienceLevelDetector } from './ExperienceLevelDetector.js';
import { DailyReportGenerator } from './DailyReportGenerator.js';
import { AnalyticsGenerator } from './AnalyticsGenerator.js';
import { WeeklyReportGenerator } from './WeeklyReportGenerator.js';
import { Telemetry } from './Telemetry.js';
import { BackupService } from './BackupService.js';

export async function runOrchestrator(
  options: {
    targetCompanyId?: string;
    targetPriority?: number;
    forceAll?: boolean;
    dryRun?: boolean;
  } = {},
): Promise<void> {
  const startTime = Date.now();
  const telemetry = Telemetry.getInstance();
  telemetry.setSchedulerStatus('running');
  Logger.info('Initializing Job Monitor Platform...');

  // 1. Select Storage Provider
  const storage: StorageProvider = config.isLocal ? new FileStorage() : new SupabaseStorage();

  try {
    await storage.initialize();
    Logger.info(`Storage initialized successfully using: ${storage.constructor.name}`);
  } catch (e: any) {
    Logger.critical('Failed to initialize storage provider. Aborting run.', e);
    throw e;
  }

  // 2. Distributed Advisory Locking (Production Supabase Only)
  if (!config.isLocal) {
    try {
      Logger.info('Acquiring distributed Postgres advisory lock...');
      const supabase = (storage as any).client;
      
      // Use atomic function to check and acquire the lock
      const { data, error } = await supabase.rpc('try_advisory_lock', { 
        lock_key: 8675309 
      });

      if (error) throw error;

      // Function returns true if lock was acquired, false if already held
      if (data === false) {
        Logger.warn('Another monitor instance is currently running. Exiting to prevent execution race.');
        return;
      }
      
      Logger.info('Distributed lock acquired successfully.');
    } catch (e) {
      Logger.warn(
        `Failed to execute distributed lock check: ${e instanceof Error ? e.message : String(e)}. Proceeding with caution.`,
      );
    }
  }

  try {
    // 3. Fetch Company Registry
    let companies = await storage.getEnabledCompanies();
    Logger.info(`Loaded ${companies.length} active companies from registry.`);

    if (options.targetCompanyId) {
      companies = companies.filter((c) => c.id === options.targetCompanyId);
      Logger.info(`Targeted company override: ${options.targetCompanyId} (Matches: ${companies.length})`);
    } else {
      if (options.targetPriority) {
        companies = companies.filter((c) => c.priority === options.targetPriority);
        Logger.info(`Targeted priority filter: ${options.targetPriority} (Matches: ${companies.length})`);
      }

      if (!options.forceAll) {
        // Scheduler logic: Check if due based on interval_minutes
        companies = companies.filter((c) => {
          if (!c.last_successful_scrape) return true;
          const lastRun = new Date(c.last_successful_scrape).getTime();
          const diffMinutes = (Date.now() - lastRun) / (60 * 1000);
          return diffMinutes >= c.interval_minutes - 5;
        });
        Logger.info(`Scheduler: ${companies.length} companies are currently due for execution.`);
      }
    }

    if (!options.targetCompanyId) {
      companies = companies.filter((c) => {
        if (c.api_suspended_until) {
          const suspendedUntil = new Date(c.api_suspended_until).getTime();
          if (suspendedUntil > Date.now()) {
            Logger.info(
              `[${c.name}] Scraper suspended until ${new Date(c.api_suspended_until).toLocaleString()} due to circuit breaker. Skipping.`,
            );
            return false;
          }
        }
        return true;
      });
    }

    if (companies.length === 0) {
      Logger.info('No companies due for monitoring in this run. Exiting.');
      return;
    }

    // 4. Initialize Core Helpers
    const httpClient = (storage as any).httpClient ?? new (await import('./HttpClient.js')).HttpClient();
    const playwrightScraper = new PlaywrightScraper();
    const fallbackScraper = new FallbackScraper();
    const taskQueue = new TaskQueue();

    const companyMetricsList: any[] = [];
    const allMatchesToNotify: { job: Job; score: number }[] = [];
    const allUpdatedMatchesToNotify: { job: Job; score: number }[] = [];
    let totalJobsFoundCount = 0;
    let totalFailuresCount = 0;

    // 5. Staggered Batch Execution Queue Setup
    const batchSize = 20;
    const batches: CompanyConfig[][] = [];
    for (let i = 0; i < companies.length; i += batchSize) {
      batches.push(companies.slice(i, i + batchSize));
    }

    Logger.info(`Scheduling ${companies.length} companies across ${batches.length} staggered batch runs.`);

    for (let b = 0; b < batches.length; b++) {
      const batch = batches[b];
      Logger.info(`Enqueueing Batch ${b + 1}/${batches.length} (${batch.length} companies)...`);

      for (const company of batch) {
        taskQueue.addTask({
          id: company.id,
          priority: company.priority,
          execute: async () => {
            const compStartTime = Date.now();
            let scraperStatus = 'healthy';
            let jobsFound = 0;
            let newJobsCount = 0;
            let finalScraperUsed = 'none';
            let rawPostings: RawJob[] = [];

            try {
              // A. ATS Discovery check
              const urlChanged = false;
              if (company.detected_ats === 'auto' || AtsDetector.shouldDetect(company, urlChanged)) {
                const detected = await AtsDetector.detect(company, httpClient);
                company.detected_ats = detected;
                company.detected_ats_at = new Date().toISOString();
                await storage.updateCompanyScrapeState(company.id, {
                  detected_ats: company.detected_ats,
                  detected_ats_at: company.detected_ats_at,
                });
              }

              // B. Scraper selection
              const plugin = ScraperRegistry.getPlugin(company);
              const forceScraper = company.preferred_scraper;

              // C. Scraper Hierarchy and Timeout Wrapper
              const runScraperPromise = (async () => {
                if (forceScraper) {
                  finalScraperUsed = forceScraper;
                  Logger.info(`[${company.name}] Using preferred scraper override: ${forceScraper}`);
                  if (forceScraper === 'playwright_fallback') {
                    return await playwrightScraper.discover(company);
                  } else if (forceScraper === 'cheerio_fallback') {
                    return await fallbackScraper.discover(company, httpClient);
                  } else {
                    const specificPlugin = ScraperRegistry.getPlugin(company);
                    return specificPlugin
                      ? await specificPlugin.discover(company, httpClient)
                      : await fallbackScraper.discover(company, httpClient);
                  }
                } else {
                  if (plugin && company.detected_ats !== 'fallback') {
                    try {
                      finalScraperUsed = plugin.metadata.id;
                      Logger.info(`[${company.name}] Stage 1: API Discovery (${finalScraperUsed})`);
                      return await plugin.discover(company, httpClient);
                    } catch (e: any) {
                      Logger.warn(`[${company.name}] API Scraper failed: ${e.message}. Falling back to Playwright...`);
                      scraperStatus = 'api_failed_playwright_success';
                    }
                  }

                  if (config.features.playwright) {
                    try {
                      finalScraperUsed = 'playwright_fallback';
                      Logger.info(`[${company.name}] Stage 2: Browser Discovery (Playwright)`);
                      const res = await playwrightScraper.discover(company);
                      if (scraperStatus === 'healthy') scraperStatus = 'degraded';
                      return res;
                    } catch (e: any) {
                      Logger.warn(`[${company.name}] Playwright failed: ${e.message}. Falling back to Cheerio HTML...`);
                      scraperStatus = 'failed';
                    }
                  }

                  finalScraperUsed = 'cheerio_fallback';
                  Logger.info(`[${company.name}] Stage 3: Cheerio HTML Scraping`);
                  const res = await fallbackScraper.discover(company, httpClient);
                  scraperStatus = 'degraded';
                  return res;
                }
              })();

              // Apply scrape_timeout if specified
              if (company.scrape_timeout && company.scrape_timeout > 0) {
                const timeoutPromise = new Promise<RawJob[]>((_, reject) =>
                  setTimeout(
                    () => reject(new Error(`Scrape timeout exceeded after ${company.scrape_timeout}ms`)),
                    company.scrape_timeout!,
                  ),
                );
                rawPostings = await Promise.race([runScraperPromise, timeoutPromise]);
              } else {
                rawPostings = await runScraperPromise;
              }

              jobsFound = rawPostings.length;
              totalJobsFoundCount += jobsFound;

              // D. Job Normalization Layer
              let currentJobs = rawPostings.map((raw) =>
                plugin ? plugin.normalize(raw, company) : JobNormalizer.normalize(raw, company),
              );

              // Apply Advanced Filtering (workplace, category, remote status, location)
              currentJobs = currentJobs.filter((j) => JobFilter.matches(j));

              // Limit jobs to fetch if company.max_jobs_to_fetch is set
              if (company.max_jobs_to_fetch && company.max_jobs_to_fetch > 0) {
                currentJobs = currentJobs.slice(0, company.max_jobs_to_fetch);
              }

              // E. Load State & Run Comparison Engine
              const previousJobs = await storage.getCompanyJobs(company.id);
              const delta = ComparisonEngine.compare(previousJobs, currentJobs);

              newJobsCount = delta.added.length;
              Logger.info(
                `[${company.name}] Scraped: ${jobsFound} jobs found, ${newJobsCount} new matches after filtering.`,
              );

              // F. Two-Stage Enrichment Pipeline: Only enrich new matching candidates
              const enrichedNewJobs: Job[] = [];
              const pluginToEnrich = ScraperRegistry.getPlugin(company);

              for (const newJob of delta.added) {
                try {
                  Logger.info(`[${company.name}] Enriching new job description: ${newJob.title} (${newJob.id})`);
                  let rawJob: RawJob = {
                    company: newJob.company,
                    id: newJob.id,
                    title: newJob.title,
                    location: newJob.location,
                    url: newJob.url,
                    source: newJob.source,
                    description: newJob.description,
                    raw: rawPostings.find((rp) => rp.id === newJob.id)?.raw,
                  };

                  if (
                    pluginToEnrich &&
                    company.detected_ats !== 'fallback' &&
                    finalScraperUsed === pluginToEnrich.metadata.id
                  ) {
                    rawJob = await pluginToEnrich.enrich(rawJob, httpClient);
                  } else if (finalScraperUsed === 'playwright_fallback') {
                    rawJob = await playwrightScraper.enrich(rawJob);
                  } else {
                    rawJob = await fallbackScraper.enrich(rawJob, httpClient);
                  }

                  const normalizedEnrichedJob = JobNormalizer.normalize(rawJob, company);
                  enrichedNewJobs.push(normalizedEnrichedJob);
                } catch (enrichErr: any) {
                  Logger.error(
                    `[${company.name}] Failed to enrich job details for ${newJob.title} (${newJob.id}): ${enrichErr.message}. Continuing.`,
                  );
                  const fallbackRaw: RawJob = {
                    company: newJob.company,
                    id: newJob.id,
                    title: newJob.title,
                    location: newJob.location,
                    url: newJob.url,
                    source: newJob.source,
                    description: newJob.description,
                    raw: rawPostings.find((rp) => rp.id === newJob.id)?.raw,
                  };
                  const normalizedFallbackJob = JobNormalizer.normalize(fallbackRaw, company);
                  enrichedNewJobs.push(normalizedFallbackJob);
                }
              }

              // G. Filter out non-tech roles and keep all remaining new jobs
              const verifiedNewJobs: Job[] = [];
              for (const enrichedJob of enrichedNewJobs) {
                const excludeKeywords = [
                  'Director',
                  'Vice President',
                  'VP',
                  'Sales',
                  'Partner Development',
                  'Account Executive',
                  'Customer Success',
                  'Business Development',
                  'Marketing',
                  'Finance',
                  'Legal',
                  'HR',
                  'Recruiter',
                ];

                const titleLower = enrichedJob.title.toLowerCase();
                const shouldExclude = excludeKeywords.some((keyword) => {
                  const kwLower = keyword.toLowerCase();
                  if (keyword === 'VP' || keyword === 'HR') {
                    const regex = new RegExp(`\\b${kwLower}\\b`, 'i');
                    return regex.test(titleLower);
                  }
                  return titleLower.includes(kwLower);
                });

                if (shouldExclude) {
                  Logger.info(`[${company.name}] Skipping blacklisted role: ${enrichedJob.title}`);
                  continue;
                }

                allMatchesToNotify.push({ job: enrichedJob, score: 100 });
                verifiedNewJobs.push(enrichedJob);
                Logger.info(
                  `[${company.name}] New job found: [${enrichedJob.title}]`,
                );
              }

              // G.2 Keep all modified/updated jobs
              const enrichedUpdatedJobs: Job[] = [];
              for (const mod of delta.modified) {
                const enrichedJob = mod.current;
                (enrichedJob as any).changes = mod.changes;
                allUpdatedMatchesToNotify.push({ job: enrichedJob, score: 100 });
                enrichedUpdatedJobs.push(enrichedJob);
                Logger.info(
                  `[${company.name}] Updated job found: [${enrichedJob.title}]`,
                );
              }

              // H. Save updated company state
              if (!options.dryRun) {
                const updatedCurrJobs = currentJobs.map((cj) => {
                  const enrichedNew = enrichedNewJobs.find((ej) => ej.id === cj.id);
                  if (enrichedNew) return enrichedNew;
                  const enrichedUpd = enrichedUpdatedJobs.find((ej) => ej.id === cj.id);
                  if (enrichedUpd) return enrichedUpd;
                  return cj;
                });
                await storage.saveCompanyJobs(company.id, updatedCurrJobs);
              }

              // I. Update company statistics
              const duration = Date.now() - compStartTime;
              const nextTotalScrapes = company.total_scrapes + 1;
              const nextAvgResponse = Math.round(
                (company.avg_response_time_ms * company.total_scrapes + duration) / nextTotalScrapes,
              );

              if (!options.dryRun) {
                await storage.updateCompanyScrapeState(company.id, {
                  last_successful_scrape: new Date().toISOString(),
                  last_scraper_used: finalScraperUsed,
                  avg_response_time_ms: nextAvgResponse,
                  total_scrapes: nextTotalScrapes,
                  last_seen_timestamp: new Date().toISOString(),
                  consecutive_failures: 0,
                  api_suspended_until: null,
                });
              }
            } catch (err: any) {
              scraperStatus = 'failed';
              totalFailuresCount++;
              Logger.error(`Scraper execution crashed for company: ${company.name}`, err);

              if (!options.dryRun) {
                const nextConsecutiveFailures = (company.consecutive_failures ?? 0) + 1;
                const nextState: Partial<CompanyConfig> = {
                  last_failed_scrape: new Date().toISOString(),
                  total_failures: company.total_failures + 1,
                  consecutive_failures: nextConsecutiveFailures,
                };

                const isPermanentFailure =
                  err.message.includes('HTTP Error 404') ||
                  err.message.includes('HTTP Error 410') ||
                  err.message.includes('ENOTFOUND') ||
                  err.message.includes('EAI_AGAIN');

                if (isPermanentFailure || nextConsecutiveFailures >= (company.retry_count ?? 3)) {
                  const cooldownMinutes = 120;
                  const suspendedUntil = new Date(Date.now() + cooldownMinutes * 60 * 1000).toISOString();
                  nextState.api_suspended_until = suspendedUntil;
                  Logger.warn(
                    `[${company.name}] Scraper error/circuit breaker tripped: ${err.message}. Suspending scraper for ${cooldownMinutes} minutes.`,
                  );
                }

                await storage.updateCompanyScrapeState(company.id, nextState);
              }
            }

            // Save metrics tracking
            const durationMs = Date.now() - compStartTime;
            companyMetricsList.push({
              id: company.id,
              name: company.name,
              durationMs,
              jobsFound,
              newJobs: newJobsCount,
              failures: scraperStatus === 'failed' ? 1 : 0,
              status: scraperStatus,
            });
          },
        });
      }

      await taskQueue.runAll(5, 500);
      taskQueue.clear();

      if (b < batches.length - 1 && !options.targetCompanyId) {
        Logger.info(`Finished Batch ${b + 1}. Staggering run: waiting 3 minutes before starting Batch ${b + 2}...`);
        const waitMs = process.env.NODE_ENV === 'test' || options.dryRun ? 1 : 3 * 60 * 1000;
        await new Promise((resolve) => setTimeout(resolve, waitMs));
      }
    }

    const isIndiaOrRemoteJob = (job: Job): boolean => {
      const locLower = (job.location || '').toLowerCase();
      const countryLower = (job.country || '').toLowerCase();
      const expLower = (job.experienceLevel || job.experience || '').toLowerCase();
      
      // REJECT if categorized as Senior OR Mid Level (or Lead / Manager / Director / Executive)
      if (
        expLower.includes('mid level') ||
        expLower.includes('senior') ||
        expLower.includes('manager') ||
        expLower.includes('executive') ||
        expLower.includes('director') ||
        expLower.includes('staff') ||
        expLower.includes('principal') ||
        expLower.includes('2–5 years') ||
        expLower.includes('5–8 years') ||
        ExperienceLevelDetector.isSeniorOrAbove(job.title, job.description)
      ) {
        return false;
      }
      
      // Foreign locations to explicitly reject
      const FOREIGN_LOCATIONS = [
        'united states', 'usa', 'us', 'uk', 'united kingdom', 'london', 'beijing', 'china',
        'brazil', 'são paulo', 'sao paulo', 'germany', 'munich', 'berlin', 'tokyo', 'japan',
        'france', 'paris', 'canada', 'toronto', 'vancouver', 'australia', 'sydney', 'singapore',
        'europe', 'latam', 'apac', 'emea', 'netherlands', 'amsterdam', 'ireland', 'dublin',
        'spain', 'madrid', 'italy', 'rome', 'switzerland', 'zurich', 'sweden', 'stockholm',
        'norway', 'oslo', 'denmark', 'copenhagen', 'finland', 'helsinki', 'poland', 'warsaw',
        'belgium', 'brussels', 'austria', 'vienna', 'czech republic', 'prague', 'south korea',
        'seoul', 'taiwan', 'taipei', 'hong kong', 'malaysia', 'kuala lumpur', 'thailand', 'bangkok',
        'vietnam', 'ho chi minh', 'philippines', 'manila', 'indonesia', 'jakarta', 'uae', 'dubai',
        'saudi arabia', 'riyadh', 'israel', 'tel aviv', 'south africa', 'johannesburg', 'egypt', 'cairo',
        'mexico', 'mexico city', 'argentina', 'buenos aires', 'colombia', 'bogota', 'chile', 'santiago',
        'peru', 'lima', 'new zealand', 'auckland'
      ];
      
      // Reject explicit foreign locations
      const isExplicitForeign = FOREIGN_LOCATIONS.some((fLoc) => locLower.includes(fLoc));
      if (isExplicitForeign) {
        return false;
      }
      
      // Reject foreign countries
      const isForeignCountry = !!(
        countryLower && 
        countryLower !== 'india' && 
        countryLower !== 'in' &&
        !/india|in\./i.test(countryLower)
      );
      if (isForeignCountry) {
        return false;
      }
      
      const isRemote = !!(
        job.isRemote ||
        locLower.includes('remote') ||
        locLower.includes('work from home') ||
        locLower.includes('anywhere')
      );

      // For remote jobs, ensure they're not explicitly foreign
      if (isRemote && isExplicitForeign) {
        return false;
      }

      const isIndia = !!(
        countryLower === 'india' ||
        countryLower === 'in' ||
        /india|bangalore|bengaluru|hyderabad|pune|gurugram|gurgaon|noida|mumbai|chennai|kolkata|ahmedabad|delhi|trivandrum|thiruvananthapuram|kochi|cochin/i.test(locLower)
      );

      return isRemote || isIndia;
    };

    // 6. Send Consolidated Alerts (Only India & Remote Jobs in Email)
    const finalAlertList: typeof allMatchesToNotify = [];
    for (const match of allMatchesToNotify) {
      if (!isIndiaOrRemoteJob(match.job)) continue;
      const isSent = await storage.isJobNotified(match.job.jobHash);
      if (!isSent) {
        finalAlertList.push(match);
      }
    }

    const finalUpdatedAlertList: typeof allUpdatedMatchesToNotify = [];
    for (const match of allUpdatedMatchesToNotify) {
      if (!isIndiaOrRemoteJob(match.job)) continue;
      // Always alert on updated details since they changed
      finalUpdatedAlertList.push(match);
    }

    if ((finalAlertList.length > 0 || finalUpdatedAlertList.length > 0 || process.env.NODE_ENV === 'test') && config.features.email && !options.dryRun) {
      Logger.info(
        `Compiling hourly digest notification for ${finalAlertList.length} new matches and ${finalUpdatedAlertList.length} updated matches...`,
      );
      const emailProvider = new EmailNotificationProvider();

      const digest = {
        runTimestamp: new Date().toISOString(),
        totalCompaniesChecked: companies.length,
        totalJobsFound: totalJobsFoundCount,
        totalNewJobs: finalAlertList.length,
        jobs: finalAlertList.map((m) => ({
          companyName: m.job.company,
          title: m.job.title,
          location: m.job.location,
          experience: m.job.experienceLevel || m.job.experience || 'Entry Level',
          experienceLevel: m.job.experienceLevel || m.job.experience || 'Entry Level',
          employmentType: m.job.employmentType,
          datePosted: m.job.datePosted,
          applyUrl: m.job.url,
          jobId: m.job.id,
          matchScore: m.score,
          isRemote: m.job.isRemote,
        })),
        updatedJobs: finalUpdatedAlertList.map((m) => ({
          companyName: m.job.company,
          title: m.job.title,
          location: m.job.location,
          experience: m.job.experienceLevel || m.job.experience || 'Entry Level',
          experienceLevel: m.job.experienceLevel || m.job.experience || 'Entry Level',
          employmentType: m.job.employmentType,
          datePosted: m.job.datePosted,
          applyUrl: m.job.url,
          jobId: m.job.id,
          matchScore: m.score,
          isRemote: m.job.isRemote,
          changes: (m.job as any).changes || [],
        })),
      };

      try {
        await emailProvider.sendDigest(digest);
        
        // Also send to Telegram if configured
        if (config.telegramBotToken && config.telegramChatId) {
          try {
            const telegramProvider = new TelegramNotificationProvider();
            await telegramProvider.sendDigest(digest);
            Logger.info('Telegram digest sent successfully');
          } catch (e: any) {
            Logger.warn('Failed to send Telegram digest (continuing with email notification)', e);
          }
        }
        
        for (const alert of finalAlertList) {
          await storage.saveJobNotified(alert.job.jobHash);
        }
      } catch (e: any) {
        Logger.error('Failed to send notifications', e);
      }
    } else {
      Logger.info(
        `Email notifications skipped. Matches to alert: ${finalAlertList.length + finalUpdatedAlertList.length}. Feature status: ${config.features.email}`,
      );
    }

    // 7. Output Dashboards, Status, CSVs, Reports, and Metrics Exporters
    const totalDurationMs = Date.now() - startTime;
    const globalMetrics: GlobalMetrics = {
      runTimestamp: new Date().toISOString(),
      totalDurationMs,
      companiesChecked: companies.length,
      totalJobs: totalJobsFoundCount,
      totalNewMatches: finalAlertList.length,
      totalFailures: totalFailuresCount,
      companies: companyMetricsList,
    };

    if (config.features.dashboard && !options.dryRun) {
      MetricsExporter.exportPrometheus(globalMetrics);
      MetricsExporter.exportStatus(globalMetrics);

      // Save final stats record to file/DB before generating analytics trends
      await storage.saveRunStats({
        durationMs: totalDurationMs,
        companiesChecked: companies.length,
        jobsScraped: totalJobsFoundCount,
        matchesFound: finalAlertList.length + finalUpdatedAlertList.length,
        failuresCount: totalFailuresCount,
      });

      // Generate Exports & Analytics
      AnalyticsGenerator.generate(globalMetrics);

      const applications = await storage.getApplications();
      DashboardGenerator.generate(globalMetrics, finalAlertList, finalUpdatedAlertList, applications);
      DailyReportGenerator.generate(globalMetrics, finalAlertList, finalUpdatedAlertList);
      WeeklyReportGenerator.generate(globalMetrics, applications, finalAlertList);

      // Generate CSV
      const allMatchedCSV = [
        ...finalAlertList.map((m) => ({ ...m, status: 'New' })),
        ...finalUpdatedAlertList.map((m) => ({ ...m, status: 'Updated' })),
      ];
      const csvJobs = allMatchedCSV.map((m) => ({
        company: m.job.company,
        title: m.job.title,
        location: m.job.location,
        score: m.score,
        status: m.status,
        url: m.job.url,
        datePosted: m.job.datePosted || '',
        dateFound: new Date().toISOString().split('T')[0],
      }));
      CsvExporter.export(csvJobs);

      // Export Applications
      const appCsvHeaders = [
        'JobHash',
        'Company',
        'JobId',
        'Status',
        'AppliedDate',
        'ResumeUsed',
        'Notes',
        'LastUpdated',
      ];
      const appCsvRows = applications.map((a) => [
        a.jobHash,
        `"${a.company.replace(/"/g, '""')}"`,
        a.jobId,
        a.status,
        a.appliedDate || '',
        a.resumeUsed || '',
        `"${(a.notes || '').replace(/"/g, '""')}"`,
        a.lastUpdated,
      ]);
      const appCsvContent = [appCsvHeaders.join(','), ...appCsvRows.map((r) => r.join(','))].join('\n');
      const storageDir = path.join(process.cwd(), 'storage');
      fs.writeFileSync(path.join(storageDir, 'applications.csv'), appCsvContent, 'utf-8');
      fs.writeFileSync(path.join(storageDir, 'applications.json'), JSON.stringify(applications, null, 2), 'utf-8');

      let appMd = '# Tracked Applications\n\n';
      applications.forEach((a) => {
        appMd += `### ${a.company} - Job ID: ${a.jobId}\n`;
        appMd += `- **Status**: ${a.status}\n`;
        appMd += `- **Applied Date**: ${a.appliedDate || 'N/A'}\n`;
        appMd += `- **Resume**: ${a.resumeUsed || 'N/A'}\n`;
        appMd += `- **Notes**: ${a.notes || 'None'}\n`;
        appMd += `- **Last Updated**: ${a.lastUpdated}\n\n`;
      });
      fs.writeFileSync(path.join(storageDir, 'applications.md'), appMd, 'utf-8');

      // Ensure storage directory exists and export run summary
      const summaryPath = path.join(storageDir, 'summary.json');
      const totalNewJobs = globalMetrics.companies.reduce((acc, c) => acc + (c.newJobs ?? 0), 0);
      const runSummary = {
        runTimestamp: globalMetrics.runTimestamp,
        runDurationMs: globalMetrics.totalDurationMs,
        jobsDiscovered: globalMetrics.totalJobs,
        newJobs: totalNewJobs,
        matches: globalMetrics.totalNewMatches + finalUpdatedAlertList.length,
        notifications: globalMetrics.totalNewMatches + finalUpdatedAlertList.length,
        scraperFailures: globalMetrics.totalFailures,
      };
      fs.writeFileSync(summaryPath, JSON.stringify(runSummary, null, 2), 'utf-8');
      Logger.info(`Run summary saved to: ${summaryPath}`);

      // Save execution logs history for the Automation Hub UI
      try {
        const historyPath = path.join(storageDir, 'scrape_history_logs.json');
        let history: any[] = [];
        if (fs.existsSync(historyPath)) {
          try {
            history = JSON.parse(fs.readFileSync(historyPath, 'utf-8'));
          } catch (error) {
            Logger.warn('Failed to parse history file', error as Error);
          }
        }

        const newLogs = globalMetrics.companies.map((c) => ({
          timestamp: globalMetrics.runTimestamp,
          company: c.name,
          status: c.status === 'success' ? 'success' : 'error',
          jobsFound: c.newJobs || 0,
          duration: (c.durationMs / 1000).toFixed(1) + 's',
          errors: c.status === 'success' ? 0 : 1,
          retries: 0,
        }));

        history = [...newLogs, ...history].slice(0, 100);
        fs.writeFileSync(historyPath, JSON.stringify(history, null, 2), 'utf-8');
      } catch (err) {
        Logger.error('Failed to save scrape history logs', err as any);
      }

      await BackupService.triggerAutoBackup(storage);
    }

    const telemetry = Telemetry.getInstance();
    telemetry.recordSchedulerRun();
    telemetry.setSchedulerStatus(totalFailuresCount > 0 ? 'degraded' : 'healthy');
    Logger.info(
      `Job Monitor Platform run completed in ${(totalDurationMs / 1000).toFixed(1)}s. Total matches: ${finalAlertList.length + finalUpdatedAlertList.length}`,
    );
  } finally {
    // 8. Release Advisory Lock
    if (!config.isLocal) {
      try {
        Logger.info('Releasing distributed advisory lock...');
        const supabase = (storage as any).client;
        await supabase.rpc('pg_advisory_unlock', { '': 8675309 });
        Logger.info('Distributed lock released successfully.');
      } catch (e) {
        Logger.warn('Failed to release advisory lock.', { error: e instanceof Error ? e.message : String(e) });
      }
    }
  }
}

// Auto-run if triggered directly
const isMain = process.argv[1] && (process.argv[1].endsWith('index.ts') || process.argv[1].endsWith('index.js'));
if (isMain) {
  runOrchestrator().catch((e) => {
    Logger.critical('Orchestrator encountered uncaught startup crash', e);
    process.exit(1);
  });
}
