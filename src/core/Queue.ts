import { Logger } from './Logger.js';
import { Telemetry } from './Telemetry.js';

export interface QueueTask<T = any> {
  id: string;
  priority: number; // 1 (high), 2 (medium), 3 (low)
  execute: () => Promise<T>;
}

export interface TaskResult<T = any> {
  id: string;
  status: 'fulfilled' | 'rejected';
  value?: T;
  reason?: any;
}

export class TaskQueue {
  private queue: QueueTask[] = [];

  public addTask(task: QueueTask): void {
    this.queue.push(task);
  }

  public clear(): void {
    this.queue = [];
  }

  /**
   * Sorts the queue. Priority 1 runs first, then 2, then 3.
   * If priority matches, keeps original insertion order.
   */
  private sortQueue(): void {
    this.queue.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Executes all tasks in the queue with a maximum concurrency limit
   * and optional delay between task starts.
   */
  public async runAll(concurrency: number = 5, delayBetweenMs: number = 500): Promise<TaskResult[]> {
    this.sortQueue();
    const activeTasks = new Set<Promise<any>>();
    const results: TaskResult[] = [];
    const tasksToProcess = [...this.queue];

    Telemetry.queueSize = tasksToProcess.length;

    Logger.info(
      `Starting priority queue execution. Total tasks: ${tasksToProcess.length}, Concurrency: ${concurrency}`,
    );

    const executeNext = async (): Promise<void> => {
      if (tasksToProcess.length === 0) return;

      const task = tasksToProcess.shift()!;
      Telemetry.queueSize = tasksToProcess.length;
      Telemetry.activeWorkers++;

      const taskPromise = (async () => {
        try {
          Logger.debug(`Executing task: ${task.id} (Priority: ${task.priority})`);
          const val = await task.execute();
          results.push({ id: task.id, status: 'fulfilled', value: val });
        } catch (err) {
          Logger.error(`Task rejected: ${task.id}`, err as any);
          results.push({ id: task.id, status: 'rejected', reason: err });
        } finally {
          Telemetry.activeWorkers--;
        }
      })();

      activeTasks.add(taskPromise);
      taskPromise.finally(() => activeTasks.delete(taskPromise));

      // Wait a short delay before launching the next task to rate-limit calls
      if (delayBetweenMs > 0 && tasksToProcess.length > 0) {
        await new Promise((resolve) => setTimeout(resolve, delayBetweenMs));
      }

      // If we have workers available and more tasks, trigger the next one
      if (activeTasks.size < concurrency && tasksToProcess.length > 0) {
        await executeNext();
      }
    };

    // Spin up initial workers
    const initialWorkers = Math.min(concurrency, tasksToProcess.length);
    const workerPromises: Promise<void>[] = [];

    for (let i = 0; i < initialWorkers; i++) {
      workerPromises.push(executeNext());
      // Introduce a staggered delay on startup
      if (delayBetweenMs > 0 && i < initialWorkers - 1) {
        await new Promise((resolve) => setTimeout(resolve, delayBetweenMs));
      }
    }

    // Wait for the queue to drain and all active tasks to settle
    while (tasksToProcess.length > 0 || activeTasks.size > 0) {
      if (activeTasks.size > 0) {
        await Promise.race(activeTasks);
      } else if (tasksToProcess.length > 0) {
        await executeNext();
      }
    }

    Logger.info(
      `Priority queue execution finished. Succeeded: ${results.filter((r) => r.status === 'fulfilled').length}, Failed: ${results.filter((r) => r.status === 'rejected').length}`,
    );
    return results;
  }
}
