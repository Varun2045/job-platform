/**
 * APM Monitoring Integration Guide
 * 
 * This file shows how to integrate APM monitoring (New Relic or Datadog)
 * into the server.ts file for production monitoring.
 */

import type { Request, Response, NextFunction } from 'express';
import { env } from '../config/env.js';
import { SecureLogger } from '../utils/SecureLogger.js';

// ============================================================================
// OPTION 1: New Relic Integration
// ============================================================================

// MUST BE AT THE VERY TOP OF server.ts BEFORE ANY OTHER IMPORTS
if (env.NODE_ENV === 'production' && process.env.NEW_RELIC_LICENSE_KEY) {
  // @ts-ignore - newrelic is a dynamic import without types
  import('newrelic');
  SecureLogger.logInfo('New Relic APM agent initialized');
}

// ============================================================================
// OPTION 2: Datadog Integration
// ============================================================================

// Import and initialize Datadog at the top of server.ts
if (env.NODE_ENV === 'production' && process.env.DATADOG_API_KEY) {
  import('./datadog.js');
  SecureLogger.logInfo('Datadog APM agent initialized');
}

// ============================================================================
// Custom APM Instrumentation
// ============================================================================

/**
 * Custom APM instrumentation helper class
 */
export class APMInstrumentation {
  /**
   * Record custom metric for job scraping operations
   */
  static recordJobScraped(company: string, durationMs: number, jobsFound: number, status: string) {
    // New Relic custom event
    if (process.env.NEW_RELIC_LICENSE_KEY) {
      try {
        // @ts-ignore - newrelic is a dynamic import without types
        // @ts-ignore - newrelic is a dynamic import without types
        const newrelic = require('newrelic');
        newrelic.recordCustomEvent('jobScraped', {
          company,
          durationMs,
          jobsFound,
          status,
          timestamp: Date.now(),
        });
      } catch (error) {
        SecureLogger.logError('Failed to record New Relic custom event', error as Error);
      }
    }

    // Datadog custom metric
    if (process.env.DATADOG_API_KEY) {
      try {
        const tracer = require('dd-trace');
        const span = tracer.scope().active();
        if (span) {
          span.setTag('job.company', company);
          span.setTag('job.duration_ms', durationMs);
          span.setTag('job.jobs_found', jobsFound);
          span.setTag('job.status', status);
        }
      } catch (error) {
        SecureLogger.logError('Failed to record Datadog custom metric', error as Error);
      }
    }
  }

  /**
   * Record circuit breaker state change
   */
  static recordCircuitBreakerState(service: string, oldState: string, newState: string, reason?: string) {
    if (process.env.NEW_RELIC_LICENSE_KEY) {
      try {
        // @ts-ignore - newrelic is a dynamic import without types
        const newrelic = require('newrelic');
        newrelic.recordCustomEvent('circuitBreakerState', {
          service,
          oldState,
          newState,
          reason,
          timestamp: Date.now(),
        });
      } catch (error) {
        SecureLogger.logError('Failed to record circuit breaker state', error as Error);
      }
    }

    if (process.env.DATADOG_API_KEY) {
      try {
        const tracer = require('dd-trace');
        const span = tracer.scope().active();
        if (span) {
          span.setTag('circuit_breaker.service', service);
          span.setTag('circuit_breaker.old_state', oldState);
          span.setTag('circuit_breaker.new_state', newState);
          span.setTag('circuit_breaker.reason', reason || 'unknown');
        }
      } catch (error) {
        SecureLogger.logError('Failed to record Datadog circuit breaker state', error as Error);
      }
    }
  }

  /**
   * Record rate limit violation
   */
  static recordRateLimitViolation(endpoint: string, ip: string, limitType: string) {
    if (process.env.NEW_RELIC_LICENSE_KEY) {
      try {
        // @ts-ignore - newrelic is a dynamic import without types
        const newrelic = require('newrelic');
        newrelic.recordCustomEvent('rateLimitViolation', {
          endpoint,
          ip,
          limitType,
          timestamp: Date.now(),
        });
      } catch (error) {
        SecureLogger.logError('Failed to record rate limit violation', error as Error);
      }
    }

    if (process.env.DATADOG_API_KEY) {
      try {
        const tracer = require('dd-trace');
        const span = tracer.scope().active();
        if (span) {
          span.setTag('rate_limit.endpoint', endpoint);
          span.setTag('rate_limit.ip', ip);
          span.setTag('rate_limit.type', limitType);
        }
      } catch (error) {
        SecureLogger.logError('Failed to record Datadog rate limit violation', error as Error);
      }
    }
  }

