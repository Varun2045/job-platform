/**
 * Backup Routes
 * 
 * Handles backup and restore operations
 */

import express from 'express';
import { Logger } from '../core/Logger.js';
import { sendSuccess, sendError, ErrorCodes } from '../utils/apiResponse.js';
import { BackupService } from '../core/BackupService.js';
import type { Request, Response } from 'express';

const router = express.Router();

// This will be set by the main server file
let storage: any;

export function setStorage(storageProvider: any) {
  storage = storageProvider;
}

/**
 * POST /api/backup/export
 * Export system backup
 */
router.post('/export', async (req: Request, res: Response) => {
  try {
    const backup = await BackupService.exportBackup(storage);
    return sendSuccess(res, backup);
  } catch (err: unknown) {
    const error = err as Error;
    Logger.error('Error in POST /api/backup/export', error);
    return sendError(res, ErrorCodes.INTERNAL_ERROR, error.message, 500);
  }
});

/**
 * POST /api/backup/import
 * Import system backup
 */
router.post('/import', async (req: Request, res: Response) => {
  try {
    await BackupService.importBackup(storage, req.body);
    return sendSuccess(res, { success: true });
  } catch (err: unknown) {
    const error = err as Error;
    Logger.error('Error in POST /api/backup/import', error);
    return sendError(res, ErrorCodes.INTERNAL_ERROR, error.message, 500);
  }
});

export default router;