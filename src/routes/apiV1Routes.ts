import { Router, Request, Response } from 'express';
import { StorageProvider, Offer, FollowUp } from '../storage/StorageProvider.js';
import { KanbanService, KanbanStage } from '../core/KanbanService.js';
import { OfferAnalyzer } from '../core/OfferAnalyzer.js';
import { HeatmapEngine } from '../core/HeatmapEngine.js';
import { VisaIntelligenceService } from '../core/VisaIntelligenceService.js';
import { SlackNotificationProvider } from '../notifications/SlackNotificationProvider.js';
import { TelegramNotificationProvider } from '../notifications/TelegramNotificationProvider.js';
import { AiResumeTailorEngine } from '../core/AiResumeTailorEngine.js';
import { AiCoverLetterEngine } from '../core/AiCoverLetterEngine.js';
import { DailyDigestEngine } from '../core/DailyDigestEngine.js';
import { CalendarService } from '../core/CalendarService.js';
import { AiInsightsEngine } from '../core/AiInsightsEngine.js';
import { JobInboxService } from '../core/JobInboxService.js';
import { GlobalSearchEngine } from '../core/GlobalSearchEngine.js';
import { PlaywrightExtractor } from '../playwright/PlaywrightExtractor.js';
import { AtsRegistryService } from '../core/AtsRegistryService.js';
import { Logger } from '../core/Logger.js';

