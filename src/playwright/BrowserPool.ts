import { Logger } from '../core/Logger.js';

export class BrowserPool {
  private static instance: BrowserPool;
  private maxConcurrency: number = 4;
  private activeWorkers: number = 0;

  private constructor() {}

  public static getInstance(): BrowserPool {
    if (!BrowserPool.instance) {
      BrowserPool.instance = new BrowserPool();
    }
    return BrowserPool.instance;
  }

  public async acquireWorker(): Promise<boolean> {
    if (this.activeWorkers >= this.maxConcurrency) {
      Logger.warn(`BrowserPool: Max concurrency reached (${this.maxConcurrency}). Queueing request.`);
      return false;
    }
    this.activeWorkers++;
    Logger.info(`BrowserPool: Worker acquired. Active workers: ${this.activeWorkers}/${this.maxConcurrency}`);
    return true;
  }

  public releaseWorker(): void {
    if (this.activeWorkers > 0) {
      this.activeWorkers--;
    }
    Logger.info(`BrowserPool: Worker released. Active workers: ${this.activeWorkers}/${this.maxConcurrency}`);
  }

  public getStats() {
    return {
      maxConcurrency: this.maxConcurrency,
      activeWorkers: this.activeWorkers,
    };
  }
}
