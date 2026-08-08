import { CompanyConfig, RawJob, ScraperPlugin, Job } from '../Scraper.js';
import { HttpClient } from '../../core/HttpClient.js';
import { Logger } from '../../core/Logger.js';
import { JobNormalizer } from '../../core/JobNormalizer.js';

export const metadata = {
  id: 'workday',
  version: '1.0.0',
  ats: 'workday',
  author: 'Job Monitor',
};

export class WorkdayPlugin implements ScraperPlugin {
  public metadata = metadata;

  public capabilities = {
    supportsPagination: true,
    supportsIncrementalSync: false,
    supportsJobDescriptions: true,
    supportsRemoteFiltering: false,
  };

  public supports(company: CompanyConfig): boolean {
    return company.detected_ats === 'workday';
  }

  public async discover(company: CompanyConfig, httpClient: HttpClient): Promise<RawJob[]> {
    const apiEndpoint = company.api_endpoint;
    if (!apiEndpoint) {
      throw new Error(`Workday plugin requires api_endpoint config for ${company.name}`);
    }

    const { baseUrl, tenant, site } = parseWorkdayUrl(apiEndpoint);
    const searchUrl = `${baseUrl}/wday/cxs/${tenant}/${site}/jobs`;
    Logger.debug(`Workday discovery request to: ${searchUrl}`);

    // Fetch first page to find total jobs
    const limit = 20;
    let offset = 0;
    let total = 0;
    const rawJobs: RawJob[] = [];

    const requestBody = {
      limit,
      offset,
      searchText: '',
      appliedFacets: {},
    };

    const headers = {
      'Accept': 'application/json, text/plain, */*',
      'Content-Type': 'application/json',
      'X-Workday-Client': 'CXS',
    };

    const response = await httpClient.post<any>(searchUrl, requestBody, headers, { timeoutMs: 30000 });
    
    let postings: any[] = [];
    if (response.data) {
      if (Array.isArray(response.data.jobPostings)) {
        postings = response.data.jobPostings;
        total = response.data.total ?? postings.length;
      } else if (Array.isArray(response.data)) {
        postings = response.data;
        total = postings.length;
      } else {
        throw new Error(`Unexpected Workday response format for ${company.name}`);
      }
    } else {
      throw new Error(`Unexpected Workday response format for ${company.name}`);
    }

    Logger.debug(`Workday found total: ${total} jobs for ${company.name}`);

    // Map first page
    this.mapPostings(postings, company, baseUrl, tenant, site, rawJobs);

    // If more jobs, fetch up to 100 total jobs (5 pages) to avoid timeout/rate limits in hourly cron
    const maxOffset = Math.min(total, 100);
    offset += limit;

    while (offset < maxOffset) {
      Logger.debug(`Workday paging for ${company.name}: offset ${offset}/${total}`);
      const pageBody = { limit, offset, searchText: '', appliedFacets: {} };
      try {
        const pageResponse = await httpClient.post<any>(searchUrl, pageBody, headers, { timeoutMs: 30000 });
        if (pageResponse.data) {
          let pagePostings: any[] = [];
          if (Array.isArray(pageResponse.data.jobPostings)) {
            pagePostings = pageResponse.data.jobPostings;
          } else if (Array.isArray(pageResponse.data)) {
            pagePostings = pageResponse.data;
          }
          if (pagePostings.length > 0) {
            this.mapPostings(pagePostings, company, baseUrl, tenant, site, rawJobs);
          }
        }
      } catch (err: any) {
        Logger.warn(`Workday page offset ${offset} failed for ${company.name}: ${err.message}`);
        break; // continue with what we have
      }
      offset += limit;
    }

    return rawJobs;
  }

  private mapPostings(postings: any[], company: CompanyConfig, baseUrl: string, tenant: string, site: string, targetList: RawJob[]): void {
    postings.forEach((post: any) => {
      const jobId =
        post.bulletins?.[0]?.bulletinId ?? post.jobReqId ?? post.externalPath?.split('_')?.pop() ?? post.externalPath ?? Math.random().toString(36).substring(7);
      
      let jobUrl = post.externalPath || '';
      if (jobUrl && jobUrl.startsWith('/')) {
        jobUrl = `${baseUrl}${jobUrl}`;
      } else if (!jobUrl) {
        jobUrl = `${baseUrl}/job/${tenant}/${site}`;
      }

      targetList.push({
        company: company.name,
        id: String(jobId),
        title: post.title,
        location: post.locationsText ?? 'Unknown',
        url: jobUrl,
        datePosted: post.postedOn,
        employmentType: post.workType,
        source: 'workday',
        raw: {
          ...post,
          _tenant: tenant,
          _site: site,
          _baseUrl: baseUrl,
        },
      });
    });
  }

