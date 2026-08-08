import { Logger } from '../Logger.js';
import got from 'got';
import { ProxyCandidate } from './ProxyCollector.js';

export interface ValidationResult {
  proxy: ProxyCandidate;
  isWorking: boolean;
  latencyMs: number;
  externalIp?: string;
  error?: string;
  supportsHttps: boolean;
}

export interface ValidationConfig {
  timeoutMs: number;
  maxLatencyMs: number;
  testEndpoint: string;
  concurrency: number;
}

export class ProxyValidator {
  private static instance: ProxyValidator | null = null;
  private config: ValidationConfig;

  private constructor(config: Partial<ValidationConfig> = {}) {
    this.config = {
      timeoutMs: config.timeoutMs || 10000,
      maxLatencyMs: config.maxLatencyMs || 5000,
      testEndpoint: config.testEndpoint || 'http://ifconfig.me/ip',
      concurrency: config.concurrency || 10,
    };
  }

  public static getInstance(config?: Partial<ValidationConfig>): ProxyValidator {
    if (!ProxyValidator.instance) {
      ProxyValidator.instance = new ProxyValidator(config);
    }
    return ProxyValidator.instance;
  }

  /**
   * Validate a single proxy
   */
  public async validateProxy(proxy: ProxyCandidate): Promise<ValidationResult> {
    const startTime = Date.now();
    const proxyUrl = `${proxy.protocol}://${proxy.ip}:${proxy.port}`;

    try {
      // Test HTTP connectivity
      const httpResponse = await got('http://ifconfig.me/ip', {
        proxyUrl,
        timeout: { request: this.config.timeoutMs },
        responseType: 'text',
        retry: 0,
      });

      const latencyMs = Date.now() - startTime;
      const externalIp = httpResponse.body.trim();

      // Test HTTPS connectivity
      let supportsHttps = false;
      try {
        await got('https://ifconfig.me/ip', {
          proxyUrl,
          timeout: { request: this.config.timeoutMs },
          responseType: 'text',
          retry: 0,
        });
        supportsHttps = true;
      } catch {
        // HTTPS not supported
      }

      // Check latency threshold
      if (latencyMs > this.config.maxLatencyMs) {
        return {
          proxy,
          isWorking: false,
          latencyMs,
          externalIp,
          error: `Latency too high: ${latencyMs}ms`,
          supportsHttps,
        };
      }

      return {
        proxy,
        isWorking: true,
        latencyMs,
        externalIp,
        supportsHttps,
      };
    } catch (error: any) {
      const latencyMs = Date.now() - startTime;
      return {
        proxy,
        isWorking: false,
        latencyMs,
        error: error.message || 'Unknown error',
        supportsHttps: false,
      };
    }
  }

  /**
   * Validate multiple proxies with concurrency control
   */
  public async validateProxies(proxies: ProxyCandidate[]): Promise<ValidationResult[]> {
    Logger.info(`[ProxyValidator] Starting validation of ${proxies.length} proxies...`);

    const results: ValidationResult[] = [];
    const chunks = this.chunkArray(proxies, this.config.concurrency);

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      Logger.info(`[ProxyValidator] Validating chunk ${i + 1}/${chunks.length} (${chunk.length} proxies)...`);

      const chunkResults = await Promise.all(
        chunk.map(proxy => this.validateProxy(proxy))
      );

      results.push(...chunkResults);

      // Small delay between chunks to avoid overwhelming
      if (i < chunks.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    const working = results.filter(r => r.isWorking).length;
    const failed = results.filter(r => !r.isWorking).length;

    Logger.info(`[ProxyValidator] Validation complete: ${working} working, ${failed} failed`);

    return results;
  }

  /**
   * Filter to only working proxies
   */
  public filterWorkingProxies(results: ValidationResult[]): ProxyCandidate[] {
    return results
      .filter(r => r.isWorking)
      .map(r => r.proxy);
  }

  /**
   * Get validation statistics
   */
  public getStatistics(results: ValidationResult[]): {
    total: number;
    working: number;
    failed: number;
    avgLatencyMs: number;
    httpsSupportCount: number;
  } {
    const working = results.filter(r => r.isWorking);
    const workingLatencies = working.map(r => r.latencyMs);
    const avgLatency = workingLatencies.length > 0
      ? workingLatencies.reduce((a, b) => a + b, 0) / workingLatencies.length
      : 0;

    return {
      total: results.length,
      working: working.length,
      failed: results.length - working.length,
      avgLatencyMs: Math.round(avgLatency),
      httpsSupportCount: working.filter(r => r.supportsHttps).length,
    };
  }

  /**
   * Chunk array into smaller arrays
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}