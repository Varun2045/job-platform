# API Security Requirements Table

This document outlines the security requirements for different API endpoint patterns in the Job Platform API.

## Security Matrix

| Path Pattern | Auth Scheme | Rate Limit Tier | Sanitization Applied | Circuit Breaker | Notes |
|-------------|-------------|----------------|---------------------|----------------|-------|
| `/api/auth/*` | None / Credentials | 5 req / 15 min | Strict sanitization | No | Authentication endpoints - strict rate limiting to prevent brute force |
| `/api/jobs/*` | Bearer JWT | 30 write ops / 1 min | Standard HTML + Text | No | Job CRUD operations - standard sanitization for user content |
| `/api/applications/*` | Bearer JWT | 30 write ops / 1 min | Standard HTML + Text | No | Application tracking - allows basic HTML for notes |
| `/api/resumes/*` | Bearer JWT | 10 expensive ops / 1 min | Raw HTML preserved | No | Resume processing - raw HTML needed for parsing |
| `/api/scraper/*` | Bearer JWT / API Key | 10 expensive ops / 1 min | Raw HTML preserved for scraper routes | Yes | Scraping operations - circuit breaker for external ATS calls |
| `/api/ai/*` | Bearer JWT | 10 expensive ops / 1 min | Standard sanitization | Yes | AI operations - circuit breaker for OpenAI/Gemini APIs |
| `/api/admin/*` | Admin JWT | 100 req / 1 min | Strict sanitization | No | Admin operations - strict input validation |
| `/api/monitor/*` | Bearer JWT | 100 req / 1 min | Standard sanitization | No | Monitoring endpoints - relaxed rate limiting |
| `/health` | None | No rate limiting | None | No | Health check - public endpoint |
| `/ready` | None | No rate limiting | None | No | Readiness check - public endpoint |

## Rate Limit Tiers

### Tier 1: Authentication (Most Restrictive)
- **Limit**: 5 requests per 15 minutes
- **Purpose**: Prevent brute force attacks on authentication
- **Applied to**: `/api/auth/login`, `/api/auth/register`, `/api/auth/reset-password`
- **Response**: HTTP 429 with code `TOO_MANY_AUTH_ATTEMPTS`

### Tier 2: Expensive Operations
- **Limit**: 10 requests per minute
- **Purpose**: Protect resource-intensive operations
- **Applied to**: `/api/scraper/*`, `/api/ai/*`, `/api/resumes/parse`
- **Response**: HTTP 429 with code `TOO_MANY_EXPENSIVE_OPS`

### Tier 3: Write Operations
- **Limit**: 30 requests per minute
- **Purpose**: Prevent spam while allowing normal usage
- **Applied to**: POST, PUT, DELETE, PATCH operations
- **Response**: HTTP 429 with code `TOO_MANY_WRITE_OPS`

### Tier 4: General API
- **Limit**: 100 requests per 15 minutes
- **Purpose**: General API protection
- **Applied to**: All other API endpoints
- **Response**: HTTP 429 with code `TOO_MANY_REQUESTS`

## Sanitization Levels

### Strict Sanitization
- **Applied to**: Authentication, admin endpoints, sensitive data
- **Allowed Tags**: None (text only)
- **Allowed Attributes**: None
- **Strips**: All HTML, event handlers, JavaScript URIs
- **Purpose**: Maximum security for sensitive operations

### Standard HTML + Text
- **Applied to**: General user content, job descriptions, notes
- **Allowed Tags**: `b`, `i`, `em`, `strong`, `a`, `p`, `ul`, `ol`, `li`, `br`, `h1-h6`
- **Allowed Attributes**: `href`, `title`, `target` (for anchors)
- **Allowed Schemes**: `http`, `https`, `mailto`, `tel`
- **Strips**: Scripts, event handlers, dangerous attributes
- **Purpose**: Balance between functionality and security

### Raw HTML Preserved
- **Applied to**: Scraper test endpoints, resume parsing
- **Allowed Tags**: All HTML tags
- **Allowed Attributes**: All attributes
- **Strips**: None
- **Purpose**: Needed for HTML parsing and testing operations
- **Special Routes**: `/api/scraper/test-selector`, `/api/resumes/upload`

## Circuit Breaker Protection

