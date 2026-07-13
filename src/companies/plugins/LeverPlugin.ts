import { CompanyConfig, RawJob, ScraperPlugin, Job } from '../Scraper.js';
import { HttpClient } from '../../core/HttpClient.js';
import { Logger } from '../../core/Logger.js';
import { JobNormalizer } from '../../core/JobNormalizer.js';

export const metadata = {
  id: 'lever',
  version: '1.0.0',
  ats: 'lever',
  author: 'Job Monitor'
};

export class LeverPlugin implements ScraperPlugin {
  public metadata = metadata;
  
  public capabilities = {
    supportsPagination: false,
    supportsIncrementalSync: false,
    supportsJobDescriptions: true,
    supportsRemoteFiltering: false
  };

  public supports(company: CompanyConfig): boolean {
    return company.detected_ats === 'lever';
  }

  public async discover(company: CompanyConfig, httpClient: HttpClient): Promise<RawJob[]> {
    const companyId = company.api_endpoint || company.id;
    const url = `https://api.lever.co/v0/postings/${companyId}`;
    
    Logger.debug(`Lever discovery request for company: ${company.name} [CompanyId: ${companyId}]`);
    const response = await httpClient.get<any[]>(url);

    if (!Array.isArray(response.data)) {
      throw new Error(`Unexpected Lever API response structure (expected array) for ${company.name}`);
    }

    const rawJobs = response.data.map((job: any) => {
      // Compile description from descriptionHtml and lists
      let description = job.descriptionHtml ?? '';
      if (Array.isArray(job.lists)) {
        job.lists.forEach((list: any) => {
          description += `<h3>${list.text}</h3><ul>`;
          if (Array.isArray(list.content)) {
            list.content.forEach((item: string) => {
              description += `<li>${item}</li>`;
            });
          }
          description += '</ul>';
        });
      }

      return {
        company: company.name,
        id: String(job.id),
        title: job.text,
        location: job.categories?.location ?? 'Unknown',
        url: job.hostedUrl,
        datePosted: job.createdAt ? new Date(job.createdAt).toISOString() : undefined,
        team: job.categories?.department ?? 'General',
        employmentType: job.categories?.commitment ?? 'Full-time',
        source: 'lever',
        description,
        isRemote: job.categories?.location?.toLowerCase().includes('remote') || false,
        raw: job
      };
    });

    return rawJobs;
  }

  public async enrich(rawJob: RawJob, httpClient: HttpClient): Promise<RawJob> {
    // Lever already returns descriptions in the list query
    return rawJob;
  }

  public normalize(rawJob: RawJob, company: CompanyConfig): Job {
    return JobNormalizer.normalize(rawJob, company);
  }
}
export const plugin = new LeverPlugin();
