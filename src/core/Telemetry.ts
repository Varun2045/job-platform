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

export class Telemetry {
  public static activeWorkers = 0;
  public static queueSize = 0;
  public static totalRequests = 0;
  private static totalLatencyMs = 0;
  public static emailSuccessCount = 0;
  public static emailFailureCount = 0;
  public static lastSchedulerRun: string | null = null;
  public static schedulerStatus: 'idle' | 'running' | 'healthy' | 'degraded' | 'disabled' = 'healthy';

  public static recordRequest(latencyMs: number): void {
    this.totalRequests++;
    this.totalLatencyMs += latencyMs;
  }

  public static getAverageLatency(): number {
    return this.totalRequests > 0 ? Math.round(this.totalLatencyMs / this.totalRequests) : 0;
  }

  public static recordEmail(success: boolean): void {
    if (success) {
      this.emailSuccessCount++;
    } else {
      this.emailFailureCount++;
    }
  }

  public static getMetricsReport(dbStatus: 'connected' | 'disconnected'): TelemetryMetrics {
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
      uptimeSeconds: Math.round(process.uptime())
    };
  }

  public static toPrometheusFormat(metrics: TelemetryMetrics): string {
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
}