  public async enrich(rawJob: RawJob, httpClient: HttpClient): Promise<RawJob> {
    const post = rawJob.raw;
    if (!post || !post.externalPath) {
      Logger.warn(`Cannot enrich Workday job ${rawJob.id} for ${rawJob.company}: missing raw post metadata.`);
      return rawJob;
    }

    const tenant = post._tenant;
    const site = post._site;
    const baseUrl = post._baseUrl;

    if (!tenant || !site || !baseUrl) {
      Logger.warn(`Cannot enrich Workday job ${rawJob.id} for ${rawJob.company}: missing tenant/site/baseUrl metadata.`);
      return rawJob;
    }

    let jobPath = post.externalPath;
    if (jobPath.startsWith('/job/')) {
      jobPath = jobPath.substring(5);
    } else {
      const parts = jobPath.split('/').filter(Boolean);
      if (parts.length >= 2 && parts[0] === 'job') {
        jobPath = parts.slice(1).join('/');
      } else if (parts.length > 2 && parts[1] === tenant) {
        jobPath = parts.slice(2).join('/');
      }
    }

    const detailApiUrl = `${baseUrl}/wday/cxs/${tenant}/${site}/job/${jobPath}`;

    try {
      Logger.debug(`Fetching Workday description from details API: ${detailApiUrl}`);
      const response = await httpClient.get<any>(detailApiUrl, undefined, { timeoutMs: 30000 });
      if (response.data && response.data.jobPostingInfo) {
        rawJob.description = response.data.jobPostingInfo.jobDescription ?? '';
        rawJob.team = response.data.jobPostingInfo.jobFamily ?? rawJob.team;
        rawJob.experience = response.data.jobPostingInfo.experienceLevel ?? rawJob.experience;
        rawJob.employmentType = response.data.jobPostingInfo.timeType ?? rawJob.employmentType;
      }
    } catch (err: any) {
      Logger.error(`Failed to enrich Workday job details for ${rawJob.company} (${rawJob.id})`, err);
    }

    return rawJob;
  }

  public normalize(rawJob: RawJob, company: CompanyConfig): Job {
    return JobNormalizer.normalize(rawJob, company);
  }
}

function parseWorkdayUrl(url: string): { baseUrl: string; tenant: string; site: string } {
  const urlObj = new URL(url);
  const baseUrl = `https://${urlObj.host}`;

  const cxsMatch = urlObj.pathname.match(/\/wday\/cxs\/([^/]+)\/([^/]+)/);
  if (cxsMatch) {
    return {
      baseUrl,
      tenant: cxsMatch[1],
      site: cxsMatch[2],
    };
  }

  const recruitingMatch = urlObj.pathname.match(/\/recruiting\/([^/]+)\/([^/]+)/);
  if (recruitingMatch) {
    return {
      baseUrl,
      tenant: recruitingMatch[1],
      site: recruitingMatch[2],
    };
  }

  const hostParts = urlObj.host.split('.');
  const tenant = hostParts[0];

  const pathParts = urlObj.pathname.split('/').filter(Boolean);
  const filteredParts = pathParts.filter(part => !/^[a-z]{2}([-_][A-Z]{2,4})?$/i.test(part));
  
  let site = 'External';
  if (filteredParts.length > 0) {
    if (filteredParts.length > 1 && (filteredParts[filteredParts.length - 1].toLowerCase() === 'jobs' || filteredParts[filteredParts.length - 1].toLowerCase() === 'search')) {
      site = filteredParts[filteredParts.length - 2];
    } else {
      site = filteredParts[filteredParts.length - 1];
    }
  }

  return {
    baseUrl,
    tenant,
    site,
  };
}

export const plugin = new WorkdayPlugin();
