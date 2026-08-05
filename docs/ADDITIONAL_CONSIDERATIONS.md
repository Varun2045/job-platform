# Additional Considerations: Security, Resilience, Testing & Ops Guide

This document details the operational, security, testing, deployment, and monitoring strategies for the **Job Platform / AI Career Operating System**.

---

## 1. Testing Strategy: Integration Tests for Middleware & Services

### 1.1 Overview
To guarantee system stability, security middleware and core resilience services must be validated using end-to-end integration tests. Tests are written in **Jest** using `supertest` to mock client HTTP traffic against Express application endpoints.

---

### 1.2 Middleware Integration Tests

#### A. Rate Limiter Integration Test (`src/tests/RateLimiterMiddleware.test.ts`)
Validates that rate-limiting headers are correctly set and that requests exceeding thresholds return HTTP 429 (`TOO_MANY_REQUESTS`).

```typescript
import request from 'supertest';
import express from 'express';
import { apiRateLimiter, authRateLimiter } from '../middleware/rateLimiter.js';

describe('Rate Limiter Middleware Integration Tests', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
  });

  test('should allow requests within rate limit and set rate limit headers', async () => {
    app.get('/api/test', apiRateLimiter, (req, res) => {
      res.status(200).json({ success: true });
    });

    const res = await request(app).get('/api/test');
    expect(res.status).toBe(200);
    expect(res.headers).toHaveProperty('ratelimit-limit');
    expect(res.headers).toHaveProperty('ratelimit-remaining');
  });

  test('should block authentication attempts exceeding threshold', async () => {
    app.post('/api/auth/login', authRateLimiter, (req, res) => {
      res.status(200).json({ token: 'mock-token' });
    });

    // Simulate requests up to limit
    for (let i = 0; i < 5; i++) {
      await request(app).post('/api/auth/login').send({ email: 'user@example.com', password: 'password' });
    }

    // Exceed limit
    const blockedRes = await request(app).post('/api/auth/login').send({ email: 'user@example.com', password: 'password' });
    expect(blockedRes.status).toBe(429);
    expect(blockedRes.body.error.code).toBe('TOO_MANY_AUTH_ATTEMPTS');
  });
});
```

#### B. Sanitization Middleware Integration Test (`src/tests/SanitizeMiddleware.test.ts`)
Validates that malicious script tags, XSS payloads, and unauthorized HTML attributes are stripped from incoming JSON request bodies and query parameters.

```typescript
import request from 'supertest';
import express from 'express';
import { sanitizeRequestBody } from '../middleware/sanitize.js';

describe('Sanitizer Middleware Integration Tests', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use(sanitizeRequestBody);
    app.post('/api/jobs', (req, res) => {
      res.status(200).json({ body: req.body });
    });
  });

  test('should strip dangerous <script> tags from request body', async () => {
    const payload = {
      title: 'Software Engineer',
      description: 'Great role <script>alert("xss")</script>',
    };

    const res = await request(app).post('/api/jobs').send(payload);
    expect(res.status).toBe(200);
    expect(res.body.body.description).toBe('Great role');
    expect(res.body.body.description).not.toContain('<script>');
  });

  test('should strip inline JavaScript event handlers', async () => {
    const payload = {
      notes: '<img src="invalid.jpg" onerror="alert(1)" /> Click here',
    };

    const res = await request(app).post('/api/jobs').send(payload);
    expect(res.status).toBe(200);
    expect(res.body.body.notes).not.toContain('onerror=');
  });
});
```

---

### 1.3 Service Circuit Breaker & Resiliency Integration Test
Validates that downstream failures in third-party ATS scrapers or external APIs trip the circuit breaker and return graceful fallback responses.

```typescript
import { HttpClient } from '../core/HttpClient.js';

describe('HttpClient Circuit Breaker Integration Tests', () => {
  test('should open circuit breaker after consecutive failures', async () => {
    const client = new HttpClient({
      failureThreshold: 3,
      resetTimeoutMs: 1000,
    });

    // Mock failing fetch endpoint
    jest.spyOn(global, 'fetch').mockRejectedValue(new Error('Network connection timeout'));

    // Trigger failures
    for (let i = 0; i < 3; i++) {
      await expect(client.get('https://api.external-ats.com/jobs')).rejects.toThrow();
    }

    // Circuit should now be OPEN, short-circuiting immediate requests
    expect(client.getCircuitState()).toBe('OPEN');
    await expect(client.get('https://api.external-ats.com/jobs')).rejects.toThrow('Circuit breaker is OPEN');
  });
});
```

