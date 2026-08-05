import { SecureLogger } from './SecureLogger.js';

export interface RetryOptions {
  maxRetries?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffFactor?: number;
  shouldRetry?: (error: any) => boolean;
  onRetry?: (attempt: number, error: any) => void;
}

const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelayMs: 500,
  maxDelayMs: 30000, // 30 seconds max delay
  backoffFactor: 2,
  shouldRetry: (error: any) => {
    // Retry on network errors and 5xx errors
    return (
      error.code === 'ECONNRESET' ||
      error.code === 'ETIMEDOUT' ||
      error.code === 'ENOTFOUND' ||
      error.code === 'ECONNREFUSED' ||
      error.statusCode >= 500 ||
      error.statusCode === 429 // Too Many Requests
    );
  },
  onRetry: (attempt, error) => {
    SecureLogger.logWarn(`Retry attempt ${attempt} after error: ${error.message}`);
  },
};

/**
 * Retry function with exponential backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let lastError: any;
  let currentDelay = opts.initialDelayMs;

  for (let attempt = 1; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Check if we should retry this error
      if (!opts.shouldRetry(error)) {
        SecureLogger.logDebug('Error not retryable', { error: error instanceof Error ? error.message : String(error) });
        throw error;
      }

      // Don't retry on the last attempt
      if (attempt === opts.maxRetries) {
        SecureLogger.logError('Max retries reached', error instanceof Error ? error : new Error(String(error)));
        throw error;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(currentDelay, opts.maxDelayMs);
      
      // Log retry attempt
      if (opts.onRetry) {
        opts.onRetry(attempt, error);
      }

      // Wait before retrying
      await sleep(delay);
      
      // Increase delay for next attempt
      currentDelay *= opts.backoffFactor;
    }
  }

  throw lastError;
}

/**
 * Sleep utility for delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry with jitter to avoid thundering herd
 */
export async function withRetryWithJitter<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let lastError: any;
  let currentDelay = opts.initialDelayMs;

  for (let attempt = 1; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (!opts.shouldRetry(error)) {
        throw error;
      }

      if (attempt === opts.maxRetries) {
        throw error;
      }

      // Add jitter: random value between 0 and currentDelay
      const jitter = Math.random() * currentDelay;
      const delay = Math.min(currentDelay + jitter, opts.maxDelayMs);

      if (opts.onRetry) {
        opts.onRetry(attempt, error);
      }

      await sleep(delay);
      currentDelay *= opts.backoffFactor;
    }
  }

  throw lastError;
}

/**
 * Retry specifically for HTTP requests
 */
export async function retryHttpRequest<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const httpOptions: RetryOptions = {
    ...DEFAULT_RETRY_OPTIONS,
    ...options,
    shouldRetry: (error: any) => {
      // Retry on network errors and specific HTTP status codes
      const isNetworkError = 
        error.code === 'ECONNRESET' ||
        error.code === 'ETIMEDOUT' ||
        error.code === 'ENOTFOUND' ||
        error.code === 'ECONNREFUSED';

      const isRetryableStatus = 
        error.statusCode === 408 || // Request Timeout
        error.statusCode === 429 || // Too Many Requests
        error.statusCode === 500 || // Internal Server Error
        error.statusCode === 502 || // Bad Gateway
        error.statusCode === 503 || // Service Unavailable
        error.statusCode === 504;  // Gateway Timeout

      return isNetworkError || isRetryableStatus;
    },
  };

  return withRetry(fn, httpOptions);
}

/**
 * Class-based retry manager for more complex scenarios
 */
export class RetryManager {
  private options: Required<RetryOptions>;
  private attemptCount = 0;

  constructor(options: RetryOptions = {}) {
    this.options = { ...DEFAULT_RETRY_OPTIONS, ...options };
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    this.attemptCount = 0;
    return withRetry(fn, {
      ...this.options,
      onRetry: (attempt, error) => {
        this.attemptCount = attempt;
        if (this.options.onRetry) {
          this.options.onRetry(attempt, error);
        }
      },
    });
  }

  getAttemptCount(): number {
    return this.attemptCount;
  }

  reset(): void {
    this.attemptCount = 0;
  }
}

/**
 * Decorator for retrying class methods
 */
export function Retryable(options: RetryOptions = {}) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      return withRetry(() => originalMethod.apply(this, args), options);
    };

    return descriptor;
  };
}
