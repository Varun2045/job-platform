import os from 'os';

export interface TelemetryMetrics {
  activeWorkers: number;
  queueSize: number;
  totalRequests: number;
  avgLatencyMs: number;
  emailSuccessCount: number;
  emailFailureCount: number;
  dbStatus: 'connected' | 'disconnected';
  schedulerStatus: 'idle' | 'running' | 'healthy' | 'degraded' | 'disabled';
  cpuUsage: number;
  memoryUsageBytes: number;
  uptimeSeconds: number;
}

/**
 * Thread-safe Telemetry class using instance-based state
 * to avoid race conditions in multi-worker scenarios
 */
export class Telemetry {
  private static instance: Telemetry;
  
  // Instance-based state to avoid race conditions
  private activeWorkers: number = 0;
  private queueSize: number = 0;
  private totalRequests: number = 0;
  private totalLatencyMs: number = 0;
  private emailSuccessCount: number = 0;
  private emailFailureCount: number = 0;
  private lastSchedulerRun: string | null = null;
  private schedulerStatus: 'idle' | 'running' | 'healthy' | 'degraded' | 'disabled' = 'healthy';
  private startTime: number = Date.now();

  private constructor() {}

  static getInstance(): Telemetry {
    if (!Telemetry.instance) {
      Telemetry.instance = new Telemetry();
    }
    return Telemetry.instance;
  }

  // Reset state (useful for testing)
  reset(): void {
    this.activeWorkers = 0;
    this.queueSize = 0;
    this.totalRequests = 0;
    this.totalLatencyMs = 0;
    this.emailSuccessCount = 0;
    this.emailFailureCount = 0;
    this.lastSchedulerRun = null;
    this.schedulerStatus = 'healthy';
    this.startTime = Date.now();
  }

  setActiveWorkers(count: number): void {
    this.activeWorkers = Math.max(0, count);
  }

  incrementActiveWorkers(): void {
    this.activeWorkers++;
  }

  decrementActiveWorkers(): void {
    this.activeWorkers = Math.max(0, this.activeWorkers - 1);
  }

  setQueueSize(size: number): void {
    this.queueSize = Math.max(0, size);
  }

  setSchedulerStatus(status: 'idle' | 'running' | 'healthy' | 'degraded' | 'disabled'): void {
    this.schedulerStatus = status;
  }

  recordRequest(latencyMs: number): void {
    this.totalRequests++;
    this.totalLatencyMs += latencyMs;
  }

  getAverageLatency(): number {
    return this.totalRequests > 0 ? Math.round(this.totalLatencyMs / this.totalRequests) : 0;
  }

  recordEmail(success: boolean): void {
    if (success) {
      this.emailSuccessCount++;
    } else {
      this.emailFailureCount++;
    }
  }

  recordSchedulerRun(): void {
    this.lastSchedulerRun = new Date().toISOString();
  }

  getMetricsReport(dbStatus: 'connected' | 'disconnected'): TelemetryMetrics {
    const mem = process.memoryUsage();
    return {
      activeWorkers: this.activeWorkers,
      queueSize: this.queueSize,
      totalRequests: this.totalRequests,
      avgLatencyMs: this.getAverageLatency(),
      emailSuccessCount: this.emailSuccessCount,
      emailFailureCount: this.emailFailureCount,
      dbStatus,
      schedulerStatus: this.schedulerStatus,
      cpuUsage: os.loadavg()[0],
      memoryUsageBytes: mem.heapUsed,
      uptimeSeconds: Math.round((Date.now() - this.startTime) / 1000),
    };
  }

