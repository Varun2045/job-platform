import { CompanyConfig, RawJob, ScraperPlugin, Job } from '../Scraper.js';
import { HttpClient } from '../../core/HttpClient.js';
import { Logger } from '../../core/Logger.js';
import * as cheerio from 'cheerio';
import { JobNormalizer } from '../../core/JobNormalizer.js';

export const metadata = {
  id: 'apple',
  version: '1.0.0',
  ats: 'apple',
  author: 'Job Monitor'
};

export class ApplePlugin implements ScraperPlugin {
  public metadata = metadata;
  
  public capabilities = {
    supportsPagination: true,
    supportsIncrementalSync: false,
    supportsJobDescriptions: false, // Search API returns snippet
    supportsRemoteFiltering: true
  };

  public supports(company: CompanyConfig): boolean {
    return company.detected_ats === 'apple';
  }

  public async discover(company: CompanyConfig, httpClient: HttpClient): Promise<RawJob[]> {
    // Apple Careers API (Filtered to India)
    const url = 'https://jobs.apple.com/api/v1/search/role?site=us-en&query=&location=india';
    
    Logger.debug(`Apple Careers API request: ${url}`);
    const response = await httpClient.get<any>(url);

    if (!response.data || !Array.isArray(response.data.searchResults)) {
      throw new Error(`Unexpected Apple API response format for ${company.name}`);
    }

    Logger.debug(`Apple API returned ${response.data.searchResults.length} jobs for India`);

    const rawJobs = response.data.searchResults.map((job: any) => {
      const jobId = job.jobID;
      const jobUrl = `https://jobs.apple.com/en-us/details/${jobId}`;

      return {
        company: company.name,
        id: String(jobId),
        title: job.postingTitle,
        location: job.locations?.[0]?.cityName ?? 'India',
        country: 'India',
        url: jobUrl,
        datePosted: job.releaseDate,
        team: job.team ?? 'Software Engineering',
        source: 'apple',
        description: job.postingDescription ?? '', // Snippet/Summary
        raw: job
      };
    });

    return rawJobs;
  }

  public async enrich(rawJob: RawJob, httpClient: HttpClient): Promise<RawJob> {
    // Apple needs an HTML fetch to scrape the full description text
    try {
      Logger.debug(`Apple fetching description HTML from: ${rawJob.url}`);
      const response = await httpClient.get<string>(rawJob.url);
      
      const $ = cheerio.load(response.data);
      const descElement = $('#jd-description');
      
      if (descElement.length > 0) {
        rawJob.description = descElement.html() ?? descElement.text();
      } else {
        // Fallback: search key div classes like job-details
        const alternativeDesc = $('.job-details').text() || $('.jd-info').text();
        if (alternativeDesc) {
          rawJob.description = alternativeDesc;
        }
      }
    } catch (err: any) {
      Logger.error(`Failed to enrich Apple job details for ${rawJob.company} (${rawJob.id})`, err);
    }

    return rawJob;
  }

  public normalize(rawJob: RawJob, company: CompanyConfig): Job {
    return JobNormalizer.normalize(rawJob, company);
  }
}
export const plugin = new ApplePlugin();
