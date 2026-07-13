import { CompanyConfig, RawJob, ScraperPlugin, Job } from '../Scraper.js';
import { HttpClient } from '../../core/HttpClient.js';
import { Logger } from '../../core/Logger.js';
import { JobNormalizer } from '../../core/JobNormalizer.js';

export const metadata = {
  id: 'meta',
  version: '1.0.0',
  ats: 'meta',
  author: 'Job Monitor'
};

export class MetaPlugin implements ScraperPlugin {
  public metadata = metadata;
  
  public capabilities = {
    supportsPagination: true,
    supportsIncrementalSync: false,
    supportsJobDescriptions: true, // List endpoint has descriptions
    supportsRemoteFiltering: true
  };

  public supports(company: CompanyConfig): boolean {
    return company.detected_ats === 'meta';
  }

  public async discover(company: CompanyConfig, httpClient: HttpClient): Promise<RawJob[]> {
    // Meta Careers endpoint
    const url = 'https://www.metacareers.com/api/v1/jobs/';
    
    // Search payload for India
    const payload = {
      q: '',
      locations: ['Bangalore, India', 'Gurgaon, India', 'Hyderabad, India', 'Mumbai, India', 'India'],
      limit: 100
    };

    Logger.debug(`Meta Careers API POST request: ${url}`);
    
    try {
      const response = await httpClient.post<any>(url, payload);
      
      if (!response.data || !Array.isArray(response.data.jobs)) {
        throw new Error(`Unexpected Meta API response structure for ${company.name}`);
      }

      Logger.debug(`Meta API returned ${response.data.jobs.length} jobs`);

      const rawJobs = response.data.jobs.map((job: any) => {
        const jobId = job.id;
        const jobUrl = `https://www.metacareers.com/jobs/${jobId}`;

        return {
          company: company.name,
          id: String(jobId),
          title: job.title,
          location: job.location ?? 'India',
          country: 'India',
          url: jobUrl,
          datePosted: job.publish_date,
          team: job.sub_department ?? job.department ?? 'Engineering',
          source: 'meta',
          description: job.description ?? job.requirements ?? '', // Meta returns full desc
          raw: job
        };
      });

      return rawJobs;
    } catch (err: any) {
      Logger.error(`Meta API failed, falling back to page scraper: ${err.message}`);
      // Throw error so retry hierarchy will fallback to PlaywrightScraper
      throw err;
    }
  }

  public async enrich(rawJob: RawJob, httpClient: HttpClient): Promise<RawJob> {
    return rawJob;
  }

  public normalize(rawJob: RawJob, company: CompanyConfig): Job {
    return JobNormalizer.normalize(rawJob, company);
  }
}
export const plugin = new MetaPlugin();
