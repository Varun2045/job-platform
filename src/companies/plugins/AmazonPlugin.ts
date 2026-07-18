import { CompanyConfig, RawJob, ScraperPlugin, Job } from '../Scraper.js';
import { HttpClient } from '../../core/HttpClient.js';
import { Logger } from '../../core/Logger.js';
import { JobNormalizer } from '../../core/JobNormalizer.js';

export const metadata = {
  id: 'amazon',
  version: '1.0.0',
  ats: 'amazon',
  author: 'Job Monitor',
};

export class AmazonPlugin implements ScraperPlugin {
  public metadata = metadata;

  public capabilities = {
    supportsPagination: true,
    supportsIncrementalSync: false,
    supportsJobDescriptions: true, // Search API returns full description
    supportsRemoteFiltering: true,
  };

  public supports(company: CompanyConfig): boolean {
    return company.detected_ats === 'amazon';
  }

  public async discover(company: CompanyConfig, httpClient: HttpClient): Promise<RawJob[]> {
    // Amazon Search API sorting by recent
    const url = 'https://www.amazon.jobs/en/search.json?loc_query=India&result_limit=100&sort=recent';

    Logger.debug(`Amazon Jobs API request: ${url}`);
    const response = await httpClient.get<any>(url);

    if (!response.data || !Array.isArray(response.data.jobs)) {
      throw new Error(`Unexpected Amazon Jobs API response format for ${company.name}`);
    }

    Logger.debug(`Amazon API returned ${response.data.jobs.length} jobs for India`);

    const rawJobs = response.data.jobs.map((job: any) => {
      const jobUrl = `https://www.amazon.jobs${job.job_path}`;
      const location = `${job.city ?? ''}, ${job.state ?? ''}, India`.replace(/^[,\s]+|[,\s]+$/g, '');

      return {
        company: company.name,
        id: String(job.id_icims ?? job.id),
        title: job.title,
        location: location || 'India',
        country: 'India',
        url: jobUrl,
        datePosted: job.posted_date ? new Date(job.posted_date).toISOString() : undefined,
        team: job.job_category ?? 'Software Development',
        employmentType: job.schedule ?? 'Full-time',
        source: 'amazon',
        description: job.description ?? job.description_short ?? '',
        raw: job,
      };
    });

    return rawJobs;
  }

  public async enrich(rawJob: RawJob, _httpClient: HttpClient): Promise<RawJob> {
    // Amazon search API already returns descriptions in search JSON
    return rawJob;
  }

  public normalize(rawJob: RawJob, company: CompanyConfig): Job {
    return JobNormalizer.normalize(rawJob, company);
  }
}
export const plugin = new AmazonPlugin();
