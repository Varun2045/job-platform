import { CompanyConfig, RawJob, ScraperPlugin, Job } from '../Scraper.js';
import { HttpClient } from '../../core/HttpClient.js';
import { Logger } from '../../core/Logger.js';
import { JobNormalizer } from '../../core/JobNormalizer.js';

export const metadata = {
  id: 'greenhouse',
  version: '1.0.0',
  ats: 'greenhouse',
  author: 'Job Monitor',
};

export class GreenhousePlugin implements ScraperPlugin {
  public metadata = metadata;

  public capabilities = {
    supportsPagination: false,
    supportsIncrementalSync: false,
    supportsJobDescriptions: true,
    supportsRemoteFiltering: false,
  };

  public supports(company: CompanyConfig): boolean {
    return company.detected_ats === 'greenhouse';
  }

  public async discover(company: CompanyConfig, httpClient: HttpClient): Promise<RawJob[]> {
    let boardToken = company.api_endpoint || company.id;
    if (boardToken.startsWith('http://') || boardToken.startsWith('https://')) {
      const match = boardToken.match(/boards\.greenhouse\.io\/([^/?#]+)/);
      if (match) {
        boardToken = match[1];
      }
    }
    const url = `https://boards-api.greenhouse.io/v1/boards/${boardToken}/jobs?content=true`;

    Logger.debug(`Greenhouse discovery request for company: ${company.name} [Board: ${boardToken}]`);
    const response = await httpClient.get<any>(url);

    if (!response.data || !Array.isArray(response.data.jobs)) {
      throw new Error(`Unexpected Greenhouse API response structure for ${company.name}`);
    }

    const rawJobs = response.data.jobs.map((job: any) => ({
      company: company.name,
      id: String(job.id),
      title: job.title,
      location: job.location?.name ?? 'Unknown',
      url: job.absolute_url,
      datePosted: job.updated_at,
      team: job.departments?.[0]?.name ?? job.offices?.[0]?.name ?? 'General',
      source: 'greenhouse',
      description: job.content, // greenhouse content is HTML description
      raw: job,
    }));

    return rawJobs;
  }

  public async enrich(rawJob: RawJob, _httpClient: HttpClient): Promise<RawJob> {
    // Greenhouse already fetched full description in discover phase because of content=true
    return rawJob;
  }

  public normalize(rawJob: RawJob, company: CompanyConfig): Job {
    return JobNormalizer.normalize(rawJob, company);
  }
}
export const plugin = new GreenhousePlugin();
