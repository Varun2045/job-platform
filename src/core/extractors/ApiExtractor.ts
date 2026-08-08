import { Extractor, ExtractionContext, ExtractionResult } from '../ExtractionEngine.js';
import { ScraperRegistry } from '../../companies/ScraperRegistry.js';
import { Logger } from '../Logger.js';
import { BroadcastManager } from '../BroadcastManager.js';

export class ApiExtractor implements Extractor {
  public name = 'ApiExtractor';
  public priority = 1;

  public async canHandle(context: ExtractionContext): Promise<boolean> {
    const { company } = context;
    // Supported if we have a matching registry plugin or detected ATS with known API format
    return (
      !!company.detected_ats &&
      company.detected_ats !== 'custom' &&
      company.detected_ats !== 'fallback'
    );
  }

  public async extract(context: ExtractionContext): Promise<ExtractionResult> {
    const { company, httpClient } = context;
    const startTime = Date.now();

    // 1. Self-healing URL transformation for Workday APIs
    if (company.detected_ats === 'workday' && company.api_endpoint) {
      let url = company.api_endpoint;
      if (!url.includes('/wday/cxs/')) {
        const match = url.match(/https:\/\/([a-z0-9-]+)\.myworkdayjobs\.com\/([a-z0-9-_]+)/i);
        if (match) {
          const subdomain = match[1];
          const tenant = subdomain.split('.')[0];
          const subpath = match[2];
          company.api_endpoint = `https://${subdomain}.myworkdayjobs.com/wday/cxs/${tenant}/${subpath}`;
          Logger.info(`[ApiExtractor] Self-healed Workday URL for ${company.name}: ${url} -> ${company.api_endpoint}`);
        }
      }
    }

    const plugin = ScraperRegistry.getPlugin(company);
    if (!plugin) {
      return {
        success: false,
        extractor: this.name,
        executionTimeMs: Date.now() - startTime,
        jobs: [],
        warnings: [`No registered plugin found for ATS: ${company.detected_ats}`],
        metadata: {},
        error: `Plugin not found for ATS: ${company.detected_ats}`
      };
    }

    try {
      const jobs = await plugin.discover(company, httpClient);
      BroadcastManager.incrementExtractorMetric(this.name);
      return {
        success: true,
        extractor: this.name,
        executionTimeMs: Date.now() - startTime,
        jobs,
        warnings: [],
        metadata: {
          pluginVersion: plugin.metadata.version,
          ats: plugin.metadata.ats
        }
      };
    } catch (err: any) {
      return {
        success: false,
        extractor: this.name,
        executionTimeMs: Date.now() - startTime,
        jobs: [],
        warnings: [err.message],
        metadata: {},
        error: err.message
      };
    }
  }
}
