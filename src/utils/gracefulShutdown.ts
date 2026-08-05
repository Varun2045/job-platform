import { SecureLogger } from './SecureLogger.js';
import { BrowserPool } from '../playwright/BrowserPool.js';

export interface ShutdownOptions {
  timeout?: number;
  forceTimeout?: number;
  onShutdownStart?: () => void | Promise<void>;
  onShutdownComplete?: () => void | Promise<void>;
  onShutdownError?: (error: Error) => void | Promise<void>;
}

const DEFAULT_SHUTDOWN_OPTIONS: Required<ShutdownOptions> = {
  timeout: 10000, // 10 seconds for graceful shutdown
  forceTimeout: 5000, // 5 seconds for forceful shutdown
  onShutdownStart: async () => {
    SecureLogger.logInfo('Starting graceful shutdown process');
  },
  onShutdownComplete: async () => {
    SecureLogger.logInfo('Graceful shutdown completed successfully');
  },
  onShutdownError: async (error) => {
    SecureLogger.logError('Error during graceful shutdown', error);
  },
};

export class GracefulShutdown {
  private static instance: GracefulShutdown;
  private isShuttingDown = false;
  private shutdownHooks: Array<() => Promise<void>> = [];
  private server: any = null;

  private constructor() {}

  static getInstance(): GracefulShutdown {
    if (!GracefulShutdown.instance) {
      GracefulShutdown.instance = new GracefulShutdown();
    }
    return GracefulShutdown.instance;
  }

  /**
   * Register a server instance for graceful shutdown
   */
  registerServer(server: any): void {
    this.server = server;
  }

  /**
   * Add a cleanup hook to be called during shutdown
   */
  addShutdownHook(hook: () => Promise<void>): void {
    this.shutdownHooks.push(hook);
  }

  /**
   * Remove a shutdown hook
   */
  removeShutdownHook(hook: () => Promise<void>): void {
    const index = this.shutdownHooks.indexOf(hook);
    if (index > -1) {
      this.shutdownHooks.splice(index, 1);
    }
  }

  /**
   * Handle shutdown signal
   */
  async handleShutdown(signal: string, options: ShutdownOptions = {}): Promise<void> {
    if (this.isShuttingDown) {
      SecureLogger.logWarn('Shutdown already in progress, ignoring signal');
      return;
    }

    this.isShuttingDown = true;
    const opts = { ...DEFAULT_SHUTDOWN_OPTIONS, ...options };

    SecureLogger.logInfo(`Received ${signal} signal`);

    try {
      // Call shutdown start callback
      await opts.onShutdownStart();

      // Create shutdown promise with timeout
      const shutdownPromise = this.performGracefulShutdown();

      // Race between graceful shutdown and timeout
      const result = await Promise.race([
        shutdownPromise,
        this.createTimeout(opts.timeout, 'Graceful shutdown timeout'),
      ]);

      if (result === 'timeout') {
        SecureLogger.logWarn('Graceful shutdown timeout, forcing shutdown');
        await this.performForcefulShutdown(opts.forceTimeout);
      }

      // Call shutdown complete callback
      await opts.onShutdownComplete();

      process.exit(0);
    } catch (error) {
      await opts.onShutdownError(error as Error);
      process.exit(1);
    }
  }

  /**
   * Perform graceful shutdown
   */
  private async performGracefulShutdown(): Promise<void> {
    SecureLogger.logInfo('Performing graceful shutdown');

    // 1. Close HTTP server (stop accepting new connections)
    if (this.server) {
      await this.closeServer();
    }

    // 2. Close browser pool
    await this.closeBrowserPool();

    // 3. Execute registered shutdown hooks
    await this.executeShutdownHooks();

    SecureLogger.logInfo('Graceful shutdown completed');
  }

