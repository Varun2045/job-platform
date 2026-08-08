import * as cheerio from 'cheerio';
import { Extractor, ExtractionContext, ExtractionResult } from '../ExtractionEngine.js';
import { RawJob } from '../../companies/Scraper.js';
import { Logger } from '../Logger.js';
import { BroadcastManager } from '../BroadcastManager.js';

export class SitemapExtractor implements Extractor {
  public name = 'SitemapExtractor';
  public priority = 5; // Run after XML feed checks

  public async canHandle(context: ExtractionContext): Promise<boolean> {
    const { url, company } = context;
    return !!company.sitemap_url || url.endsWith('sitemap.xml') || url.includes('/sitemaps') || url.includes('robots.txt');
  }

  public async extract(context: ExtractionContext): Promise<ExtractionResult> {
    const { company, httpClient } = context;
    let { url } = context;
    const startTime = Date.now();

    try {
      // Category 1: XML Sitemaps discovery via robots.txt
      if (url.includes('robots.txt')) {
        const robotsRes = await httpClient.get<string>(url);
        const sitemapMatch = robotsRes.data.match(/Sitemap:\s*(https?:\/\/\S+)/i);
        if (sitemapMatch && sitemapMatch[1]) {
          url = sitemapMatch[1];
          Logger.info(`[SitemapExtractor] Discovered sitemap via robots.txt: ${url}`);
        } else {
          // Fallback to common location
          const domain = new URL(url).origin;
          url = `${domain}/sitemap.xml`;
        }
      }

      const response = await httpClient.get<string>(url);
      const xml = response.data;
      
      // If it's a sitemap index, we should ideally recurse, but for now let's just parse it
      const $ = cheerio.load(xml, { xmlMode: true });
      const rawJobs: RawJob[] = [];

      // Category 1: Programmatic parsing of sitemaps
      $('url loc, sitemap loc').each((_, elem) => {
        const locUrl = $(elem).text().trim();
        if (!locUrl) return;

        // Broaden detection for job URLs
        const isJobUrl = /\/jobs?\//i.test(locUrl) || 
                         /\/postings?\//i.test(locUrl) || 
                         /\/positions?\//i.test(locUrl) ||
                         /\/careers?\//i.test(locUrl) ||
                         /career/i.test(locUrl) && locUrl.endsWith('.html');

        const hasKeyword = /engineer|developer|sde|backend|frontend|fullstack|data|ai|software|architect/i.test(locUrl);

        if (isJobUrl && hasKeyword) {
          const parts = locUrl.split('/').filter(p => p);
          const slug = parts[parts.length - 1] || 'Job Opportunity';
          const title = slug
            .split(/[?#]/)[0] // remove query params
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
