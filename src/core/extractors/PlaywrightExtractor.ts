import fs from 'fs';
import path from 'path';
import { Page } from 'playwright';
import { Extractor, ExtractionContext, ExtractionResult } from '../ExtractionEngine.js';
import { BrowserPool } from '../BrowserPool.js';
import { RawJob } from '../../companies/Scraper.js';
import { Logger } from '../Logger.js';
import { BroadcastManager } from '../BroadcastManager.js';

import { config } from '../../config/config.js';

export class PlaywrightExtractor implements Extractor {
  public name = 'PlaywrightExtractor';
  public priority = 6; // Lowest priority strategy (fallback of last resort)

  public async canHandle(context: ExtractionContext): Promise<boolean> {
    return context.url.startsWith('http') && config.features.playwright !== false;
  }

  public async extract(context: ExtractionContext): Promise<ExtractionResult> {
    const { company, url } = context;
    const startTime = Date.now();

    Logger.info(`[PlaywrightExtractor] Acquiring browser page from context pool for ${company.name}...`);
    const pool = BrowserPool.getInstance();
    const { context: browserCtx, page } = await pool.acquirePage({
      usePersistent: company.use_persistent_profile,
      cdpEndpoint: company.cdp_endpoint || undefined
    });

    try {
      // Navigate to URL
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 35000 });

      // Category 5: Cloudflare Turnstile Action Bypass
      // Often, simply waiting for the layout to stabilize allows the script to pass.
      await page.waitForLoadState('networkidle').catch(() => {});
      await page.waitForTimeout(4000); 

      // Category 4: Jitter and Backoff Intervals
      await page.waitForTimeout(Math.random() * 2000);

      // Evaluate job listings
      const links = await page.evaluate(() => {
        const anchors = Array.from(document.querySelectorAll('a'));
        return anchors
          .map(a => ({
            href: a.href,
            text: a.innerText.trim(),
          }))
          .filter(a => a.href && a.text);
      });

      const rawJobs: RawJob[] = [];
      const jobLinkPatterns = [/\/jobs?\//i, /\/postings?\//i, /\/careers?\//i, /\/positions?\//i, /detail/i];

      for (const link of links) {
        if (link.text.length < 5 || link.text.length > 100) continue;

        const isJobLink = jobLinkPatterns.some(pattern => pattern.test(link.href));
        const hasSoftwareKeyword = /engineer|developer|sde|backend|frontend|fullstack|programmer|technologist|data/i.test(link.text);

        if (isJobLink && hasSoftwareKeyword) {
          const jobId = Buffer.from(link.href).toString('base64').substring(0, 16);
          rawJobs.push({
            company: company.name,
            id: jobId,
            title: link.text,
            location: 'India',
            url: link.href,
            source: 'playwright_extractor',
          });
        }
      }

      await pool.releasePage(browserCtx);

      if (rawJobs.length > 0) {
        BroadcastManager.incrementExtractorMetric(this.name);
      }

      return {
        success: rawJobs.length > 0,
        extractor: this.name,
        executionTimeMs: Date.now() - startTime,
        jobs: rawJobs,
        warnings: rawJobs.length === 0 ? ['Reachable, but found 0 matching job links.'] : [],
        metadata: {
          totalLinksScraped: links.length
        }
      };
    } catch (err: any) {
      Logger.error(`[PlaywrightExtractor] Execution failed for ${company.name}: ${err.message}`);
      
      // Capture error screenshot before releasing
      try {
        await this.captureError(company.id, page);
      } catch {}

      await pool.releasePage(browserCtx);

      return {
        success: false,
        extractor: this.name,
        executionTimeMs: Date.now() - startTime,
        jobs: [],
        warnings: [err.message],
        metadata: {},
        error: err.message
      };
    }
  }

  private async captureError(companyId: string, page: Page): Promise<void> {
    try {
      const dir = path.join(process.cwd(), 'storage', 'screenshots');
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const filename = `${companyId}_error.png`;
      const filepath = path.join(dir, filename);
      await page.screenshot({ path: filepath, fullPage: true });
      Logger.error(`[PlaywrightExtractor] Saved failure screenshot for ${companyId} at: ${filepath}`);
    } catch (err) {
      Logger.error(`[PlaywrightExtractor] Failed to capture error screenshot for ${companyId}`, err as any);
    }
  }
}
