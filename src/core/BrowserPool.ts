import { chromium, Browser, BrowserContext, Page } from 'playwright';
import { Logger } from './Logger.js';
import { BroadcastManager } from './BroadcastManager.js';

interface BrowserEntry {
  browser: Browser;
  activeContextsCount: number;
  lastActiveTime: number;
}

export class BrowserPool {
  public static launchesCount = 0;
  private static instance: BrowserPool | null = null;
  private browsers: BrowserEntry[] = [];
  
  private maxBrowserInstances = 3;
  private maxContextsPerBrowser = 8;
  private idleTimeoutMs = 30000;
  
  private idleTimer: NodeJS.Timeout | null = null;
  private contextToBrowserMap: Map<BrowserContext, Browser> = new Map();

  private constructor() {}

  public static getInstance(): BrowserPool {
    if (!BrowserPool.instance) {
      BrowserPool.instance = new BrowserPool();
    }
    return BrowserPool.instance;
  }

  /**
   * Safe getter for browser instance that handles connections and health checks.
   */
  private async getBrowserForAllocation(): Promise<BrowserEntry> {
    // 1. Clean unhealthy browsers
    for (let i = this.browsers.length - 1; i >= 0; i--) {
      const entry = this.browsers[i];
      if (!entry.browser.isConnected()) {
        Logger.warn('[BrowserPool] Unhealthy or disconnected browser detected, cleaning up...');
        try {
          await entry.browser.close();
        } catch {}
        this.browsers.splice(i, 1);
      }
    }

    // 2. Find a browser with active context capacity
    for (const entry of this.browsers) {
      if (entry.activeContextsCount < this.maxContextsPerBrowser) {
        return entry;
      }
    }

    // 3. Launch a new one if limit not reached
    if (this.browsers.length < this.maxBrowserInstances) {
      Logger.info(`[BrowserPool] Launching new Chromium browser instance (${this.browsers.length + 1}/${this.maxBrowserInstances})...`);
      const newBrowser = await chromium.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--disable-blink-features=AutomationControlled'
        ]
      });
      BroadcastManager.incrementBrowserMetric('launch');
      BrowserPool.launchesCount++;

      const entry: BrowserEntry = {
        browser: newBrowser,
        activeContextsCount: 0,
        lastActiveTime: Date.now()
      };
      this.browsers.push(entry);
      return entry;
    }

    // 4. Overloaded: Fall back to the browser with fewest active contexts
    let bestEntry = this.browsers[0];
    let minContexts = Infinity;
    for (const entry of this.browsers) {
      if (entry.activeContextsCount < minContexts) {
        minContexts = entry.activeContextsCount;
        bestEntry = entry;
      }
    }
    return bestEntry;
  }

  /**
   * Start timer to clean up idle browsers.
   */
  private startIdleTimer(): void {
    if (this.idleTimer) return;
    this.idleTimer = setInterval(async () => {
      const now = Date.now();
      for (let i = this.browsers.length - 1; i >= 0; i--) {
        const entry = this.browsers[i];
        if (entry.activeContextsCount === 0 && now - entry.lastActiveTime > this.idleTimeoutMs) {
          Logger.info('[BrowserPool] Idle browser timeout reached. Disposing instance...');
          try {
            await entry.browser.close();
          } catch {}
          this.browsers.splice(i, 1);
        }
      }
      if (this.browsers.length === 0 && this.idleTimer) {
        clearInterval(this.idleTimer);
        this.idleTimer = null;
      }
    }, 10000);
  }

  /**
   * Acquires a page inside a dedicated browser context.
   */
  public async acquirePage(): Promise<{ context: BrowserContext; page: Page }> {
    const entry = await this.getBrowserForAllocation();
    entry.activeContextsCount++;
    entry.lastActiveTime = Date.now();

    this.startIdleTimer();

    const context = await entry.browser.newContext({
      viewport: { width: 1280, height: 800 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
      locale: 'en-US',
      timezoneId: 'America/New_York',
      extraHTTPHeaders: {
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Sec-Ch-Ua': '"Not/A)Brand";v="8", "Chromium";v="126", "Google Chrome";v="126"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"Windows"',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1'
      }
    });

    this.contextToBrowserMap.set(context, entry.browser);
    const page = await context.newPage();
    
    // Add stealth initialization scripts to bypass basic bot detectors
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
      (window as any).chrome = { runtime: {} };
      Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
      Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
    });

    return { context, page };
  }

  /**
   * Releases and cleans up context and page resources.
   */
  public async releasePage(context: BrowserContext): Promise<void> {
    try {
      await context.close();
    } catch (err: any) {
      Logger.error('[BrowserPool] Error closing context', err);
    } finally {
      const browser = this.contextToBrowserMap.get(context);
      if (browser) {
        this.contextToBrowserMap.delete(context);
        const entry = this.browsers.find(b => b.browser === browser);
        if (entry) {
          entry.activeContextsCount = Math.max(0, entry.activeContextsCount - 1);
          entry.lastActiveTime = Date.now();
        }
      }
    }
  }

  /**
   * Shuts down the entire browser pool instance.
   */
  public async shutdown(): Promise<void> {
    Logger.info('[BrowserPool] Shutting down shared browser pool...');
    if (this.idleTimer) {
      clearInterval(this.idleTimer);
      this.idleTimer = null;
    }

    // Close contexts mapping
    this.contextToBrowserMap.clear();

    // Close all browser instances
    const list = [...this.browsers];
    this.browsers = [];
    for (const entry of list) {
      try {
        await entry.browser.close();
      } catch {}
    }
  }

  /**
   * Telemetry stats helper
   */
  public getStats() {
    const activeContexts = Array.from(this.contextToBrowserMap.keys()).length;
    return {
      activeBrowsers: this.browsers.length,
      activeContexts,
      maxBrowsers: this.maxBrowserInstances,
      maxContextsPerBrowser: this.maxContextsPerBrowser,
      isLaunched: this.browsers.length > 0
    };
  }
}
