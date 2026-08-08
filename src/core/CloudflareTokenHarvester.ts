import { Logger } from './Logger.js';

export interface CloudflareToken {
  token: string;
  expiry: number;
  domain: string;
  userAgent: string;
}

export interface TokenCacheEntry {
  token: string;
  expiry: number;
  createdAt: number;
  domain: string;
  userAgent: string;
}

/**
 * Cloudflare Token Harvester with Redis cache support
 * 
 * This service handles the collection and caching of Cloudflare challenge tokens
 * to bypass anti-bot protections during scraping operations.
 */
export class CloudflareTokenHarvester {
  private static instance: CloudflareTokenHarvester | null = null;
  private tokenCache: Map<string, TokenCacheEntry> = new Map();
  private redisClient: any = null; // Redis client placeholder
  private useRedis: boolean = false;
  private cacheExpiryMs: number = 30 * 60 * 1000; // 30 minutes default

  private constructor() {
    this.initializeRedis();
  }

  public static getInstance(): CloudflareTokenHarvester {
    if (!CloudflareTokenHarvester.instance) {
      CloudflareTokenHarvester.instance = new CloudflareTokenHarvester();
    }
    return CloudflareTokenHarvester.instance;
  }

  /**
   * Initialize Redis connection for distributed token caching
   */
  private async initializeRedis(): Promise<void> {
    try {
      // Check if Redis is configured
      const redisUrl = process.env.REDIS_URL || process.env.REDIS_HOST;
      if (!redisUrl) {
        Logger.info('[CloudflareTokenHarvester] Redis not configured, using in-memory cache');
        return;
      }

      // Dynamic import of Redis client
      const { createClient } = await import('redis');
      this.redisClient = createClient({
        url: redisUrl,
        socket: {
          reconnectStrategy: 'reconnect',
        },
      });

      await this.redisClient.connect();
      this.useRedis = true;
      Logger.info('[CloudflareTokenHarvester] Redis connection established');
    } catch (error: any) {
      Logger.warn(`[CloudflareTokenHarvester] Redis initialization failed, using in-memory cache: ${error.message}`);
      this.useRedis = false;
    }
  }

  /**
   * Generate cache key for a domain and user agent combination
   */
  private getCacheKey(domain: string, userAgent: string): string {
    return `cf_token:${domain}:${Buffer.from(userAgent).toString('base64').substring(0, 16)}`;
  }

  /**
   * Get cached token for a domain
   */
  public async getCachedToken(domain: string, userAgent: string): Promise<CloudflareToken | null> {
    const cacheKey = this.getCacheKey(domain, userAgent);

    try {
      if (this.useRedis && this.redisClient) {
        const cached = await this.redisClient.get(cacheKey);
        if (cached) {
          const entry: TokenCacheEntry = JSON.parse(cached);
          if (Date.now() < entry.expiry) {
            Logger.info(`[CloudflareTokenHarvester] Using cached token for ${domain}`);
            return {
              token: entry.token,
              expiry: entry.expiry,
              domain: entry.domain,
              userAgent: entry.userAgent,
            };
          } else {
            // Token expired, remove from cache
            await this.redisClient.del(cacheKey);
          }
        }
      } else {
        // Use in-memory cache
        const entry = this.tokenCache.get(cacheKey);
        if (entry && Date.now() < entry.expiry) {
          Logger.info(`[CloudflareTokenHarvester] Using in-memory cached token for ${domain}`);
          return {
            token: entry.token,
            expiry: entry.expiry,
            domain: entry.domain,
            userAgent: entry.userAgent,
          };
        } else if (entry) {
          // Token expired, remove from cache
          this.tokenCache.delete(cacheKey);
        }
      }
    } catch (error: any) {
      Logger.error(`[CloudflareTokenHarvester] Error getting cached token: ${error.message}`);
    }

    return null;
  }

  /**
   * Cache a Cloudflare token
   */
  public async cacheToken(token: CloudflareToken): Promise<void> {
    const cacheKey = this.getCacheKey(token.domain, token.userAgent);
    const entry: TokenCacheEntry = {
      token: token.token,
      expiry: token.expiry,
      createdAt: Date.now(),
      domain: token.domain,
      userAgent: token.userAgent,
    };

    try {
      if (this.useRedis && this.redisClient) {
        await this.redisClient.setEx(
          cacheKey,
          Math.floor(this.cacheExpiryMs / 1000),
          JSON.stringify(entry)
        );
        Logger.info(`[CloudflareTokenHarvester] Cached token in Redis for ${token.domain}`);
      } else {
        this.tokenCache.set(cacheKey, entry);
        Logger.info(`[CloudflareTokenHarvester] Cached token in memory for ${token.domain}`);
      }
    } catch (error: any) {
      Logger.error(`[CloudflareTokenHarvester] Error caching token: ${error.message}`);
    }
  }

