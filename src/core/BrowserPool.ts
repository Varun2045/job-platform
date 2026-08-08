import { chromium, Browser, BrowserContext, Page, LaunchOptions } from 'playwright';
import { Logger } from './Logger.js';
import { BroadcastManager } from './BroadcastManager.js';
import path from 'path';
import os from 'os';

interface BrowserEntry {
  browser: Browser | BrowserContext; // Can be a regular browser or a persistent context
  isPersistent: boolean;
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
  private contextToBrowserMap: Map<BrowserContext, Browser | BrowserContext> = new Map();

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
  private async getBrowserForAllocation(options: { usePersistent?: boolean; cdpEndpoint?: string } = {}): Promise<BrowserEntry> {
    // 1. Clean unhealthy browsers
    for (let i = this.browsers.length - 1; i >= 0; i--) {
      const entry = this.browsers[i];
      const isConnected = 'isConnected' in entry.browser ? entry.browser.isConnected() : true; // BrowserContext doesn't have isConnected in the same way
      
      if (!isConnected) {
        Logger.warn('[BrowserPool] Unhealthy or disconnected browser detected, cleaning up...');
        try {
          await entry.browser.close();
        } catch {}
        this.browsers.splice(i, 1);
      }
    }

    // 2. Category 3: CDP Connection
    if (options.cdpEndpoint) {
      Logger.info(`[BrowserPool] Connecting to existing browser via CDP: ${options.cdpEndpoint}`);
      const browser = await chromium.connectOverCDP(options.cdpEndpoint);
      const entry: BrowserEntry = {
        browser,
        isPersistent: false,
        activeContextsCount: 0,
        lastActiveTime: Date.now()
      };
      this.browsers.push(entry);
      return entry;
    }

    // 3. Category 3: Persistent User Profiles
    if (options.usePersistent) {
      const userDataDir = path.join(os.tmpdir(), `playwright-profile-${Date.now()}`);
      Logger.info(`[BrowserPool] Launching persistent browser context: ${userDataDir}`);
      const context = await chromium.launchPersistentContext(userDataDir, {
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-blink-features=AutomationControlled'
        ]
      });
      const entry: BrowserEntry = {
        browser: context,
        isPersistent: true,
        activeContextsCount: 0,
        lastActiveTime: Date.now()
      };
      this.browsers.push(entry);
      return entry;
    }

    // 4. Standard Pooled Browsers
    for (const entry of this.browsers) {
      if (!entry.isPersistent && entry.activeContextsCount < this.maxContextsPerBrowser) {
        return entry;
      }
    }

