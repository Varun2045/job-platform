import { TaskQueue, QueueTask, TaskResult } from './Queue.js';
import { ResourceMonitor } from './ResourceMonitor.js';
import { Logger } from './Logger.js';

export type PoolType = 'api' | 'static' | 'playwright' | 'retry';

export class MultiPoolQueue {
  private apiQueue = new TaskQueue();
  private staticQueue = new TaskQueue();
  private playwrightQueue = new TaskQueue();
  private retryQueue = new TaskQueue();

  private baseConcurrencies: Record<PoolType, number> = {
    api: 50,
    static: 30,
    playwright: 5,
    retry: 5
  };

  private startTime = 0;
  private duration = 0;

  /**
   * Adds a task to the specialized queue.
   */
  public addTask(poolType: PoolType, task: QueueTask): void {
    task.createdAt = Date.now();
    switch (poolType) {
      case 'api':
        this.apiQueue.addTask(task);
        break;
      case 'static':
        this.staticQueue.addTask(task);
        break;
      case 'playwright':
        this.playwrightQueue.addTask(task);
        break;
      case 'retry':
        this.retryQueue.addTask(task);
        break;
    }
  }

  /**
   * Runs all queues concurrently, scaling worker pools dynamically.
   */
  public async runAll(delayBetweenMs = 150): Promise<TaskResult[]> {
    Logger.info('[MultiPoolQueue] Initiating execution of all specialized worker queues...');

    // Fetch adaptive concurrency limits
    const apiLimit = await ResourceMonitor.getAdaptiveConcurrency(this.baseConcurrencies.api, 'api');
    const staticLimit = await ResourceMonitor.getAdaptiveConcurrency(this.baseConcurrencies.static, 'static');
    const pwLimit = await ResourceMonitor.getAdaptiveConcurrency(this.baseConcurrencies.playwright, 'playwright');
    const retryLimit = this.baseConcurrencies.retry;

    Logger.info(`[MultiPoolQueue] Dynamic Concurrency Settings: API Queue: ${apiLimit}, Static Queue: ${staticLimit}, Playwright Queue: ${pwLimit}, Retry Queue: ${retryLimit}`);

    this.startTime = Date.now();

    // Execute concurrently
    const [apiResults, staticResults, playwrightResults, retryResults] = await Promise.all([
      this.apiQueue.runAll(apiLimit, delayBetweenMs),
      this.staticQueue.runAll(staticLimit, delayBetweenMs),
      this.playwrightQueue.runAll(pwLimit, delayBetweenMs),
      this.retryQueue.runAll(retryLimit, delayBetweenMs)
    ]);

    this.duration = Date.now() - this.startTime;
    const totalResults = [...apiResults, ...staticResults, ...playwrightResults, ...retryResults];

    Logger.info(`[MultiPoolQueue] Completed execution of all queues in ${this.duration}ms. Total tasks completed: ${totalResults.length}`);
    return totalResults;
  }

  public getStats() {
    const totalCompleted =
      this.apiQueue.totalCompleted +
      this.staticQueue.totalCompleted +
      this.playwrightQueue.totalCompleted +
      this.retryQueue.totalCompleted;

    const totalFailed =
      this.apiQueue.totalFailed +
      this.staticQueue.totalFailed +
      this.playwrightQueue.totalFailed +
      this.retryQueue.totalFailed;

    const totalSubmitted =
      this.apiQueue.totalSubmitted +
      this.staticQueue.totalSubmitted +
      this.playwrightQueue.totalSubmitted +
      this.retryQueue.totalSubmitted;

    const totalStarvationPromotions =
      this.apiQueue.starvationPromotions +
      this.staticQueue.starvationPromotions +
      this.playwrightQueue.starvationPromotions +
      this.retryQueue.starvationPromotions;

    const totalWaitTime =
      this.apiQueue.totalWaitTimeMs +
      this.staticQueue.totalWaitTimeMs +
      this.playwrightQueue.totalWaitTimeMs +
      this.retryQueue.totalWaitTimeMs;

    const totalBusyTime =
      this.apiQueue.totalBusyTimeMs +
      this.staticQueue.totalBusyTimeMs +
      this.playwrightQueue.totalBusyTimeMs +
      this.retryQueue.totalBusyTimeMs;

    const averageWaitTimeMs = totalSubmitted > 0 ? Math.round(totalWaitTime / totalSubmitted) : 0;

    // Calculate worker utilization (busy time vs available time * concurrency)
    const elapsed = this.duration || 1;
    const totalCapacity =
      elapsed * (this.baseConcurrencies.api + this.baseConcurrencies.static + this.baseConcurrencies.playwright + this.baseConcurrencies.retry);
    const workerUtilization = parseFloat(((totalBusyTime / totalCapacity) * 100).toFixed(1));

    return {
      totalSubmitted,
      totalCompleted,
      totalFailed,
      totalStarvationPromotions,
      averageWaitTimeMs,
      workerUtilizationPercent: Math.min(100, workerUtilization),
      api: {
        submitted: this.apiQueue.totalSubmitted,
        completed: this.apiQueue.totalCompleted,
        failed: this.apiQueue.totalFailed,
        promoted: this.apiQueue.starvationPromotions,
      },
      static: {
        submitted: this.staticQueue.totalSubmitted,
        completed: this.staticQueue.totalCompleted,
        failed: this.staticQueue.totalFailed,
        promoted: this.staticQueue.starvationPromotions,
      },
      playwright: {
        submitted: this.playwrightQueue.totalSubmitted,
        completed: this.playwrightQueue.totalCompleted,
        failed: this.playwrightQueue.totalFailed,
        promoted: this.playwrightQueue.starvationPromotions,
      }
    };
  }
}
