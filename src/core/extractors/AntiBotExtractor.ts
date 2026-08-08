import { Extractor, ExtractionContext, ExtractionResult } from '../ExtractionEngine.js';
import { BrowserPool } from '../BrowserPool.js';
import { Logger } from '../Logger.js';
import { HttpClient } from '../HttpClient.js';

export class AntiBotExtractor implements Extractor {
  public name = 'AntiBotExtractor';
  public priority = 7; 

  public async canHandle(context: ExtractionContext): Promise<boolean> {
    // Activate if the company has explicitly requested persistent profiles or if we detected a block
    return !!context.company.use_persistent_profile || !!context.company.cdp_endpoint;
  }

  public async extract(context: ExtractionContext): Promise<ExtractionResult> {
    const { company, url } = context;
    const startTime = Date.now();
    
    Logger.info(`[AntiBotExtractor] Attempting token harvesting for ${company.name}...`);
    
    const pool = BrowserPool.getInstance();
    const { context: browserCtx, page } = await pool.acquirePage({
      usePersistent: company.use_persistent_profile,
      cdpEndpoint: company.cdp_endpoint || undefined
    });

    try {
      // 1. Navigate and wait for challenge resolution
      await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
      
      // Wait for potential Cloudflare/Turnstile to clear
      await page.waitForTimeout(5000);
      
      // 2. Category 5: Token Harvesting
      // Extract cookies to be reused by HttpClient
      const cookies = await browserCtx.cookies();
      const cookieString = cookies.map(c => `${c.name}=${c.value}`).join('; ');
      
      // Store in HttpClient's sticky session cache
      const domain = new URL(url).hostname;
      HttpClient.setSharedCookies(domain, cookieString);
      
      Logger.info(`[AntiBotExtractor] Successfully harvested ${cookies.length} cookies for ${domain}`);
      
      // 3. Optional: Try to extract jobs while we have the page open
      const links = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('a'))
          .map(a => ({ href: a.href, text: a.innerText.trim() }))
          .filter(a => a.href && a.text.length > 5);
      });

      await pool.releasePage(browserCtx);

      return {
        success: false, // We return false so the engine continues to the next extractor which can now use the harvested tokens
        extractor: this.name,
        executionTimeMs: Date.now() - startTime,
        jobs: [],
        warnings: [`Harvested tokens for ${domain}`],
        metadata: {
          cookieCount: cookies.length,
          harvestedDomain: domain
        }
      };
    } catch (err: any) {
      await pool.releasePage(browserCtx);
      Logger.error(`[AntiBotExtractor] Token harvesting failed: ${err.message}`);
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
}
