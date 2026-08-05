# Monitoring and Alerting Configuration

## Circuit Breaker Telemetry Logging

Circuit breaker state changes are emitted to structured logs formatted as JSON:

```json
{
  "timestamp": "2026-08-05T00:54:00.000Z",
  "level": "WARN",
  "event": "CIRCUIT_BREAKER_STATE_CHANGE",
  "service": "GreenhouseScraperService",
  "previousState": "CLOSED",
  "currentState": "OPEN",
  "consecutiveFailures": 5,
  "threshold": 5,
  "resetTimeoutMs": 30000
}
```

## Alerting Rules & Threshold Matrix

| Alert Name | Metric / Event | Threshold | Evaluation Window | Severity | Action |
|-------------|---------------|------------|-------------------|----------|--------|
| Circuit Breaker Tripped | event: CIRCUIT_BREAKER_STATE_CHANGE & currentState: OPEN | > 0 events | Instant (1 min) | HIGH | Notify Slack #ops-alerts + PagerDuty |
| High Error Rate (5xx) | HTTP Response Code 5xx ratio | > 2.0% of total requests | 5 minutes | CRITICAL | Page On-Call Engineer |
| Authentication Rate Limit Spike | code: TOO_MANY_AUTH_ATTEMPTS | > 50 events | 10 minutes | MEDIUM | Security log alert (potential brute-force attack) |
| High Latency (P95) | Endpoint P95 Response Time | > 1500 ms | 10 minutes | WARNING | Slack #perf-mon notification |
| Database Connection Pool Exhaustion | connection pool waiting count | > 10 connections | 5 minutes | HIGH | Database team notification |
| Memory Usage > 80% | memory heap used | > 80% of allocated memory | 5 minutes | WARNING | Automatic scaling trigger |
| Playwright Browser Pool Exhaustion | active browser contexts | = max concurrent contexts | 1 minute | HIGH | Ops team notification |

## Datadog Monitor Alert Definition

### High 5xx Error Rate Alert
```json
{
  "name": "[CRITICAL] High 5xx Error Rate in Job Platform",
  "type": "query alert",
  "query": "sum(last_5m):sum:trace.express.request.errors{env:production}.as_count() / sum:trace.express.request.hits{env:production}.as_count() * 100 > 2",
  "message": "5xx HTTP Error Rate exceeds 2% over the last 5 minutes! @pagerduty-job-platform",
  "tags": ["env:production", "service:job-platform", "team:ops"],
  "options": {
    "notify_no_data": false,
    "renotify_interval": 30,
    "include_tags": ["env:production"]
  }
}
```

### Circuit Breaker Activation Alert
```json
{
  "name": "[HIGH] Circuit Breaker Activation Detected",
  "type": "log alert",
  "query": "event:CIRCUIT_BREAKER_STATE_CHANGE currentState:OPEN",
  "message": "Circuit breaker has opened for service: {{service.name}}. Previous state: {{service.previousState}}. @slack-job-platform-ops",
  "tags": ["env:production", "type:circuit-breaker"],
  "options": {
    "notify_no_data": false,
    "renotify_interval": 60
  }
}
```

### Authentication Rate Limit Alert
```json
{
  "name": "[MEDIUM] Authentication Rate Limit Spike",
  "type": "log alert",
  "query": "error.code:TOO_MANY_AUTH_ATTEMPTS > 50",
  "message": "Potential brute force attack detected: {{error.count}} authentication rate limit violations in last 10 minutes. @security-team",
  "tags": ["env:production", "type:security"],
  "options": {
    "notify_no_data": false,
    "renotify_interval": 15
  }
}
```

### High Latency Alert
```json
{
  "name": "[WARNING] High API Latency Detected",
  "type": "query alert",
  "query": "avg(last_10m):trace.express.request.duration{env:production} > 1500",
  "message": "API P95 latency exceeds 1500ms over the last 10 minutes. Current: {{value}}ms @slack-job-platform-ops",
  "tags": ["env:production", "type:performance"],
  "options": {
    "notify_no_data": false,
    "renotify_interval": 20
  }
}
```

## Slack Integration

