import { CompanyConfig, RawJob, ScraperPlugin, Job } from '../Scraper.js';
import { HttpClient } from '../../core/HttpClient.js';
import { Logger } from '../../core/Logger.js';
import { JobNormalizer } from '../../core/JobNormalizer.js';

export const metadata = {
  id: 'workday',
  version: '1.0.0',
  ats: 'workday',
  author: 'Job Monitor'
};

export class WorkdayPlugin implements ScraperPlugin {
  public metadata = metadata;
  
  public capabilities = {
    supportsPagination: true,
    supportsIncrementalSync: false,
    supportsJobDescriptions: true,
    supportsRemoteFiltering: false
  };

  public supports(company: CompanyConfig): boolean {
    return company.detected_ats === 'workday';
  }

  public async discover(company: CompanyConfig, httpClient: HttpClient): Promise<RawJob[]> {
    const apiEndpoint = company.api_endpoint;
    if (!apiEndpoint) {
      throw new Error(`Workday plugin requires api_endpoint config for ${company.name}`);
    }

    const searchUrl = `${apiEndpoint}/jobs`;
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
      appliedFacets: {}
    };

    const response = await httpClient.post<any>(searchUrl, requestBody);
    if (!response.data || !Array.isArray(response.data.jobPostings)) {
      throw new Error(`Unexpected Workday response format for ${company.name}`);
    }

    total = response.data.total ?? response.data.jobPostings.length;
    Logger.debug(`Workday found total: ${total} jobs for ${company.name}`);

    // Map first page
    this.mapPostings(response.data.jobPostings, company, apiEndpoint, rawJobs);

    // If more jobs, fetch up to 100 total jobs (5 pages) to avoid timeout/rate limits in hourly cron
    const maxOffset = Math.min(total, 100);
    offset += limit;
    
    while (offset < maxOffset) {
      Logger.debug(`Workday paging for ${company.name}: offset ${offset}/${total}`);
      const pageBody = { limit, offset, searchText: '', appliedFacets: {} };
      try {
        const pageResponse = await httpClient.post<any>(searchUrl, pageBody);
        if (pageResponse.data && Array.isArray(pageResponse.data.jobPostings)) {
          this.mapPostings(pageResponse.data.jobPostings, company, apiEndpoint, rawJobs);
        }
      } catch (err: any) {
        Logger.warn(`Workday page offset ${offset} failed for ${company.name}: ${err.message}`);
        break; // continue with what we have
      }
      offset += limit;
    }

    return rawJobs;
  }

  private mapPostings(postings: any[], company: CompanyConfig, apiEndpoint: string, targetList: RawJob[]): void {
    const urlObj = new URL(apiEndpoint);
    const baseUrl = `${urlObj.protocol}//${urlObj.host}`;

    postings.forEach((post: any) => {
      const jobId = post.bulletins?.[0]?.bulletinId ?? post.jobReqId ?? post.externalPath.split('_').pop() ?? post.externalPath;
      const jobUrl = `${baseUrl}${post.externalPath}`;

      targetList.push({
        company: company.name,
        id: String(jobId),
        title: post.title,
        location: post.locationsText ?? 'Unknown',
        url: jobUrl,
        datePosted: post.postedOn,
        employmentType: post.workType,
        source: 'workday',
        raw: post // save the raw details for enrichment references
      });
    });
  }

  public async enrich(rawJob: RawJob, httpClient: HttpClient): Promise<RawJob> {
    const post = rawJob.raw;
    if (!post || !post.externalPath) {
      Logger.warn(`Cannot enrich Workday job ${rawJob.id} for ${rawJob.company}: missing raw post metadata.`);
      return rawJob;
    }

    // e.g. nvidia.wd5.myworkdayjobs.com/wday/cxs/nvidia/NVIDIA_External_Career_Site
    // Let's replace the last /jobs in search to /job/externalPath
    // Wait, the API endpoint is stored on company config, but since we map base inside discover, we can use base
    // Let's extract the endpoint from the search URL. We can construct it.
    // Standard detail url: baseUrl/wday/cxs/tenant/careerSite/job/externalPath
    // In discover, we mapped post.externalPath which is like `/job/nvidia/NVIDIA_External_Career_Site/job-title_JR12345`
    // Wait, the post.externalPath starts with `/job/` (e.g. `/job/nvidia/NVIDIA_External_Career_Site/job-title_JR12345`)
    // The details endpoint is `baseUrl/wday/cxs/tenant/careerSite/job/job-title_JR12345` (without the tenant/careerSite duplicated or similar).
    // Actually, Workday's standard detail API URL is:
    // `baseUrl/wday/cxs/{tenant}/{careerSite}/job/{jobPath}` where jobPath is the last part of post.externalPath
    
    // Let's resolve the detail URL.
    const urlObj = new URL(rawJob.url);
    const baseUrl = `${urlObj.protocol}//${urlObj.host}`;
    
    // To construct the detail URL safely, let's extract tenant & careerSite from the raw job url or base.
    // For nvidia, rawJob.url is `https://nvidia.wd5.myworkdayjobs.com/job/nvidia/NVIDIA_External_Career_Site/job-title_JR12345` (mapped from externalPath).
    // Detail API is `https://nvidia.wd5.myworkdayjobs.com/wday/cxs/nvidia/NVIDIA_External_Career_Site/job/job-title_JR12345`
    // Let's look at the mapping: externalPath = `/job/nvidia/NVIDIA_External_Career_Site/job-title_JR12345`
    // We want: `/wday/cxs/nvidia/NVIDIA_External_Career_Site/job/job-title_JR12345`
    // Notice that externalPath starts with `/job/{tenant}/{site}/{path}`
    // If we replace `/job/` with `/wday/cxs/` and insert `/job/` before the final path component:
    // Let's do a reliable replacement:
    // Split externalPath by '/' -> ['', 'job', 'tenant', 'site', 'job-id']
    // Reconstruct: `/wday/cxs/tenant/site/job/job-id`
    
    const parts = post.externalPath.split('/').filter(Boolean); // ['job', 'tenant', 'site', 'job-id']
    if (parts.length >= 4 && parts[0] === 'job') {
      const tenant = parts[1];
      const site = parts[2];
      const jobPath = parts.slice(3).join('/'); // 'job-id'
      const detailApiUrl = `${baseUrl}/wday/cxs/${tenant}/${site}/job/${jobPath}`;

      try {
        Logger.debug(`Fetching Workday description from details API: ${detailApiUrl}`);
        const response = await httpClient.get<any>(detailApiUrl);
        if (response.data && response.data.jobPostingInfo) {
          rawJob.description = response.data.jobPostingInfo.jobDescription ?? '';
          rawJob.team = response.data.jobPostingInfo.jobFamily ?? rawJob.team;
          rawJob.experience = response.data.jobPostingInfo.experienceLevel ?? rawJob.experience;
          rawJob.employmentType = response.data.jobPostingInfo.timeType ?? rawJob.employmentType;
        }
      } catch (err: any) {
        Logger.error(`Failed to enrich Workday job details for ${rawJob.company} (${rawJob.id})`, err);
      }
    } else {
      Logger.warn(`Invalid Workday external path format: ${post.externalPath}`);
    }

    return rawJob;
  }

  public normalize(rawJob: RawJob, company: CompanyConfig): Job {
    return JobNormalizer.normalize(rawJob, company);
  }
}
export const plugin = new WorkdayPlugin();
