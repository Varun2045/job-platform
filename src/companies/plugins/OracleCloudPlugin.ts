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
    let baseUrl = 'https://fa.oraclecloud.com';
    let site = companyContext;

    if (companyContext.startsWith('http://') || companyContext.startsWith('https://')) {
      try {
        const urlObj = new URL(companyContext);
        baseUrl = `${urlObj.protocol}//${urlObj.host}`;
        const match = urlObj.pathname.match(/CandidateExperience\/en\/sites\/([^/]+)/);
        if (match) {
          site = match[1];
        } else {
          const altMatch = urlObj.pathname.match(/\/([^/?#]+)/);
          if (altMatch) {
            site = altMatch[1];
          }
        }
      } catch {}
    } else {
      baseUrl = `https://fa.${companyContext}.oraclecloud.com`;
    }

    const url = `${baseUrl}/hcmUI/api/Employee/Candidate/${site}/jobs`;

    Logger.debug(`Oracle Cloud discovery request for company: ${company.name} [URL: ${url}]`);
    
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