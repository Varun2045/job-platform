/**
 * Monitoring Routes
 * 
 * Handles health checks and monitoring endpoints
 */

import express from 'express';
import { Logger } from '../core/Logger.js';
import { sendSuccess, sendError, ErrorCodes } from '../utils/apiResponse.js';
import type { Request, Response } from 'express';

const router = express.Router();

// This will be set by the main server file
let storage: any;
let isScrapersPaused = false;

export function setStorage(storageProvider: any) {
  storage = storageProvider;
}

export function getScrapersPaused(): boolean {
  return isScrapersPaused;
}

export function setScrapersPaused(paused: boolean) {
  isScrapersPaused = paused;
}

/**
 * GET /api/monitoring
 * Get system monitoring data
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const companiesList = await storage.getAllCompanies();
    const totalCompanies = companiesList.length;
    const failedScrapers = companiesList.filter((c: { consecutive_failures?: number; last_failed_scrape?: string; last_successful_scrape?: string }) => 
      (c.consecutive_failures || 0) > 0 || (c.last_failed_scrape && (!c.last_successful_scrape || new Date(c.last_failed_scrape) > new Date(c.last_successful_scrape)))).length;
    const healthyScrapers = Math.max(0, totalCompanies - failedScrapers);

    const responseTimes = companiesList.map((c: { avg_response_time_ms?: number }) => c.avg_response_time_ms || 0).filter((t: number) => t > 0);
    let avgDuration = '0.0s';
    if (responseTimes.length > 0) {
      const avgMs = responseTimes.reduce((a: number, b: number) => a + b, 0) / responseTimes.length;
      avgDuration = `${(avgMs / 1000).toFixed(2)}s`;
    }

    return sendSuccess(res, {
      scrapers: {
        total: totalCompanies,
        healthy: healthyScrapers,
        failed: failedScrapers,
        avgResponseTime: avgDuration,
      },
      system: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err: unknown) {
    const error = err as Error;
    Logger.error('Error in GET /api/monitoring', error);
    return sendError(res, ErrorCodes.INTERNAL_ERROR, error.message, 500);
  }
});

/**
 * GET /api/health
 * Health check endpoint
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    const dbStatus = 'connected';
    
    return sendSuccess(res, {
      status: 'healthy',
      database: dbStatus,
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const error = err as Error;
    Logger.error('Error in GET /api/health', error);
    return sendError(res, ErrorCodes.INTERNAL_ERROR, error.message, 500);
  }
});

/**
 * POST /api/monitoring/pause
 * Pause all scrapers
 */
router.post('/pause', async (req: Request, res: Response) => {
  try {
    isScrapersPaused = true;
    return sendSuccess(res, { success: true, message: 'Scrapers paused successfully' });
  } catch (err: unknown) {
    const error = err as Error;
    Logger.error('Error in POST /api/monitoring/pause', error);
    return sendError(res, ErrorCodes.INTERNAL_ERROR, error.message, 500);
  }
});

/**
 * POST /api/monitoring/resume
 * Resume all scrapers
 */
router.post('/resume', async (req: Request, res: Response) => {
  try {
    isScrapersPaused = false;
    return sendSuccess(res, { success: true, message: 'Scrapers resumed successfully' });
  } catch (err: unknown) {
    const error = err as Error;
    Logger.error('Error in POST /api/monitoring/resume', error);
    return sendError(res, ErrorCodes.INTERNAL_ERROR, error.message, 500);
  }
});

export default router;