export function createApiV1Router(storage: StorageProvider): Router {
  const router = Router();

  const kanbanService = new KanbanService(storage);
  const offerAnalyzer = new OfferAnalyzer(storage);
  const heatmapEngine = new HeatmapEngine(storage);
  const visaService = new VisaIntelligenceService(storage);
  const tailorEngine = new AiResumeTailorEngine();
  const coverLetterEngine = new AiCoverLetterEngine();
  const digestEngine = new DailyDigestEngine(storage);
  const insightsEngine = new AiInsightsEngine(storage);
  const inboxService = new JobInboxService(storage);
  const searchEngine = new GlobalSearchEngine(storage);
  const playwrightExtractor = new PlaywrightExtractor();
  const atsRegistryService = new AtsRegistryService();

  // Helper response functions
  const sendSuccess = (res: Response, data: any, statusCode: number = 200) => {
    return res.status(statusCode).json({ success: true, data });
  };

  const sendError = (res: Response, message: string, code: string = 'BAD_REQUEST', statusCode: number = 400) => {
    return res.status(statusCode).json({
      success: false,
      error: { code, message },
    });
  };

  const DEFAULT_GUEST_USER_ID = 'guest-user-00000000-0000-0000-0000-000000000000';
  const getUserId = (req: Request): string => {
    return (req as any).user?.id || DEFAULT_GUEST_USER_ID;
  };

  // ==========================================
  // APPLICATIONS & KANBAN
  // ==========================================

  // PUT /api/v1/applications/:id/stage
  router.put('/applications/:id/stage', async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const { targetStatus, targetStageOrder } = req.body;
      const userId = getUserId(req);

      if (!targetStatus || typeof targetStatus !== 'string') {
        return sendError(res, 'Target status string is required', 'INVALID_INPUT', 400);
      }

      const updated = await kanbanService.moveApplication(id, targetStatus as KanbanStage, targetStageOrder, userId);
      return sendSuccess(res, updated);
    } catch (err: any) {
      Logger.error(`API Error PUT /applications/${req.params.id}/stage`, err);
      return sendError(res, err.message || 'Failed to move application stage', 'STAGE_MOVE_FAILED', 400);
    }
  });

  // PATCH /api/v1/applications/:id/reorder
  router.patch('/applications/:id/reorder', async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const { targetStageOrder } = req.body;
      const userId = getUserId(req);

      if (typeof targetStageOrder !== 'number') {
        return sendError(res, 'targetStageOrder number is required', 'INVALID_INPUT', 400);
      }

      const updated = await kanbanService.reorderWithinStage(id, targetStageOrder, userId);
      return sendSuccess(res, updated);
    } catch (err: any) {
      Logger.error(`API Error PATCH /applications/${req.params.id}/reorder`, err);
      return sendError(res, err.message || 'Failed to reorder application', 'REORDER_FAILED', 400);
    }
  });

  // GET /api/v1/applications/board
  router.get('/applications/board', async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      const board = await kanbanService.getBoard(userId);
      return sendSuccess(res, board);
    } catch (err: any) {
      Logger.error('API Error GET /applications/board', err);
      return sendError(res, err.message || 'Failed to fetch Kanban board', 'BOARD_FETCH_FAILED', 500);
    }
  });

  // ==========================================
  // OFFERS
  // ==========================================

  // POST /api/v1/offers/analyze
  router.post('/offers/analyze', async (req: Request, res: Response) => {
    try {
      const offer: Offer = req.body;
      if (!offer || typeof offer.baseSalary !== 'number') {
        return sendError(res, 'Offer baseSalary number is required', 'INVALID_INPUT', 400);
      }

      const analysis = offerAnalyzer.analyzeOffer(offer);
      return sendSuccess(res, analysis);
    } catch (err: any) {
      Logger.error('API Error POST /offers/analyze', err);
      return sendError(res, err.message || 'Failed to analyze offer', 'ANALYSIS_FAILED', 400);
    }
  });

  // POST /api/v1/offers/compare
  router.post('/offers/compare', async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      const comparison = await offerAnalyzer.compareOffers(userId);
      return sendSuccess(res, comparison);
    } catch (err: any) {
      Logger.error('API Error POST /offers/compare', err);
      return sendError(res, err.message || 'Failed to compare offers', 'COMPARE_FAILED', 500);
    }
  });

  // GET /api/v1/offers/:applicationId
  router.get('/offers/:applicationId', async (req: Request, res: Response) => {
    try {
      const applicationId = req.params.applicationId as string;
      const offer = await storage.getOfferByApplicationId(applicationId);
      if (!offer) {
        return sendError(res, `No offer found for application "${applicationId}"`, 'NOT_FOUND', 404);
      }
      return sendSuccess(res, offer);
    } catch (err: any) {
      Logger.error(`API Error GET /offers/${req.params.applicationId}`, err);
      return sendError(res, err.message || 'Failed to fetch offer', 'FETCH_FAILED', 500);
    }
  });

  // ==========================================
  // FOLLOW-UPS
  // ==========================================

  // GET /api/v1/followups
  router.get('/followups', async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      const followups = await storage.getFollowUps(userId);
      return sendSuccess(res, followups);
    } catch (err: any) {
      Logger.error('API Error GET /followups', err);
      return sendError(res, err.message || 'Failed to fetch follow-ups', 'FETCH_FAILED', 500);
    }
  });

  // POST /api/v1/followups
  router.post('/followups', async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      const followUp: FollowUp = {
        id: req.body.id || `followup-${Date.now()}`,
        applicationId: req.body.applicationId,
        scheduledDate: req.body.scheduledDate || new Date().toISOString(),
        status: req.body.status || 'Pending',
        note: req.body.note || '',
      };

      if (!followUp.applicationId) {
        return sendError(res, 'applicationId string is required', 'INVALID_INPUT', 400);
      }

      await storage.saveFollowUp(userId, followUp);
      return sendSuccess(res, followUp, 201);
    } catch (err: any) {
      Logger.error('API Error POST /followups', err);
      return sendError(res, err.message || 'Failed to create follow-up', 'CREATE_FAILED', 400);
    }
  });

  // PUT /api/v1/followups/:id
  router.put('/followups/:id', async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const userId = getUserId(req);

      const followUp: FollowUp = {
        id,
        applicationId: req.body.applicationId,
        scheduledDate: req.body.scheduledDate,
        status: req.body.status,
        note: req.body.note,
      };

      await storage.saveFollowUp(userId, followUp);
      return sendSuccess(res, followUp);
    } catch (err: any) {
      Logger.error(`API Error PUT /followups/${req.params.id}`, err);
      return sendError(res, err.message || 'Failed to update follow-up', 'UPDATE_FAILED', 400);
    }
  });

  // DELETE /api/v1/followups/:id
  router.delete('/followups/:id', async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const userId = getUserId(req);
      await storage.deleteFollowUp(userId, id);
      return sendSuccess(res, { deleted: true, id });
    } catch (err: any) {
      Logger.error(`API Error DELETE /followups/${req.params.id}`, err);
      return sendError(res, err.message || 'Failed to delete follow-up', 'DELETE_FAILED', 400);
    }
  });

  // ==========================================
  // VISA INTELLIGENCE
  // ==========================================

  // GET /api/v1/visa/company
  router.get('/visa/company', async (req: Request, res: Response) => {
    try {
      const companyName = String(req.query.name || '');
      if (!companyName.trim()) {
        return sendError(res, 'Company name query parameter "?name=" is required', 'INVALID_INPUT', 400);
      }

      const stats = await visaService.getCompanyStatistics(companyName);
      return sendSuccess(res, stats);
    } catch (err: any) {
      Logger.error('API Error GET /visa/company', err);
      return sendError(res, err.message || 'Failed to fetch visa statistics', 'FETCH_FAILED', 500);
    }
  });

  // GET /api/v1/visa/search
  router.get('/visa/search', async (req: Request, res: Response) => {
    try {
      const query = String(req.query.query || '');
      const sponsors = await visaService.searchCompany(query);
      return sendSuccess(res, sponsors);
    } catch (err: any) {
      Logger.error('API Error GET /visa/search', err);
      return sendError(res, err.message || 'Failed to search visa sponsors', 'SEARCH_FAILED', 500);
    }
  });

  // ==========================================
  // NOTIFICATIONS
  // ==========================================

  // POST /api/v1/notifications/test-slack
  router.post('/notifications/test-slack', async (req: Request, res: Response) => {
    try {
      const { webhookUrl, message } = req.body;
      if (!webhookUrl || typeof webhookUrl !== 'string') {
        return sendError(res, 'webhookUrl string is required', 'INVALID_INPUT', 400);
      }

      const provider = new SlackNotificationProvider(webhookUrl);
      if (!provider.isValidWebhookUrl(webhookUrl)) {
        return sendError(res, 'Invalid or restricted Slack Webhook URL provided', 'INVALID_WEBHOOK', 400);
      }

      await provider.sendDigest({
        runTimestamp: new Date().toISOString(),
        totalCompaniesChecked: 1,
        totalJobsFound: 1,
        totalNewJobs: 1,
        jobs: [
          {
            companyName: 'Test Automation',
            title: message || 'Senior Software Engineer',
            location: 'Remote',
            experience: 'Senior',
            employmentType: 'Full-time',
            datePosted: new Date().toISOString(),
            applyUrl: 'https://example.com/careers',
            jobId: 'test-1',
            matchScore: 98,
            isRemote: true,
          },
        ],
      });

      return sendSuccess(res, { delivered: true, provider: 'slack' });
    } catch (err: any) {
      Logger.error('API Error POST /notifications/test-slack', err);
      return sendError(res, err.message || 'Slack dispatch failed', 'DISPATCH_FAILED', 400);
    }
  });

  // POST /api/v1/notifications/test-telegram
  router.post('/notifications/test-telegram', async (req: Request, res: Response) => {
    try {
      const { botToken, chatId, message } = req.body;
      if (!botToken || !chatId) {
        return sendError(res, 'botToken and chatId are required', 'INVALID_INPUT', 400);
      }

      const provider = new TelegramNotificationProvider(botToken, chatId);
      if (!provider.isValidBotToken(botToken)) {
        return sendError(res, 'Invalid Telegram Bot Token format', 'INVALID_TOKEN', 400);
      }

      if (!provider.isValidChatId(chatId)) {
        return sendError(res, 'Invalid Telegram Chat ID format', 'INVALID_CHAT_ID', 400);
      }

      await provider.sendDigest({
        runTimestamp: new Date().toISOString(),
        totalCompaniesChecked: 1,
        totalJobsFound: 1,
        totalNewJobs: 1,
        jobs: [
          {
            companyName: 'Test Automation',
            title: message || 'Senior Backend Engineer',
            location: 'Remote',
            experience: 'Senior',
            employmentType: 'Full-time',
            datePosted: new Date().toISOString(),
            applyUrl: 'https://example.com/careers',
            jobId: 'test-2',
            matchScore: 96,
            isRemote: true,
          },
        ],
      });

      return sendSuccess(res, { delivered: true, provider: 'telegram' });
    } catch (err: any) {
      Logger.error('API Error POST /notifications/test-telegram', err);
      return sendError(res, err.message || 'Telegram dispatch failed', 'DISPATCH_FAILED', 400);
    }
  });

  // ==========================================
  // KEYWORD HEATMAP
  // ==========================================

  // POST /api/v1/heatmap
  router.post('/heatmap', async (req: Request, res: Response) => {
    try {
      const { jobId, resumeProfileId, jobDescription, resumeContent } = req.body;
      if (!jobDescription || !resumeContent) {
        return sendError(res, 'jobDescription and resumeContent strings are required', 'INVALID_INPUT', 400);
      }

      const heatmap = heatmapEngine.generateHeatmap(
        jobId || 'custom-job',
        resumeProfileId || 'custom-resume',
        jobDescription,
        resumeContent,
      );

      return sendSuccess(res, heatmap);
    } catch (err: any) {
      Logger.error('API Error POST /heatmap', err);
      return sendError(res, err.message || 'Failed to generate heatmap', 'HEATMAP_FAILED', 400);
    }
  });

  // GET /api/v1/heatmap/:applicationId
  router.get('/heatmap/:applicationId', async (req: Request, res: Response) => {
    try {
      const applicationId = req.params.applicationId as string;
      const apps = await storage.getApplications((req as any).user?.id);
      const app = apps.find((a) => a.jobId === applicationId || a.jobHash === applicationId);

      const jobDescription = app?.notes || 'TypeScript Node.js React Docker PostgreSQL';
      const resumeContent = 'TypeScript Node.js React developer with experience';

      const heatmap = heatmapEngine.generateHeatmap(
        applicationId,
        app?.resumeProfileId || 'default-profile',
        jobDescription,
        resumeContent,
      );

      return sendSuccess(res, heatmap);
    } catch (err: any) {
      Logger.error(`API Error GET /heatmap/${req.params.applicationId}`, err);
      return sendError(res, err.message || 'Failed to fetch heatmap', 'FETCH_FAILED', 500);
    }
  });

  // ==========================================
  // CHROME EXTENSION INGESTION
  // ==========================================

  // POST /api/v1/extension/save-job
  router.post('/extension/save-job', async (req: Request, res: Response) => {
    try {
      const { companyName, jobTitle, location, salaryRange, jobUrl, description, skills, platformSource } = req.body;
      if (!companyName || !jobTitle || !jobUrl) {
        return sendError(res, 'companyName, jobTitle, and jobUrl are required fields', 'INVALID_INPUT', 400);
      }

      const userId = getUserId(req);
      const savedJob = await storage.saveExtensionJob({
        id: `ext-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        userId,
        companyName,
        jobTitle,
        location: location || 'Unspecified',
        salaryRange: salaryRange || null,
        jobUrl,
        description: description || '',
        skills: skills || [],
        platformSource: platformSource || 'Extension',
        status: 'Captured',
        createdAt: new Date().toISOString(),
      });

      Logger.info(`Extension: Saved job [${jobTitle} at ${companyName}] from source [${platformSource}]`);
      return sendSuccess(res, savedJob, 201);
    } catch (err: any) {
      Logger.error('API Error POST /extension/save-job', err);
      return sendError(res, err.message || 'Failed to save extension job', 'SAVE_FAILED', 500);
    }
  });

  // GET /api/v1/extension/jobs
  router.get('/extension/jobs', async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      const jobs = await storage.getExtensionJobs(userId);
      return sendSuccess(res, jobs);
    } catch (err: any) {
      Logger.error('API Error GET /extension/jobs', err);
      return sendError(res, err.message || 'Failed to fetch extension jobs', 'FETCH_FAILED', 500);
    }
  });

  // ==========================================
  // AI TOOLS
  // ==========================================

  // POST /api/v1/ai/tailor-resume
  router.post('/ai/tailor-resume', async (req: Request, res: Response) => {
    try {
      const { jobId, jobDescription, resumeContent, masterSkills } = req.body;
      if (!jobDescription || !resumeContent) {
        return sendError(res, 'jobDescription and resumeContent are required fields', 'INVALID_INPUT', 400);
      }

      const result = tailorEngine.tailorResume({
        jobId,
        jobDescription,
        resumeContent,
        masterSkills,
      });

      return sendSuccess(res, result);
    } catch (err: any) {
      Logger.error('API Error POST /ai/tailor-resume', err);
      return sendError(res, err.message || 'Failed to tailor resume', 'TAILOR_FAILED', 500);
    }
  });

  // POST /api/v1/ai/cover-letter
  router.post('/ai/cover-letter', async (req: Request, res: Response) => {
    try {
      const { companyName, jobTitle, jobDescription, candidateName, tone, length } = req.body;
      if (!companyName || !jobTitle) {
        return sendError(res, 'companyName and jobTitle are required fields', 'INVALID_INPUT', 400);
      }

      const result = coverLetterEngine.generateCoverLetter({
        companyName,
        jobTitle,
        jobDescription,
        candidateName,
        tone,
        length,
      });

      return sendSuccess(res, result);
    } catch (err: any) {
      Logger.error('API Error POST /ai/cover-letter', err);
      return sendError(res, err.message || 'Failed to generate cover letter', 'GENERATE_FAILED', 500);
    }
  });

  // ==========================================
  // DAILY DIGEST & CALENDAR SYNC
  // ==========================================

  // POST /api/v1/digest/send
  router.post('/digest/send', async (req: Request, res: Response) => {
    try {
      const { channels, slackWebhookUrl, telegramBotToken, telegramChatId } = req.body;
      const userId = getUserId(req);

      const result = await digestEngine.dispatchDigest(userId, channels || ['email'], {
        slackWebhookUrl,
        telegramBotToken,
        telegramChatId,
      });

      return sendSuccess(res, result);
    } catch (err: any) {
      Logger.error('API Error POST /digest/send', err);
      return sendError(res, err.message || 'Failed to dispatch digest', 'DISPATCH_FAILED', 500);
    }
  });

  // GET /api/v1/calendar/export-ics
  router.get('/calendar/export-ics', async (req: Request, res: Response) => {
    try {
      const { title, description, startTime, endTime, location } = req.query;
      const ics = CalendarService.generateICS({
        title: String(title || 'Job Interview'),
        description: String(description || 'Job application interview event'),
        eventType: 'Interview',
        startTime: startTime ? new Date(String(startTime)) : new Date(),
        endTime: endTime ? new Date(String(endTime)) : new Date(Date.now() + 3600000),
        location: String(location || 'Virtual Call'),
      });

      res.setHeader('Content-Type', 'text/calendar');
      res.setHeader('Content-Disposition', 'attachment; filename="event.ics"');
      return res.send(ics);
    } catch (err: any) {
      Logger.error('API Error GET /calendar/export-ics', err);
      return sendError(res, err.message || 'Failed to generate ICS file', 'ICS_FAILED', 500);
    }
  });

  // ==========================================
  // AI INSIGHTS
  // ==========================================

  // GET /api/v1/insights
  router.get('/insights', async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      const insights = await insightsEngine.generateInsights(userId);
      return sendSuccess(res, insights);
    } catch (err: any) {
      Logger.error('API Error GET /insights', err);
      return sendError(res, err.message || 'Failed to generate insights', 'FETCH_FAILED', 500);
    }
  });

  // ==========================================
  // JOB INBOX & APPLICATION PROMOTION
  // ==========================================

  // GET /api/v1/inbox
  router.get('/inbox', async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      const jobs = await inboxService.getInboxJobs(userId);
      return sendSuccess(res, jobs);
    } catch (err: any) {
      Logger.error('API Error GET /inbox', err);
      return sendError(res, err.message || 'Failed to fetch inbox jobs', 'FETCH_FAILED', 500);
    }
  });

  // POST /api/v1/inbox/:id/promote
  router.post('/inbox/:id/promote', async (req: Request, res: Response) => {
    try {
      const inboxJobId = req.params.id as string;
      const userId = getUserId(req);

      const app = await inboxService.promoteToApplication(inboxJobId, userId);
      return sendSuccess(res, app, 201);
    } catch (err: any) {
      Logger.error(`API Error POST /inbox/${req.params.id}/promote`, err);
      return sendError(res, err.message || 'Failed to promote job to application', 'PROMOTE_FAILED', 400);
    }
  });

  // POST /api/v1/inbox/bulk-promote
  router.post('/inbox/bulk-promote', async (req: Request, res: Response) => {
    try {
      const { ids } = req.body;
      if (!Array.isArray(ids) || ids.length === 0) {
        return sendError(res, 'ids must be a non-empty array', 'INVALID_INPUT', 400);
      }

      const userId = getUserId(req);
      const promotedApps = [];
      for (const id of ids) {
        try {
          const app = await inboxService.promoteToApplication(id, userId);
          promotedApps.push(app);
        } catch {
          // ignore individual item fails
        }
      }

      return sendSuccess(res, { promotedCount: promotedApps.length, promotedApps });
    } catch (err: any) {
      Logger.error('API Error POST /inbox/bulk-promote', err);
      return sendError(res, err.message || 'Failed bulk promote', 'BULK_PROMOTE_FAILED', 500);
    }
  });

  // ==========================================
  // GLOBAL SEARCH
  // ==========================================

  // GET /api/v1/search?q=query
  router.get('/search', async (req: Request, res: Response) => {
    try {
      const query = String(req.query.q || '');
      const userId = getUserId(req);

      const results = await searchEngine.search(query, userId);
      return sendSuccess(res, results);
    } catch (err: any) {
      Logger.error('API Error GET /search', err);
      return sendError(res, err.message || 'Search execution failed', 'SEARCH_FAILED', 500);
    }
  });

  // ==========================================
  // PLAYWRIGHT EXTRACTION FALLBACK
  // ==========================================

  // POST /api/v1/extract-job
  router.post('/extract-job', async (req: Request, res: Response) => {
    try {
      const { jobUrl } = req.body;
      if (!jobUrl) {
        return sendError(res, 'jobUrl is required field', 'INVALID_INPUT', 400);
      }

      const extracted = await playwrightExtractor.extractJob(jobUrl);
      return sendSuccess(res, extracted);
    } catch (err: any) {
      Logger.error('API Error POST /extract-job', err);
      return sendError(res, err.message || 'Failed to extract job details via Playwright', 'EXTRACTION_FAILED', 500);
    }
  });

  // ==========================================
  // SUPPORTED ATS EXPLORER
  // ==========================================

  // GET /api/v1/ats/registry
  router.get('/ats/registry', async (_req: Request, res: Response) => {
    try {
      const companies = await storage.getAllCompanies();
      const healthMap: Record<string, 'Healthy' | 'Warning' | 'Failing'> = {};
      for (const c of companies) {
        const failures = c.consecutive_failures ?? 0;
        let h: 'Healthy' | 'Warning' | 'Failing' = 'Healthy';
        if (!c.enabled || failures >= 3) {
          h = 'Failing';
        } else if (failures > 0) {
          h = 'Warning';
        }
        healthMap[c.name.toLowerCase()] = h;
        healthMap[c.id.toLowerCase()] = h;
      }
      const overview = atsRegistryService.getRegistryOverview(healthMap);
      return sendSuccess(res, overview);
    } catch (err: any) {
      Logger.error('API Error GET /ats/registry', err);
      return sendError(res, err.message || 'Failed to fetch ATS registry', 'FETCH_FAILED', 500);
    }
  });

  // POST /api/v1/ats/detect-url
  router.post('/ats/detect-url', async (req: Request, res: Response) => {
    try {
      const { url } = req.body;
      if (!url) {
        return sendError(res, 'url is required field', 'INVALID_INPUT', 400);
      }

      const result = atsRegistryService.detectUrl(url);
      return sendSuccess(res, result);
    } catch (err: any) {
      Logger.error('API Error POST /ats/detect-url', err);
      return sendError(res, err.message || 'Failed to detect URL platform', 'DETECT_FAILED', 500);
    }
  });

  // POST /api/v1/ats/update-urls
  router.post('/ats/update-urls', async (req: Request, res: Response) => {
    try {
      const { companyName, careerPage, jobBoardUrl } = req.body;
      if (!companyName) {
        return sendError(res, 'companyName is a required field', 'INVALID_INPUT', 400);
      }

      const result = atsRegistryService.updateCompanyUrls(companyName, careerPage, jobBoardUrl);
      return sendSuccess(res, result.data, 200);
    } catch (err: any) {
      Logger.error('API Error POST /ats/update-urls', err);
      return sendError(res, err.message || 'Failed to update parser URLs', 'UPDATE_FAILED', 400);
    }
  });

  return router;
}
