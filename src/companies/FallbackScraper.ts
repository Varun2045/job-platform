import { CompanyConfig, RawJob } from './Scraper.js';
import { HttpClient } from '../core/HttpClient.js';
import { Logger } from '../core/Logger.js';
import * as cheerio from 'cheerio';

export class FallbackScraper {
  public async discover(company: CompanyConfig, httpClient: HttpClient): Promise<RawJob[]> {
    let url = company.api_endpoint || company.last_scraper_used || `https://www.${company.id}.com/careers`;
    if (company.detected_ats === 'greenhouse' && company.api_endpoint && !company.api_endpoint.startsWith('http')) {
      url = `https://boards.greenhouse.io/${company.api_endpoint}`;
    } else if (company.detected_ats === 'lever' && company.api_endpoint && !company.api_endpoint.startsWith('http')) {
      url = `https://jobs.lever.co/${company.api_endpoint}`;
    }
    Logger.debug(`Fallback Cheerio HTML scraping for ${company.name} at URL: ${url}`);

    const response = await httpClient.get<string>(url);
    const $ = cheerio.load(response.data);
    const rawJobs: RawJob[] = [];

    // Heuristics to find job links in static HTML
    const jobLinkPatterns = [/\/jobs?\//i, /\/postings?\//i, /\/careers?\//i, /\/positions?\//i, /detail/i];

    $('a').each((_, elem) => {
      const href = $(elem).attr('href');
      const text = $(elem).text().trim();

      if (!href || !text || text.length < 5 || text.length > 100) return;

      const isJobLink = jobLinkPatterns.some((pattern) => pattern.test(href));
      const hasSoftwareKeyword = /engineer|developer|sde|backend|frontend|fullstack|programmer|technologist|data/i.test(
        text,
      );

      if (isJobLink && hasSoftwareKeyword) {
        // Resolve absolute URL
        let resolvedUrl = href;
        if (href.startsWith('/')) {
          try {
            const parsedUrl = new URL(url);
            resolvedUrl = `${parsedUrl.protocol}//${parsedUrl.host}${href}`;
          } catch {
            // Ignore
          }
        }

        const jobId = Buffer.from(resolvedUrl).toString('base64').substring(0, 16); // stable dummy ID

        rawJobs.push({
          company: company.name,
          id: jobId,
          title: text,
          location: 'India', // fallback assumption
          url: resolvedUrl,
          source: 'cheerio_fallback',
        });
      }
    });

    Logger.info(`Cheerio fallback scraped ${rawJobs.length} potential jobs for ${company.name}`);
    return rawJobs;
  }

  public async enrich(rawJob: RawJob, httpClient: HttpClient): Promise<RawJob> {
    try {
      const response = await httpClient.get<string>(rawJob.url);
      const $ = cheerio.load(response.data);

      // Remove scripts, styles and metadata
      $('script, style, nav, footer, header').remove();
      rawJob.description = $('body').text().trim().replace(/\s+/g, ' ');
    } catch (e: any) {
      Logger.warn(`Failed to enrich fallback job description for ${rawJob.id}: ${e.message}`);
    }
    return rawJob;
  }
}