  toPrometheusFormat(metrics: TelemetryMetrics): string {
    const lines: string[] = [];

    lines.push('# HELP job_monitor_active_workers Active parallel scraper workers');
    lines.push('# TYPE job_monitor_active_workers gauge');
    lines.push(`job_monitor_active_workers ${metrics.activeWorkers}`);

    lines.push('# HELP job_monitor_queue_size Currently enqueued jobs awaiting scraper workers');
    lines.push('# TYPE job_monitor_queue_size gauge');
    lines.push(`job_monitor_queue_size ${metrics.queueSize}`);

    lines.push('# HELP job_monitor_api_requests_total Total API requests received by HTTP servers');
    lines.push('# TYPE job_monitor_api_requests_total counter');
    lines.push(`job_monitor_api_requests_total ${metrics.totalRequests}`);

    lines.push('# HELP job_monitor_api_latency_average_ms Average response time in milliseconds');
    lines.push('# TYPE job_monitor_api_latency_average_ms gauge');
    lines.push(`job_monitor_api_latency_average_ms ${metrics.avgLatencyMs}`);

    lines.push('# HELP job_monitor_emails_sent_success Successful email alerts sent via Resend API');
    lines.push('# TYPE job_monitor_emails_sent_success counter');
    lines.push(`job_monitor_emails_sent_success ${metrics.emailSuccessCount}`);

    lines.push('# HELP job_monitor_emails_sent_failure Failed email alerts');
    lines.push('# TYPE job_monitor_emails_sent_failure counter');
    lines.push(`job_monitor_emails_sent_failure ${metrics.emailFailureCount}`);

    lines.push('# HELP job_monitor_cpu_load_average CPU load average over the last 1 minute');
    lines.push('# TYPE job_monitor_cpu_load_average gauge');
    lines.push(`job_monitor_cpu_load_average ${metrics.cpuUsage.toFixed(2)}`);

    lines.push('# HELP job_monitor_memory_usage_bytes Node heap memory allocation in bytes');
    lines.push('# TYPE job_monitor_memory_usage_bytes gauge');
    lines.push(`job_monitor_memory_usage_bytes ${metrics.memoryUsageBytes}`);

    lines.push('# HELP job_monitor_db_connected Database connection state (1 = connected, 0 = disconnected)');
    lines.push('# TYPE job_monitor_db_connected gauge');
    lines.push(`job_monitor_db_connected ${metrics.dbStatus === 'connected' ? 1 : 0}`);

    lines.push('# HELP job_monitor_uptime_seconds Application process uptime in seconds');
    lines.push('# TYPE job_monitor_uptime_seconds gauge');
    lines.push(`job_monitor_uptime_seconds ${metrics.uptimeSeconds}`);

    return lines.join('\n') + '\n';
  }

  /**
   * Safely aggregates scraper run statistics across all active companies,
   * handling missing or partial statistics and preventing divide-by-zero.
   */
  static calculateScraperStats(companies: Array<{
    total_scrapes?: number;
    total_failures?: number;
    avg_response_time_ms?: number;
  }>): SystemStats {
    const totalCompanies = companies.length;
    const totalScrapes = companies.reduce((acc, c) => acc + (c.total_scrapes ?? 0), 0);
    const totalFailures = companies.reduce((acc, c) => acc + (c.total_failures ?? 0), 0);

    const failureRate = totalScrapes > 0 ? Number(((totalFailures / totalScrapes) * 100).toFixed(1)) : 0;

    // Filter to only companies that have been scraped and have a response time recorded
    const companiesWithStats = companies.filter((c) => (c.avg_response_time_ms ?? 0) > 0);

    const avgResponseTimeMs =
      companiesWithStats.length > 0
        ? Math.round(
            companiesWithStats.reduce((acc, c) => acc + (c.avg_response_time_ms ?? 0), 0) / companiesWithStats.length,
          )
        : 0;

    const avgResponseTimeSec = Number((avgResponseTimeMs / 1000).toFixed(2));

    return {
      totalCompanies,
      totalScrapes,
      totalFailures,
      failureRate,
      avgResponseTimeSec,
    };
  }
}

export interface SystemStats {
  totalCompanies: number;
  totalScrapes: number;
  totalFailures: number;
  failureRate: number;
  avgResponseTimeSec: number;
}

export class StatsReporter {
  public static calculate(companies: any[]): SystemStats {
    return Telemetry.calculateScraperStats(companies);
  }
}
