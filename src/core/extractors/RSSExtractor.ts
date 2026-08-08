import * as cheerio from 'cheerio';
import { Extractor, ExtractionContext, ExtractionResult } from '../ExtractionEngine.js';
import { RawJob } from '../../companies/Scraper.js';
import { Logger } from '../Logger.js';
import { BroadcastManager } from '../BroadcastManager.js';

export class RSSExtractor implements Extractor {
  public name = 'RSSExtractor';
  public priority = 4; // Priority 4 (after Structured Schema checks)

  public async canHandle(context: ExtractionContext): Promise<boolean> {
    const { url } = context;
    return (
      url.endsWith('.xml') ||
      url.includes('/feed') ||
      url.includes('/rss') ||
      url.includes('/atom')
    );
  }

  public async extract(context: ExtractionContext): Promise<ExtractionResult> {
    const { company, httpClient, url } = context;
    const startTime = Date.now();

    try {
      const response = await httpClient.get<string>(url);
      const xml = response.data;
      const $ = cheerio.load(xml, { xmlMode: true });
      const rawJobs: RawJob[] = [];

      // Check RSS item elements
      $('item').each((_, elem) => {
        const title = $(elem).find('title').text().trim();
        const link = $(elem).find('link').text().trim();
        const description = $(elem).find('description').text().trim();
        const pubDate = $(elem).find('pubDate').text().trim();
        const guid = $(elem).find('guid').text().trim() || link;

        if (title && link) {
          rawJobs.push({
            company: company.name,
            id: guid,
            title,
            location: 'Remote',
            url: link,
            source: 'rss_feed_extractor',
            description,
            datePosted: pubDate || undefined
          });
        }
      });

      // Check Atom entry elements
      if (rawJobs.length === 0) {
        $('entry').each((_, elem) => {
          const title = $(elem).find('title').text().trim();
          const link = $(elem).find('link').attr('href') || $(elem).find('link').text().trim();
          const content = $(elem).find('content').text().trim() || $(elem).find('summary').text().trim();
          const updated = $(elem).find('updated').text().trim();
          const id = $(elem).find('id').text().trim() || link;

          if (title && link) {
            rawJobs.push({
              company: company.name,
              id,
              title,
              location: 'Remote',
              url: link,
              source: 'atom_feed_extractor',
              description: content,
              datePosted: updated || undefined
            });
          }
        });
      }

      if (rawJobs.length > 0) {
        BroadcastManager.incrementExtractorMetric(this.name);
      }

      return {
        success: rawJobs.length > 0,
        extractor: this.name,
        executionTimeMs: Date.now() - startTime,
        jobs: rawJobs,
        warnings: rawJobs.length === 0 ? ['No feed items or entries detected.'] : [],
        metadata: {
          feedType: $('item').length > 0 ? 'RSS' : $('entry').length > 0 ? 'Atom' : 'XML'
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