### Webhook Configuration
```typescript
// src/notifications/SlackNotifier.ts
export class SlackNotifier {
  private webhookUrl: string;
  
  constructor(webhookUrl: string) {
    this.webhookUrl = webhookUrl;
  }
  
  async sendAlert(message: string, severity: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL'): Promise<void> {
    const colors = {
      INFO: '#36a64f',
      WARNING: '#ff9800',
      ERROR: '#f44336',
      CRITICAL: '#b71c1c'
    };
    
    const payload = {
      text: message,
      attachments: [{
        color: colors[severity],
        fields: [
          {
            title: 'Severity',
            value: severity,
            short: true
          },
          {
            title: 'Timestamp',
            value: new Date().toISOString(),
            short: true
          },
          {
            title: 'Environment',
            value: process.env.NODE_ENV || 'unknown',
            short: true
          }
        ]
      }]
    };
    
    await fetch(this.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  }
}
```

## PagerDuty Integration

### PagerDuty Service Integration
```typescript
// src/notifications/PagerDutyNotifier.ts
export class PagerDutyNotifier {
  private apiKey: string;
  private routingKey: string;
  
  constructor(apiKey: string, routingKey: string) {
    this.apiKey = apiKey;
    this.routingKey = routingKey;
  }
  
  async triggerCriticalAlert(message: string, details?: any): Promise<void> {
    const payload = {
      routing_key: this.routingKey,
      event_action: 'trigger',
      payload: {
        summary: message,
        severity: 'critical',
        source: 'job-platform',
        custom_details: details
      }
    };
    
    await fetch('https://events.pagerduty.com/v2/enqueue', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token token=${this.apiKey}`
      },
      body: JSON.stringify(payload)
    });
  }
}
```

## Prometheus Metrics Export

### Metrics Configuration
```typescript
// src/monitoring/PrometheusMetrics.ts
import { register, Counter, Histogram, Gauge } from 'prom-client';

export const PrometheusMetrics = {
  // Request metrics
  httpRequestsTotal: new Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status_code']
  }),
  
  httpRequestDuration: new Histogram({
    name: 'http_request_duration_seconds',
    help: 'HTTP request duration in seconds',
    labelNames: ['method', 'route'],
    buckets: [0.1, 0.5, 1, 2, 5, 10]
  }),
  
  // Circuit breaker metrics
  circuitBreakerState: new Gauge({
    name: 'circuit_breaker_state',
    help: 'Current state of circuit breaker (0=CLOSED, 1=OPEN, 2=HALF_OPEN)',
    labelNames: ['service']
  }),
  
  circuitBreakerFailures: new Counter({
    name: 'circuit_breaker_failures_total',
    help: 'Total number of circuit breaker failures',
    labelNames: ['service']
  }),
  
  // Scraper metrics
  scraperOperations: new Counter({
    name: 'scraper_operations_total',
    help: 'Total number of scraper operations',
    labelNames: ['company', 'status']
  }),
  
  scraperDuration: new Histogram({
    name: 'scraper_duration_seconds',
    help: 'Scraper operation duration in seconds',
    labelNames: ['company'],
    buckets: [1, 5, 10, 30, 60, 120]
  }),
  
  // Browser pool metrics
  browserPoolActiveContexts: new Gauge({
    name: 'browser_pool_active_contexts',
    help: 'Number of active browser contexts'
  }),
  
  browserPoolMaxConcurrency: new Gauge({
    name: 'browser_pool_max_concurrency',
    help: 'Maximum browser concurrency'
  }),
  
  // Error metrics
  errorsTotal: new Counter({
    name: 'errors_total',
    help: 'Total number of errors',
    labelNames: ['type', 'location']
  })
};

// Metrics endpoint for Prometheus scraping
export function metricsEndpoint(req: any, res: any) {
  res.set('Content-Type', register.contentType);
  res.end(register.metrics());
}
```

## Custom Dashboard Configuration

### Grafana Dashboard JSON
```json
{
  "dashboard": {
    "title": "Job Platform Monitoring",
    "panels": [
      {
        "title": "Request Rate",
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])",
            "legendFormat": "{{method}} {{route}}"
          }
        ]
      },
      {
        "title": "Response Time",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, http_request_duration_seconds)",
            "legendFormat": "P95"
          }
        ]
      },
      {
        "title": "Circuit Breaker Status",
        "targets": [
          {
            "expr": "circuit_breaker_state",
            "legendFormat": "{{service}}"
          }
        ]
      },
      {
        "title": "Scraper Performance",
        "targets": [
          {
            "expr": "rate(scraper_operations_total[1h])",
            "legendFormat": "{{company}} {{status}}"
          }
        ]
      },
      {
        "title": "Browser Pool Utilization",
        "targets": [
          {
            "expr": "browser_pool_active_contexts / browser_pool_max_concurrency",
            "legendFormat": "Utilization %"
          }
        ]
      }
    ]
  }
}
```

## Log Aggregation Configuration

### Pino Log Configuration for Different Environments
```typescript
// src/monitoring/LogConfiguration.ts
import pino from 'pino';

