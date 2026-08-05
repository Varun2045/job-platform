import { CompanyConfig, RawJob, ScraperPlugin, Job } from '../Scraper.js';
import { HttpClient } from '../../core/HttpClient.js';
import { Logger } from '../../core/Logger.js';
import { JobNormalizer } from '../../core/JobNormalizer.js';

export const metadata = {
  id: 'oraclecloud',
  version: '1.0.0',
  ats: 'oraclecloud',
  author: 'Job Monitor',
};

export class OracleCloudPlugin implements ScraperPlugin {
  public metadata = metadata;

  public capabilities = {
    supportsPagination: false,
    supportsIncrementalSync: false,
    supportsJobDescriptions: true,
    supportsRemoteFiltering: false,
  };

  public supports(company: CompanyConfig): boolean {
    return company.detected_ats === 'oraclecloud';
  }

  public async discover(company: CompanyConfig, httpClient: HttpClient): Promise<RawJob[]> {
    let companyContext = company.api_endpoint || company.id;
    
    // Extract context from Oracle Cloud URLs
    if (companyContext.startsWith('http://') || companyContext.startsWith('https://')) {
      const match = companyContext.match(/fa\.oraclecloud\.com\/hcmUI\/CandidateExperience\/en\/sites\/([^/]+)/);
      if (match) {
        companyContext = match[1];
      } else {
        // Try alternative pattern
        const altMatch = companyContext.match(/oraclecloud\.com\/([^/?#]+)/);
        if (altMatch) {
          companyContext = altMatch[1];
        }
      }
    }

    // Oracle Cloud API endpoint pattern
    const url = `https://fa.{companyContext}.oraclecloud.com/hcmUI/api/Employee/Candidate/${companyContext}/jobs`;

    Logger.debug(`Oracle Cloud discovery request for company: ${company.name} [Context: ${companyContext}]`);
    
    try {
      const response = await httpClient.get<any>(url);

      if (!response.data || !Array.isArray(response.data.items || response.data)) {
        throw new Error(`Unexpected Oracle Cloud API response structure for ${company.name}`);
      }

      const jobs = response.data.items || response.data;
      
      const rawJobs = jobs.map((job: any) => ({
        company: company.name,
        id: String(job.Id || job.jobId),
        title: job.Title || job.title,
        location: job.Location || job.location || 'Unknown',
        url: job.DescriptionUrl || job.url || `${company.api_endpoint}`,
        datePosted: job.PostedDate || job.postedDate || new Date().toISOString(),
        team: job.Department || job.department || 'General',
        source: 'oraclecloud',
        description: job.Description || job.description,
        raw: job,
      }));

      return rawJobs;
    } catch (error) {
      Logger.warn(`Oracle Cloud API request failed for ${company.name}, falling back to generic scraping`);
      // Return empty array - the fallback scraper will handle this
      return [];
    }
  }

  public async enrich(rawJob: RawJob, _httpClient: HttpClient): Promise<RawJob> {
    // Oracle Cloud already fetched full description in discover phase
    return rawJob;
  }

  public normalize(rawJob: RawJob, company: CompanyConfig): Job {
    return JobNormalizer.normalize(rawJob, company);
  }
}
export const plugin = new OracleCloudPlugin();