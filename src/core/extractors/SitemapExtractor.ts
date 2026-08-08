import * as cheerio from 'cheerio';
import { Extractor, ExtractionContext, ExtractionResult } from '../ExtractionEngine.js';
import { RawJob } from '../../companies/Scraper.js';
import { Logger } from '../Logger.js';
import { BroadcastManager } from '../BroadcastManager.js';

export class SitemapExtractor implements Extractor {
  public name = 'SitemapExtractor';
  public priority = 5; // Run after XML feed checks

  public async canHandle(context: ExtractionContext): Promise<boolean> {
    const { url } = context;
    return url.endsWith('sitemap.xml') || url.includes('/sitemaps');
  }

  public async extract(context: ExtractionContext): Promise<ExtractionResult> {
    const { company, httpClient, url } = context;
    const startTime = Date.now();

    try {
      const response = await httpClient.get<string>(url);
      const xml = response.data;
      const $ = cheerio.load(xml, { xmlMode: true });
      const rawJobs: RawJob[] = [];

      $('url loc, sitemap loc').each((_, elem) => {
        const locUrl = $(elem).text().trim();
        if (!locUrl) return;

        const isJobUrl = /\/jobs?\//i.test(locUrl) || /\/postings?\//i.test(locUrl) || /\/positions?\//i.test(locUrl);
        const hasKeyword = /engineer|developer|sde|backend|frontend|fullstack|data|ai/i.test(locUrl);

        if (isJobUrl && hasKeyword) {
          // Attempt to construct title from URL slug
          const parts = locUrl.split('/');
          const slug = parts[parts.length - 1] || parts[parts.length - 2] || 'Software Engineer';
          const title = slug
            .replace(/[-_]/g, ' ')
            .replace(/\b\w/g, c => c.toUpperCase());

          const jobId = Buffer.from(locUrl).toString('base64').substring(0, 16);

          rawJobs.push({
            company: company.name,
            id: jobId,
            title,
            location: 'Remote',
            url: locUrl,
            source: 'sitemap_extractor'
          });
        }
      });

      if (rawJobs.length > 0) {
        BroadcastManager.incrementExtractorMetric(this.name);
      }

      return {
        success: rawJobs.length > 0,
        extractor: this.name,
        executionTimeMs: Date.now() - startTime,
        jobs: rawJobs,
        warnings: rawJobs.length === 0 ? ['No matching job URLs detected inside sitemap.'] : [],
        metadata: {
          totalLocs: $('loc').length
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
