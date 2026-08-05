import { CompanyConfig, RawJob, ScraperPlugin, Job } from '../Scraper.js';
import { HttpClient } from '../../core/HttpClient.js';
import { Logger } from '../../core/Logger.js';
import { JobNormalizer } from '../../core/JobNormalizer.js';
import * as cheerio from 'cheerio';

export const metadata = {
  id: 'smartrecruiters',
  version: '1.0.0',
  ats: 'smartrecruiters',
  author: 'Job Monitor',
};

export class SmartRecruitersPlugin implements ScraperPlugin {
  public metadata = metadata;

  public capabilities = {
    supportsPagination: true,
    supportsIncrementalSync: false,
    supportsJobDescriptions: true,
    supportsRemoteFiltering: true,
  };

  public supports(company: CompanyConfig): boolean {
    return company.detected_ats === 'smartrecruiters';
  }

  public async discover(company: CompanyConfig, httpClient: HttpClient): Promise<RawJob[]> {
    const url = company.api_endpoint;
    
    if (!url) {
      throw new Error(`No API endpoint configured for SmartRecruiters company ${company.name}`);
    }

    Logger.debug(`SmartRecruiters scraping: ${url}`);
    const response = await httpClient.get<string>(url);
    const $ = cheerio.load(response.data);

    const jobs: RawJob[] = [];

    // SmartRecruiters typically uses specific CSS selectors
    $('.job-item, .job-opening, [data-job-id]').each((_, element) => {
      try {
        const $el = $(element);
        
        const title = $el.find('.job-title, h2, h3, .title').first().text().trim();
        const location = $el.find('.job-location, .location, [data-field="location"]').first().text().trim();
        const link = $el.find('a').first();
        const url = link.attr('href');
        const description = $el.find('.job-description, .description, [data-field="description"]').first().text().trim();
        
        // Extract job ID from data attributes
        const jobId = $el.attr('data-job-id') || 
                      $el.attr('data-id') || 
                      (url ? this.extractJobIdFromUrl(url) : 
                      `job-${jobs.length}`);

        if (title && url) {
          const fullUrl = url.startsWith('http') ? url : new URL(url, `https://${new URL(company.api_endpoint || '').hostname}`).href;
          
          jobs.push({
            company: company.name,
            id: jobId,
            title: title,
            location: location || 'Remote',
            country: this.extractCountry(location),
            url: fullUrl,
            datePosted: new Date().toISOString(),
            team: 'Engineering',
            source: 'smartrecruiters',
            description: description,
            isRemote: this.isRemote(location),
            raw: $el.html(),
          });
        }
      } catch (error) {
        Logger.warn(`Failed to parse SmartRecruiters job item: ${error}`);
      }
    });

    if (jobs.length === 0) {
      Logger.warn(`No jobs found for ${company.name} via SmartRecruiters plugin`);
    }

    Logger.debug(`SmartRecruiters plugin found ${jobs.length} jobs for ${company.name}`);
    return jobs;
  }

  public async enrich(rawJob: RawJob, httpClient: HttpClient): Promise<RawJob> {
    try {
      const response = await httpClient.get<string>(rawJob.url);
      const $ = cheerio.load(response.data);

      // Extract full job description
      const fullDescription = $('.job-description, .description, [data-field="description"]').first().text().trim();
      
      // Extract additional metadata
      const employmentType = $('.employment-type, [data-field="employmentType"]').first().text().trim();
      const team = $('.team, [data-field="department"]').first().text().trim();
      const postedDate = $('.posted-date, [data-field="datePosted"]').first().text().trim();

      return {
        ...rawJob,
        description: fullDescription || rawJob.description,
        employmentType: employmentType || rawJob.employmentType,
        team: team || rawJob.team,
        datePosted: postedDate ? this.parseDate(postedDate) : rawJob.datePosted,
      };
    } catch (error) {
      Logger.warn(`Failed to enrich SmartRecruiters job ${rawJob.id}: ${error}`);
      return rawJob;
    }
  }

  public normalize(rawJob: RawJob, company: CompanyConfig): Job {
    return JobNormalizer.normalize(rawJob, company);
  }

  private extractJobIdFromUrl(url: string): string {
    const match = url.match(/job\/([^\/]+)/) || url.match(/jobId=([^&]+)/);
    return match ? match[1] : url.split('/').pop() || 'unknown';
  }

  private extractCountry(location: string): string {
    const locLower = location.toLowerCase();
    
    if (locLower.includes('india') || locLower.includes('bangalore') || locLower.includes('hyderabad')) {
      return 'India';
    }
    if (locLower.includes('united states') || locLower.includes('usa') || locLower.includes('us')) {
      return 'United States';
    }
    if (locLower.includes('united kingdom') || locLower.includes('uk')) {
      return 'United Kingdom';
    }
    if (locLower.includes('canada')) {
      return 'Canada';
    }
    
    return '';
  }

  private isRemote(location: string): boolean {
    const locLower = location.toLowerCase();
    return locLower.includes('remote') || 
           locLower.includes('work from home') ||
           locLower.includes('anywhere');
  }

  private parseDate(dateString: string): string {
    try {
      const parsed = new Date(dateString);
      if (!isNaN(parsed.getTime())) {
        return parsed.toISOString();
      }
      
      const match = dateString.match(/(\d+)\s*(day|hour|week|month)s?\s*ago/i);
      if (match) {
        const value = parseInt(match[1], 10);
        const unit = match[2].toLowerCase();
        const now = new Date();
        
        switch (unit) {
          case 'day':
            now.setDate(now.getDate() - value);
            break;
          case 'hour':
            now.setHours(now.getHours() - value);
            break;
          case 'week':
            now.setDate(now.getDate() - (value * 7));
            break;
          case 'month':
            now.setMonth(now.getMonth() - value);
            break;
        }
        
        return now.toISOString();
      }
      
      return new Date().toISOString();
    } catch {
      return new Date().toISOString();
    }
  }
}

export const plugin = new SmartRecruitersPlugin();