### Protected External Services
1. **ATS Scrapers** (Greenhouse, Lever, Workday, etc.)
   - Failure Threshold: 5 consecutive failures
   - Reset Timeout: 30 seconds
   - Half-Open Max Calls: 3

2. **AI Services** (OpenAI, Gemini)
   - Failure Threshold: 3 consecutive failures
   - Reset Timeout: 60 seconds
   - Half-Open Max Calls: 2

3. **Email Service** (Resend)
   - Failure Threshold: 3 consecutive failures
   - Reset Timeout: 120 seconds
   - Half-Open Max Calls: 2

### Circuit Breaker States
- **CLOSED**: Normal operation, all requests pass through
- **OPEN**: Circuit is tripped, requests are blocked
- **HALF_OPEN**: Testing if service has recovered, limited requests allowed

### Circuit Breaker Logging
State changes are logged with:
- Service name
- Previous state
- New state
- Failure count
- Threshold
- Reset timeout

## Authentication Schemes

### Bearer JWT
- **Header**: `Authorization: Bearer <token>`
- **Token Source**: Login endpoint
- **Expiration**: 30 days
- **Secret**: Minimum 32 characters (enforced by Zod validation)

### API Key
- **Header**: `X-API-Key: <key>`
- **Purpose**: Headless automated agents
- **Rate Limits**: Same as authenticated users
- **Validation**: Key format and length validation

### No Authentication
- **Applied to**: `/health`, `/ready`, public endpoints
- **Rate Limits**: No rate limiting applied
- **Sanitization**: None (health checks only)

## Security Headers

All API responses include:
- `X-Request-ID`: Unique request identifier
- `X-Content-Type-Options`: nosniff
- `X-Frame-Options`: DENY
- `X-XSS-Protection`: 1; mode=block
- `Strict-Transport-Security`: max-age=31536000 (HTTPS only)

## Error Response Format

All errors follow this format:
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {} // Only in development mode
  }
}
```

### Common Error Codes
- `BAD_REQUEST`: Invalid input or validation failed
- `UNAUTHORIZED`: Authentication required or invalid
- `FORBIDDEN`: Insufficient permissions
- `NOT_FOUND`: Resource not found
- `TOO_MANY_REQUESTS`: General rate limit exceeded
- `TOO_MANY_AUTH_ATTEMPTS`: Auth rate limit exceeded
- `TOO_MANY_EXPENSIVE_OPS`: Expensive operation rate limit exceeded
- `TOO_MANY_WRITE_OPS`: Write operation rate limit exceeded
- `VALIDATION_ERROR`: Input validation failed
- `EXTERNAL_SERVICE_ERROR`: External service (ATS, AI) error
- `CIRCUIT_BREAKER_OPEN`: Circuit breaker is blocking requests

## Security Best Practices

### For API Consumers
1. **Always use HTTPS** in production
2. **Validate and sanitize** all user inputs before sending to API
3. **Implement retry logic** with exponential backoff for 429 responses
4. **Store JWT tokens securely** on client side
5. **Monitor rate limit headers** in responses
6. **Handle circuit breaker errors** gracefully with fallbacks

### For API Implementation
1. **Never log sensitive data** (passwords, tokens, API keys)
2. **Use parameterized queries** for database operations
3. **Implement proper CORS** configuration
4. **Keep dependencies updated** and regularly audit for vulnerabilities
5. **Monitor for anomalies** in rate limit violations and circuit breaker activations
6. **Test security controls** regularly with integration tests

## Monitoring & Alerting

### Key Metrics to Monitor
1. **Rate limit violations** by endpoint and IP
2. **Circuit breaker activations** by service
3. **Failed authentication attempts** (potential brute force)
4. **Sanitization blocks** (potential XSS attempts)
5. **External service error rates** (ATS, AI, email)

### Alert Thresholds
- **Critical**: Circuit breaker activation > 5 per hour
- **High**: Auth rate limit violations > 50 per 10 minutes
- **Medium**: General rate limit violations > 100 per hour
- **Low**: Single circuit breaker activation

### Response to Alerts
1. **Circuit breaker activation**: Investigate external service status, consider manual reset
2. **Auth rate limit spikes**: Check for brute force attacks, consider IP blocking
3. **High error rates**: Review logs for common patterns, address root cause
4. **Sanitization blocks**: Monitor for XSS attack patterns
