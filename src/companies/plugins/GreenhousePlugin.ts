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
    const genericTokens = new Set(['careers', 'jobs', 'positions', 'open-positions', 'search-jobs', 'current-openings', 'search', 'all-jobs', 'join', 'embed', 'job_board', 'v1', 'global', 'en', 'careers-home', 'careers-list', 'positions']);

    let boardToken = company.api_endpoint || company.id;
    if (boardToken.startsWith('http://') || boardToken.startsWith('https://')) {
      try {
        const urlObj = new URL(boardToken);
        const forParam = urlObj.searchParams.get('for');
        if (forParam) {
          boardToken = forParam;
        } else {
          const parts = urlObj.pathname.split('/').filter(Boolean);
          const filteredParts = parts.filter(p => p !== 'embed' && p !== 'job_board' && p !== 'v1');
          boardToken = filteredParts[filteredParts.length - 1] || company.id;
        }
      } catch {
        const match = boardToken.match(/boards\.greenhouse\.io\/([^/?#]+)/);
        if (match) {
          boardToken = match[1];
        }
      }
    }

    if (genericTokens.has(boardToken.toLowerCase())) {
      boardToken = company.id;
    }

    const tryTokens = [boardToken];
    if (boardToken !== company.id) {
      tryTokens.push(company.id);
    }
    const cleanedId = company.id.replace(/[-_]/g, '');
    if (!tryTokens.includes(cleanedId)) {
      tryTokens.push(cleanedId);
    }

    let lastError: any = null;
    let rawJobs: RawJob[] = [];

    for (const token of tryTokens) {
      const url = `https://boards-api.greenhouse.io/v1/boards/${token}/jobs?content=true`;
      Logger.debug(`Greenhouse discovery request for company: ${company.name} [Board: ${token}]`);
      try {
        const response = await httpClient.get<any>(url, undefined, { timeoutMs: 20000, retries: 1 });
        if (response.data && Array.isArray(response.data.jobs)) {
          rawJobs = response.data.jobs.map((job: any) => ({
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
          break;
        }
      } catch (err: any) {
        lastError = err;
        Logger.warn(`Greenhouse board token "${token}" failed for ${company.name}: ${err.message}`);
      }
    }

    if (rawJobs.length === 0 && lastError) {
      throw lastError;
    }

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
