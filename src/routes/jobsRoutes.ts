/**
 * Jobs Routes
 * 
 * Handles job listing, search, and job details
 */

import express from 'express';
import { Logger } from '../core/Logger.js';
import { sendSuccess, sendError, ErrorCodes } from '../utils/apiResponse.js';
import type { Request, Response } from 'express';

const router = express.Router();

// This will be set by the main server file
let storage: any;
let SearchEngine: any;

export function setDependencies(storageProvider: any, searchEngine: any) {
  storage = storageProvider;
  SearchEngine = searchEngine;
}

/**
 * GET /api/jobs
 * List jobs with optional filtering
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const {
      q,
      technology,
      company,
      experience,
      department,
      location,
      isRemote,
      sortBy = 'datePosted',
      sortOrder = 'desc',
      page = 1,
      limit = 50,
    } = req.query;

    const allJobs = await storage.getAllJobs();
    let filteredJobs = allJobs;

    // Apply filters
    if (q) {
      const query = q.toString().toLowerCase();
      filteredJobs = filteredJobs.filter((job: any) =>
        job.title?.toLowerCase().includes(query) ||
        job.company?.toLowerCase().includes(query) ||
        job.description?.toLowerCase().includes(query)
      );
    }

    if (technology) {
      filteredJobs = filteredJobs.filter((job: any) =>
        job.skills?.includes(technology)
      );
    }

    if (company) {
      filteredJobs = filteredJobs.filter((job: any) =>
        job.company?.toLowerCase().includes(company.toString().toLowerCase())
      );
    }

    if (location) {
      filteredJobs = filteredJobs.filter((job: any) =>
        job.location?.toLowerCase().includes(location.toString().toLowerCase())
      );
    }

    if (isRemote === 'true') {
      filteredJobs = filteredJobs.filter((job: any) => job.isRemote);
    }

    // Apply sorting
    filteredJobs.sort((a: any, b: any) => {
      const aVal = a[sortBy as string];
      const bVal = b[sortBy as string];
      
      if (sortOrder === 'desc') {
        return aVal > bVal ? -1 : 1;
      } else {
        return aVal < bVal ? -1 : 1;
      }
    });

    // Apply pagination
    const offset = (Number(page) - 1) * Number(limit);
    const paginatedJobs = filteredJobs.slice(offset, offset + Number(limit));

    return sendSuccess(res, {
      jobs: paginatedJobs,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: filteredJobs.length,
        totalPages: Math.ceil(filteredJobs.length / Number(limit)),
      },
    });
  } catch (err: unknown) {
    const error = err as Error;
    Logger.error('Error in /api/jobs', error);
    return sendError(res, ErrorCodes.INTERNAL_ERROR, error.message, 500);
  }
});

/**
 * GET /api/jobs/:hash
 * Get job details by hash
 */
router.get('/:hash', async (req: Request, res: Response) => {
  try {
    const { hash } = req.params;
    const companies = await storage.getAllCompanies();
    let foundJob: any = null;
    let matchedComp: any = null;

    const allJobs = await storage.getAllJobs();
    const j = allJobs.find((x: any) => x.jobHash === hash);
    if (j) {
      foundJob = j;
      matchedComp = companies.find((c: any) => c.id.toLowerCase() === (j.company || '').toLowerCase() || c.name.toLowerCase() === (j.company || '').toLowerCase()) || null;
    }

    if (!foundJob) {
      return sendError(res, ErrorCodes.NOT_FOUND, 'Job not found', 404);
    }

    return sendSuccess(res, {
      job: foundJob,
      company: matchedComp,
    });
  } catch (err: unknown) {
    const error = err as Error;
    Logger.error('Error in /api/jobs/:hash', error);
    return sendError(res, ErrorCodes.INTERNAL_ERROR, error.message, 500);
  }
});

/**
 * GET /api/jobs/:hash/analysis
 * Get job analysis
 */
router.get('/:hash/analysis', async (req: Request, res: Response) => {
  try {
    const { hash } = req.params;
    const allJobs = await storage.getAllJobs();
    const job = allJobs.find((j: any) => j.jobHash === hash);

    if (!job) {
      return sendError(res, ErrorCodes.NOT_FOUND, 'Job not found', 404);
    }

    // Mock analysis - in production this would use AI
    const analysis = {
      matchScore: 85,
      keySkills: ['JavaScript', 'React', 'TypeScript'],
      experienceLevel: 'Mid-Senior',
      remoteFriendly: job.isRemote,
      salaryRange: job.salary || 'Not specified',
      careerGrowth: 'High',
      companyReputation: 'Good',
    };

    return sendSuccess(res, analysis);
  } catch (err: unknown) {
    const error = err as Error;
    Logger.error('Error in /api/jobs/:hash/analysis', error);
    return sendError(res, ErrorCodes.INTERNAL_ERROR, error.message, 500);
  }
});

export default router;