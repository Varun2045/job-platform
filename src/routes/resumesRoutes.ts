/**
 * Resumes Routes
 * 
 * Handles resume management and profile operations
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
 * GET /api/resumes
 * List all resumes
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const resumes = await storage.getResumes();
    return sendSuccess(res, {
      resumes,
      total: resumes.length,
    });
  } catch (err: unknown) {
    const error = err as Error;
    Logger.error('Error in GET /api/resumes', error);
    return sendError(res, ErrorCodes.INTERNAL_ERROR, error.message, 500);
  }
});

/**
 * POST /api/resumes
 * Upload a new resume
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, content, pdf_data } = req.body;

    if (!name || !content) {
      return sendError(res, ErrorCodes.VALIDATION_ERROR, 'Name and content are required', 400);
    }

    const resume = await storage.createResume({
      name,
      content,
      pdf_data,
    });

    return sendSuccess(res, resume, 201);
  } catch (err: unknown) {
    const error = err as Error;
    Logger.error('Error in POST /api/resumes', error);
    return sendError(res, ErrorCodes.INTERNAL_ERROR, error.message, 500);
  }
});

/**
 * DELETE /api/resumes/:name
 * Delete a resume
 */
router.delete('/:name', async (req: Request, res: Response) => {
  try {
    const { name } = req.params;
    const deleted = await storage.deleteResume(name);

    if (!deleted) {
      return sendError(res, ErrorCodes.NOT_FOUND, 'Resume not found', 404);
    }

    return sendSuccess(res, { message: 'Resume deleted successfully' });
  } catch (err: unknown) {
    const error = err as Error;
    Logger.error('Error in DELETE /api/resumes/:name', error);
    return sendError(res, ErrorCodes.INTERNAL_ERROR, error.message, 500);
  }
});

/**
 * GET /api/resume-profiles
 * List resume profiles
 */
router.get('/resume-profiles', async (req: Request, res: Response) => {
  try {
    const profiles = await storage.getResumeProfiles();
    return sendSuccess(res, {
      profiles,
      total: profiles.length,
    });
  } catch (err: unknown) {
    const error = err as Error;
    Logger.error('Error in GET /api/resume-profiles', error);
    return sendError(res, ErrorCodes.INTERNAL_ERROR, error.message, 500);
  }
});

export default router;