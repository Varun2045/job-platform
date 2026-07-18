import { CompanyConfig, RawJob, ScraperPlugin, Job } from '../Scraper.js';
import { HttpClient } from '../../core/HttpClient.js';
import { Logger } from '../../core/Logger.js';
import { JobNormalizer } from '../../core/JobNormalizer.js';

export const metadata = {
  id: 'microsoft',
  version: '1.0.0',
  ats: 'microsoft',
  author: 'Job Monitor',
};

export class MicrosoftPlugin implements ScraperPlugin {
  public metadata = metadata;

  public capabilities = {
    supportsPagination: true,
    supportsIncrementalSync: false,
    supportsJobDescriptions: false, // Search API returns snippet only
    supportsRemoteFiltering: true,
  };

  private static requestQueue: (() => Promise<void>)[] = [];
  private static isProcessingQueue = false;
  private static lastRequestTime = 0;
  private static readonly RATE_LIMIT_MS = 1500; // Configurable: 1.5 seconds

  private async throttle(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      MicrosoftPlugin.requestQueue.push(async () => {
        try {
          const now = Date.now();
          const timeSinceLast = now - MicrosoftPlugin.lastRequestTime;
          if (timeSinceLast < MicrosoftPlugin.RATE_LIMIT_MS) {
            const waitTime = MicrosoftPlugin.RATE_LIMIT_MS - timeSinceLast;
            Logger.debug(`Microsoft rate-limiting: queue throttling for ${waitTime}ms...`);
            await new Promise((r) => setTimeout(r, waitTime));
          }
          MicrosoftPlugin.lastRequestTime = Date.now();
          resolve();
        } catch (e) {
          reject(e);
        }
      });
      this.triggerQueueProcessing();
    });
  }

  private async triggerQueueProcessing(): Promise<void> {
    if (MicrosoftPlugin.isProcessingQueue) return;
    MicrosoftPlugin.isProcessingQueue = true;

    while (MicrosoftPlugin.requestQueue.length > 0) {
      const nextRequest = MicrosoftPlugin.requestQueue.shift();
      if (nextRequest) {
        await nextRequest();
      }
    }

    MicrosoftPlugin.isProcessingQueue = false;
  }

  public supports(company: CompanyConfig): boolean {
    return company.detected_ats === 'microsoft';
  }

  public async discover(company: CompanyConfig, httpClient: HttpClient): Promise<RawJob[]> {
    const allPositions: any[] = [];

    // Fetch 5 pages of 20 positions to gather up to 100 jobs (matching original limit)
    for (let start = 0; start < 100; start += 20) {
      const url = `https://apply.careers.microsoft.com/api/pcsx/search?domain=microsoft.com&query=India&start=${start}`;
      Logger.debug(`Microsoft Careers API request: ${url}`);
      try {
        const response = await httpClient.get<any>(url);
        if (response.data && response.data.data && Array.isArray(response.data.data.positions)) {
          allPositions.push(...response.data.data.positions);
          if (response.data.data.positions.length < 20) {
            break; // Reached last page
          }
        } else {
          break;
        }
      } catch (err: any) {
        Logger.error(`Failed to fetch Microsoft page start=${start}`, err);
        break;
      }
    }

    Logger.debug(`Microsoft API returned ${allPositions.length} jobs for India`);

    const rawJobs = allPositions.map((job: any) => {
      const jobId = String(job.id);
      const jobUrl = `https://jobs.careers.microsoft.com/global/en/share/${jobId}`;
      const locationsList = Array.isArray(job.locations) ? job.locations.join(', ') : 'India';

      const dateVal =
        typeof job.postedTs === 'number' ? new Date(job.postedTs * 1000).toISOString() : new Date().toISOString();

      return {
        company: company.name,
        id: jobId,
        title: job.name,
        location: locationsList,
        url: jobUrl,
        datePosted: dateVal,
        team: job.department ?? 'Engineering',
        employmentType: job.workLocationOption ?? 'Full-time',
        source: 'microsoft',
        description: '', // Empty initially, filled in enrich stage
        raw: job,
      };
    });

    return rawJobs;
  }

  public async enrich(rawJob: RawJob, httpClient: HttpClient): Promise<RawJob> {
    const detailUrl = `https://apply.careers.microsoft.com/api/pcsx/position_details?position_id=${rawJob.id}&domain=microsoft.com&hl=en`;

    let attempt = 0;
    const maxAttempts = 4;
    let delayMs = 1000; // 1s initial backoff

    while (attempt < maxAttempts) {
      attempt++;
      await this.throttle();

      try {
        Logger.debug(
          `Microsoft fetching description from detail API (Attempt ${attempt}/${maxAttempts}): ${detailUrl}`,
        );
        const response = await httpClient.request<any>(detailUrl, {
          method: 'GET',
          retries: 1, // Disable HttpClient's built-in retries
          timeoutMs: 10000,
        });

        if (response.status === 200 && response.data && response.data.data) {
          const details = response.data.data;
          rawJob.description = details.jobDescription ?? rawJob.description;
          rawJob.team = details.department ?? rawJob.team;
          break; // Success! Exit retry loop
        }
      } catch (err: any) {
        Logger.warn(`Microsoft fetch attempt ${attempt} failed: ${err.message}`);

        if (attempt >= maxAttempts) {
          Logger.error(`Max attempts reached for Microsoft job details enrichment on ${rawJob.id}`);
          break;
        }

        // Determine wait time
        let waitTimeMs = delayMs;

        // Check if err is HttpError with status 429
        if (err.name === 'HttpError' || err.status === 429) {
          const status = err.status;
          const headers = err.headers;

          if (status === 429 && headers) {
            const retryAfterHeader = headers.get('retry-after');
            if (retryAfterHeader) {
              // Try parsing as integer number of seconds first
              let retryAfterSec = parseInt(retryAfterHeader, 10);
              if (isNaN(retryAfterSec)) {
                // Fallback to parsing as HTTP Date string
                const parsedDate = Date.parse(retryAfterHeader);
                if (!isNaN(parsedDate)) {
                  retryAfterSec = Math.ceil((parsedDate - Date.now()) / 1000);
                }
              }
              if (!isNaN(retryAfterSec) && retryAfterSec > 0) {
                waitTimeMs = retryAfterSec * 1000;
                Logger.info(`Microsoft 429 rate limit hit. Respecting Retry-After header: waiting ${waitTimeMs}ms...`);
              }
            } else {
              Logger.info(`Microsoft 429 rate limit hit. Waiting exponential backoff: ${waitTimeMs}ms...`);
            }
          }
        }

        await new Promise((resolve) => setTimeout(resolve, waitTimeMs));
        delayMs *= 2; // Double backoff for next round
      }
    }

    return rawJob;
  }

  public normalize(rawJob: RawJob, company: CompanyConfig): Job {
    return JobNormalizer.normalize(rawJob, company);
  }
}
export const plugin = new MicrosoftPlugin();
