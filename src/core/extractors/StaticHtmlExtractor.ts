import * as cheerio from 'cheerio';
import { Extractor, ExtractionContext, ExtractionResult } from '../ExtractionEngine.js';
import { RawJob } from '../../companies/Scraper.js';
import { Logger } from '../Logger.js';
import { BroadcastManager } from '../BroadcastManager.js';

export class StaticHtmlExtractor implements Extractor {
  public name = 'StaticHtmlExtractor';
  public priority = 3; // Static HTML runs after API checking

  public async canHandle(context: ExtractionContext): Promise<boolean> {
    // Standard HTML sites
    return context.url.startsWith('http');
  }

  public async extract(context: ExtractionContext): Promise<ExtractionResult> {
    const { company, httpClient, url } = context;
    const startTime = Date.now();

    try {
      const response = await httpClient.get<string>(url);
      const html = response.data;
      const $ = cheerio.load(html);
      const rawJobs: RawJob[] = [];

      const jobLinkPatterns = [/\/jobs?\//i, /\/postings?\//i, /\/careers?\//i, /\/positions?\//i, /detail/i];

      $('a').each((_, elem) => {
        const href = $(elem).attr('href');
        const text = $(elem).text().trim();

        if (!href || !text || text.length < 5 || text.length > 100) return;

        const isJobLink = jobLinkPatterns.some(pattern => pattern.test(href));
        const hasSoftwareKeyword = /engineer|developer|sde|backend|frontend|fullstack|programmer|technologist|data/i.test(text);

        if (isJobLink && hasSoftwareKeyword) {
          let resolvedUrl = href;
          if (href.startsWith('/')) {
            try {
              const parsedUrl = new URL(url);
              resolvedUrl = `${parsedUrl.protocol}//${parsedUrl.host}${href}`;
            } catch {}
          }

          const jobId = Buffer.from(resolvedUrl).toString('base64').substring(0, 16);

          rawJobs.push({
            company: company.name,
            id: jobId,
            title: text,
            location: 'India', // fallback default
            url: resolvedUrl,
            source: 'static_html_extractor',
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
        warnings: rawJobs.length === 0 ? ['No jobs matched keywords in static HTML.'] : [],
        metadata: {
          totalLinksChecked: $('a').length
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
