import { CompanyConfig, RawJob, ScraperPlugin, Job } from '../Scraper.js';
import { HttpClient } from '../../core/HttpClient.js';
import { Logger } from '../../core/Logger.js';
import { JobNormalizer } from '../../core/JobNormalizer.js';

export const metadata = {
  id: 'bamboohr',
  version: '1.0.0',
  ats: 'bamboohr',
  author: 'Job Monitor',
};

export class BambooHRPlugin implements ScraperPlugin {
  public metadata = metadata;

  public capabilities = {
    supportsPagination: false,
    supportsIncrementalSync: false,
    supportsJobDescriptions: true,
    supportsRemoteFiltering: false,
  };

  public supports(company: CompanyConfig): boolean {
    return company.detected_ats === 'bamboohr';
  }

  public async discover(company: CompanyConfig, httpClient: HttpClient): Promise<RawJob[]> {
    let companySlug = company.api_endpoint || company.id;
    
    // Extract company slug from BambooHR URLs
    if (companySlug.startsWith('http://') || companySlug.startsWith('https://')) {
      const match = companySlug.match(/\.bamboohr\.com\/careers\/?/);
      if (match) {
        // Extract subdomain
        const subdomainMatch = companySlug.match(/:\/\/([^.]+)\.bamboohr\.com/);
        if (subdomainMatch) {
          companySlug = subdomainMatch[1];
        }
      }
    }

    // BambooHR API endpoint pattern
    const url = `https://${companySlug}.bamboohr.com/careers/list`;

    Logger.debug(`BambooHR discovery request for company: ${company.name} [Slug: ${companySlug}]`);
    
    try {
      const response = await httpClient.get<any>(url);

      if (!response.data || !Array.isArray(response.data.jobs || response.data)) {
        throw new Error(`Unexpected BambooHR API response structure for ${company.name}`);
      }

      const jobs = response.data.jobs || response.data;
      
      const rawJobs = jobs.map((job: any) => ({
        company: company.name,
        id: String(job.id || job.jobId),
        title: job.title || job.Title,
        location: job.location || job.Location || 'Unknown',
        url: job.url || job.applyUrl || `https://${companySlug}.bamboohr.com/careers/${job.id}`,
        datePosted: job.postedDate || job.PostedDate || new Date().toISOString(),
        team: job.department || job.Department || 'General',
        source: 'bamboohr',
        description: job.description || job.Description,
        raw: job,
      }));

      return rawJobs;
    } catch (error) {
      Logger.warn(`BambooHR API request failed for ${company.name}, falling back to generic scraping`);
      return [];
    }
  }

  public async enrich(rawJob: RawJob, _httpClient: HttpClient): Promise<RawJob> {
    // BambooHR already fetched full description in discover phase
    return rawJob;
  }

  public normalize(rawJob: RawJob, company: CompanyConfig): Job {
    return JobNormalizer.normalize(rawJob, company);
  }
}
export const plugin = new BambooHRPlugin();