import { Logger } from './Logger.js';
import got, { OptionsInit, Response } from 'got';
import { ProxyPoolManager } from './proxy/ProxyPoolManager.js';
import { ProxyCandidate } from './proxy/ProxyCollector.js';

export class HttpError extends Error {
  public status: number;
  public headers: any;

  constructor(message: string, status: number, headers: any) {
    super(message);
    this.status = status;
    this.headers = headers;
    this.name = 'HttpError';
  }
}

export interface HttpRequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  timeoutMs?: number;
  retries?: number;
  backoffMs?: number;
  useStickySession?: boolean;
  proxyUrl?: string;
  useMobileAppSpoofing?: boolean;
  mobileAppType?: 'ios' | 'android';
  useProxyRotation?: boolean;
  proxyProvider?: 'brightdata' | 'smartproxy' | 'custom';
  proxyUsername?: string;
  proxyPassword?: string;
}

export interface HttpResponse<T = any> {
  data: T;
  status: number;
  headers: any;
  durationMs: number;
  url: string;
}

export class HttpClient {
  private static sessionCookies: Map<string, string> = new Map();
  private static proxyPool: string[] = [];
  private static currentProxyIndex = 0;
  private static proxyPoolManager: ProxyPoolManager | null = null;
  private static useAdvancedProxyPool = false;

  /**
   * Configure proxy pool for rotation (simple string array)
   */
  public static configureProxyPool(proxies: string[]): void {
    this.proxyPool = proxies;
    this.currentProxyIndex = 0;
    this.useAdvancedProxyPool = false;
    Logger.info(`[HttpClient] Configured simple proxy pool with ${proxies.length} proxies`);
  }

  /**
   * Configure advanced proxy pool with ProxyPoolManager
   */
  public static configureAdvancedProxyPool(manager: ProxyPoolManager): void {
    this.proxyPoolManager = manager;
    this.useAdvancedProxyPool = true;
    Logger.info('[HttpClient] Configured advanced proxy pool with ProxyPoolManager');
  }

  /**
   * Get next proxy from pool with rotation
   */
  private static getNextProxy(): string | null {
    if (this.useAdvancedProxyPool && this.proxyPoolManager) {
      const entry = this.proxyPoolManager.getNextProxy();
      if (entry) {
        return this.proxyPoolManager.formatProxyUrl(entry);
      }
      return null;
    }

    // Fallback to simple pool
    if (this.proxyPool.length === 0) return null;
    
    const proxy = this.proxyPool[this.currentProxyIndex];
    this.currentProxyIndex = (this.currentProxyIndex + 1) % this.proxyPool.length;
    return proxy;
  }

  /**
   * Mark proxy as failed
   */
  private static markProxyFailed(proxyUrl: string, error?: string): void {
    if (this.useAdvancedProxyPool && this.proxyPoolManager) {
      // Parse proxy URL to get IP and port
      const match = proxyUrl.match(/(?:https?:\/\/)?([^:]+):(\d+)/);
      if (match) {
        const [, ip, port] = match;
        this.proxyPoolManager.markProxyFailed(
          { ip, port: parseInt(port, 10), protocol: 'http', source: 'custom' },
          error
        );
      }
    }
  }

  /**
   * Mark proxy as successful
   */
  private static markProxySuccess(proxyUrl: string): void {
    if (this.useAdvancedProxyPool && this.proxyPoolManager) {
      const match = proxyUrl.match(/(?:https?:\/\/)?([^:]+):(\d+)/);
      if (match) {
        const [, ip, port] = match;
        this.proxyPoolManager.markProxySuccess(
          { ip, port: parseInt(port, 10), protocol: 'http', source: 'custom' }
        );
      }
    }
  }

  public static setSharedCookies(domain: string, cookies: string): void {
    this.sessionCookies.set(domain, cookies);
  }
  
