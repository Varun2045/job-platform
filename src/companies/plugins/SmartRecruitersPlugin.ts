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
    let companySlug = company.api_endpoint || company.id;
    if (companySlug.startsWith('http://') || companySlug.startsWith('https://')) {
      try {
        const urlObj = new URL(companySlug);
        const pathParts = urlObj.pathname.split('/').filter(Boolean);
        companySlug = pathParts[0] || company.id;
      } catch {
        companySlug = company.id;
      }
    }

    // SmartRecruiters API postings endpoint
    const url = `https://api.smartrecruiters.com/v1/companies/${companySlug}/postings`;

    Logger.debug(`SmartRecruiters API discovery for ${company.name} [Slug: ${companySlug}]`);
    
    try {
      const response = await httpClient.get<any>(url);
      
      const content = response.data?.content || response.data;
      if (!Array.isArray(content)) {
        throw new Error(`Unexpected SmartRecruiters API structure for ${company.name}`);
      }

      const rawJobs = content.map((job: any) => {
        const jobId = String(job.id);
        const jobUrl = `https://jobs.smartrecruiters.com/${job.company?.identifier || companySlug}/${jobId}`;
        const location = job.location?.fullLocation || job.location?.city || 'Unknown';
        
        return {
          company: company.name,
          id: jobId,
          title: job.name || 'Unknown Role',
          location: location,
          url: jobUrl,
          datePosted: job.releasedDate || new Date().toISOString(),
          team: job.function?.label || job.industry?.label || 'General',
          source: 'smartrecruiters',
          description: '', // Will be enriched
          raw: job,
        };
      });

      return rawJobs;
    } catch (error: any) {
      Logger.warn(`SmartRecruiters API request failed for ${company.name}: ${error.message}, falling back to generic scraping`);
      return [];
    }
  }

  public async enrich(rawJob: RawJob, httpClient: HttpClient): Promise<RawJob> {
    try {
      const companySlug = rawJob.raw?.company?.identifier || rawJob.company.replace(/\s+/g, '');
      const url = `https://api.smartrecruiters.com/v1/companies/${companySlug}/postings/${rawJob.id}`;
      
      const response = await httpClient.get<any>(url);
      const jobAd = response.data?.jobAd;
      
      if (jobAd?.sections) {
        const sections = jobAd.sections;
        const descriptionText = [
          sections.jobDescription?.text || '',
          sections.qualifications?.text || '',
          sections.additionalInformation?.text || ''
        ].filter(Boolean).join('\n\n');
        
        // Clean up HTML tags if any
        const cleanedDescription = descriptionText.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
        
        return {
          ...rawJob,
          description: cleanedDescription || rawJob.description,
          employmentType: response.data?.typeOfEmployment?.label || rawJob.employmentType,
        };
      }
      
      return rawJob;
    } catch (error: any) {
      Logger.warn(`Failed to enrich SmartRecruiters job ${rawJob.id} via API: ${error.message}`);
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
