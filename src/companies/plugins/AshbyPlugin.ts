import { CompanyConfig, RawJob, ScraperPlugin, Job } from '../Scraper.js';
import { HttpClient } from '../../core/HttpClient.js';
import { Logger } from '../../core/Logger.js';
import { JobNormalizer } from '../../core/JobNormalizer.js';

export const metadata = {
  id: 'ashby',
  version: '1.0.0',
  ats: 'ashby',
  author: 'Job Monitor',
};

export class AshbyPlugin implements ScraperPlugin {
  public metadata = metadata;

  public capabilities = {
    supportsPagination: true,
    supportsIncrementalSync: false,
    supportsJobDescriptions: true,
    supportsRemoteFiltering: true,
  };

  public supports(company: CompanyConfig): boolean {
    return company.detected_ats === 'ashby';
  }

  public async discover(company: CompanyConfig, httpClient: HttpClient): Promise<RawJob[]> {
    const url = company.api_endpoint || `https://jobs.ashbyhq.com/${company.id}`;
    const boardName = getAshbyBoardName(url);

    if (!boardName) {
      throw new Error(`Could not determine Ashby board name from API endpoint: ${url}`);
    }

    const apiUrl = `https://api.ashbyhq.com/posting-api/job-board/${boardName}`;
    Logger.debug(`Ashby JSON API request to: ${apiUrl}`);

    const response = await httpClient.get<any>(apiUrl, undefined, { timeoutMs: 30000 });
    const responseText = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);

    if (responseText.toLowerCase().includes('cloudflare') || responseText.toLowerCase().includes('captcha')) {
      throw new Error(`Access Blocked by Anti-Bot Detection (Cloudflare/CAPTCHA) during Ashby API request`);
    }

    if (!response.data || !Array.isArray(response.data.jobs)) {
      throw new Error(`Unexpected Ashby API response structure: missing jobs array`);
    }

    const rawJobs: RawJob[] = response.data.jobs.map((job: any) => {
      const workplaceType = job.workplaceType || '';
      const isRemote = workplaceType.toLowerCase() === 'remote' || 
                       job.location?.toLowerCase()?.includes('remote') ||
                       false;

      return {
        company: company.name,
        id: String(job.id),
        title: job.title,
        location: job.location ?? 'Remote',
        url: job.jobUrl ?? `https://jobs.ashbyhq.com/${boardName}/${job.id}`,
        datePosted: job.publishedAt ?? new Date().toISOString(),
        team: job.team ?? job.department ?? 'General',
        source: 'ashby',
        description: job.descriptionPlain ?? job.descriptionHtml ?? '',
        employmentType: job.employmentType ?? 'FullTime',
        isRemote,
        raw: job,
      };
    });

    Logger.debug(`Ashby plugin found ${rawJobs.length} jobs for ${company.name}`);
    return rawJobs;
  }

  public async enrich(rawJob: RawJob, _httpClient: HttpClient): Promise<RawJob> {
    // Ashby API already provides full descriptions in the job-board JSON payload
    return rawJob;
  }

  public normalize(rawJob: RawJob, company: CompanyConfig): Job {
    return JobNormalizer.normalize(rawJob, company);
  }
}

function getAshbyBoardName(url: string): string {
  try {
    const urlObj = new URL(url);
    const parts = urlObj.pathname.split('/').filter(Boolean);
    if (urlObj.pathname.includes('/posting-api/job-board/')) {
      const idx = parts.indexOf('job-board');
      if (idx !== -1 && idx + 1 < parts.length) {
        return parts[idx + 1];
      }
    }
    return parts[0] || '';
  } catch {
    return url.replace(/https?:\/\/jobs\.ashbyhq\.com\//, '').split('/')[0] || url;
  }
}

export const plugin = new AshbyPlugin();