  /**
   * Record authentication failure
   */
  static recordAuthFailure(email: string, reason: string) {
    if (process.env.NEW_RELIC_LICENSE_KEY) {
      try {
        // @ts-ignore - newrelic is a dynamic import without types
        const newrelic = require('newrelic');
        newrelic.recordCustomEvent('authenticationFailure', {
          email: email.substring(0, 3) + '***', // Partial email for privacy
          reason,
          timestamp: Date.now(),
        });
      } catch (error) {
        SecureLogger.logError('Failed to record authentication failure', error as Error);
      }
    }

    if (process.env.DATADOG_API_KEY) {
      try {
        const tracer = require('dd-trace');
        const span = tracer.scope().active();
        if (span) {
          span.setTag('auth.reason', reason);
          span.setTag('auth.email_partial', email.substring(0, 3) + '***');
        }
      } catch (error) {
        SecureLogger.logError('Failed to record Datadog auth failure', error as Error);
      }
    }
  }

  /**
   * Create custom span for expensive operations
   */
  static async traceOperation<T>(
    operationName: string,
    fn: () => Promise<T>,
    tags?: Record<string, any>
  ): Promise<T> {
    if (process.env.DATADOG_API_KEY) {
      try {
        const tracer = require('dd-trace');
        return tracer.trace(operationName, async (span: any) => {
          if (tags) {
            Object.entries(tags).forEach(([key, value]) => {
              span.setTag(key, value);
            });
          }
          return await fn();
        });
      } catch (error) {
        SecureLogger.logError('Datadog tracing failed, falling back to direct execution', error as Error);
        return await fn();
      }
    }

    // Fallback for New Relic
    if (process.env.NEW_RELIC_LICENSE_KEY) {
      try {
        // @ts-ignore - newrelic is a dynamic import without types
        const newrelic = require('newrelic');
        return newrelic.startSegmentedTransaction(operationName, 'custom', async () => {
          try {
            return await fn();
          } finally {
            newrelic.endTransaction();
          }
        });
      } catch (error) {
        SecureLogger.logError('New Relic tracing failed, falling back to direct execution', error as Error);
        return await fn();
      }
    }

    // No APM enabled, execute directly
    return await fn();
  }
}

/**
 * Integration example for server.ts
 */
export function integrateAPMMiddleware(app: { use: (middleware: (req: Request, res: Response, next: NextFunction) => void) => void }) {
  // Add APM-specific middleware
  
  // Request ID for tracing correlation
  app.use((req: Request, res: Response, next: NextFunction) => {
    const requestId = (req.headers['x-request-id'] as string) || `req-${Date.now()}-${crypto.randomUUID().substring(0, 9)}`;
    (req as any).requestId = requestId;
    res.setHeader('X-Request-ID', requestId);
    
    // Add request ID to active APM span
    if (process.env.DATADOG_API_KEY) {
      try {
        const tracer = require('dd-trace');
        const span = tracer.scope().active();
        if (span) {
          span.setTag('request.id', requestId);
        }
      } catch {
        // Ignore
      }
    }
    
    next();
  });

  // Custom metrics middleware
  app.use((req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      
      // Record HTTP request metrics
      if (process.env.NEW_RELIC_LICENSE_KEY) {
        try {
          // @ts-ignore - newrelic is a dynamic import without types
        const newrelic = require('newrelic');
          newrelic.recordCustomEvent('httpRequest', {
            method: req.method,
            path: req.path,
            statusCode: res.statusCode,
            durationMs: duration,
            requestId: (req as any).requestId,
          });
        } catch (error) {
          // Ignore
        }
      }
    });
    
    next();
  });
}

/**
 * Example usage in route handlers
 */
export async function exampleAPMUsage() {
  // Example 1: Trace an expensive operation
  const result = await APMInstrumentation.traceOperation(
    'expensive_computation',
    async () => {
      // Your expensive operation here
      return { data: 'computed' };
    },
    { operation_type: 'data_processing' }
  );

  // Example 2: Record custom metrics
  APMInstrumentation.recordJobScraped('google', 1500, 25, 'success');
  
  // Example 3: Record circuit breaker state
  APMInstrumentation.recordCircuitBreakerState('GreenhouseAPI', 'CLOSED', 'OPEN', 'Timeout');
  
  // Example 4: Record rate limit violation
  APMInstrumentation.recordRateLimitViolation('/api/auth/login', '192.168.1.1', 'TOO_MANY_AUTH_ATTEMPTS');
  
  // Example 5: Record auth failure
  APMInstrumentation.recordAuthFailure('user@example.com', 'Invalid credentials');
}

export default APMInstrumentation;
