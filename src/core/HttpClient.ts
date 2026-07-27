import { Logger } from './Logger.js';

export class HttpError extends Error {
  public status: number;
  public headers: Headers;

  constructor(message: string, status: number, headers: Headers) {
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
}

export interface HttpResponse<T = any> {
  data: T;
  status: number;
  headers: Headers;
  durationMs: number;
}

export class HttpClient {
  private userAgents: string[] = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36 OPR/111.0.0.0',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:127.0) Gecko/20100101 Firefox/127.0',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 Edg/126.0.0.0',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
    'Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
  ];

  private getRandomUserAgent(): string {
    return this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
  }

  public async request<T = any>(url: string, config: HttpRequestConfig = {}): Promise<HttpResponse<T>> {
    const method = config.method ?? 'GET';
    const retries = config.retries ?? 3;
    const initialBackoff = config.backoffMs ?? 1000;
    const timeoutMs = config.timeoutMs ?? 15000;

    let attempt = 0;
    let currentBackoff = initialBackoff;

    while (attempt < retries) {
      attempt++;
      const startTime = Date.now();

      try {
        const headers: Record<string, string> = {
          'User-Agent': this.getRandomUserAgent(),
          Accept: 'application/json, text/plain, */*',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          ...config.headers,
        };

        let fetchBody: string | undefined;
        if (config.body) {
          if (typeof config.body === 'object') {
            fetchBody = JSON.stringify(config.body);
            headers['Content-Type'] = headers['Content-Type'] ?? 'application/json';
          } else {
            fetchBody = String(config.body);
          }
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        try {
          const response = await fetch(url, {
            method,
            headers,
            body: fetchBody,
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          const durationMs = Date.now() - startTime;

          if (!response.ok) {
            // If 4xx (except rate limit 429) or other client errors, don't retry, throw immediately.
            if (response.status >= 400 && response.status < 500 && response.status !== 429) {
              throw new HttpError(
                `HTTP Error ${response.status}: ${response.statusText}`,
                response.status,
                response.headers,
              );
            }
            // For 5xx or 429, retry
            throw new HttpError(
              `HTTP Server Error ${response.status}: ${response.statusText}`,
              response.status,
              response.headers,
            );
          }

          // Parse response content type
          const contentType = response.headers.get('content-type') ?? '';
          let data: any;

          if (contentType.includes('application/json')) {
            data = await response.json();
          } else {
            data = await response.text();
          }

          return {
            data: data as T,
            status: response.status,
            headers: response.headers,
            durationMs,
          };
        } catch (error: any) {
          clearTimeout(timeoutId);
          throw error;
        }
      } catch (error: any) {
        const durationMs = Date.now() - startTime;

        // Log error attempt
        Logger.warn(`Request failed to ${url} (Attempt ${attempt}/${retries}) in ${durationMs}ms: ${error.message}`);

        if (error instanceof HttpError && error.status >= 400 && error.status < 500 && error.status !== 429) {
          throw error;
        }

        if (attempt >= retries) {
          throw error;
        }

        // Wait before next attempt (exponential backoff with jitter)
        const jitter = Math.random() * 200 - 100; // +-100ms jitter
        const sleepTime = Math.max(0, currentBackoff + jitter);
        await new Promise((resolve) => setTimeout(resolve, sleepTime));
        currentBackoff *= 2; // double backoff for next round
      }
    }

    throw new Error(`Request execution loop exited unexpectedly for ${url}`);
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
