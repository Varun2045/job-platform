import os from 'os';
import { Logger } from './Logger.js';

export class ResourceMonitor {
  private static lastCpuSample = os.cpus();
  private static lastCpuTime = Date.now();

  /**
   * Samples CPU ticks and calculates the aggregate CPU usage percentage.
   */
  public static async getCpuUsage(): Promise<number> {
    const startSample = os.cpus();
    const startTime = Date.now();

    // Sleep 150ms to accumulate tick changes
    await new Promise(r => setTimeout(r, 150));

    const endSample = os.cpus();
    const endTime = Date.now();

    let totalDiff = 0;
    let idleDiff = 0;

    for (let i = 0; i < startSample.length; i++) {
      const start = startSample[i].times;
      const end = endSample[i].times;

      const user = end.user - start.user;
      const sys = end.sys - start.sys;
      const nice = end.nice - start.nice;
      const idle = end.idle - start.idle;
      const irq = end.irq - start.irq;

      const total = user + sys + nice + idle + irq;
      totalDiff += total;
      idleDiff += idle;
    }

    if (totalDiff === 0) return 0;
    const usage = 100 - (100 * idleDiff) / totalDiff;
    return parseFloat(usage.toFixed(1));
  }

  /**
   * Returns current system memory metrics.
   */
  public static getMemoryUsage() {
    const free = os.freemem();
    const total = os.totalmem();
    const used = total - free;
    const usagePercent = parseFloat(((used / total) * 100).toFixed(1));

    return {
      totalBytes: total,
      freeBytes: free,
      usedBytes: used,
      usagePercent,
      isMemoryPressured: usagePercent > 85
    };
  }

  /**
   * Adjusts worker queue concurrency based on live CPU and Memory resource load.
   */
  public static async getAdaptiveConcurrency(baseLimit: number, poolType: 'api' | 'static' | 'playwright'): Promise<number> {
    const cpu = await this.getCpuUsage();
    const mem = this.getMemoryUsage();

    let multiplier = 1.0;

    if (cpu > 85 || mem.isMemoryPressured) {
      // High pressure: scale down concurrency by half
      multiplier = 0.5;
      Logger.warn(`[ResourceMonitor] System resource pressure detected: CPU ${cpu}%, Memory ${mem.usagePercent}%. Throttling concurrency for ${poolType} pool.`);
    } else if (cpu < 60 && !mem.isMemoryPressured) {
      // Resource headroom: scale up concurrency slightly
      multiplier = 1.3;
    }

    const calculated = Math.round(baseLimit * multiplier);
    
    // Ensure we don't return 0
    const minLimit = poolType === 'playwright' ? 2 : 5;
    return Math.max(minLimit, calculated);
  }
}
