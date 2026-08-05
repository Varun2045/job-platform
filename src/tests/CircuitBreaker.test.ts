import { CircuitBreaker, CircuitBreakerRegistry, CircuitState } from '../utils/circuitBreaker.js';

describe('Circuit Breaker Integration Tests', () => {
  let circuitBreaker: CircuitBreaker;

  beforeEach(() => {
    circuitBreaker = new CircuitBreaker({
      failureThreshold: 3,
      resetTimeout: 1000, // 1 second for testing
      halfOpenMaxCalls: 2,
    });
  });

  afterEach(() => {
    circuitBreaker.reset();
  });

  describe('Basic Circuit Breaker Behavior', () => {
    test('should start in CLOSED state', () => {
      const stats = circuitBreaker.getStats();
      expect(stats.state).toBe(CircuitState.CLOSED);
      expect(stats.failureCount).toBe(0);
    });

    test('should allow successful calls in CLOSED state', async () => {
      const mockFn = jest.fn().mockResolvedValue('success');
      
      const result = await circuitBreaker.execute(mockFn);
      
      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(1);
      
      const stats = circuitBreaker.getStats();
      expect(stats.state).toBe(CircuitState.CLOSED);
      expect(stats.successCount).toBe(1);
    });

    test('should transition to OPEN after failure threshold', async () => {
      const mockFn = jest.fn().mockRejectedValue(new Error('Service unavailable'));
      
      // Trigger failures up to threshold
      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.execute(mockFn);
        } catch (error) {
          // Expected to fail
        }
      }
      
      const stats = circuitBreaker.getStats();
      expect(stats.state).toBe(CircuitState.OPEN);
      expect(stats.failureCount).toBe(3);
    });

    test('should block calls when circuit is OPEN', async () => {
      const mockFn = jest.fn().mockRejectedValue(new Error('Service unavailable'));
      
      // Trigger failures to open circuit
      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.execute(mockFn);
        } catch (error) {
          // Expected to fail
        }
      }
      
      // Try to call again - should be blocked
      await expect(circuitBreaker.execute(mockFn)).rejects.toThrow('Circuit breaker is OPEN');
      expect(mockFn).toHaveBeenCalledTimes(3); // Should not be called again
    });
  });

  describe('Circuit Breaker Recovery', () => {
    test('should transition to HALF_OPEN after reset timeout', async () => {
      const mockFn = jest.fn().mockRejectedValue(new Error('Service unavailable'));
      
      // Open the circuit
      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.execute(mockFn);
        } catch (error) {
          // Expected to fail
        }
      }
      
      expect(circuitBreaker.getState()).toBe(CircuitState.OPEN);
      
      // Wait for reset timeout
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      // Create a function that will succeed
      const successFn = jest.fn().mockResolvedValue('success');
      
      // Should transition to HALF_OPEN and allow call
      const result = await circuitBreaker.execute(successFn);
      
      expect(result).toBe('success');
      expect(circuitBreaker.getState()).toBe(CircuitState.HALF_OPEN);
    });

    test('should close circuit after successful calls in HALF_OPEN', async () => {
      const mockFn = jest.fn().mockRejectedValue(new Error('Service unavailable'));
      
      // Open the circuit
      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.execute(mockFn);
        } catch (error) {
          // Expected to fail
        }
      }
      
      // Wait for reset timeout
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      // Make successful calls to close circuit
      const successFn = jest.fn().mockResolvedValue('success');
      
      for (let i = 0; i < 2; i++) {
        await circuitBreaker.execute(successFn);
      }
      
      expect(circuitBreaker.getState()).toBe(CircuitState.CLOSED);
    });

    test('should re-open circuit on failure in HALF_OPEN', async () => {
      const mockFn = jest.fn().mockRejectedValue(new Error('Service unavailable'));
      
      // Open the circuit
      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.execute(mockFn);
        } catch (error) {
          // Expected to fail
        }
      }
      
      // Wait for reset timeout
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      // Fail in HALF_OPEN state
      try {
        await circuitBreaker.execute(mockFn);
      } catch (error) {
        // Expected to fail
      }
      
      expect(circuitBreaker.getState()).toBe(CircuitState.OPEN);
    });
  });

  describe('Circuit Breaker Registry', () => {
    test('should manage multiple circuit breakers', () => {
      const registry = CircuitBreakerRegistry.getInstance();
      
      const cb1 = registry.getCircuitBreaker('service1');
      const cb2 = registry.getCircuitBreaker('service2');
      
      expect(cb1).not.toBe(cb2);
      
      const stats = registry.getAllStats();
      expect(stats).toHaveProperty('service1');
      expect(stats).toHaveProperty('service2');
    });

    test('should return same circuit breaker instance for same name', () => {
      const registry = CircuitBreakerRegistry.getInstance();
      
      const cb1 = registry.getCircuitBreaker('service1');
      const cb2 = registry.getCircuitBreaker('service1');
      
      expect(cb1).toBe(cb2);
    });

    test('should reset all circuit breakers', () => {
      const registry = CircuitBreakerRegistry.getInstance();
      
      const cb1 = registry.getCircuitBreaker('service1');
      const cb2 = registry.getCircuitBreaker('service2');
      
      // Open both circuits
      cb1.open('Test open');
      cb2.open('Test open');
      
      expect(cb1.getState()).toBe(CircuitState.OPEN);
      expect(cb2.getState()).toBe(CircuitState.OPEN);
      
      // Reset all
      registry.resetAll();
      
      expect(cb1.getState()).toBe(CircuitState.CLOSED);
      expect(cb2.getState()).toBe(CircuitState.CLOSED);
    });
  });

  describe('State Change Callbacks', () => {
    test('should call state change callback on transition', async () => {
      const stateChanges: Array<{ state: CircuitState; reason?: string }> = [];
      
      const cb = new CircuitBreaker({
        failureThreshold: 2,
        resetTimeout: 1000,
        onStateChange: (state, reason) => {
          stateChanges.push({ state, reason });
        },
      });
      
      const mockFn = jest.fn().mockRejectedValue(new Error('Service unavailable'));
      
      // Trigger failures to open circuit
      for (let i = 0; i < 2; i++) {
        try {
          await cb.execute(mockFn);
        } catch (error) {
          // Expected
        }
      }
      
      expect(stateChanges).toHaveLength(1);
      expect(stateChanges[0].state).toBe(CircuitState.OPEN);
      expect(stateChanges[0].reason).toContain('Failure threshold reached');
    });
  });

  describe('Manual Control', () => {
    test('should allow manual circuit opening', () => {
      circuitBreaker.open('Manual maintenance');
      
      expect(circuitBreaker.getState()).toBe(CircuitState.OPEN);
      
      const stats = circuitBreaker.getStats();
      expect(stats.nextAttemptTime).toBeGreaterThan(Date.now());
    });

    test('should allow manual circuit reset', () => {
      circuitBreaker.open('Test');
      expect(circuitBreaker.getState()).toBe(CircuitState.OPEN);
      
      circuitBreaker.reset();
      expect(circuitBreaker.getState()).toBe(CircuitState.CLOSED);
    });
  });

  describe('Statistics and Monitoring', () => {
    test('should track success and failure counts', async () => {
      const successFn = jest.fn().mockResolvedValue('success');
      const failFn = jest.fn().mockRejectedValue(new Error('Failed'));
      
      // Success
      await circuitBreaker.execute(successFn);
      
      // Failure
      try {
        await circuitBreaker.execute(failFn);
      } catch (error) {
        // Expected to fail
      }
      
      const stats = circuitBreaker.getStats();
      expect(stats.successCount).toBe(1);
      expect(stats.failureCount).toBe(1);
      expect(stats.lastSuccessTime).toBeTruthy();
      expect(stats.lastFailureTime).toBeTruthy();
    });

    test('should provide comprehensive statistics', () => {
      const stats = circuitBreaker.getStats();
      
      expect(stats).toHaveProperty('state');
      expect(stats).toHaveProperty('failureCount');
      expect(stats).toHaveProperty('successCount');
      expect(stats).toHaveProperty('lastFailureTime');
      expect(stats).toHaveProperty('lastSuccessTime');
      expect(stats).toHaveProperty('nextAttemptTime');
    });
  });

  describe('Health Check Integration', () => {
    test('should provide health check functionality', async () => {
      const isHealthy = await circuitBreaker.healthCheck();
      
      // Should be healthy when circuit is closed
      expect(isHealthy).toBe(true);
    });

    test('should report unhealthy when circuit is open', async () => {
      circuitBreaker.open('Test');
      
      const isHealthy = await circuitBreaker.healthCheck();
      
      // Health check should still work even when circuit is open
      expect(typeof isHealthy).toBe('boolean');
    });
  });
});
