import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { HttpClient } from './HttpClient.js';
import { Logger } from './Logger.js';

interface CacheEntry {
  url: string;
  etag?: string;
  lastModified?: string;
  contentHash?: string;
  updatedAt: string;
}

export class ChangeDetection {
  private static cacheFile = path.join(process.cwd(), 'storage', 'change_cache.json');
  private static cache: Record<string, CacheEntry> = {};

  static {
    this.loadCache();
  }

  public static etagHits = 0;
  public static lastModifiedHits = 0;
  public static contentHashHits = 0;

  private static loadCache(): void {
    try {
      const dir = path.dirname(this.cacheFile);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      if (fs.existsSync(this.cacheFile)) {
        this.cache = JSON.parse(fs.readFileSync(this.cacheFile, 'utf8'));
      }
    } catch (err: any) {
      Logger.error('[ChangeDetection] Failed to load cache file', err);
    }
  }

  private static saveCache(): void {
    try {
      fs.writeFileSync(this.cacheFile, JSON.stringify(this.cache, null, 2), 'utf8');
    } catch (err: any) {
      Logger.error('[ChangeDetection] Failed to write cache file', err);
    }
  }

  /**
   * Performs HEAD request checks (ETag / Last-Modified) and returns true if content changed or check is skipped.
   */
  public static async hasChanged(companyId: string, url: string, httpClient: HttpClient): Promise<boolean> {
    const entry = this.cache[companyId];
    if (!entry || entry.url !== url) {
      return true; // Not cached or target URL changed
    }

    try {
      // 1. HEAD request check
      const headRes = await httpClient.request(url, { method: 'GET', timeoutMs: 5000, retries: 1 });
      const etag = headRes.headers.get('etag') || headRes.headers.get('ETag') || undefined;
      const lastModified = headRes.headers.get('last-modified') || headRes.headers.get('Last-Modified') || undefined;

      if (entry.etag && etag && entry.etag === etag) {
        Logger.info(`[ChangeDetection] Match detected via ETag cache check for ${companyId}`);
        ChangeDetection.etagHits++;
        return false;
      }

      if (entry.lastModified && lastModified && entry.lastModified === lastModified) {
        Logger.info(`[ChangeDetection] Match detected via Last-Modified cache check for ${companyId}`);
        ChangeDetection.lastModifiedHits++;
        return false;
      }
    } catch (err: any) {
      // HEAD request failed or blocked, fall through to GET comparison
      Logger.debug(`[ChangeDetection] HEAD request check bypassed for ${companyId}: ${err.message}`);
    }

    return true;
  }

  /**
   * Validates response data content hash comparison.
   */
  public static isContentChanged(companyId: string, url: string, data: any): boolean {
    const entry = this.cache[companyId];
    const dataStr = typeof data === 'object' ? JSON.stringify(data) : String(data);
    const contentHash = crypto.createHash('sha256').update(dataStr).digest('hex');

    if (entry && entry.url === url && entry.contentHash === contentHash) {
      Logger.info(`[ChangeDetection] Match detected via content hash cache check for ${companyId}`);
      ChangeDetection.contentHashHits++;
      return false;
    }

    return true;
  }

  /**
   * Updates cached metadata for a company scraper URL.
   */
  public static update(companyId: string, url: string, data: any, headers?: Headers): void {
    const dataStr = typeof data === 'object' ? JSON.stringify(data) : String(data);
    const contentHash = crypto.createHash('sha256').update(dataStr).digest('hex');

    const etag = headers ? (headers.get('etag') || headers.get('ETag') || undefined) : undefined;
    const lastModified = headers ? (headers.get('last-modified') || headers.get('Last-Modified') || undefined) : undefined;

    this.cache[companyId] = {
      url,
      etag,
      lastModified,
      contentHash,
      updatedAt: new Date().toISOString()
    };

    this.saveCache();
  }
}