export const createLogger = (environment: string) => {
  const isDevelopment = environment === 'development';
  const isProduction = environment === 'production';
  
  return pino({
    level: process.env.LOG_LEVEL || 'info',
    // Redact sensitive information
    redact: {
      paths: [
        'req.headers.authorization',
        'req.headers.cookie',
        'req.body.password',
        'req.body.token',
        'req.body.apiKey',
        '*.apiKey',
        '*.secret',
        '*.jwt'
      ],
      censor: '[REDACTED]'
    },
    // Development formatting
    transport: isDevelopment 
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'HH:MM:ss Z',
            ignore: 'pid,hostname'
          }
        }
      : undefined,
    // Production optimization
    ...(isProduction && {
      serializers: {
        req: pino.stdSerializers.req,
        res: pino.stdSerializers.res,
        err: pino.stdSerializers.err
      }
    })
  });
};
```

## Health Check Endpoint Enhancement

```typescript
// src/monitoring/HealthCheck.ts
export class HealthCheckService {
  static async getDetailedHealth() {
    const checks = {
      timestamp: new Date().toISOString(),
      status: 'healthy',
      checks: {
        database: await this.checkDatabase(),
        circuitBreakers: await this.checkCircuitBreakers(),
        browserPool: await this.checkBrowserPool(),
        externalServices: await this.checkExternalServices(),
        memory: this.checkMemory(),
        uptime: process.uptime()
      }
    };
    
    // Determine overall status
    const unhealthyChecks = Object.values(checks.checks)
      .filter((check: any) => check.status !== 'healthy');
    
    if (unhealthyChecks.length > 0) {
      checks.status = 'unhealthy';
    } else {
      const degradedChecks = Object.values(checks.checks)
        .filter((check: any) => check.status === 'degraded');
      
      if (degradedChecks.length > 0) {
        checks.status = 'degraded';
      }
    }
    
    return checks;
  }
  
  private static async checkCircuitBreakers() {
    const registry = CircuitBreakerRegistry.getInstance();
    const stats = registry.getAllStats();
    
    const circuitBreakers = {};
    for (const [name, stat] of Object.entries(stats)) {
      circuitBreakers[name] = {
        state: stat.state,
        failureCount: stat.failureCount,
        successCount: stat.successCount,
        lastFailureTime: stat.lastFailureTime,
        isHealthy: stat.state !== 'OPEN'
      };
    }
    
    const openCircuits = Object.values(circuitBreakers)
      .filter((cb: any) => !cb.isHealthy);
    
    return {
      status: openCircuits.length > 0 ? 'degraded' : 'healthy',
      circuitBreakers,
      openCircuits: openCircuits.length
    };
  }
}
```

## Alert Notification Routing

### Alert Routing Configuration
```typescript
// src/monitoring/AlertRouter.ts
export class AlertRouter {
  private static routeAlert(alert: Alert) {
    switch (alert.severity) {
      case 'CRITICAL':
        this.sendToPagerDuty(alert);
        this.sendToSlack(alert, '#critical-alerts');
        break;
      case 'HIGH':
        this.sendToSlack(alert, '#ops-alerts');
        this.sendToEmail(alert, 'oncall@example.com');
        break;
      case 'MEDIUM':
        this.sendToSlack(alert, '#notifications');
        break;
      case 'WARNING':
        this.sendToSlack(alert, '#perf-mon');
        break;
      default:
        this.sendToSlack(alert, '#alerts');
    }
  }
}
```

This monitoring and alerting configuration provides comprehensive observability for the Job Platform with appropriate alerting for different severity levels and integration with common monitoring tools.
