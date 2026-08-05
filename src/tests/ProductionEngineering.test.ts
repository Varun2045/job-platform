import { jest } from '@jest/globals';
import { Telemetry } from '../core/Telemetry.js';
import { HealthService } from '../core/HealthService.js';
import { FileStorage } from '../storage/FileStorage.js';
import { StorageProvider } from '../storage/StorageProvider.js';
import fs from 'fs';

describe('Version 2.2.0 Production Engineering Checks', () => {
  const storage = new FileStorage();

  beforeAll(async () => {
    await storage.initialize();
  });

  it('should verify Telemetry tracking registry metrics updates', () => {
    const telemetry = Telemetry.getInstance();
    telemetry.setActiveWorkers(2);
    telemetry.setQueueSize(10);
    telemetry.recordRequest(120);
    telemetry.recordRequest(80);
    telemetry.recordEmail(true);
    telemetry.recordEmail(false);

    const report = telemetry.getMetricsReport('connected');

    expect(report.activeWorkers).toBe(2);
    expect(report.queueSize).toBe(10);
    expect(report.totalRequests).toBeGreaterThanOrEqual(2);
    expect(report.avgLatencyMs).toBe(100);
    expect(report.emailSuccessCount).toBeGreaterThanOrEqual(1);
    expect(report.emailFailureCount).toBeGreaterThanOrEqual(1);

    const promOutput = telemetry.toPrometheusFormat(report);
    expect(promOutput).toContain('job_monitor_active_workers 2');
    expect(promOutput).toContain('job_monitor_queue_size 10');
    expect(promOutput).toContain('job_monitor_db_connected 1');
  });

  it('should verify HealthService ready and health statuses checks', async () => {
    const readyReport = await HealthService.checkReady(storage);
    expect(readyReport.ready).toBe(true);
    expect(readyReport.checks.database.status).toBe('ok');

    const healthReport = await HealthService.checkHealth(storage);
    expect(['healthy', 'degraded']).toContain(healthReport.status);
    expect(healthReport.checks.database.status).toBe('healthy');
    expect(healthReport.checks.system.memoryHeapUsedMb).toBeGreaterThan(0);
  });

  it('should handle HealthService ready checks database failure', async () => {
    const brokenStorage = {
      getEnabledCompanies: async () => {
        throw new Error('Network timeout');
      },
    } as unknown as StorageProvider;

    const readyReport = await HealthService.checkReady(brokenStorage);
    expect(readyReport.ready).toBe(false);
    expect(readyReport.checks.database.status).toBe('failed');
    expect(readyReport.checks.database.error).toBe('Network timeout');
  });

  it('should handle HealthService ready checks storage directory write failure', async () => {
    // Mock fs.mkdirSync to fail
    const mockMkdir = jest.spyOn(fs, 'mkdirSync').mockImplementation(() => {
      throw new Error('Permission denied');
    });
    // Temporarily delete status file or simulate storageDir write error by mocking fs.existsSync
    const mockExists = jest.spyOn(fs, 'existsSync').mockImplementation((p: any) => {
      if (p.toString().endsWith('storage')) return false; // force mkdir
      return true;
    });

    const readyReport = await HealthService.checkReady(storage);
    expect(readyReport.ready).toBe(false);
    expect(readyReport.checks.storageWrite.status).toBe('failed');

    mockMkdir.mockRestore();
    mockExists.mockRestore();
  });

  it('should handle checkHealth with degraded scheduler due to stale or missing status file', async () => {
    const mockExists = jest.spyOn(fs, 'existsSync').mockImplementation((p: any) => {
      if (p.toString().endsWith('status.json')) return true;
      return false;
    });
    const mockReadFile = jest.spyOn(fs, 'readFileSync').mockImplementation(() => {
      // 4 hours ago
      const pastDate = new Date(Date.now() - 240 * 60 * 1000).toISOString();
      return JSON.stringify({ lastRun: pastDate });
    });

    const healthReport = await HealthService.checkHealth(storage);
    expect(healthReport.status).toBe('degraded');
    expect(healthReport.checks.scheduler.status).toBe('degraded');

    mockExists.mockRestore();
    mockReadFile.mockRestore();
  });

  it('should handle checkHealth with degraded scheduler due to missing status file', async () => {
    const mockExists = jest.spyOn(fs, 'existsSync').mockImplementation((p: any) => {
      if (p.toString().endsWith('status.json')) return false;
      return true;
    });

    const healthReport = await HealthService.checkHealth(storage);
    expect(healthReport.status).toBe('degraded');
    expect(healthReport.checks.scheduler.status).toBe('degraded');
    expect(healthReport.checks.scheduler.reason).toBe('No status file history found');

    mockExists.mockRestore();
  });

  it('should handle checkHealth when scheduler status file parsing throws error', async () => {
    const mockExists = jest.spyOn(fs, 'existsSync').mockImplementation((p: any) => {
      if (p.toString().endsWith('status.json')) return true;
      return true;
    });
    const mockReadFile = jest.spyOn(fs, 'readFileSync').mockImplementation(() => {
      return 'invalid-json';
    });

    const healthReport = await HealthService.checkHealth(storage);
    expect(healthReport.status).toBe('degraded');
    expect(healthReport.checks.scheduler.status).toBe('degraded');

    mockExists.mockRestore();
    mockReadFile.mockRestore();
  });

  it('should handle checkHealth when scrapers query fails', async () => {
    const brokenStorage = {
      getEnabledCompanies: async () => [{ id: '1', name: 'C', enabled: true }],
      getAllCompanies: async () => {
        throw new Error('Query error');
      },
    } as unknown as StorageProvider;

    const healthReport = await HealthService.checkHealth(brokenStorage);
    expect(healthReport.checks.scrapers.status).toBe('unknown');
  });
});
