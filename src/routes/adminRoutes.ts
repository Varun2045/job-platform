/**
 * Admin Routes
 * 
 * Handles administrative operations
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
 * GET /api/admin/users
 * List all users (admin only)
 */
router.get('/users', async (req: Request, res: Response) => {
  try {
    const users = await storage.getAllUsers();
    return sendSuccess(res, {
      users,
      total: users.length,
    });
  } catch (err: unknown) {
    const error = err as Error;
    Logger.error('Error in GET /api/admin/users', error);
    return sendError(res, ErrorCodes.INTERNAL_ERROR, error.message, 500);
  }
});

/**
 * POST /api/admin/scrapers/trigger
 * Trigger scraper for specific company
 */
router.post('/scrapers/trigger', async (req: Request, res: Response) => {
  try {
    const { companyId } = req.body;

    if (!companyId) {
      return sendError(res, ErrorCodes.VALIDATION_ERROR, 'Company ID is required', 400);
    }

    // Trigger scraper logic would go here
    return sendSuccess(res, {
      message: 'Scraper triggered successfully',
      companyId,
    });
  } catch (err: unknown) {
    const error = err as Error;
    Logger.error('Error in POST /api/admin/scrapers/trigger', error);
    return sendError(res, ErrorCodes.INTERNAL_ERROR, error.message, 500);
  }
});

/**
 * GET /api/admin/metrics
 * Get system metrics
 */
router.get('/metrics', async (req: Request, res: Response) => {
  try {
    const companies = await storage.getAllCompanies();
    const jobs = await storage.getAllJobs();

    return sendSuccess(res, {
      totalCompanies: companies.length,
      totalJobs: jobs.length,
      activeCompanies: companies.filter((c: { enabled?: boolean }) => c.enabled).length,
      jobsToday: jobs.filter((j: { datePosted?: string }) => {
        if (!j.datePosted) return false;
        const today = new Date().toISOString().split('T')[0];
        return j.datePosted.startsWith(today);
      }).length,
    });
  } catch (err: unknown) {
    const error = err as Error;
    Logger.error('Error in GET /api/admin/metrics', error);
    return sendError(res, ErrorCodes.INTERNAL_ERROR, error.message, 500);
  }
});

export default router;