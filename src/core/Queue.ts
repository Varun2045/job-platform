import { Logger } from './Logger.js';
import { Telemetry } from './Telemetry.js';

export interface QueueTask<T = any> {
  id: string;
  priority: number; // 1 (High), 2 (Medium), 3 (Low)
  execute: () => Promise<T>;
  createdAt?: number;
}

export interface TaskResult<T = any> {
  id: string;
  status: 'fulfilled' | 'rejected';
  value?: T;
  reason?: any;
}

export class TaskQueue {
  private queue: QueueTask[] = [];

  // Statistics
  public totalSubmitted = 0;
  public totalCompleted = 0;
  public totalFailed = 0;
  public totalWaitTimeMs = 0;
  public totalBusyTimeMs = 0;
  public starvationPromotions = 0;

  public addTask(task: QueueTask): void {
    if (!task.createdAt) {
      task.createdAt = Date.now();
    }
    this.queue.push(task);
    this.totalSubmitted++;
  }

  public clear(): void {
    this.queue = [];
  }

  /**
   * Starvation prevention and dynamic sorting.
   * If a low/medium priority task has waited for >30 seconds, promote it to High.
   */
  private sortQueue(): void {
    const now = Date.now();
    for (const task of this.queue) {
      if (task.createdAt && now - task.createdAt > 30000 && task.priority > 1) {
        task.priority = 1;
        this.starvationPromotions++;
        Logger.info(`[Queue] Starvation Prevention: Promoted task ${task.id} to priority 1 (High) after waiting ${Math.round((now - task.createdAt)/1000)}s.`);
      }
    }
    this.queue.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Executes all tasks in the queue with a maximum concurrency limit
   */
  public async runAll(concurrency: number = 5, delayBetweenMs: number = 500): Promise<TaskResult[]> {
    this.sortQueue();
    const activeTasks = new Set<Promise<any>>();
    const results: TaskResult[] = [];
    const tasksToProcess = [...this.queue];
    
    const telemetry = Telemetry.getInstance();
    telemetry.setQueueSize(tasksToProcess.length);

    Logger.info(
      `Starting priority queue execution. Total tasks: ${tasksToProcess.length}, Concurrency: ${concurrency}`,
    );

    const executeNext = async (): Promise<void> => {
      if (tasksToProcess.length === 0) return;

      const task = tasksToProcess.shift()!;
      telemetry.setQueueSize(tasksToProcess.length);
      telemetry.incrementActiveWorkers();

      // Record wait time
      if (task.createdAt) {
        this.totalWaitTimeMs += Date.now() - task.createdAt;
      }

      const startTime = Date.now();
      const taskPromise = (async () => {
        try {
          Logger.debug(`Executing task: ${task.id} (Priority: ${task.priority})`);
          
          // Enforce a 120-second timeout on task execution to prevent queue hangs
          const timeoutLimit = 120000;
          const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error(`Task execution timed out after ${timeoutLimit / 1000}s.`)), timeoutLimit)
          );

          const val = await Promise.race([task.execute(), timeoutPromise]);
          results.push({ id: task.id, status: 'fulfilled', value: val });
          this.totalCompleted++;
        } catch (err) {
          Logger.error(`Task rejected: ${task.id}`, err as any);
          results.push({ id: task.id, status: 'rejected', reason: err });
          this.totalFailed++;
        } finally {
          telemetry.decrementActiveWorkers();
          this.totalBusyTimeMs += Date.now() - startTime;
        }
      })();

      activeTasks.add(taskPromise);
      taskPromise.finally(() => activeTasks.delete(taskPromise));

      if (delayBetweenMs > 0 && tasksToProcess.length > 0) {
        await new Promise((resolve) => setTimeout(resolve, delayBetweenMs));
      }

      if (activeTasks.size < concurrency && tasksToProcess.length > 0) {
        await executeNext();
      }
    };

    const initialWorkers = Math.min(concurrency, tasksToProcess.length);
    const workerPromises: Promise<void>[] = [];

    for (let i = 0; i < initialWorkers; i++) {
      workerPromises.push(executeNext());
      if (delayBetweenMs > 0 && i < initialWorkers - 1) {
        await new Promise((resolve) => setTimeout(resolve, delayBetweenMs));
      }
    }

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
    
    // Clear queue after completion
    this.queue = [];
    return results;
  }
}
