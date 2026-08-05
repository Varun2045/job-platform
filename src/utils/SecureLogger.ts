import pino from 'pino';
import { env } from '../config/env.js';

// Sensitive data patterns to redact
const SENSITIVE_PATTERNS = [
  'password',
  'secret',
  'token',
  'apiKey',
  'api_key',
  'apikey',
  'authorization',
  'auth',
  'credit',
  'ssn',
  'social',
  'passport',
  'private',
  'key',
  'jwt',
  'bearer',
  'session',
  'cookie',
];

/**
 * Secure logger with automatic sensitive data redaction
 */
export class SecureLogger {
  private static instance: pino.Logger;

  private static initialize(): pino.Logger {
    return pino({
      level: env.LOG_LEVEL,
      // Automatic redaction of sensitive fields
      redact: {
        paths: [
          'req.headers.authorization',
          'req.headers.cookie',
          'req.body.password',
          'req.body.token',
          'req.body.secret',
          'req.body.apiKey',
          'req.body.api_key',
          'req.body.jwt',
          'req.body.session',
          'req.body.*.password',
          'req.body.*.token',
          'req.body.*.secret',
          'req.body.*.apiKey',
          'req.body.*.api_key',
          'req.body.*.jwt',
          'req.query.token',
          'req.query.secret',
          'req.query.apiKey',
          'req.query.api_key',
          'req.params.token',
          'req.params.secret',
          'res.headers.authorization',
          'res.headers["set-cookie"]',
          'error.config.headers',
          'error.request.headers',
          '*.password',
          '*.token',
          '*.secret',
          '*.apiKey',
          '*.api_key',
          '*.jwt',
          '*.authorization',
          '*.cookie',
        ],
        censor: '[REDACTED]',
        remove: true,
      },
      // Add timestamp and formatting
      timestamp: pino.stdTimeFunctions.isoTime,
      // Add error serialization
      serializers: {
        err: pino.stdSerializers.err,
        req: pino.stdSerializers.req,
        res: pino.stdSerializers.res,
      },
      // Development vs production formatting
      transport: env.NODE_ENV === 'development' 
        ? {
            target: 'pino-pretty',
            options: {
              colorize: true,
              translateTime: 'HH:MM:ss Z',
              ignore: 'pid,hostname',
            },
          }
        : undefined,
    });
  }

  public static getInstance(): pino.Logger {
    if (!SecureLogger.instance) {
      SecureLogger.instance = SecureLogger.initialize();
    }
    return SecureLogger.instance;
  }

  /**
   * Manually redact sensitive data from an object
   */
  public static redactSensitiveData(obj: any): any {
    if (!obj || typeof obj !== 'object') {
      return obj;
    }

    const redacted = { ...obj };
    
    for (const key in redacted) {
      if (Object.prototype.hasOwnProperty.call(redacted, key)) {
        const lowerKey = key.toLowerCase();
        
        // Check if key matches sensitive patterns
        if (SENSITIVE_PATTERNS.some(pattern => lowerKey.includes(pattern))) {
          redacted[key] = '[REDACTED]';
        } else if (typeof redacted[key] === 'object' && redacted[key] !== null) {
          redacted[key] = SecureLogger.redactSensitiveData(redacted[key]);
        }
      }
    }
    
    return redacted;
  }

  /**
   * Safe logging that automatically redacts sensitive data
   */
  public static logInfo(message: string, meta?: any): void {
    const logger = SecureLogger.getInstance();
    const safeMeta = meta ? SecureLogger.redactSensitiveData(meta) : {};
    logger.info(safeMeta, message);
  }

  public static logWarn(message: string, meta?: any): void {
    const logger = SecureLogger.getInstance();
    const safeMeta = meta ? SecureLogger.redactSensitiveData(meta) : {};
    logger.warn(safeMeta, message);
  }

  public static logError(message: string, error?: Error | string, meta?: any): void {
    const logger = SecureLogger.getInstance();
    const safeMeta = meta ? SecureLogger.redactSensitiveData(meta) : {};
    
    if (error instanceof Error) {
      // Redact error stack trace if it contains sensitive info
      const safeError = {
        ...error,
        message: error.message,
        stack: SecureLogger.redactStackTrace(error.stack),
      };
      logger.error({ err: safeError, ...safeMeta }, message);
    } else if (typeof error === 'string') {
      logger.error({ error: SecureLogger.redactSensitiveData(error), ...safeMeta }, message);
    } else {
      logger.error(safeMeta, message);
    }
  }

  public static logDebug(message: string, meta?: any): void {
    const logger = SecureLogger.getInstance();
    const safeMeta = meta ? SecureLogger.redactSensitiveData(meta) : {};
    logger.debug(safeMeta, message);
  }

  /**
   * Redact sensitive information from stack traces
   */
  private static redactStackTrace(stack?: string): string {
    if (!stack) return '';
    
    let redactedStack = stack;
    
    // Redact common sensitive patterns in stack traces
    SENSITIVE_PATTERNS.forEach(pattern => {
      const regex = new RegExp(`([?&]?${pattern}=)[^\\s&]+`, 'gi');
      redactedStack = redactedStack.replace(regex, '$1[REDACTED]');
    });
    
    return redactedStack;
  }
}

// Convenience exports for backward compatibility
export const logger = SecureLogger.getInstance();

export const Logger = {
  info: SecureLogger.logInfo,
  warn: SecureLogger.logWarn,
  error: SecureLogger.logError,
  debug: SecureLogger.logDebug,
  
  // Specialized logging methods
  logCompanyRun: (company: string, stats: any) => {
    SecureLogger.logInfo(`Scraped company: ${company}`, stats);
  },
};
