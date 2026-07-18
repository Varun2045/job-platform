import fs from 'fs';
import path from 'path';
import { StorageProvider } from '../storage/StorageProvider.js';
import { config } from '../config/config.js';

export class HealthService {
  public static async checkReady(storage: StorageProvider): Promise<{ ready: boolean; checks: Record<string, any> }> {
    const checks: Record<string, any> = {};
    let ready = true;

    // 1. Verify Database connectivity works
    try {
      await storage.getEnabledCompanies();
      checks.database = { status: 'ok' };
    } catch (err: any) {
      checks.database = { status: 'failed', error: err.message };
      ready = false;
    }

    // 2. Verify storage directory path permissions
    try {
      const storageDir = path.join(process.cwd(), 'storage');
      if (!fs.existsSync(storageDir)) {
        fs.mkdirSync(storageDir, { recursive: true });
      }
      checks.storageWrite = { status: 'ok' };
    } catch (err: any) {
      checks.storageWrite = { status: 'failed', error: err.message };
      ready = false;
    }

    return { ready, checks };
  }

  public static async checkHealth(
    storage: StorageProvider,
  ): Promise<{ status: 'healthy' | 'degraded' | 'unhealthy'; checks: Record<string, any> }> {
    const checks: Record<string, any> = {};
    let failedChecks = 0;
    let warningChecks = 0;

    // 1. Database check
    try {
      await storage.getEnabledCompanies();
      checks.database = { status: 'healthy' };
    } catch (err: any) {
      checks.database = { status: 'unhealthy', error: err.message };
      failedChecks++;
    }

    // 2. Scheduler last execution check
    try {
      const statusFilePath = path.join(process.cwd(), 'storage', 'status.json');
      if (fs.existsSync(statusFilePath)) {
        const data = JSON.parse(fs.readFileSync(statusFilePath, 'utf-8'));
        const lastRun = new Date(data.lastRun).getTime();
        const diffMinutes = (Date.now() - lastRun) / (60 * 1000);

        if (diffMinutes > 180) {
          // Stale for more than 3 hours
          checks.scheduler = {
            status: 'degraded',
            lastRun: data.lastRun,
            minutesSinceLastRun: Math.round(diffMinutes),
          };
          warningChecks++;
        } else {
          checks.scheduler = { status: 'healthy', lastRun: data.lastRun };
        }
      } else {
        checks.scheduler = { status: 'degraded', reason: 'No status file history found' };
        warningChecks++;
      }
    } catch (e: any) {
      checks.scheduler = { status: 'degraded', error: e.message };
      warningChecks++;
    }

    // 3. Email key check
    checks.emailProvider = {
      status: config.resendApiKey ? 'healthy' : 'disabled',
      configured: !!config.resendApiKey,
    };

    // 4. Scrapers health overview
    try {
      const companies = await storage.getAllCompanies();
      const disabledCount = companies.filter((c) => !c.enabled).length;
      const degradedCount = companies.filter((c) => (c.consecutive_failures ?? 0) > 0).length;
      checks.scrapers = {
        total: companies.length,
        disabled: disabledCount,
        degraded: degradedCount,
        healthy: companies.length - disabledCount - degradedCount,
      };
    } catch (err: any) {
      checks.scrapers = { status: 'unknown', error: err.message };
    }

    // 5. System metrics check
    const usage = process.memoryUsage();
    checks.system = {
      memoryHeapUsedMb: Math.round(usage.heapUsed / (1024 * 1024)),
      memoryHeapTotalMb: Math.round(usage.heapTotal / (1024 * 1024)),
      uptimeSeconds: Math.round(process.uptime()),
    };

    // Aggregated Health Rating
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (failedChecks > 0) {
      status = 'unhealthy';
    } else if (warningChecks > 0) {
      status = 'degraded';
    }

    return { status, checks };
  }
}
