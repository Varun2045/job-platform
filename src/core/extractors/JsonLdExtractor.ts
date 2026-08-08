import * as cheerio from 'cheerio';
import { Extractor, ExtractionContext, ExtractionResult } from '../ExtractionEngine.js';
import { RawJob } from '../../companies/Scraper.js';
import { Logger } from '../Logger.js';
import { BroadcastManager } from '../BroadcastManager.js';

export class JsonLdExtractor implements Extractor {
  public name = 'JsonLdExtractor';
  public priority = 2; // Run before HTML link crawling because structured data is highly reliable

  public async canHandle(context: ExtractionContext): Promise<boolean> {
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

      $('script[type="application/ld+json"]').each((_, elem) => {
        try {
          const content = $(elem).html();
          if (!content) return;

          const json = JSON.parse(content);
          const processObject = (obj: any) => {
            if (!obj) return;

            if (obj['@type'] === 'JobPosting') {
              const title = obj.title || obj.name;
              const jobUrl = obj.url || url;

              if (title) {
                const jobId = obj.identifier?.value || Buffer.from(jobUrl).toString('base64').substring(0, 16);
                const location = obj.jobLocation?.address?.addressLocality ?? obj.jobLocation?.address?.addressCountry ?? 'Remote';

                rawJobs.push({
                  company: company.name,
                  id: String(jobId),
                  title: String(title),
                  location: String(location),
                  url: String(jobUrl),
                  source: 'json_ld_extractor',
                  description: obj.description || undefined,
                  datePosted: obj.datePosted || undefined,
                  employmentType: obj.employmentType || undefined,
                  isRemote: obj.jobLocationType === 'TELECOMMUTE' || String(location).toLowerCase().includes('remote'),
                  raw: obj
                });
              }
            } else if (Array.isArray(obj)) {
              obj.forEach(processObject);
            } else if (obj['@graph'] && Array.isArray(obj['@graph'])) {
              obj['@graph'].forEach(processObject);
            }
          };

          processObject(json);
        } catch (err: any) {
          Logger.debug(`[JsonLdExtractor] Error parsing script block: ${err.message}`);
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
        warnings: rawJobs.length === 0 ? ['No JSON-LD JobPosting schema detected.'] : [],
        metadata: {
          blocksParsed: $('script[type="application/ld+json"]').length
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