---

## 2. Documentation: API Documentation & Security Requirements

### 2.1 OpenAPI 3.0 / Swagger Security Specification
The API documentation is updated to specify security schemes, authentication rules, rate limits, and sanitization expectations for consumers.

```yaml
openapi: 3.0.3
info:
  title: Open-Source AI Career Operating System API
  version: 2.1.0
  description: >
    API documentation for job searching, resume parsing, auto-applications, and AI analytics.
    All write endpoints enforce strict input sanitization and rate limits.
components:
  securitySchemes:
    BearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
      description: Supply JWT token in `Authorization: Bearer <token>` header.
    ApiKeyAuth:
      type: apiKey
      in: header
      name: X-API-Key
      description: API Key authentication for headless automated agents.

security:
  - BearerAuth: []

paths:
  /api/auth/login:
    post:
      summary: User authentication
      security: []
      description: Rate limited to 5 attempts per 15 minutes.
      responses:
        '200':
          description: Login successful. Returns JWT.
        '429':
          description: Rate limit exceeded (TOO_MANY_AUTH_ATTEMPTS).

  /api/jobs:
    post:
      summary: Create new job application entry
      security:
        - BearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/JobCreateInput'
      responses:
        '201':
          description: Job application recorded.
        '400':
          description: Invalid input or payload failed sanitization check.
        '429':
          description: Rate limit exceeded (TOO_MANY_WRITE_OPS).
```

### 2.2 Security Requirements Table

| Path Pattern | Auth Scheme | Rate Limit Tier | Sanitization Applied |
| :--- | :--- | :--- | :--- |
| `/api/auth/*` | None / Credentials | 5 req / 15 min | Strict sanitization |
| `/api/jobs/*` | Bearer JWT | 30 write ops / 1 min | Standard HTML + Text |
| `/api/scraper/*` | Bearer JWT / API Key | 10 expensive ops / 1 min | Raw HTML preserved for scraper routes |
| `/api/admin/*` | Admin JWT | 100 req / 1 min | Strict sanitization |

---

## 3. Deployment: Heroku Configuration & Environment Variables

### 3.1 Environment Variables Checklist

Set these configuration parameters on Heroku using the command line or Heroku Dashboard:

```bash
# Core & Security
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your_super_secret_jwt_key_32bytes_min
heroku config:set CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://app.yourdomain.com
heroku config:set RATE_LIMIT_WINDOW_MS=900000
heroku config:set RATE_LIMIT_MAX_REQUESTS=100

# Database & Supabase Integration
heroku config:set DATABASE_URL=postgres://user:password@host:5432/dbname?sslmode=require
heroku config:set SUPABASE_URL=https://your-project.supabase.co
heroku config:set SUPABASE_ANON_KEY=your_supabase_anon_key
heroku config:set SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Circuit Breaker & Resiliency
heroku config:set CIRCUIT_BREAKER_FAILURE_THRESHOLD=5
heroku config:set CIRCUIT_BREAKER_RESET_TIMEOUT_MS=30000

# Monitoring & APM Integration
heroku config:set NEW_RELIC_LICENSE_KEY=your_new_relic_license_key
heroku config:set NEW_RELIC_APP_NAME=job-platform-prod
heroku config:set DATADOG_API_KEY=your_datadog_api_key
heroku config:set DATADOG_SITE=datadoghq.com
```

### 3.2 Heroku `app.json` Configuration Update

```json
{
  "name": "Job Platform - AI Career Operating System",
  "description": "Heroku deployment configuration for production and review apps",
  "scripts": {
    "postdeploy": "npm run build"
  },
  "env": {
    "NODE_ENV": {
      "value": "production"
    },
    "RATE_LIMIT_WINDOW_MS": {
      "value": "900000"
    },
    "CIRCUIT_BREAKER_FAILURE_THRESHOLD": {
      "value": "5"
    }
  },
  "buildpacks": [
    {
      "url": "heroku/nodejs"
    },
    {
      "url": "https://github.com/mxschmitt/heroku-buildpack-playwright.git"
    }
  ]
}
```