  private userAgents: string[] = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15',
  ];

  // Mobile App API User Agents for spoofing
  private mobileUserAgents = {
    ios: [
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Safari/604.1',
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1',
      'Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
    ],
    android: [
      'Mozilla/5.0 (Linux; Android 14; SM-G998B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36',
      'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36',
      'Mozilla/5.0 (Linux; Android 14; SM-S911B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36',
    ],
  };

  private getRandomUserAgent(): string {
    return this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
  }

  private getRandomMobileUserAgent(type: 'ios' | 'android'): string {
    const agents = this.mobileUserAgents[type];
    return agents[Math.floor(Math.random() * agents.length)];
  }

  /**
   * Generates matching Client Hints for the given User-Agent
   */
  private getClientHints(ua: string): Record<string, string> {
    const isMobile = /Mobile|Android|iPhone|iPad/i.test(ua);
    const platform = ua.includes('Windows') ? '"Windows"' : ua.includes('Macintosh') ? '"macOS"' : '"Linux"';
    
    return {
      'Sec-CH-UA': '"Not/A)Brand";v="8", "Chromium";v="126", "Google Chrome";v="126"',
      'Sec-CH-UA-Mobile': isMobile ? '?1' : '?0',
      'Sec-CH-UA-Platform': platform,
    };
  }

  /**
   * Generates mobile app API spoofing headers
   */
  private getMobileAppHeaders(type: 'ios' | 'android', ua: string): Record<string, string> {
    const headers: Record<string, string> = {
      'User-Agent': ua,
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
    };

    if (type === 'ios') {
      headers['X-Device-ID'] = this.generateRandomDeviceId();
      headers['X-App-Version'] = '3.2.1';
      headers['X-Platform'] = 'ios';
      headers['X-OS-Version'] = '17.5';
    } else {
      headers['X-Device-ID'] = this.generateRandomDeviceId();
      headers['X-App-Version'] = '3.2.1';
      headers['X-Platform'] = 'android';
      headers['X-OS-Version'] = '14';
    }

    return headers;
  }

  private generateRandomDeviceId(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  public async request<T = any>(url: string, config: HttpRequestConfig = {}): Promise<HttpResponse<T>> {
    const method = config.method ?? 'GET';
    const retries = config.retries ?? 3;
    const initialBackoff = config.backoffMs ?? 1000;
    const timeoutMs = config.timeoutMs ?? 15000;
    
    const domain = new URL(url).hostname;
    
    // Use mobile app spoofing if configured
    let ua: string;
    let headers: Record<string, string>;
    
    if (config.useMobileAppSpoofing) {
      const mobileType = config.mobileAppType || 'ios';
      ua = this.getRandomMobileUserAgent(mobileType);
      headers = this.getMobileAppHeaders(mobileType, ua);
    } else {
      ua = this.getRandomUserAgent();
      const clientHints = this.getClientHints(ua);
      headers = {
        'User-Agent': ua,
        'Accept': method === 'GET' 
          ? 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/json;q=0.5'
          : 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        ...clientHints,
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1',
      };
    }

    // Merge custom headers
    headers = { ...headers, ...config.headers };

    // Category 4: Sticky Session Management
    if (config.useStickySession && HttpClient.sessionCookies.has(domain)) {
      headers['Cookie'] = HttpClient.sessionCookies.get(domain)!;
    }

    // Category 4: Proxy Rotation
    let proxyUrl: string | undefined;
    if (config.useProxyRotation) {
      proxyUrl = HttpClient.getNextProxy() || config.proxyUrl;
    } else if (config.proxyUrl) {
      proxyUrl = config.proxyUrl;
    }

    const options: OptionsInit = {
      method,
      headers,
      timeout: { request: timeoutMs },
      retry: {
        limit: retries,
        calculateDelay: ({ attemptCount }) => {
          // Category 4: Jitter and Backoff Intervals
          const backoff = initialBackoff * Math.pow(2, attemptCount - 1);
          const jitter = Math.random() * 500; // 0-500ms jitter
          return backoff + jitter;
        }
      },
      http2: true, // Category 2: HTTP/2 support
      followRedirect: true,
      responseType: 'text',
      throwHttpErrors: false, // Handle manually for logging
    };

    // Add proxy configuration if available
    if (proxyUrl) {
      options.proxyUrl = proxyUrl;
      if (config.proxyUsername && config.proxyPassword) {
        options.username = config.proxyUsername;
        options.password = config.proxyPassword;
      }
    }

    if (config.body) {
      if (typeof config.body === 'object') {
        options.json = config.body;
      } else {
        options.body = String(config.body);
      }
    }

    const startTime = Date.now();
    try {
      if (proxyUrl) {
        Logger.info(`[HttpClient] Using proxy: ${proxyUrl}`);
      }
      const response: Response<string> = await got(url, options);
      const durationMs = Date.now() - startTime;

      // Mark proxy as successful
      if (proxyUrl) {
        HttpClient.markProxySuccess(proxyUrl);
      }

      // Update sticky session cookies
      if (config.useStickySession && response.headers['set-cookie']) {
        const cookies = Array.isArray(response.headers['set-cookie']) 
          ? response.headers['set-cookie'].join('; ') 
          : response.headers['set-cookie'];
        HttpClient.sessionCookies.set(domain, cookies);
      }

      if (response.statusCode >= 400) {
        // Mark proxy as failed for 4xx/5xx errors
        if (proxyUrl) {
          HttpClient.markProxyFailed(proxyUrl, `HTTP ${response.statusCode}`);
        }
        throw new HttpError(
          `HTTP Error ${response.statusCode}: ${response.statusMessage}`,
          response.statusCode,
          response.headers
        );
      }

      let data: any = response.body;
      const contentType = response.headers['content-type'] ?? '';
      if (contentType.includes('application/json')) {
        try {
          data = JSON.parse(response.body);
        } catch {
          // Fallback to raw text
        }
      }

      return {
        data: data as T,
        status: response.statusCode,
        headers: response.headers,
        durationMs,
        url: response.url,
      };
    } catch (error: any) {
      const durationMs = Date.now() - startTime;
      
      // Mark proxy as failed on error
      if (proxyUrl) {
        HttpClient.markProxyFailed(proxyUrl, error.message);
      }
      
      Logger.warn(`Request failed to ${url} in ${durationMs}ms: ${error.message}`);
      throw error;
    }
  }

  public async get<T = any>(
    url: string,
    headers?: Record<string, string>,
    config: Omit<HttpRequestConfig, 'method' | 'headers' | 'body'> = {},
  ): Promise<HttpResponse<T>> {
    return this.request<T>(url, { method: 'GET', headers, ...config });
  }

  public async post<T = any>(
    url: string,
    body?: any,
    headers?: Record<string, string>,
    config: Omit<HttpRequestConfig, 'method' | 'headers' | 'body'> = {},
  ): Promise<HttpResponse<T>> {
    return this.request<T>(url, { method: 'POST', body, headers, ...config });
  }
}
