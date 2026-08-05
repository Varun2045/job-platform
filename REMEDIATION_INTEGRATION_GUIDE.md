# Remediation Integration Guide

This guide explains how to integrate the new security, architecture, and performance improvements into the existing codebase.

## 1. Environment Configuration Integration

Replace the existing `src/config/config.ts` with the new Zod-based validation:

```typescript
// In server.ts, replace:
import { config } from './config/config.js';

// With:
import { env, isDevelopment, isProduction, corsOrigins } from './config/env.js';
```

## 2. Security Middleware Integration

Add the new security middleware to server.ts:

```typescript
import { sanitizeRequestBody } from './middleware/sanitize.js';
import { apiRateLimiter, authRateLimiter } from './middleware/rateLimiter.js';
import { errorHandler, asyncHandler } from './utils/errors.js';

// After app initialization:
app.use(sanitizeRequestBody);

// Apply rate limiting
if (!isDevelopment) {
  app.use('/api', apiRateLimiter);
  app.use('/api/auth', authRateLimiter);
}

// Error handling (should be last middleware)
app.use(errorHandler);
```

## 3. Logger Integration

Replace the existing Logger with the new SecureLogger:

```typescript
// In server.ts, replace:
import { Logger } from './core/Logger.js';

// With:
import { Logger } from './utils/SecureLogger.js';
```

## 4. Storage Integration

Update storage initialization to use async file operations:

```typescript
// In server.ts, replace:
import { FileStorage } from './storage/FileStorage.js';

// With:
import { AsyncFileStorage } from './storage/AsyncFileStorage.js';

// Update storage initialization:
const storage: StorageProvider = isFileStorageMode 
  ? new AsyncFileStorage() 
  : new SupabaseStorage();
```

## 5. Browser Pool Integration

Update Playwright scrapers to use the new browser pool:

```typescript
// In PlaywrightScraper.ts, add:
import { BrowserPool, withBrowserContext } from './scrapers/BrowserPool.js';

// Replace browser initialization:
// OLD:
// const browser = await chromium.launch({ ... });

// NEW:
const pool = BrowserPool.getInstance();
const { context, release } = await pool.getContext();

try {
  // Use context instead of browser
  const page = await context.newPage();
  // ... scraping logic
} finally {
  await release();
}

// OR use the helper:
await withBrowserContext(async (context) => {
  const page = await context.newPage();
  // ... scraping logic
});
```

## 6. Graceful Shutdown Integration

Add graceful shutdown to server.ts:

```typescript
import { setupGracefulShutdown } from './utils/gracefulShutdown.js';

// After server is created:
const server = app.listen(env.PORT, () => {
  Logger.info(`Server running on port ${env.PORT} in ${env.NODE_ENV} mode`);
});

// Setup graceful shutdown
setupGracefulShutdown(server, {
  timeout: 10000,
  onShutdownStart: async () => {
    Logger.info('Starting graceful shutdown...');
  },
  onShutdownComplete: async () => {
    Logger.info('Shutdown completed successfully');
  },
});
```

## 7. Error Handling Integration

Update route handlers to use the new error handling:

```typescript
// OLD:
app.get('/api/example', async (req, res) => {
  try {
    const data = await someOperation();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// NEW:
import { asyncHandler, NotFoundError, BadRequestError } from './utils/errors.js';

app.get('/api/example', asyncHandler(async (req, res) => {
  const data = await someOperation();
  if (!data) {
    throw new NotFoundError('Resource not found');
  }
  res.json(data);
}));
```

## 8. Retry and Circuit Breaker Integration

Add resilience patterns to external service calls:

```typescript
import { withRetry, retryHttpRequest } from './utils/retry.js';
import { CircuitBreaker, CircuitBreakerProtected } from './utils/circuitBreaker.js';

// In service classes:
export class ExternalApiService {
  @CircuitBreakerProtected('external-api', {
    failureThreshold: 5,
    resetTimeout: 60000,
  })
  async fetchData() {
    return retryHttpRequest(async () => {
      const response = await fetch('https://api.example.com/data');
      return response.json();
    });
  }
}
```

## 9. Environment Variables Update

Update your `.env` file with the new required variables:

```bash
# REQUIRED SECURITY VARIABLES (minimum 32 characters)
JWT_SECRET=your-super-secret-jwt-key-at-least-32-characters-long
SESSION_SECRET=your-super-secret-session-key-at-least-32-characters

# Update storage configuration
STORAGE_MODE=file  # or 'supabase'
SUPABASE_SERVICE_ROLE_KEY=your-key  # if using supabase

# Update feature flags
FEATURE_RESUME_MATCHING=true
FEATURE_PLAYWRIGHT=true
# ... other feature flags
```

## 10. Testing the Changes

### Test Security Validations
```bash
# Try to start without JWT_SECRET (should fail)
JWT_SECRET=short npm start

# Test with proper configuration
JWT_SECRET=proper-32-character-secret-key npm start
```

### Test Rate Limiting
```bash
# Make multiple requests to test rate limiting
for i in {1..10}; do curl http://localhost:3000/api/test; done
```

### Test Graceful Shutdown
```bash
# Send SIGTERM to test graceful shutdown
kill -TERM <pid>
```

### Test Browser Pool
```bash
# Monitor browser pool during scraping
curl http://localhost:3000/api/monitor/google
```

## 11. Deployment Considerations

### Heroku Configuration
```bash
# Set production environment variables
heroku config:set JWT_SECRET=your-production-secret
heroku config:set SESSION_SECRET=your-production-session-secret
heroku config:set NODE_ENV=production
heroku config:set PLAYWRIGHT_CONCURRENCY=2
```

### Build Process
The TypeScript compiler will automatically pick up the new files. No changes to `package.json` scripts are needed.

### Monitoring
The new logger provides structured logs that work well with log aggregation tools like:
- Heroku Logplex
- Loggly
- Papertrail
- Datadog Logs

## 12. Rollback Plan

If issues arise, you can quickly rollback:

1. **Revert to old config**: Restore original `src/config/config.ts`
2. **Disable new middleware**: Comment out new middleware in server.ts
3. **Use old storage**: Switch back to `FileStorage` instead of `AsyncFileStorage`
4. **Old browser management**: Revert to original Playwright initialization

## 13. Performance Monitoring

Monitor the following metrics after deployment:

1. **Memory Usage**: Browser pool should reduce memory spikes
2. **Response Time**: Async file operations should improve response times
3. **Error Rate**: Circuit breaker should reduce cascading failures
4. **Resource Utilization**: Graceful shutdown should prevent resource leaks

## 14. Next Steps

After successful integration:

1. **Update Documentation**: Add new security requirements to README
2. **Monitoring Setup**: Configure alerts for circuit breaker activations
3. **Load Testing**: Test the new rate limiting and browser pool under load
4. **Security Audit**: Perform security review of the new implementations
5. **Performance Testing**: Compare performance metrics before and after

## 15. Troubleshooting

### Common Issues

**Issue**: Application fails to start with "JWT_SECRET must be at least 32 characters"
**Solution**: Set a proper JWT_SECRET in your environment variables

**Issue**: File storage operations timeout
**Solution**: Check disk I/O performance and permissions

**Issue**: Browser pool exhausts connections
**Solution**: Increase PLAYWRIGHT_CONCURRENCY or reduce scraping frequency

**Issue**: Circuit breaker stays open too long
**Solution**: Adjust resetTimeout in circuit breaker configuration

This integration guide ensures a smooth transition to the improved architecture while maintaining backward compatibility where possible.
