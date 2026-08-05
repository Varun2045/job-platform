/**
 * Analytics Routes
 * 
 * Handles analytics and insights endpoints
 */

import express from 'express';
import { Logger } from '../core/Logger.js';
import { sendSuccess, sendError, ErrorCodes } from '../utils/apiResponse.js';
import type { Request, Response } from 'express';

const router = express.Router();

// This will be set by the main server file
let storage: any;

export function setStorage(storageProvider: any) {
  storage = storageProvider;
}

/**
 * GET /api/analytics/insights
 * Get analytics insights
 */
router.get('/insights', async (req: Request, res: Response) => {
  try {
    const { timeframe = '7d' } = req.query;
    
    // Analytics logic would go here
    return sendSuccess(res, {
      timeframe,
      insights: {
        applicationsByStatus: {},
        applicationsByDay: {},
        responseRate: 0,
        averageResponseTime: 0,
      },
    });
  } catch (err: unknown) {
    const error = err as Error;
    Logger.error('Error in GET /api/analytics/insights', error);
    return sendError(res, ErrorCodes.INTERNAL_ERROR, error.message, 500);
  }
});

/**
 * GET /api/analytics/performance
 * Get performance metrics
 */
router.get('/performance', async (req: Request, res: Response) => {
  try {
    const companies = await storage.getAllCompanies();
    const jobs = await storage.getAllJobs();

    return sendSuccess(res, {
      totalCompanies: companies.length,
      totalJobs: jobs.length,
      scrapeSuccessRate: 0.95,
      averageScrapeTime: 2.5,
      lastScrapeTime: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const error = err as Error;
    Logger.error('Error in GET /api/analytics/performance', error);
    return sendError(res, ErrorCodes.INTERNAL_ERROR, error.message, 500);
  }
});

export default router;