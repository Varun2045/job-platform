import { CompanyConfig, RawJob, ScraperPlugin, Job } from '../Scraper.js';
import { HttpClient } from '../../core/HttpClient.js';
import { Logger } from '../../core/Logger.js';
import { JobNormalizer } from '../../core/JobNormalizer.js';
import * as cheerio from 'cheerio';

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
    
    Logger.debug(`Ashby scraping: ${url}`);
    const response = await httpClient.get<string>(url);
    const $ = cheerio.load(response.data);

    const jobs: RawJob[] = [];

    // Ashby job listings typically use specific CSS selectors
    $('.job-item, [data-test="job-item"], .job-card').each((_, element) => {
      try {
        const $el = $(element);
        
        const title = $el.find('.job-title, h2, h3, [data-test="job-title"]').first().text().trim();
        const location = $el.find('.job-location, [data-test="job-location"]').first().text().trim();
        const url = $el.find('a').first().attr('href');
        const description = $el.find('.job-description, [data-test="job-description"]').first().text().trim();
        
        // Extract job ID from URL or data attribute
        const jobId = $el.attr('data-job-id') || 
                      $el.attr('data-id') || 
                      (url ? url.split('/').pop() : 
                      `job-${jobs.length}`);

        if (title && url) {
          const fullUrl = url.startsWith('http') ? url : `https://jobs.ashbyhq.com${url}`;
          
          jobs.push({
            company: company.name,
            id: jobId || `job-${jobs.length}`,
            title: title,
            location: location || 'Remote',
            country: this.extractCountry(location || 'Remote'),
            url: fullUrl,
            datePosted: new Date().toISOString(),
            team: 'Engineering',
            source: 'ashby',
            description: description || '',
            isRemote: this.isRemote(location || 'Remote'),
            raw: $el.html(),
          });
        }
      } catch (error) {
        Logger.warn(`Failed to parse Ashby job item: ${error}`);
      }
    });

    if (jobs.length === 0) {
      Logger.warn(`No jobs found for ${company.name} via Ashby plugin`);
    }

    Logger.debug(`Ashby plugin found ${jobs.length} jobs for ${company.name}`);
    return jobs;
  }

  public async enrich(rawJob: RawJob, httpClient: HttpClient): Promise<RawJob> {
    try {
      const response = await httpClient.get<string>(rawJob.url);
      const $ = cheerio.load(response.data);

      // Extract full job description
      const fullDescription = $('.job-description, [data-test="job-description"], .description').first().text().trim();
      
      // Extract additional metadata
      const employmentType = $('.employment-type, [data-test="employment-type"]').first().text().trim();
      const team = $('.team, [data-test="team"]').first().text().trim();
      const postedDate = $('.posted-date, [data-test="posted-date"]').first().text().trim();

      return {
        ...rawJob,
        description: fullDescription || rawJob.description,
        employmentType: employmentType || rawJob.employmentType,
        team: team || rawJob.team,
        datePosted: postedDate ? this.parseDate(postedDate) : rawJob.datePosted,
      };
    } catch (error) {
      Logger.warn(`Failed to enrich Ashby job ${rawJob.id}: ${error}`);
      return rawJob;
    }
  }

  public normalize(rawJob: RawJob, company: CompanyConfig): Job {
    return JobNormalizer.normalize(rawJob, company);
  }

  private extractCountry(location: string): string {
    const locLower = location.toLowerCase();
    
    // Check for specific countries
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
    
    // Default to empty if can't determine
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
      // Handle various date formats
      const parsed = new Date(dateString);
      if (!isNaN(parsed.getTime())) {
        return parsed.toISOString();
      }
      
      // Handle relative dates like "2 days ago"
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

export const plugin = new AshbyPlugin();
