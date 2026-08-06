/**
 * Dashboard Routes
 * 
 * Handles dashboard metrics and analytics
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
 * GET /api/dashboard
 * Get dashboard metrics
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const companies = await storage.getAllCompanies();
    const applications = await storage.getApplications();

    const allJobs = await storage.getAllJobs();

    const disabledComps = companies.filter(
      (c: { enabled?: boolean; consecutive_failures?: number; circuit_breaker_tripped?: boolean }) =>
        c.enabled === false || (c.consecutive_failures ?? 0) >= 3 || c.circuit_breaker_tripped === true,
    );
    const activeComps = companies.filter((c: unknown) => !disabledComps.includes(c));
    const degradedComps = activeComps.filter(
      (c: { consecutive_failures?: number; last_failed_scrape?: string; last_successful_scrape?: string }) =>
        (c.consecutive_failures ?? 0) > 0 ||
        (c.last_failed_scrape && (!c.last_successful_scrape || new Date(c.last_failed_scrape) > new Date(c.last_successful_scrape))),
    );
    const healthyComps = activeComps.filter((c: unknown) => !degradedComps.includes(c));

    return sendSuccess(res, {
      stats: {
        jobsToday: allJobs.filter((j: { datePosted?: string }) => {
          if (!j.datePosted) return false;
          try {
            const dateObj = new Date(j.datePosted);
            if (isNaN(dateObj.getTime())) return false;
            const today = new Date().toISOString().split('T')[0];
            const jDate = dateObj.toISOString().split('T')[0];
            return today === jDate;
          } catch {
            return false;
          }
        }).length,
        newJobs: allJobs.length,
        totalCompanies: companies.length,
        activeCompanies: activeComps.length,
        healthyCompanies: healthyComps.length,
        degradedCompanies: degradedComps.length,
        disabledCompanies: disabledComps.length,
        companiesHealthy: healthyComps.length,
        companiesDegraded: degradedComps.length,
        companiesDisabled: disabledComps.length,
        totalApplications: applications.length,
      },
      companies: {
        total: companies.length,
        active: activeComps.length,
        healthy: healthyComps.length,
        degraded: degradedComps.length,
        disabled: disabledComps.length,
      },
    });
  } catch (err: unknown) {
    const error = err as Error;
    Logger.error('Error in /api/dashboard', error);
    return sendError(res, ErrorCodes.INTERNAL_ERROR, error.message, 500);
  }
});

export default router;