    // 5. Launch a new one if limit not reached
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
        isPersistent: false,
        activeContextsCount: 0,
        lastActiveTime: Date.now()
      };
      this.browsers.push(entry);
      return entry;
    }

    // 6. Overloaded: Fall back to the browser with fewest active contexts
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

  public async acquirePage(options: { usePersistent?: boolean; cdpEndpoint?: string } = {}): Promise<{ context: BrowserContext; page: Page }> {
    const entry = await this.getBrowserForAllocation(options);
    entry.activeContextsCount++;
    entry.lastActiveTime = Date.now();

    this.startIdleTimer();

    let context: BrowserContext;
    if (entry.isPersistent) {
      context = entry.browser as BrowserContext;
    } else {
      context = await (entry.browser as Browser).newContext({
        viewport: { width: 1280, height: 800 },
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
        locale: 'en-US',
        timezoneId: 'America/New_York',
        extraHTTPHeaders: {
          'Accept-Language': 'en-US,en;q=0.9',
          'Sec-Ch-Ua': '"Not/A)Brand";v="8", "Chromium";v="126", "Google Chrome";v="126"',
          'Sec-Ch-Ua-Mobile': '?0',
          'Sec-Ch-Ua-Platform': '"Windows"',
        }
      });
    }

    this.contextToBrowserMap.set(context, entry.browser);
    const page = await context.newPage();
    
    await page.addInitScript(() => {
      // Category 2: Enhanced Browser Fingerprint Evasion
      
      // 1. WebDriver detection evasion
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
      delete (navigator as any).__proto__.webdriver;
      
      // 2. Chrome object injection
      (window as any).chrome = {
        runtime: {},
        loadTimes: function() {},
        csi: function() {},
        app: {}
      };
      
      // 3. Navigator languages spoofing
      Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
      
      // 4. Navigator plugins spoofing
      Object.defineProperty(navigator, 'plugins', {
        get: () => [
          { name: 'Chrome PDF Plugin', description: 'Portable Document Format', filename: 'internal-pdf-viewer' },
          { name: 'Chrome PDF Viewer', description: '', filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai' },
          { name: 'Native Client', description: '', filename: 'internal-nacl-plugin' },
        ]
      });
      
      // 5. Screen resolution spoofing
      const originalScreen = screen;
      Object.defineProperty(screen, 'availWidth', { get: () => 1920 });
      Object.defineProperty(screen, 'availHeight', { get: () => 1040 });
      Object.defineProperty(screen, 'width', { get: () => 1920 });
      Object.defineProperty(screen, 'height', { get: () => 1080 });
      
      // 6. Hardware concurrency spoofing
      Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => 8 });
      
      // 7. Device memory spoofing
      Object.defineProperty(navigator, 'deviceMemory', { get: () => 8 });
      
      // 8. Connection spoofing
      Object.defineProperty(navigator, 'connection', {
        get: () => ({
          effectiveType: '4g',
          rtt: 100,
          downlink: 10,
          saveData: false,
        })
      });
      
      // 9. Permission state spoofing
      const originalQuery = (navigator.permissions as any).query;
      (navigator.permissions as any).query = (parameters: any) => (
        parameters.name === 'notifications' ?
          Promise.resolve({ state: Notification.permission }) :
          originalQuery(parameters)
      );
      
      // 10. Canvas fingerprint randomization
      const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
      HTMLCanvasElement.prototype.toDataURL = function(type?: string) {
        if (!type) {
          const context = this.getContext('2d');
          if (context) {
            const imageData = context.getImageData(0, 0, this.width, this.height);
            for (let i = 0; i < imageData.data.length; i += 4) {
              imageData.data[i] = imageData.data[i] + Math.floor(Math.random() * 10) - 5;
              imageData.data[i + 1] = imageData.data[i + 1] + Math.floor(Math.random() * 10) - 5;
              imageData.data[i + 2] = imageData.data[i + 2] + Math.floor(Math.random() * 10) - 5;
            }
            context.putImageData(imageData, 0, 0);
          }
        }
        return originalToDataURL.apply(this, arguments as any);
      };
      
      // 11. WebGL fingerprint randomization
      const getParameter = WebGLRenderingContext.prototype.getParameter;
      WebGLRenderingContext.prototype.getParameter = function(parameter) {
        if (parameter === 37445) {
          return 'Intel Inc.';
        }
        if (parameter === 37446) {
          return 'Intel Iris OpenGL Engine';
        }
        return getParameter.apply(this, arguments as any);
      };
      
      // 12. Audio fingerprint randomization
      const originalGetChannelData = (AudioContext.prototype as any).getChannelData;
      (AudioContext.prototype as any).getChannelData = function(channel: any) {
        const result = originalGetChannelData.apply(this, arguments as any);
        for (let i = 0; i < result.length; i++) {
          result[i] = result[i] + Math.random() * 0.0001 - 0.00005;
        }
        return result;
      };
      
      // 13. Font enumeration spoofing
      const originalMeasureText = (CanvasRenderingContext2D as any).prototype.measureText;
      (CanvasRenderingContext2D as any).prototype.measureText = function(text: any) {
        const result = originalMeasureText.apply(this, arguments as any);
        result.width = result.width + Math.random() * 0.1 - 0.05;
        return result;
      };
      
      // 14. Date/timezone spoofing
      const originalgetTimezoneOffset = Date.prototype.getTimezoneOffset;
      Date.prototype.getTimezoneOffset = function() {
        return 300; // Eastern Time
      };
      
      // 15. Touch device spoofing
      Object.defineProperty(navigator, 'maxTouchPoints', { get: () => 0 });
      
      // 16. Battery API spoofing
      if ((navigator as any).getBattery) {
        Object.defineProperty(navigator, 'getBattery', {
          get: () => () => Promise.resolve({
            charging: true,
            chargingTime: 0,
            dischargingTime: Infinity,
            level: 1,
          })
        });
      }
      
      // 17. MediaDevices spoofing
      const originalEnumerateDevices = (navigator.mediaDevices as any)?.enumerateDevices;
      if (originalEnumerateDevices) {
        (navigator.mediaDevices as any).enumerateDevices = () => {
          return originalEnumerateDevices().then((devices: any[]) => {
            return devices.map(device => ({
              ...device,
              deviceId: device.deviceId === 'default' ? 'default' : 'spoofed-' + device.deviceId,
            }));
          });
        };
      }
      
      // 18. Speech synthesis spoofing
      if ((window as any).speechSynthesis) {
        const originalGetVoices = (window as any).speechSynthesis.getVoices;
        (window as any).speechSynthesis.getVoices = () => {
          const voices = originalGetVoices();
          return voices.filter((voice: any) => voice.lang.startsWith('en'));
        };
      }
      
      // 19. Gamepad API spoofing
      if ((navigator as any).getGamepads) {
        Object.defineProperty(navigator, 'getGamepads', {
          get: () => () => []
        });
      }
      
      // 20. Performance timing spoofing
      const originalNow = performance.now;
      performance.now = () => {
        return originalNow() + Math.random() * 0.1;
      };
    });

    return { context, page };
  }

  public async releasePage(context: BrowserContext): Promise<void> {
    const browser = this.contextToBrowserMap.get(context);
    const entry = this.browsers.find(b => b.browser === browser);
    
    try {
      // If it's a persistent context, we only close the page, not the context itself (since it's the "browser")
      if (entry?.isPersistent) {
        // Find pages in this context and close the one we used
        const pages = context.pages();
        for (const p of pages) {
          await p.close();
        }
      } else {
        await context.close();
      }
    } catch (err: any) {
      Logger.error('[BrowserPool] Error closing context/page', err);
    } finally {
      if (browser) {
        this.contextToBrowserMap.delete(context);
        if (entry) {
          entry.activeContextsCount = Math.max(0, entry.activeContextsCount - 1);
          entry.lastActiveTime = Date.now();
        }
      }
    }
  }

  public async shutdown(): Promise<void> {
    if (this.idleTimer) {
      clearInterval(this.idleTimer);
      this.idleTimer = null;
    }
    this.contextToBrowserMap.clear();
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

  /**
   * Cloudflare Turnstile Action Bypass
   * 
   * Automatically detects and waits for invisible Cloudflare Turnstile challenges
   * to complete by monitoring the validation frame and waiting for layout stabilization.
   */
  public static async waitForCloudflareTurnstile(page: Page, timeoutMs: number = 15000): Promise<boolean> {
    Logger.info('[BrowserPool] Checking for Cloudflare Turnstile challenge...');
    
    try {
      // Check for Cloudflare challenge indicators
      const hasChallenge = await page.evaluate(() => {
        // Check for common Cloudflare Turnstile indicators
        const turnstileIframe = document.querySelector('iframe[src*="challenges.cloudflare.com"]');
        const cloudflareDiv = document.querySelector('[data-ray]');
        const challengeBox = document.querySelector('.cf-browser-verification');
        const challengeContainer = document.querySelector('#challenge-form');
        
        return !!(turnstileIframe || cloudflareDiv || challengeBox || challengeContainer);
      });

      if (!hasChallenge) {
        Logger.info('[BrowserPool] No Cloudflare challenge detected');
        return true;
      }

      Logger.info('[BrowserPool] Cloudflare challenge detected, waiting for resolution...');

      // Wait for layout stabilization and challenge completion
      const startTime = Date.now();
      let resolved = false;

      while (Date.now() - startTime < timeoutMs) {
        // Check if challenge is resolved
        resolved = await page.evaluate(() => {
          const turnstileIframe = document.querySelector('iframe[src*="challenges.cloudflare.com"]');
          const cloudflareDiv = document.querySelector('[data-ray]');
          const challengeBox = document.querySelector('.cf-browser-verification');
          
          // Challenge is resolved if these elements are gone or hidden
          if (turnstileIframe) {
            const style = window.getComputedStyle(turnstileIframe);
            return style.display === 'none' || style.visibility === 'hidden';
          }
          
          if (cloudflareDiv) {
            const style = window.getComputedStyle(cloudflareDiv);
            return style.display === 'none' || style.visibility === 'hidden';
          }
          
          if (challengeBox) {
            const style = window.getComputedStyle(challengeBox);
            return style.display === 'none' || style.visibility === 'hidden';
          }
          
          // If none of the challenge elements exist, it's resolved
          return true;
        });

        if (resolved) {
          Logger.info('[BrowserPool] Cloudflare challenge resolved successfully');
          // Additional wait for layout stabilization
          await page.waitForTimeout(2000);
          return true;
        }

        // Wait before next check
        await page.waitForTimeout(500);
      }

      Logger.warn('[BrowserPool] Cloudflare challenge resolution timeout');
      return false;
    } catch (error: any) {
      Logger.error(`[BrowserPool] Error during Cloudflare challenge wait: ${error.message}`);
      // If detection fails, proceed anyway with a stabilization wait
      await page.waitForTimeout(4000);
      return true;
    }
  }

  /**
   * Enhanced page navigation with automatic Cloudflare challenge handling
   */
  public static async navigateWithChallengeBypass(
    page: Page,
    url: string,
    options: { waitUntil?: 'load' | 'domcontentloaded' | 'networkidle'; timeout?: number } = {}
  ): Promise<boolean> {
    const { waitUntil = 'domcontentloaded', timeout = 30000 } = options;
    
    try {
      Logger.info(`[BrowserPool] Navigating to ${url} with challenge bypass`);
      
      // Initial navigation
      await page.goto(url, { waitUntil, timeout });
      
      // Apply layout stabilization wait (4 seconds as recommended)
      await page.waitForTimeout(4000);
      
      // Check for and wait for Cloudflare Turnstile challenges
      const bypassed = await this.waitForCloudflareTurnstile(page, 15000);
      
      if (bypassed) {
        Logger.info('[BrowserPool] Navigation with challenge bypass completed');
        return true;
      } else {
        Logger.warn('[BrowserPool] Challenge bypass may have failed, but proceeding');
        return true;
      }
    } catch (error: any) {
      Logger.error(`[BrowserPool] Navigation with challenge bypass failed: ${error.message}`);
      throw error;
    }
  }
}
