import { CompanyConfig, RawJob } from './Scraper.js';
import { HttpClient } from '../core/HttpClient.js';
import { Logger } from '../core/Logger.js';
import * as cheerio from 'cheerio';

export class FallbackScraper {
  public async discover(company: CompanyConfig, httpClient: HttpClient): Promise<RawJob[]> {
    let url = company.api_endpoint || company.last_scraper_used || `https://www.${company.id}.com/careers`;
    
    // Handle common ATS URL patterns if detected_ats is set
    if (company.detected_ats === 'greenhouse' && company.api_endpoint && !company.api_endpoint.startsWith('http')) {
      url = `https://boards.greenhouse.io/${company.api_endpoint}`;
    } else if (company.detected_ats === 'lever' && company.api_endpoint && !company.api_endpoint.startsWith('http')) {
      url = `https://jobs.lever.co/${company.api_endpoint}`;
    } else if (company.detected_ats === 'ashby' && company.api_endpoint && !company.api_endpoint.startsWith('http')) {
      url = `https://jobs.ashbyhq.com/${company.api_endpoint}`;
    } else if (company.detected_ats === 'workday' && company.api_endpoint && !company.api_endpoint.startsWith('http')) {
      url = `https://workday.wd5.myworkdayjobs.com/${company.api_endpoint}`;
    } else if (company.detected_ats === 'workable' && company.api_endpoint && !company.api_endpoint.startsWith('http')) {
      url = `https://apply.workable.com/${company.api_endpoint}`;
    } else if (company.detected_ats === 'bamboohr' && company.api_endpoint && !company.api_endpoint.startsWith('http')) {
      url = `https://${company.api_endpoint}.bamboohr.com/careers`;
    }
    
    try {
      const response = await httpClient.get<string>(url);
      const contentType = (response.headers as any)?.['content-type'] || (response.headers?.get ? response.headers.get('content-type') : '') || '';
      
      // 1. API Classification Check (JSON responses)
      if (typeof response.data === 'object' || contentType.includes('application/json') || String(response.data).trim().startsWith('{') || String(response.data).trim().startsWith('[')) {
        try {
          const json = typeof response.data === 'object' ? response.data : JSON.parse(response.data);
          const rawJobs = this.extractJobsFromJson(json, company);
          if (rawJobs.length > 0) {
            Logger.info(`[Hybrid Engine: API] Extracted ${rawJobs.length} jobs for ${company.name}`);
            return rawJobs;
          }
        } catch (e) {
          // Fall through if JSON parsing or extraction failed
        }
      }

      // Check if response data is empty or invalid
      if (!response.data || typeof response.data !== 'string') {
        Logger.warn(`Invalid or empty response data returned for ${company.name}`);
        return [];
      }

      // Load Cheerio for HTML parsing
      const $ = cheerio.load(response.data);

      // 2. Cloudflare Classification Check
      const titleText = $('title').text().trim();
      if (titleText.includes('Cloudflare') || titleText.includes('Attention Required') || response.data.includes('challenge-platform')) {
        Logger.warn(`[Hybrid Engine: Cloudflare] Cloudflare bot protection detected for ${company.name}`);
        throw new Error('Cloudflare protection active');
      }

      // 3. JSON-LD Extraction Check
      const jsonLdJobs: RawJob[] = [];
      $('script[type="application/ld+json"]').each((_, elem) => {
        try {
          const text = $(elem).text().trim();
          const json = JSON.parse(text);
          const objects = Array.isArray(json) ? json : (json['@graph'] || [json]);
          for (const obj of objects) {
            if (obj['@type'] === 'JobPosting' || obj['type'] === 'JobPosting') {
              const title = obj.title || obj.Title;
              let jobUrl = obj.url || obj.sameAs || url;
              if (jobUrl && jobUrl.startsWith('/')) {
                const parsedUrl = new URL(url);
                jobUrl = `${parsedUrl.protocol}//${parsedUrl.host}${jobUrl}`;
              }
              const jobId = obj.identifier?.value || obj.identifier || Buffer.from(jobUrl).toString('base64').substring(0, 16);
              if (title && jobUrl) {
                jsonLdJobs.push({
                  company: company.name,
                  id: String(jobId),
                  title: String(title),
                  location: obj.jobLocation?.address?.addressLocality || obj.jobLocation?.address?.addressCountry || 'Unknown',
                  url: String(jobUrl),
                  source: 'json_ld',
                  description: obj.description || '',
                  datePosted: obj.datePosted || new Date().toISOString(),
                });
              }
            }
          }
        } catch {}
      });

      if (jsonLdJobs.length > 0) {
        Logger.info(`[Hybrid Engine: JSON-LD] Extracted ${jsonLdJobs.length} jobs for ${company.name}`);
        return jsonLdJobs;
      }

      // 4. Next.js / Nuxt.js / React Inline State Extraction Check
      const nextDataText = $('#__NEXT_DATA__').text().trim();
      if (nextDataText) {
        try {
          const json = JSON.parse(nextDataText);
          const rawJobs = this.extractJobsFromState(json, company, url);
          if (rawJobs.length > 0) {
            Logger.info(`[Hybrid Engine: Next.js State] Extracted ${rawJobs.length} jobs for ${company.name}`);
            return rawJobs;
          }
        } catch {}
      }

      // 5. Static HTML Links Parsing (Fallback)
      const rawJobs: RawJob[] = [];
      const jobLinkPatterns = [/\/jobs?\//i, /\/postings?\//i, /\/careers?\//i, /\/positions?\//i, /detail/i];

      $('a').each((_, elem) => {
        const href = $(elem).attr('href');
        const text = $(elem).text().trim();

        if (!href || !text || text.length < 5 || text.length > 100) return;

        const isJobLink = jobLinkPatterns.some((pattern) => pattern.test(href));
        const hasSoftwareKeyword = /engineer|developer|sde|backend|frontend|fullstack|programmer|technologist|data/i.test(
          text,
        );

        if (isJobLink && hasSoftwareKeyword) {
          let resolvedUrl = href;
          if (href.startsWith('/')) {
            try {
              const parsedUrl = new URL(url);
              resolvedUrl = `${parsedUrl.protocol}//${parsedUrl.host}${href}`;
            } catch {}
          }

          const jobId = Buffer.from(resolvedUrl).toString('base64').substring(0, 16);
          rawJobs.push({
            company: company.name,
            id: jobId,
            title: text,
            location: 'India',
            url: resolvedUrl,
            source: 'static_html',
          });
        }
      });

      if (rawJobs.length > 0) {
        Logger.info(`[Hybrid Engine: Static HTML] Scraped ${rawJobs.length} jobs for ${company.name}`);
        return rawJobs;
      }

      // If we got here and found 0 jobs, let's log it
      Logger.warn(`[Hybrid Engine: Unknown/Empty] No jobs found for ${company.name} at ${url}`);
      return [];
    } catch (e: any) {
      Logger.warn(`Hybrid extraction failed for ${company.name}: ${e.message}`);
      throw e;
    }
  }

  private extractJobsFromJson(json: any, company: CompanyConfig): RawJob[] {
    const rawJobs: RawJob[] = [];
    const queue = [json];
    const visited = new Set();
    
    while (queue.length > 0) {
      const current = queue.shift();
      if (!current || typeof current !== 'object' || visited.has(current)) continue;
      visited.add(current);

      if (Array.isArray(current)) {
        for (const item of current) {
          if (item && typeof item === 'object' && this.looksLikeJob(item)) {
            rawJobs.push(this.mapJsonJobToRawJob(item, company));
          } else if (item && typeof item === 'object') {
            queue.push(item);
          }
        }
      } else {
        for (const key of Object.keys(current)) {
          const val = current[key];
          if (Array.isArray(val) && (key.toLowerCase().includes('job') || key.toLowerCase().includes('posting') || key.toLowerCase().includes('position') || key.toLowerCase().includes('item'))) {
            for (const item of val) {
              if (item && typeof item === 'object') {
                rawJobs.push(this.mapJsonJobToRawJob(item, company));
              }
            }
          } else if (val && typeof val === 'object') {
            queue.push(val);
          }
        }
      }
    }
    return rawJobs;
  }

  private extractJobsFromState(json: any, company: CompanyConfig, baseUrl: string): RawJob[] {
    const rawJobs: RawJob[] = [];
    const queue = [json];
    const visited = new Set();
    
    while (queue.length > 0) {
      const current = queue.shift();
      if (!current || typeof current !== 'object' || visited.has(current)) continue;
      visited.add(current);

      if (Array.isArray(current)) {
        for (const item of current) {
          if (item && typeof item === 'object' && this.looksLikeJob(item)) {
            rawJobs.push(this.mapJsonJobToRawJob(item, company, baseUrl));
          } else if (item && typeof item === 'object') {
            queue.push(item);
          }
        }
      } else {
        for (const key of Object.keys(current)) {
          const val = current[key];
          if (val && typeof val === 'object') {
            queue.push(val);
          }
        }
      }
    }
    return rawJobs;
  }

  private looksLikeJob(obj: any): boolean {
    const keys = Object.keys(obj).map(k => k.toLowerCase());
    const hasTitle = keys.some(k => k === 'title' || k === 'jobtitle' || k === 'role');
    const hasUrl = keys.some(k => k === 'url' || k === 'link' || k === 'href' || k === 'applyurl' || k === 'id' || k === 'jobid');
    return hasTitle && hasUrl;
  }

  private mapJsonJobToRawJob(item: any, company: CompanyConfig, baseUrl?: string): RawJob {
    const title = item.title || item.Title || item.jobTitle || item.role || 'Unknown Role';
    let jobUrl = item.url || item.applyUrl || item.link || item.href || company.api_endpoint;
    
    if (jobUrl && jobUrl.startsWith('/') && baseUrl) {
      try {
        const parsedUrl = new URL(baseUrl);
        jobUrl = `${parsedUrl.protocol}//${parsedUrl.host}${jobUrl}`;
      } catch {}
    }

    const id = item.id || item.jobId || item.postingId || Buffer.from(String(jobUrl)).toString('base64').substring(0, 16);
    return {
      company: company.name,
      id: String(id),
      title: String(title),
      location: item.location || item.Location || item.jobLocation || 'Unknown',
      url: String(jobUrl),
      source: 'json_api_extracted',
      description: item.description || item.Description || '',
    };
  }

  public async enrich(rawJob: RawJob, httpClient: HttpClient): Promise<RawJob> {
    try {
      const response = await httpClient.get<string>(rawJob.url);
      const $ = cheerio.load(response.data);
      $('script, style, nav, footer, header').remove();
      rawJob.description = $('body').text().trim().replace(/\s+/g, ' ');
    } catch (e: any) {
      Logger.warn(`Failed to enrich fallback job description for ${rawJob.id}: ${e.message}`);
    }
    return rawJob;
  }
}
