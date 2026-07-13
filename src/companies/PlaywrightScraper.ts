import { chromium, Browser, Page } from 'playwright';
import { CompanyConfig, RawJob } from './Scraper.js';
import { Logger } from '../core/Logger.js';
import fs from 'fs';
import path from 'path';

export class PlaywrightScraper {
  private async ensureScreenshotDir(): Promise<string> {
    const dir = path.join(process.cwd(), 'storage', 'screenshots');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    return dir;
  }

  private async captureError(companyId: string, page: Page): Promise<void> {
    try {
      const dir = await this.ensureScreenshotDir();
      const filename = `${companyId}_error.png`;
      const filepath = path.join(dir, filename);
      await page.screenshot({ path: filepath, fullPage: true });
      Logger.error(`Saved Playwright failure screenshot for ${companyId} at: ${filepath}`);
    } catch (err) {
      Logger.error(`Failed to capture screenshot for ${companyId}`, err as any);
    }
  }

  public async discover(company: CompanyConfig): Promise<RawJob[]> {
    let url = company.api_endpoint || `https://www.${company.id}.com/careers`;
    if (company.detected_ats === 'greenhouse' && company.api_endpoint && !company.api_endpoint.startsWith('http')) {
      url = `https://boards.greenhouse.io/${company.api_endpoint}`;
    } else if (company.detected_ats === 'lever' && company.api_endpoint && !company.api_endpoint.startsWith('http')) {
      url = `https://jobs.lever.co/${company.api_endpoint}`;
    }
    Logger.info(`Launching Playwright scraper for ${company.name} at: ${url}`);

    let browser: Browser | null = null;
    try {
      browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });

      const page = await browser.newPage();
      await page.setViewportSize({ width: 1280, height: 800 });
      
      // Navigate with timeout
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
      
      // Wait another 3s for hydration/rendering of lists
      await page.waitForTimeout(3000);

      // Scrape all links matching keyword heuristics
      const rawJobs: RawJob[] = [];
      const links = await page.evaluate(() => {
        const anchors = Array.from(document.querySelectorAll('a'));
        return anchors.map(a => ({
          href: a.href,
          text: a.innerText.trim()
        })).filter(a => a.href && a.text);
      });

      const jobLinkPatterns = [
        /\/jobs?\//i,
        /\/postings?\//i,
        /\/careers?\//i,
        /\/positions?\//i,
        /detail/i
      ];

      for (const link of links) {
        if (link.text.length < 5 || link.text.length > 100) continue;

        const isJobLink = jobLinkPatterns.some((pattern) => pattern.test(link.href));
        const hasSoftwareKeyword = /engineer|developer|sde|backend|frontend|fullstack|programmer|technologist|data/i.test(link.text);

        if (isJobLink && hasSoftwareKeyword) {
          const jobId = Buffer.from(link.href).toString('base64').substring(0, 16);
          rawJobs.push({
            company: company.name,
            id: jobId,
            title: link.text,
            location: 'India',
            url: link.href,
            source: 'playwright_fallback'
          });
        }
      }

      Logger.info(`Playwright scraper found ${rawJobs.length} potential jobs for ${company.name}`);
      return rawJobs;

    } catch (e: any) {
      Logger.error(`Playwright discovery failed for ${company.name}: ${e.message}`);
      // Take screenshot of failure before throwing
      if (browser) {
        try {
          const pages = browser.contexts()[0]?.pages() ?? [];
          if (pages.length > 0) {
            await this.captureError(company.id, pages[0]);
          }
        } catch (screenshotErr) {
          // Ignore
        }
      }
      throw e;
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  public async enrich(rawJob: RawJob): Promise<RawJob> {
    Logger.info(`Playwright enriching job description for ${rawJob.id} at URL: ${rawJob.url}`);
    
    let browser: Browser | null = null;
    try {
      browser = await chromium.launch({ headless: true });
      const page = await browser.newPage();
      await page.goto(rawJob.url, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(2000);

      // Extract inner text of body excluding headers/footers
      const pageText = await page.evaluate(() => {
        // Remove noise
        const removeSelectors = ['script', 'style', 'header', 'footer', 'nav'];
        removeSelectors.forEach(sel => {
          document.querySelectorAll(sel).forEach(el => el.remove());
        });
        return document.body.innerText.trim();
      });

      rawJob.description = pageText.replace(/\s+/g, ' ');
      return rawJob;
    } catch (e: any) {
      Logger.warn(`Playwright enrichment failed for ${rawJob.id}: ${e.message}`);
      return rawJob;
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }
}
