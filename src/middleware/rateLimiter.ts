import rateLimit from 'express-rate-limit';
import { authRateLimitConfig, rateLimitConfig } from '../config/env.js';

/**
 * Standard API rate limiter for general endpoints
 */
export const apiRateLimiter = rateLimit({
  windowMs: rateLimitConfig.windowMs,
  max: rateLimitConfig.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many requests from this IP, please try again later',
    },
  },
  skip: (req) => {
    // Skip rate limiting in development mode if needed
    return process.env.NODE_ENV === 'test' && req.path !== '/api/test';
  },
});

/**
 * Strict rate limiter for authentication endpoints
 * More aggressive limits to prevent brute force attacks
 */
export const authRateLimiter = rateLimit({
  windowMs: authRateLimitConfig.windowMs,
  max: authRateLimitConfig.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      code: 'TOO_MANY_AUTH_ATTEMPTS',
      message: 'Too many authentication attempts. Please try again after 15 minutes.',
    },
  },
  skip: (req) => {
    return process.env.NODE_ENV === 'test' && req.path !== '/api/auth/login';
  },
  // Store IP addresses to track attempts
  keyGenerator: (req) => {
    return req.ip || 'unknown';
  },
});

/**
 * Rate limiter for expensive operations (scraping, AI operations)
 */
export const expensiveOperationLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 expensive operations per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      code: 'TOO_MANY_EXPENSIVE_OPS',
      message: 'Too many expensive operations. Please wait before trying again.',
    },
  },
});

/**
 * Rate limiter for write operations (POST, PUT, DELETE)
 */
export const writeOperationLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 write operations per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      code: 'TOO_MANY_WRITE_OPS',
      message: 'Too many write operations. Please slow down.',
    },
  },
  skip: (req) => {
    // Only apply to write methods
    return !['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method);
  },
});

/**
 * Create a custom rate limiter with specific configuration
 */
export const createCustomRateLimiter = (
  windowMs: number,
  max: number,
  message?: string
) => {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      error: {
        code: 'CUSTOM_RATE_LIMIT',
        message: message || 'Rate limit exceeded',
      },
    },
  });
};