### 3.3 Heroku Procfile
```
web: npm run start
worker: node dist/cli/admin.js monitor
```

---

## 4. Monitoring: Circuit Breaker Activations & Error Rate Alerts

### 4.1 Circuit Breaker Telemetry Logging
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

---

### 4.2 Alerting Rules & Threshold Matrix

| Alert Name | Metric / Event | Threshold | Evaluation Window | Severity | Action |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Circuit Breaker Tripped** | `event: CIRCUIT_BREAKER_STATE_CHANGE` & `currentState: OPEN` | > 0 events | Instant (1 min) | **HIGH** | Notify Slack `#ops-alerts` + PagerDuty |
| **High Error Rate (5xx)** | HTTP Response Code 5xx ratio | > 2.0% of total requests | 5 minutes | **CRITICAL** | Page On-Call Engineer |
| **Authentication Rate Limit Spike** | `code: TOO_MANY_AUTH_ATTEMPTS` | > 50 events | 10 minutes | **MEDIUM** | Security log alert (potential brute-force attack) |
| **High Latency (P95)** | Endpoint P95 Response Time | > 1500 ms | 10 minutes | **WARNING** | Slack `#perf-mon` notification |

---

### 4.3 Datadog Monitor Alert Definition Example (Terraform / JSON)

```json
{
  "name": "[CRITICAL] High 5xx Error Rate in Job Platform",
  "type": "query alert",
  "query": "sum(last_5m):sum:trace.express.request.errors{env:production}.as_count() / sum:trace.express.request.hits{env:production}.as_count() * 100 > 2",
  "message": "5xx HTTP Error Rate exceeds 2% over the last 5 minutes! @pagerduty-job-platform",
  "tags": ["env:production", "service:job-platform", "team:ops"],
  "options": {
    "notify_no_data": false,
    "renotify_interval": 30
  }
}
```

---

## 5. Performance: APM Monitoring (New Relic & DataDog)

### 5.1 New Relic Integration
To enable New Relic APM, install the agent and import it at the **very first line** of `src/server.ts`.

#### Installation:
```bash
npm install newrelic --save
```

#### Application Entry Point (`src/server.ts`):
```typescript
// MUST BE AT THE VERY TOP BEFORE ANY OTHER IMPORTS
if (process.env.NEW_RELIC_LICENSE_KEY) {
  import('newrelic');
}

import express from 'express';
import { apiRateLimiter } from './middleware/rateLimiter.js';
// ... rest of imports and server initialization
```

#### Configuration File (`newrelic.cjs`):
```javascript
'use strict';
exports.config = {
  app_name: [process.env.NEW_RELIC_APP_NAME || 'job-platform-prod'],
  license_key: process.env.NEW_RELIC_LICENSE_KEY,
  logging: {
    level: 'info',
  },
  allow_all_headers: true,
  attributes: {
    exclude: [
      'request.headers.cookie',
      'request.headers.authorization',
      'request.headers.x-api-key',
    ],
  },
};
```

---

### 5.2 Datadog APM (`dd-trace`) Integration
Alternatively, if using Datadog:

#### Installation:
```bash
npm install dd-trace --save
```

#### Initialization (`src/server.ts`):
```typescript
import tracer from 'dd-trace';
tracer.init({
  env: process.env.NODE_ENV || 'production',
  service: 'job-platform-backend',
  logInjection: true,
});

import express from 'express';
// ... rest of server code
```

---

### 5.3 APM Performance Metrics to Monitor

1. **Transaction Throughput & Latency**:
   - P50, P90, and P99 latency broken down by API routes (`/api/jobs`, `/api/ai/*`, `/api/auth/*`).
2. **Database Query Profiling**:
   - PostgreSQL query latency distribution & slow queries (>100ms).
   - Connection pool utilization and waiting count.
3. **Event Loop & Garbage Collection**:
   - Node.js Event Loop Lag (>50ms target threshold).
   - Heap Memory Usage & GC Pause Times.
4. **External API Tracing**:
   - Outbound HTTP requests to Supabase, OpenAI, Resend, and Playwright headless scrapers.
