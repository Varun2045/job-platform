/**
 * Applications Routes
 * 
 * Handles job application tracking and automation
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
 * GET /api/applications
 * List user's applications
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const applications = await storage.getApplications(userId);

    return sendSuccess(res, {
      applications,
      total: applications.length,
    });
  } catch (err: unknown) {
    const error = err as Error;
    Logger.error('Error in /api/applications', error);
    return sendError(res, ErrorCodes.INTERNAL_ERROR, error.message, 500);
  }
});

/**
 * POST /api/applications
 * Create a new application
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { jobHash, company, status, notes, resumeUsed } = req.body;

    if (!jobHash || !company) {
      return sendError(res, ErrorCodes.VALIDATION_ERROR, 'jobHash and company are required', 400);
    }

    const application = await storage.createApplication({
      userId,
      jobHash,
      company,
      status: status || 'New',
      notes,
      resumeUsed,
    });

    return sendSuccess(res, application, 201);
  } catch (err: unknown) {
    const error = err as Error;
    Logger.error('Error in POST /api/applications', error);
    return sendError(res, ErrorCodes.INTERNAL_ERROR, error.message, 500);
  }
});

/**
 * PUT /api/applications/:id
 * Update application status
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const updated = await storage.updateApplication(id, {
      status,
      notes,
    });

    if (!updated) {
      return sendError(res, ErrorCodes.NOT_FOUND, 'Application not found', 404);
    }

    return sendSuccess(res, updated);
  } catch (err: unknown) {
    const error = err as Error;
    Logger.error('Error in PUT /api/applications/:id', error);
    return sendError(res, ErrorCodes.INTERNAL_ERROR, error.message, 500);
  }
});

/**
 * DELETE /api/applications/:id
 * Delete application
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = await storage.deleteApplication(id);

    if (!deleted) {
      return sendError(res, ErrorCodes.NOT_FOUND, 'Application not found', 404);
    }

    return sendSuccess(res, { message: 'Application deleted successfully' });
  } catch (err: unknown) {
    const error = err as Error;
    Logger.error('Error in DELETE /api/applications/:id', error);
    return sendError(res, ErrorCodes.INTERNAL_ERROR, error.message, 500);
  }
});

export default router;