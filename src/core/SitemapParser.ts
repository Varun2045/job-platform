import { HttpClient } from './HttpClient.js';
import { Logger } from './Logger.js';
import * as cheerio from 'cheerio';

export interface SitemapEntry {
  loc: string;
  lastmod?: string;
  changefreq?: string;
  priority?: number;
}

export interface SitemapParseResult {
  entries: SitemapEntry[];
  totalEntries: number;
  parseErrors: number;
  processingTimeMs: number;
}

export class SitemapParser {
  private httpClient: HttpClient;
  private jobUrlPatterns: RegExp[];

  constructor() {
    this.httpClient = new HttpClient();
    // Common job URL patterns to filter relevant URLs
    this.jobUrlPatterns = [
      /\/jobs?\//i,
      /\/careers?\//i,
      /\/opportunities?\//i,
      /\/positions?\//i,
      /\/vacancies?\//i,
      /\/job-\d+/i,
      /\/position-\d+/i,
      /\/job\/[a-z0-9-]+/i,
      /\/apply\/[a-z0-9-]+/i,
    ];
  }

  /**
   * Parse XML sitemap from a URL
   */
  public async parseFromUrl(sitemapUrl: string): Promise<SitemapParseResult> {
    const startTime = Date.now();
    Logger.info(`[SitemapParser] Fetching sitemap: ${sitemapUrl}`);

    try {
      const response = await this.httpClient.get(sitemapUrl);
      const xmlContent = response.data as string;
      
      return this.parseXmlContent(xmlContent);
    } catch (error: any) {
      Logger.error(`[SitemapParser] Failed to fetch sitemap: ${error.message}`);
      return {
        entries: [],
        totalEntries: 0,
        parseErrors: 1,
        processingTimeMs: Date.now() - startTime,
      };
    }
  }

  /**
   * Parse XML sitemap content
   */
  public parseXmlContent(xmlContent: string): SitemapParseResult {
    const startTime = Date.now();
    const entries: SitemapEntry[] = [];
    let parseErrors = 0;

    try {
      const $ = cheerio.load(xmlContent, { xmlMode: true });
      
      // Handle regular sitemap
      $('url').each((_, element) => {
        try {
          const loc = $(element).find('loc').text().trim();
          const lastmod = $(element).find('lastmod').text().trim() || undefined;
          const changefreq = $(element).find('changefreq').text().trim() || undefined;
          const priorityStr = $(element).find('priority').text().trim();
          const priority = priorityStr ? parseFloat(priorityStr) : undefined;

          if (loc) {
            entries.push({ loc, lastmod, changefreq, priority });
          }
        } catch (error) {
          parseErrors++;
        }
      });

      // Handle sitemap index
      $('sitemap').each((_, element) => {
        try {
          const loc = $(element).find('loc').text().trim();
          const lastmod = $(element).find('lastmod').text().trim() || undefined;

          if (loc) {
            entries.push({ loc, lastmod });
          }
        } catch (error) {
          parseErrors++;
        }
      });

      Logger.info(`[SitemapParser] Parsed ${entries.length} entries from sitemap`);
    } catch (error: any) {
      Logger.error(`[SitemapParser] XML parsing error: ${error.message}`);
      parseErrors++;
    }

    return {
      entries,
      totalEntries: entries.length,
      parseErrors,
      processingTimeMs: Date.now() - startTime,
    };
  }

  /**
   * Filter sitemap entries to find job-related URLs
   */
  public filterJobUrls(entries: SitemapEntry[]): SitemapEntry[] {
    return entries.filter(entry => {
      return this.jobUrlPatterns.some(pattern => pattern.test(entry.loc));
    });
  }

  /**
   * Discover job URLs from a sitemap index recursively
   */
  public async discoverJobsFromSitemapIndex(
    sitemapIndexUrl: string,
    maxDepth: number = 2,
    currentDepth: number = 0
  ): Promise<string[]> {
    if (currentDepth >= maxDepth) {
      Logger.warn(`[SitemapParser] Max depth reached for sitemap discovery`);
      return [];
    }

    Logger.info(`[SitemapParser] Discovering jobs from sitemap index (depth ${currentDepth + 1}/${maxDepth})`);
    
    const result = await this.parseFromUrl(sitemapIndexUrl);
    const jobUrls: string[] = [];

    // Filter for job URLs in the current sitemap
    const directJobUrls = this.filterJobUrls(result.entries);
    jobUrls.push(...directJobUrls.map(entry => entry.loc));

    // Recursively process child sitemaps
    const sitemapUrls = result.entries.filter(entry => 
      entry.loc.endsWith('.xml') && !entry.loc.includes('sitemap')
    );

    for (const sitemap of sitemapUrls) {
      try {
        const childJobUrls = await this.discoverJobsFromSitemapIndex(
          sitemap.loc,
          maxDepth,
          currentDepth + 1
        );
        jobUrls.push(...childJobUrls);
      } catch (error: any) {
        Logger.error(`[SitemapParser] Failed to process child sitemap ${sitemap.loc}: ${error.message}`);
      }
    }

    // Remove duplicates
    const uniqueJobUrls = [...new Set(jobUrls)];
    Logger.info(`[SitemapParser] Discovered ${uniqueJobUrls.length} unique job URLs`);

    return uniqueJobUrls;
  }

  /**
   * Extract job IDs from sitemap URLs
   */
  public extractJobIdsFromUrls(urls: string[]): Map<string, string> {
    const jobIds = new Map<string, string>();

    for (const url of urls) {
      try {
        const urlObj = new URL(url);
        const pathParts = urlObj.pathname.split('/').filter(Boolean);
        
        // Try to extract job ID from various patterns
        const lastPart = pathParts[pathParts.length - 1];
        const secondLastPart = pathParts[pathParts.length - 2];

        // Pattern: /jobs/123456 or /job/abc-def
        if (lastPart && /^\d+$/.test(lastPart)) {
          jobIds.set(lastPart, url);
        } else if (lastPart && lastPart.length > 3) {
          jobIds.set(lastPart, url);
        } else if (secondLastPart && secondLastPart.length > 3) {
          jobIds.set(secondLastPart, url);
        }
      } catch (error) {
        Logger.warn(`[SitemapParser] Failed to extract job ID from URL: ${url}`);
      }
    }

    return jobIds;
  }

  /**
   * Validate sitemap URL
   */
  public isValidSitemapUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return urlObj.pathname.endsWith('.xml') || 
             urlObj.pathname.includes('sitemap') ||
             urlObj.searchParams.has('sitemap');
    } catch {
      return false;
    }
  }
}