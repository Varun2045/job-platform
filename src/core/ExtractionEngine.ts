import { CompanyConfig, RawJob } from '../companies/Scraper.js';
import { HttpClient } from './HttpClient.js';
import { Logger } from './Logger.js';

export interface ExtractionContext {
  company: CompanyConfig;
  httpClient: HttpClient;
  url: string;
}

export interface ExtractionResult {
  success: boolean;
  extractor: string;
  executionTimeMs: number;
  jobs: RawJob[];
  warnings: string[];
  metadata: Record<string, any>;
  error?: string;
  unchanged?: boolean;
}

export interface Extractor {
  name: string;
  priority: number;
  canHandle(context: ExtractionContext): Promise<boolean>;
  extract(context: ExtractionContext): Promise<ExtractionResult>;
}

import { ApiExtractor } from './extractors/ApiExtractor.js';
import { JsonLdExtractor } from './extractors/JsonLdExtractor.js';
import { StaticHtmlExtractor } from './extractors/StaticHtmlExtractor.js';
import { RSSExtractor } from './extractors/RSSExtractor.js';
import { SitemapExtractor } from './extractors/SitemapExtractor.js';
import { PlaywrightExtractor } from './extractors/PlaywrightExtractor.js';
import { AntiBotExtractor } from './extractors/AntiBotExtractor.js';
import { ExtractorRegistry } from './ExtractorRegistry.js';

export class ExtractionEngine {
  private static extractors: Extractor[] = [];

  static {
    this.registerExtractor(new ApiExtractor());
    this.registerExtractor(new JsonLdExtractor());
    this.registerExtractor(new StaticHtmlExtractor());
    this.registerExtractor(new RSSExtractor());
    this.registerExtractor(new SitemapExtractor());
    this.registerExtractor(new PlaywrightExtractor());
    this.registerExtractor(new AntiBotExtractor());
  }

  public static registerExtractor(extractor: Extractor): void {
    this.extractors.push(extractor);
    this.extractors.sort((a, b) => a.priority - b.priority); // Ascending priority (1 is highest)
  }

  public static getRegisteredExtractors(): Extractor[] {
    return this.extractors;
  }

  /**
   * Automatically executes the optimal extraction pipeline chain.
   */
  public static async extract(company: CompanyConfig, httpClient: HttpClient): Promise<ExtractionResult> {
    const startTime = Date.now();
    let url = company.api_endpoint || `https://www.${company.id}.com/careers`;

    // Handle ATS URL mappings
    if (company.detected_ats === 'greenhouse' && company.api_endpoint && !company.api_endpoint.startsWith('http')) {
      url = `https://boards.greenhouse.io/${company.api_endpoint}`;
    } else if (company.detected_ats === 'lever' && company.api_endpoint && !company.api_endpoint.startsWith('http')) {
      url = `https://jobs.lever.co/${company.api_endpoint}`;
    } else if (company.detected_ats === 'ashby' && company.api_endpoint && !company.api_endpoint.startsWith('http')) {
      url = `https://jobs.ashbyhq.com/${company.api_endpoint}`;
    }

    const context: ExtractionContext = { company, httpClient, url };
    const warnings: string[] = [];

    Logger.info(`[ExtractionEngine] Processing extraction pipeline for: ${company.name} (ATS: ${company.detected_ats || 'custom'})`);

    // Step 2: Dynamic Strategy Ordering
    const history = ExtractorRegistry.getHistory(company.id);
    const pipeline = [...this.extractors];

    if (history && Object.keys(history.stats).length > 0) {
      pipeline.sort((a, b) => {
        const statsA = history.stats[a.name];
        const statsB = history.stats[b.name];
        
        // Base baseline confidence by priority mapping
        const confA = statsA ? statsA.confidence : (100 - a.priority * 10);
        const confB = statsB ? statsB.confidence : (100 - b.priority * 10);
        
        return confB - confA; // descending order
      });
    }

    let shouldSkipHttpStrategies = false;
    let botVendor = 'none';

    for (const extractor of pipeline) {
      // Step 4: Intelligent Failure Recovery Skipping
      if (shouldSkipHttpStrategies && extractor.name !== 'PlaywrightExtractor' && extractor.name !== 'AntiBotExtractor') {
        Logger.info(`[ExtractionEngine] Skipping HTTP strategy ${extractor.name} due to active ${botVendor} block.`);
        continue;
      }

      const strategyStart = Date.now();
      try {
        const canHandle = await extractor.canHandle(context);
        if (canHandle) {
          Logger.info(`[ExtractionEngine] Extractor matched: ${extractor.name} for ${company.name}`);
          const res = await extractor.extract(context);
          const duration = Date.now() - strategyStart;

          // Step 3: Learning Mode (Successful run feedback)
          if (res.success || res.unchanged) {
            ExtractorRegistry.recordRun(company.id, extractor.name, true, duration, res.jobs.length);
            res.executionTimeMs = Date.now() - startTime;
            return res;
          }

          const errorMsg = res.error || 'Strategy returned 0 jobs';
          warnings.push(`${extractor.name} warning: ${errorMsg}`);
          
          // Step 3: Learning Mode (Failed/unsuccessful run feedback)
          ExtractorRegistry.recordRun(company.id, extractor.name, false, duration, 0, errorMsg);

          // Step 4: Detect Bot Block inside result warning
          const botKeywords = /cloudflare|akamai|datadome|perimeterx|fastly|captcha|blocked|forbidden|access denied|permission denied/i;
          if (botKeywords.test(errorMsg)) {
            shouldSkipHttpStrategies = true;
            botVendor = 'firewall';
            Logger.warn(`[ExtractionEngine] Detected active bot block during ${extractor.name} strategy. Initiating fallback acceleration.`);
          }
        }
      } catch (err: any) {
        const duration = Date.now() - strategyStart;
        Logger.warn(`[ExtractionEngine] Strategy ${extractor.name} failed for ${company.name}: ${err.message}`);
        warnings.push(`${extractor.name} crashed: ${err.message}`);

        // Step 3: Learning Mode (Crashed run feedback)
        ExtractorRegistry.recordRun(company.id, extractor.name, false, duration, 0, err.message);

        // Step 4: Detect Bot Block inside crash message
        const botKeywords = /cloudflare|akamai|datadome|perimeterx|fastly|captcha|blocked|forbidden|access denied|permission denied/i;
        if (botKeywords.test(err.message)) {
          shouldSkipHttpStrategies = true;
          botVendor = 'firewall';
          Logger.warn(`[ExtractionEngine] Detected active bot block (crash) in ${extractor.name}. Initiating fallback acceleration.`);
        }
      }
    }

    // Pipeline exhausted
    return {
      success: false,
      extractor: 'none',
      executionTimeMs: Date.now() - startTime,
      jobs: [],
      warnings,
      metadata: {},
      error: 'All extraction strategies in the fallback pipeline were exhausted.'
    };
  }
}
