import { Logger } from '../Logger.js';
import { ProxyCandidate } from './ProxyCollector.js';
import { ValidationResult } from './ProxyValidator.js';

export interface ProxyPoolEntry extends ProxyCandidate {
  healthy: boolean;
  lastUsed: number;
  failureCount: number;
  lastFailureTime?: number;
  cooldownUntil?: number;
  latencyMs: number;
  supportsHttps: boolean;
}

export interface ProxyPoolConfig {
  maxPoolSize: number;
  cooldownMs: number;
  maxFailures: number;
  healthCheckIntervalMs: number;
}

export class ProxyPoolManager {
  private static instance: ProxyPoolManager | null = null;
  private pool: Map<string, ProxyPoolEntry> = new Map();
  private currentIndex = 0;
  private config: ProxyPoolConfig;
  private healthCheckTimer?: NodeJS.Timeout;

  private constructor(config: Partial<ProxyPoolConfig> = {}) {
    this.config = {
      maxPoolSize: config.maxPoolSize || 100,
      cooldownMs: config.cooldownMs || 300000, // 5 minutes
      maxFailures: config.maxFailures || 3,
      healthCheckIntervalMs: config.healthCheckIntervalMs || 600000, // 10 minutes
    };

    this.startHealthCheckTimer();
  }

  public static getInstance(config?: Partial<ProxyPoolConfig>): ProxyPoolManager {
    if (!ProxyPoolManager.instance) {
      ProxyPoolManager.instance = new ProxyPoolManager(config);
    }
    return ProxyPoolManager.instance;
  }

  /**
   * Initialize pool with validated proxies
   */
  public initializePool(validationResults: ValidationResult[]): void {
    Logger.info(`[ProxyPoolManager] Initializing pool with ${validationResults.length} proxies...`);

    for (const result of validationResults) {
      if (result.isWorking) {
        const key = this.getProxyKey(result.proxy);
        this.pool.set(key, {
          ...result.proxy,
          healthy: true,
          lastUsed: 0,
          failureCount: 0,
          latencyMs: result.latencyMs,
          supportsHttps: result.supportsHttps,
        });
      }
    }

    Logger.info(`[ProxyPoolManager] Pool initialized with ${this.pool.size} healthy proxies`);
  }

  /**
   * Get next healthy proxy for rotation
   */
  public getNextProxy(): ProxyPoolEntry | null {
    const healthyProxies = Array.from(this.pool.values()).filter(
      p => p.healthy && (!p.cooldownUntil || p.cooldownUntil < Date.now())
    );

    if (healthyProxies.length === 0) {
      Logger.warn('[ProxyPoolManager] No healthy proxies available');
      return null;
    }

    // Sort by last used (round-robin with preference for least recently used)
    healthyProxies.sort((a, b) => a.lastUsed - b.lastUsed);

    const proxy = healthyProxies[0];
    proxy.lastUsed = Date.now();

    return proxy;
  }

  /**
   * Mark proxy as failed
   */
  public markProxyFailed(proxy: ProxyCandidate, error?: string): void {
    const key = this.getProxyKey(proxy);
    const entry = this.pool.get(key);

    if (entry) {
      entry.failureCount++;
      entry.lastFailureTime = Date.now();

      Logger.warn(
        `[ProxyPoolManager] Proxy failed: ${proxy.ip}:${proxy.port} (failures: ${entry.failureCount}) - ${error || 'Unknown error'}`
      );

      // Mark as unhealthy if max failures reached
      if (entry.failureCount >= this.config.maxFailures) {
        entry.healthy = false;
        entry.cooldownUntil = Date.now() + this.config.cooldownMs;
        Logger.warn(
          `[ProxyPoolManager] Proxy marked unhealthy: ${proxy.ip}:${proxy.port} (cooldown until ${new Date(entry.cooldownUntil).toISOString()})`
        );
      }
    }
  }

  /**
   * Mark proxy as successful (reset failure count)
   */
  public markProxySuccess(proxy: ProxyCandidate): void {
    const key = this.getProxyKey(proxy);
    const entry = this.pool.get(key);

    if (entry) {
      entry.failureCount = 0;
      entry.healthy = true;
      entry.cooldownUntil = undefined;
      entry.lastUsed = Date.now();
    }
  }

  /**
   * Get pool statistics
   */
  public getPoolStats(): {
    total: number;
    healthy: number;
    unhealthy: number;
    onCooldown: number;
    avgLatencyMs: number;
  } {
    const all = Array.from(this.pool.values());
    const healthy = all.filter(p => p.healthy);
    const unhealthy = all.filter(p => !p.healthy);
    const onCooldown = all.filter(p => p.cooldownUntil && p.cooldownUntil > Date.now());
    const latencies = healthy.map(p => p.latencyMs);
    const avgLatency = latencies.length > 0
      ? latencies.reduce((a, b) => a + b, 0) / latencies.length
      : 0;

    return {
      total: all.length,
      healthy: healthy.length,
      unhealthy: unhealthy.length,
      onCooldown: onCooldown.length,
      avgLatencyMs: Math.round(avgLatency),
    };
  }

  /**
   * Export healthy proxies for Heroku Config Vars
   */
  public exportForHeroku(maxProxies: number = 20): string[] {
    const healthyProxies = Array.from(this.pool.values())
      .filter(p => p.healthy && (!p.cooldownUntil || p.cooldownUntil < Date.now()))
      .sort((a, b) => a.latencyMs - b.latencyMs) // Sort by latency
      .slice(0, maxProxies);

    return healthyProxies.map(p => `${p.protocol}://${p.ip}:${p.port}`);
  }

  /**
   * Recover proxies from cooldown
   */
  private recoverCooldownProxies(): void {
    const now = Date.now();
    let recovered = 0;

    for (const [key, entry] of this.pool.entries()) {
      if (entry.cooldownUntil && entry.cooldownUntil < now) {
        entry.healthy = true;
        entry.cooldownUntil = undefined;
        entry.failureCount = 0;
        recovered++;
      }
    }

    if (recovered > 0) {
      Logger.info(`[ProxyPoolManager] Recovered ${recovered} proxies from cooldown`);
    }
  }

  /**
   * Start health check timer
   */
  private startHealthCheckTimer(): void {
    this.healthCheckTimer = setInterval(() => {
      this.recoverCooldownProxies();
    }, this.config.healthCheckIntervalMs);
  }

  /**
   * Stop health check timer
   */
  public stopHealthCheckTimer(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = undefined;
    }
  }

  /**
   * Clear pool
   */
  public clearPool(): void {
    this.pool.clear();
    Logger.info('[ProxyPoolManager] Pool cleared');
  }

  /**
   * Get proxy key for Map
   */
  private getProxyKey(proxy: ProxyCandidate): string {
    return `${proxy.ip}:${proxy.port}`;
  }

  /**
   * Format proxy as URL string
   */
  public formatProxyUrl(entry: ProxyPoolEntry): string {
    return `${entry.protocol}://${entry.ip}:${entry.port}`;
  }
}