import { CompanyConfig, RawJob, ScraperPlugin, Job } from '../Scraper.js';
import { HttpClient } from '../../core/HttpClient.js';
import { Logger } from '../../core/Logger.js';
import { JobNormalizer } from '../../core/JobNormalizer.js';
import * as cheerio from 'cheerio';

export const metadata = {
  id: 'google',
  version: '1.0.1',
  ats: 'google',
  author: 'Job Monitor',
};

export class GooglePlugin implements ScraperPlugin {
  public metadata = metadata;

  public capabilities = {
    supportsPagination: true,
    supportsIncrementalSync: false,
    supportsJobDescriptions: true,
    supportsRemoteFiltering: true,
  };

  public supports(company: CompanyConfig): boolean {
    return company.detected_ats === 'google';
  }

  public async discover(company: CompanyConfig, httpClient: HttpClient): Promise<RawJob[]> {
    const url =
      company.api_endpoint ||
      'https://www.google.com/about/careers/applications/jobs/results/?location=India&limit=100';

    Logger.debug(`Google Careers HTML request: ${url}`);
    const response = await httpClient.get<string>(url);
    const $ = cheerio.load(response.data);

    let jobsList: any[] = [];
    $('script').each((_, el) => {
      const html = $(el).html() ?? '';
      if (html.includes("key: 'ds:1'") || html.includes('key:"ds:1"')) {
        try {
          const AF_initDataCallback = (obj: any) => {
            if (obj.key === 'ds:1' && Array.isArray(obj.data) && Array.isArray(obj.data[0])) {
              jobsList = obj.data[0];
            }
          };
          const fn = new Function('AF_initDataCallback', html);
          fn(AF_initDataCallback);
        } catch {
          // ignore
        }
      }
    });

    if (jobsList.length === 0) {
      throw new Error(`Could not find any jobs in Google Careers HTML response for ${company.name}`);
    }

    Logger.debug(`Google parsed ${jobsList.length} jobs from page data`);

    const rawJobs = jobsList.map((job: any) => {
      const jobId = String(job[0]);
      const jobUrl = `https://careers.google.com/jobs/results/${jobId}`;
      const locationsList = Array.isArray(job[12]) ? job[12].map((loc: any) => loc[0]).join(', ') : 'India';

      const description = [job[13]?.[1] ?? '', job[5]?.[1] ?? '', job[6]?.[1] ?? ''].filter(Boolean).join('\n');

      const dateVal =
        Array.isArray(job[16]) && typeof job[16][0] === 'number'
          ? new Date(job[16][0] * 1000).toISOString()
          : new Date().toISOString();

      return {
        company: company.name,
        id: jobId,
        title: job[1] ?? 'Software Engineer',
        location: locationsList,
        country: 'India',
        url: jobUrl,
        datePosted: dateVal,
        team: 'Engineering',
        source: 'google',
        description: description,
        raw: job,
      };
    });

    return rawJobs;
  }

  public async enrich(rawJob: RawJob, _httpClient: HttpClient): Promise<RawJob> {
    return rawJob;
  }

  public normalize(rawJob: RawJob, company: CompanyConfig): Job {
    return JobNormalizer.normalize(rawJob, company);
  }
}
export const plugin = new GooglePlugin();
