import { CompanyConfig, RawJob, ScraperPlugin, Job } from '../Scraper.js';
import { HttpClient } from '../../core/HttpClient.js';
import { Logger } from '../../core/Logger.js';
import { JobNormalizer } from '../../core/JobNormalizer.js';

export const metadata = {
  id: 'workable',
  version: '1.0.0',
  ats: 'workable',
  author: 'Job Monitor',
};

export class WorkablePlugin implements ScraperPlugin {
  public metadata = metadata;

  public capabilities = {
    supportsPagination: false,
    supportsIncrementalSync: false,
    supportsJobDescriptions: true,
    supportsRemoteFiltering: false,
  };

  public supports(company: CompanyConfig): boolean {
    return company.detected_ats === 'workable';
  }

  public async discover(company: CompanyConfig, httpClient: HttpClient): Promise<RawJob[]> {
    let companySlug = company.api_endpoint || company.id;
    
    // Extract company slug from various URL formats
    if (companySlug.startsWith('http://') || companySlug.startsWith('https://')) {
      const match = companySlug.match(/apply\.workable\.com\/([^/?#]+)/);
      if (match) {
        companySlug = match[1];
      } else {
        // Try to extract from other patterns
        const urlMatch = companySlug.match(/workable\.com\/([^/?#]+)/);
        if (urlMatch) {
          companySlug = urlMatch[1];
        }
      }
    }

    const url = `https://apply.workable.com/api/v1/accounts/${companySlug}/jobs`;

    Logger.debug(`Workable discovery request for company: ${company.name} [Slug: ${companySlug}]`);
    const response = await httpClient.get<any>(url);

    if (!response.data || !Array.isArray(response.data)) {
      throw new Error(`Unexpected Workable API response structure for ${company.name}`);
    }

    const rawJobs = response.data.map((job: any) => ({
      company: company.name,
      id: String(job.id),
      title: job.title,
      location: job.location?.country && job.location?.city 
        ? `${job.location.city}, ${job.location.country}`
        : job.location?.country || job.location?.state || 'Unknown',
      url: job.url,
      datePosted: job.published_at || job.created_at,
      team: job.department || 'General',
      source: 'workable',
      description: job.description,
      raw: job,
    }));

    return rawJobs;
  }

  public async enrich(rawJob: RawJob, _httpClient: HttpClient): Promise<RawJob> {
    // Workable already fetched full description in discover phase
    return rawJob;
  }

  public normalize(rawJob: RawJob, company: CompanyConfig): Job {
    return JobNormalizer.normalize(rawJob, company);
  }
}
export const plugin = new WorkablePlugin();