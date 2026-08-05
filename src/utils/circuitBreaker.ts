import { SecureLogger } from './SecureLogger.js';

export interface CircuitBreakerOptions {
  failureThreshold?: number;
  resetTimeout?: number;
  monitoringPeriod?: number;
  halfOpenMaxCalls?: number;
  onStateChange?: (state: CircuitState, reason?: string) => void;
}

export enum CircuitState {
  CLOSED = 'CLOSED',   // Normal operation
  OPEN = 'OPEN',       // Circuit is open, blocking calls
  HALF_OPEN = 'HALF_OPEN' // Testing if service has recovered
}

export interface CircuitBreakerStats {
  state: CircuitState;
  failureCount: number;
  successCount: number;
  lastFailureTime: number | null;
  lastSuccessTime: number | null;
  nextAttemptTime: number | null;
}

/**
 * Circuit Breaker implementation for preventing cascading failures
 */
export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount = 0;
  private successCount = 0;
  private lastFailureTime: number | null = null;
  private lastSuccessTime: number | null = null;
  private nextAttemptTime: number | null = null;
  private halfOpenCalls = 0;

  private readonly options: Required<CircuitBreakerOptions>;

  constructor(options: CircuitBreakerOptions = {}) {
    this.options = {
      failureThreshold: options.failureThreshold || 5,
      resetTimeout: options.resetTimeout || 60000, // 1 minute
      monitoringPeriod: options.monitoringPeriod || 10000, // 10 seconds
      halfOpenMaxCalls: options.halfOpenMaxCalls || 3,
      onStateChange: options.onStateChange || (() => {}),
    };
  }

  /**
   * Execute a function with circuit breaker protection
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // Check if circuit is open
    if (this.state === CircuitState.OPEN) {
      if (this.shouldAttemptReset()) {
        this.transitionToHalfOpen();
      } else {
        const error = new Error('Circuit breaker is OPEN - service unavailable');
        SecureLogger.logWarn('Circuit breaker blocked call', {
          nextAttemptTime: this.nextAttemptTime,
        });
        throw error;
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  /**
   * Handle successful execution
   */
  private onSuccess(): void {
    this.successCount++;
    this.lastSuccessTime = Date.now();

    if (this.state === CircuitState.HALF_OPEN) {
      this.halfOpenCalls++;
      
      // If enough successful calls in half-open state, close the circuit
      if (this.halfOpenCalls >= this.options.halfOpenMaxCalls) {
        this.transitionToClosed('Service recovered after testing');
      }
    } else {
      // Reset failure count on success in closed state
      this.failureCount = 0;
    }
  }

  /**
   * Handle failed execution
   */
  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.state === CircuitState.HALF_OPEN) {
      // If failure in half-open state, open the circuit immediately
      this.transitionToOpen('Service failed during recovery testing');
    } else if (this.failureCount >= this.options.failureThreshold) {
      // If failure threshold reached, open the circuit
      this.transitionToOpen(`Failure threshold reached: ${this.failureCount}`);
    }
  }

  /**
   * Check if we should attempt to reset the circuit
   */
  private shouldAttemptReset(): boolean {
    if (!this.lastFailureTime) return false;
    
    const timeSinceLastFailure = Date.now() - this.lastFailureTime;
    return timeSinceLastFailure >= this.options.resetTimeout;
  }

  /**
   * Transition to CLOSED state
   */
  private transitionToClosed(reason?: string): void {
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.halfOpenCalls = 0;
    this.nextAttemptTime = null;
    
    SecureLogger.logInfo('Circuit breaker transitioned to CLOSED', { reason });
    this.options.onStateChange(CircuitState.CLOSED, reason);
  }

  /**
   * Transition to OPEN state
   */
  private transitionToOpen(reason?: string): void {
    this.state = CircuitState.OPEN;
    this.nextAttemptTime = Date.now() + this.options.resetTimeout;
    
    SecureLogger.logWarn('Circuit breaker transitioned to OPEN', { reason });
    this.options.onStateChange(CircuitState.OPEN, reason);
  }

  /**
   * Transition to HALF_OPEN state
   */
  private transitionToHalfOpen(): void {
    this.state = CircuitState.HALF_OPEN;
    this.halfOpenCalls = 0;
    
    SecureLogger.logInfo('Circuit breaker transitioned to HALF_OPEN');
    this.options.onStateChange(CircuitState.HALF_OPEN);
  }

  /**
   * Get current circuit breaker statistics
   */
  getStats(): CircuitBreakerStats {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime,
      lastSuccessTime: this.lastSuccessTime,
      nextAttemptTime: this.nextAttemptTime,
    };
  }

  /**
   * Manually reset the circuit breaker to CLOSED state
   */
  reset(): void {
    this.transitionToClosed('Manual reset');
  }

  /**
   * Manually open the circuit breaker
   */
  open(reason = 'Manual open'): void {
    this.transitionToOpen(reason);
  }

  /**
   * Get current state
   */
  getState(): CircuitState {
    return this.state;
  }

  /**
   * Health check for the circuit breaker
   */
  async healthCheck(): Promise<boolean> {
    try {
      // If circuit is open, check if it should attempt reset
      if (this.state === CircuitState.OPEN) {
        return this.shouldAttemptReset();
      }
      return true;
    } catch (error) {
      SecureLogger.logError('Circuit breaker health check failed', error as Error);
      return false;
    }
  }
}

/**
 * Circuit breaker registry for managing multiple circuit breakers
 */
export class CircuitBreakerRegistry {
  private static instance: CircuitBreakerRegistry;
  private circuitBreakers = new Map<string, CircuitBreaker>();

  private constructor() {}

  static getInstance(): CircuitBreakerRegistry {
    if (!CircuitBreakerRegistry.instance) {
      CircuitBreakerRegistry.instance = new CircuitBreakerRegistry();
    }
    return CircuitBreakerRegistry.instance;
  }

  /**
   * Get or create a circuit breaker for a specific service
   */
  getCircuitBreaker(name: string, options?: CircuitBreakerOptions): CircuitBreaker {
    if (!this.circuitBreakers.has(name)) {
      this.circuitBreakers.set(name, new CircuitBreaker(options));
    }
    return this.circuitBreakers.get(name)!;
  }

  /**
   * Get all circuit breaker statistics
   */
  getAllStats(): Record<string, CircuitBreakerStats> {
    const stats: Record<string, CircuitBreakerStats> = {};
    
    for (const [name, cb] of this.circuitBreakers) {
      stats[name] = cb.getStats();
    }
    
    return stats;
  }

  /**
   * Reset all circuit breakers
   */
  resetAll(): void {
    for (const cb of this.circuitBreakers.values()) {
      cb.reset();
    }
  }

  /**
   * Remove a circuit breaker
   */
  remove(name: string): boolean {
    return this.circuitBreakers.delete(name);
  }
}

/**
 * Decorator for circuit breaker protection
 */
export function CircuitBreakerProtected(
  name: string,
  options?: CircuitBreakerOptions
) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    const registry = CircuitBreakerRegistry.getInstance();
    const circuitBreaker = registry.getCircuitBreaker(name, options);

    descriptor.value = async function (...args: any[]) {
      return circuitBreaker.execute(() => originalMethod.apply(this, args));
    };

    return descriptor;
  };
}