  /**
   * Perform forceful shutdown
   */
  private async performForcefulShutdown(timeout: number): Promise<void> {
    SecureLogger.logWarn('Performing forceful shutdown');

    const forcePromise = this.executeShutdownHooksForceful();
    
    await Promise.race([
      forcePromise,
      this.createTimeout(timeout, 'Forceful shutdown timeout'),
    ]);

    SecureLogger.logWarn('Forceful shutdown completed');
  }

  /**
   * Close HTTP server gracefully
   */
  private async closeServer(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.server) {
        resolve();
        return;
      }

      SecureLogger.logInfo('Closing HTTP server');

      this.server.close((err: any) => {
        if (err) {
          SecureLogger.logError('Error closing HTTP server', err);
          reject(err);
        } else {
          SecureLogger.logInfo('HTTP server closed successfully');
          resolve();
        }
      });

      // Force close after timeout
      setTimeout(() => {
        SecureLogger.logWarn('Force closing HTTP server after timeout');
        this.server.destroy();
        resolve();
      }, 5000);
    });
  }

  /**
   * Close browser pool
   */
  private async closeBrowserPool(): Promise<void> {
    try {
      const browserPool = BrowserPool.getInstance();
      await browserPool.close();
      SecureLogger.logInfo('Browser pool closed successfully');
    } catch (error) {
      SecureLogger.logError('Error closing browser pool', error as Error);
    }
  }

  /**
   * Execute registered shutdown hooks
   */
  private async executeShutdownHooks(): Promise<void> {
    SecureLogger.logInfo(`Executing ${this.shutdownHooks.length} shutdown hooks`);

    for (const hook of this.shutdownHooks) {
      try {
        await hook();
      } catch (error) {
        SecureLogger.logError('Error executing shutdown hook', error as Error);
      }
    }

    SecureLogger.logInfo('All shutdown hooks executed');
  }

  /**
   * Execute shutdown hooks forcefully (with shorter timeout)
   */
  private async executeShutdownHooksForceful(): Promise<void> {
    SecureLogger.logWarn('Executing shutdown hooks forcefully');

    for (const hook of this.shutdownHooks) {
      try {
        // Give each hook 1 second max during forceful shutdown
        await Promise.race([
          hook(),
          this.createTimeout(1000, 'Shutdown hook timeout'),
        ]);
      } catch (error) {
        SecureLogger.logError('Error in forceful shutdown hook', error as Error);
      }
    }
  }

  /**
   * Create a timeout promise
   */
  private createTimeout(ms: number, message: string): Promise<'timeout'> {
    return new Promise((resolve) => {
      setTimeout(() => resolve('timeout'), ms);
    });
  }

  /**
   * Setup signal handlers
   */
  setupSignalHandlers(): void {
    // Handle SIGTERM (Heroku, Docker)
    process.on('SIGTERM', () => {
      this.handleShutdown('SIGTERM');
    });

    // Handle SIGINT (Ctrl+C)
    process.on('SIGINT', () => {
      this.handleShutdown('SIGINT');
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      SecureLogger.logError('Uncaught exception', error);
      this.handleShutdown('uncaughtException');
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      SecureLogger.logError('Unhandled promise rejection', reason as Error);
      this.handleShutdown('unhandledRejection');
    });

    SecureLogger.logInfo('Signal handlers registered');
  }

  /**
   * Check if shutdown is in progress
   */
  isShutdownInProgress(): boolean {
    return this.isShuttingDown;
  }
}

/**
 * Setup graceful shutdown for an Express server
 */
export function setupGracefulShutdown(server: any, options?: ShutdownOptions): GracefulShutdown {
  const shutdown = GracefulShutdown.getInstance();
  
  shutdown.registerServer(server);
  shutdown.setupSignalHandlers();

  // Add default cleanup hooks
  shutdown.addShutdownHook(async () => {
    // Add any additional cleanup here
    // For example: close database connections, flush logs, etc.
  });

  return shutdown;
}

/**
 * Convenience function to handle shutdown without server
 */
export function handleProcessShutdown(options?: ShutdownOptions): void {
  const shutdown = GracefulShutdown.getInstance();
  shutdown.setupSignalHandlers();
}