  /**
   * Harvest Cloudflare token from a URL using browser automation
   */
  public async harvestToken(
    domain: string,
    userAgent: string,
    challengeUrl?: string
  ): Promise<CloudflareToken | null> {
    Logger.info(`[CloudflareTokenHarvester] Harvesting token for ${domain}`);

    try {
      // Check if we have a valid cached token first
      const cached = await this.getCachedToken(domain, userAgent);
      if (cached) {
        return cached;
      }

      // Harvest new token using browser automation
      const token = await this.harvestNewToken(domain, userAgent, challengeUrl);
      
      if (token) {
        await this.cacheToken(token);
        return token;
      }

      return null;
    } catch (error: any) {
      Logger.error(`[CloudflareTokenHarvester] Token harvest failed for ${domain}: ${error.message}`);
      return null;
    }
  }

  /**
   * Harvest new Cloudflare token using browser automation
   */
  private async harvestNewToken(
    domain: string,
    userAgent: string,
    challengeUrl?: string
  ): Promise<CloudflareToken | null> {
    try {
      // Dynamic import of Playwright
      const { chromium } = await import('playwright');
      
      const browser = await chromium.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-blink-features=AutomationControlled'
        ]
      });

      const context = await browser.newContext({
        userAgent,
        viewport: { width: 1280, height: 800 },
      });

      const page = await context.newPage();

      // Navigate to the challenge URL or domain
      const url = challengeUrl || `https://${domain}`;
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

      // Wait for Cloudflare challenge to complete
      await page.waitForTimeout(5000);

      // Extract Cloudflare token from cookies or localStorage
      const token = await this.extractTokenFromPage(page, domain);

      await browser.close();

      if (token) {
        const expiry = Date.now() + this.cacheExpiryMs;
        return {
          token,
          expiry,
          domain,
          userAgent,
        };
      }

      return null;
    } catch (error: any) {
      Logger.error(`[CloudflareTokenHarvester] Failed to harvest new token: ${error.message}`);
      return null;
    }
  }

  /**
   * Extract Cloudflare token from page cookies or localStorage
   */
  private async extractTokenFromPage(page: any, domain: string): Promise<string | null> {
    try {
      // Check cookies for Cloudflare tokens
      const cookies = await page.context().cookies();
      const cfToken = cookies.find((cookie: any) => 
        cookie.name === 'cf_clearance' || 
        cookie.name === 'cf_chl_rc' ||
        cookie.name === '__cf_bm'
      );

      if (cfToken) {
        return cfToken.value;
      }

      // Check localStorage for Cloudflare tokens
      const localStorageToken = await page.evaluate(() => {
        return localStorage.getItem('cf_chl_rc') || 
               localStorage.getItem('cf_clearance') ||
               localStorage.getItem('__cf_bm');
      });

      if (localStorageToken) {
        return localStorageToken;
      }

      return null;
    } catch (error: any) {
      Logger.error(`[CloudflareTokenHarvester] Error extracting token from page: ${error.message}`);
      return null;
    }
  }

  /**
   * Invalidate cached token for a domain
   */
  public async invalidateToken(domain: string, userAgent: string): Promise<void> {
    const cacheKey = this.getCacheKey(domain, userAgent);

    try {
      if (this.useRedis && this.redisClient) {
        await this.redisClient.del(cacheKey);
        Logger.info(`[CloudflareHarvester] Invalidated Redis token for ${domain}`);
      } else {
        this.tokenCache.delete(cacheKey);
        Logger.info(`[CloudflareHarvester] Invalidated in-memory token for ${domain}`);
      }
    } catch (error: any) {
      Logger.error(`[CloudflareHarvester] Error invalidating token: ${error.message}`);
    }
  }

  /**
   * Clear all cached tokens
   */
  public async clearAllTokens(): Promise<void> {
    try {
      if (this.useRedis && this.redisClient) {
        const keys = await this.redisClient.keys('cf_token:*');
        if (keys.length > 0) {
          await this.redisClient.del(keys);
          Logger.info(`[CloudflareHarvester] Cleared ${keys.length} tokens from Redis`);
        }
      } else {
        this.tokenCache.clear();
        Logger.info('[CloudflareHarvester] Cleared all in-memory tokens');
      }
    } catch (error: any) {
      Logger.error(`[CloudflareHarvester] Error clearing tokens: ${error.message}`);
    }
  }

  /**
   * Get cache statistics
   */
  public getCacheStats(): { inMemoryCount: number; redisAvailable: boolean } {
    return {
      inMemoryCount: this.tokenCache.size,
      redisAvailable: this.useRedis && this.redisClient !== null,
    };
  }

  /**
   * Shutdown and cleanup
   */
  public async shutdown(): Promise<void> {
    try {
      if (this.redisClient) {
        await this.redisClient.quit();
        this.redisClient = null;
      }
      this.tokenCache.clear();
      Logger.info('[CloudflareHarvester] Shutdown complete');
    } catch (error: any) {
      Logger.error(`[CloudflareHarvester] Error during shutdown: ${error.message}`);
    }
  }
}