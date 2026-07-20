import express from 'express';
import { CompanyConfig } from '../companies/Scraper.js';
import { PDFParse } from 'pdf-parse';
import mammoth from 'mammoth';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import compression from 'compression';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import crypto from 'crypto';
import swaggerUi from 'swagger-ui-express';
import { config } from '../config/config.js';
import { FileStorage } from '../storage/FileStorage.js';
import { SupabaseStorage } from '../storage/SupabaseStorage.js';
import { StorageProvider } from '../storage/StorageProvider.js';
import { EmailNotificationProvider } from '../notifications/EmailNotificationProvider.js';
import { ResumeMatcher } from './ResumeMatcher.js';
import { SearchEngine } from './SearchEngine.js';
import { Logger } from './Logger.js';
import { AiAnalyzer } from './ResumeMatcher.js';
import { ResumeTailor } from './ResumeTailor.js';
import { CoverLetterGenerator } from './CoverLetterGenerator.js';
import { InterviewGenerator } from './InterviewGenerator.js';
import { RecommendationEngine } from './RecommendationEngine.js';
import { Telemetry } from './Telemetry.js';
import { HealthService } from './HealthService.js';
import { BackupService } from './BackupService.js';
import { FeatureFlagsService } from './FeatureFlagsService.js';
import { AuditLogger } from './AuditLogger.js';
import { RealtimeBroadcaster } from './RealtimeBroadcaster.js';
import { runOrchestrator } from './index.js';
import { CareerAgent } from './CareerAgent.js';
import { SkillGapEngine } from './SkillGapEngine.js';
import { InterviewCopilot } from './InterviewCopilot.js';
import { CareerRoadmap } from './CareerRoadmap.js';
import { MarketIntelligence } from './MarketIntelligence.js';
import { DailyBriefService } from './DailyBriefService.js';
import { SalaryAnalyzer } from './SalaryAnalyzer.js';
import { FollowUpAssistant } from './FollowUpAssistant.js';
import { AssistantChatService } from './AssistantChatService.js';
import { FlashcardGenerator } from './FlashcardGenerator.js';
import { CheatsheetGenerator } from './cheatsheet.js';

// Version 5.0.0 Intelligent Application Automation Imports
import { AutoApplyEngine } from './AutoApplyEngine.js';
import { ResumeOptimizationService } from './ResumeOptimizationService.js';
import { CalendarService } from './CalendarService.js';
import { RecruiterManager } from './RecruiterManager.js';
import { OpportunityEngine } from './RecommendationEngine.js';
import { PortfolioRecommendation } from './PortfolioRecommendation.js';
import { ExportService } from './ExportService.js';
import { PlaywrightScraper } from '../companies/PlaywrightScraper.js';
import { FallbackScraper } from '../companies/FallbackScraper.js';
import { ScraperRegistry } from '../companies/ScraperRegistry.js';
import { HttpClient } from './HttpClient.js';
import * as cheerio from 'cheerio';

const app = express();
app.set('trust proxy', 1);

// Enable ETag checks
app.set('etag', 'weak');

// Helmet for security headers
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:', 'blob:'],
        connectSrc: ["'self'", 'https://*.supabase.co'],
      },
    },
  }),
);

// Request size limits
app.use(express.json({ limit: '10mb' }));
app.use(compression());

// Request ID Generation
app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
  const requestId = req.headers['x-request-id'] || crypto.randomUUID();
  req.headers['x-request-id'] = requestId;
  res.setHeader('X-Request-ID', requestId);
  next();
});

// Audit Logging & API Latency telemetry middleware
app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    Telemetry.recordRequest(duration);
    const reqId = req.headers['x-request-id'];
    Logger.info(
      `[AUDIT] RequestID=${reqId} Method=${req.method} URL=${req.originalUrl} Status=${res.statusCode} Latency=${duration}ms`,
    );
  });
  next();
});

// CORS whitelist config
const corsWhitelist = ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000'];
app.use(
  cors({
    origin: (origin, callback) => {
      if (
        !origin ||
        corsWhitelist.includes(origin) ||
        origin.startsWith('http://localhost:') ||
        origin.startsWith('http://127.0.0.1:') ||
        origin.endsWith('.vercel.app')
      ) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  }),
);

// API Rate Limiting (100 requests per 15 minutes window)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests from this IP, please try again after 15 minutes' },
});
if (!config.isLocal) {
  app.use('/api', apiLimiter);
}

// Disable API response caching by default
app.use('/api', (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  next();
});

// Sanitize inputs to prevent script/tag injections
const sanitizeString = (str: string): string => {
  return str.replace(/<[^>]*>/g, '').trim();
};

const sanitizeObject = (obj: any): any => {
  if (typeof obj !== 'object' || obj === null) return obj;
  for (const key in obj) {
    if (typeof obj[key] === 'string') {
      obj[key] = sanitizeString(obj[key]);
    } else if (typeof obj[key] === 'object') {
      obj[key] = sanitizeObject(obj[key]);
    }
  }
  return obj;
};

app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (req.path === '/api/scraper/test-selector' || req.path === '/api/profile-builder/publish-website') {
    if (req.body) {
      const { html, ...otherBody } = req.body;
      sanitizeObject(otherBody);
      req.body = { ...otherBody, html };
    }
    if (req.query) sanitizeObject(req.query);
    if (req.params) sanitizeObject(req.params);
    return next();
  }

  if (req.body) sanitizeObject(req.body);
  if (req.query) sanitizeObject(req.query);
  if (req.params) sanitizeObject(req.params);
  next();
});

const storage: StorageProvider = config.isLocal ? new FileStorage() : new SupabaseStorage();
await storage.initialize();
FeatureFlagsService.initialize(storage);
AuditLogger.initialize(storage);
RealtimeBroadcaster.initialize();

// Middleware for checking Supabase Auth in production
const authMiddleware = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (config.isLocal) {
    const authHeader = req.headers.authorization;
    let role = 'Admin';
    let id = '00000000-0000-0000-0000-000000000000';
    let email = config.localAdminEmail || 'admin@jobmonitor.com';

    if (authHeader) {
      if (authHeader.includes('user-token')) {
        role = 'User';
        id = '11111111-1111-1111-1111-111111111111';
        email = config.localUserEmail || 'user@jobmonitor.com';
      } else if (authHeader.includes('viewer-token')) {
        role = 'Viewer';
        id = '22222222-2222-2222-2222-222222222222';
        email = config.localViewerEmail || 'viewer@jobmonitor.com';
      }
    }

    (req as any).user = { id, email, role };
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing token' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const supabase = (storage as any).client;
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);
    if (error || !user) {
      return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }

    let profile = await storage.getProfile(user.id);
    if (!profile) {
      const name = user.email ? user.email.split('@')[0] : 'User';
      profile = {
        name,
        role: 'User',
      };
      await storage.saveProfile(user.id, profile);
      profile.role = 'User';
    }

    (req as any).user = {
      id: user.id,
      email: user.email,
      role: profile.role || 'User',
    };
    next();
  } catch {
    return res.status(401).json({ error: 'Unauthorized: Error validating token' });
  }
};

// Role Access Control checking middleware
const requireRole = (roles: string[]) => {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    if (!roles.includes(user.role)) {
      return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
    }
    next();
  };
};

// Auth endpoints
app.post('/api/auth/register', async (req, res) => {
  const { email, password, name } = req.body;
  if (config.isLocal) {
    return res.json({ token: 'mock-local-token', user: { email } });
  }
  try {
    const supabase = (storage as any).client;
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    if (data.user) {
      await storage.saveProfile(data.user.id, {
        name: name || email.split('@')[0],
        role: 'User',
      });
      await storage.saveAuditLog(data.user.id, 'Register', { email }, req.ip);
    }
    return res.json({ token: data.session?.access_token, user: data.user });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (config.isLocal) {
    if (email === config.localAdminEmail && password === config.localAdminPassword) {
      return res.json({ token: 'admin-token', user: { email, role: 'Admin' } });
    }
    if (email === config.localUserEmail && password === config.localUserPassword) {
      return res.json({ token: 'user-token', user: { email, role: 'User' } });
    }
    if (email === config.localViewerEmail && password === config.localViewerPassword) {
      return res.json({ token: 'viewer-token', user: { email, role: 'Viewer' } });
    }
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  try {
    const supabase = (storage as any).client;
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;

    if (data.user) {
      await storage.saveAuditLog(data.user.id, 'Login', { email }, req.ip);
    }
    return res.json({ token: data.session?.access_token, user: data.user });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// GET OAuth Authorization URL
app.get('/api/auth/oauth/:provider', async (req, res) => {
  const { provider } = req.params;
  if (config.isLocal) {
    return res.json({ url: '' });
  }
  try {
    const supabase = (storage as any).client;
    const originParam = req.query.origin as string;
    const referer = req.get('referer');
    const redirectUrl = originParam
      ? (originParam.endsWith('/') ? originParam : `${originParam}/`)
      : (referer ? new URL(referer).origin + '/' : `${req.protocol}://${req.get('host')}/`);
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: provider as any,
      options: {
        redirectTo: redirectUrl,
      },
    });
    if (error) throw error;
    return res.json({ url: data.url });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// Dashboard metrics
app.get('/api/dashboard', authMiddleware, async (req, res) => {
  try {
    const companies = await storage.getAllCompanies();
    const applications = await storage.getApplications();

    let statsHistory: any[] = [];
    const statsPath = path.join(process.cwd(), 'storage', 'stats.json');
    if (fs.existsSync(statsPath)) {
      try {
        statsHistory = JSON.parse(fs.readFileSync(statsPath, 'utf-8'));
      } catch {}
    }

    const allJobs = await storage.getAllJobs();

    const activeComps = companies.filter((c) => c.enabled);
    const healthyComps = activeComps.filter((c) => c.total_failures === 0);
    const degradedComps = activeComps.filter((c) => c.total_failures > 0);
    const disabledComps = companies.filter((c) => !c.enabled);

    return res.json({
      stats: {
        jobsToday: allJobs.filter((j) => {
          const today = new Date().toISOString().split('T')[0];
          const jDate = new Date(j.datePosted || 0).toISOString().split('T')[0];
          return today === jDate;
        }).length,
        newJobs: allJobs.length,
        matches: allJobs.filter((j) => {
          const profiles = ['backend'];
          const matchScore = ResumeMatcher.match(j, profiles[0]);
          return matchScore >= config.matchThreshold;
        }).length,
        applications: applications.length,
        interviews: applications.filter((a) => a.status === 'Interview').length,
        offers: applications.filter((a) => a.status === 'Offer').length,
        companiesHealthy: healthyComps.length,
        companiesDegraded: degradedComps.length,
        companiesDisabled: disabledComps.length,
      },
      charts: {
        statsHistory,
        companies: companies.map((c) => ({ name: c.name, jobsFound: c.total_scrapes })),
      },
    });
  } catch (err: any) {
    Logger.error('Error in /api/dashboard', err);
    return res.status(500).json({ error: err.message });
  }
});

// Job Explorer
app.get('/api/jobs', authMiddleware, async (req, res) => {
  try {
    const {
      company,
      technology,
      experience,
      location,
      remote,
      minScore,
      sort = 'opportunity',
      page = '1',
      limit = '10',
    } = req.query;

    const settings = await storage.getExtendedSettings();
    const companies = await storage.getEnabledCompanies();
    const allJobs = await storage.getAllJobs();
    const enabledCompsMap = new Map(companies.map((c) => [c.id, c]));
    const allScoredJobs: { job: any; score: number; opportunityScore: number; breakdown: any }[] = [];

    for (const j of allJobs) {
      const comp = enabledCompsMap.get(j.company);
      if (!comp) continue;

      const profiles = comp.resume_profiles.length > 0 ? comp.resume_profiles : ['backend'];
      const bestScore = Math.max(...profiles.map((p) => ResumeMatcher.match(j, p)));
      const recommendation = RecommendationEngine.calculateOpportunityScore(j, bestScore, comp, settings);
      allScoredJobs.push({
        job: j,
        score: bestScore,
        opportunityScore: recommendation.opportunityScore,
        breakdown: recommendation.breakdown,
      });
    }

    // Build search filter object - only include non-empty filters
    const searchFilter: any = {};
    if (company && company !== 'all') searchFilter.company = company as string;
    if (technology) searchFilter.technology = technology as string;
    if (experience && experience !== 'all') searchFilter.experience = experience as string;
    if (location) searchFilter.location = location as string;
    if (remote) searchFilter.remote = remote === 'true';
    if (minScore) searchFilter.minScore = Number(minScore);

    const filtered = SearchEngine.search(allScoredJobs as any, searchFilter) as any[];

    // Sort by match score or opportunity score
    if (sort === 'match') {
      filtered.sort((a, b) => b.score - a.score || b.opportunityScore - a.opportunityScore);
    } else {
      filtered.sort((a, b) => b.opportunityScore - a.opportunityScore || b.score - a.score);
    }

    const p = Number(page);
    const l = Number(limit);
    const start = (p - 1) * l;
    const end = start + l;
    const paginated = filtered.slice(start, end);

    return res.json({
      jobs: paginated,
      total: filtered.length,
      page: p,
      pages: Math.ceil(filtered.length / l),
    });
  } catch (err: any) {
    Logger.error('Error in /api/jobs', err);
    return res.status(500).json({ error: err.message });
  }
});

// Job Details
app.get('/api/jobs/:hash', authMiddleware, async (req, res) => {
  try {
    const { hash } = req.params;
    const companies = await storage.getAllCompanies();
    let foundJob: any = null;
    let matchedComp: any = null;

    const allJobs = await storage.getAllJobs();
    const j = allJobs.find((x) => x.jobHash === hash);
    if (j) {
      foundJob = j;
      matchedComp = companies.find((c) => c.id === j.company);
    }

    if (!foundJob) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const profile = matchedComp.resume_profiles[0] || 'backend';
    const explanation = ResumeMatcher.explain(foundJob, profile);

    return res.json({
      job: foundJob,
      explanation,
      aiSummary: `This is an automated AI summary description placeholder for the ${foundJob.title} role at ${foundJob.company}.`,
    });
  } catch (err: any) {
    Logger.error('Error in /api/jobs/:hash', err);
    return res.status(500).json({ error: err.message });
  }
});

// Application Tracking endpoints
app.get('/api/applications', authMiddleware, async (req, res) => {
  try {
    const apps = await storage.getApplications((req as any).user.id);
    const enriched = [];
    for (const app of apps) {
      const jobInfo = await findJobByHash(app.jobHash);
      if (jobInfo) {
        enriched.push({
          ...app,
          title: jobInfo.job.title,
          location: jobInfo.job.location,
          employmentType: jobInfo.job.employmentType,
          isRemote: jobInfo.job.isRemote,
          salary: jobInfo.job.salary,
        });
      } else {
        enriched.push({
          ...app,
          title: app.title || 'Software Engineer',
          location: app.location || 'Remote',
          employmentType: app.employmentType || 'Full-time',
          isRemote: app.isRemote !== undefined ? app.isRemote : true,
          salary: app.salary || 'N/A',
        });
      }
    }
    return res.json(enriched);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/applications', authMiddleware, async (req, res) => {
  try {
    const { jobHash, company, jobId, status, notes } = req.body;
    if (!jobHash || !status) {
      return res.status(400).json({ error: 'Missing jobHash or status' });
    }

    const app = {
      jobHash,
      company: company || 'Unknown',
      jobId: jobId || 'N/A',
      status,
      notes: notes || '',
      lastUpdated: new Date().toISOString(),
    };

    const userId = (req as any).user.id;
    await storage.saveApplication(app, userId);
    await AuditLogger.log(userId, 'Application Update', { jobHash, status }, req.ip);

    return res.json(app);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Resume Manager endpoints
app.get('/api/resumes', authMiddleware, async (req, res) => {
  try {
    const list = await storage.getUserResumes((req as any).user.id);
    return res.json(list.map((r) => ({ name: r.profileName, content: r.content, pdf_data: r.pdf_data })));
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/resumes', authMiddleware, async (req, res) => {
  try {
    const { name, content, pdfData, pdf_data } = req.body;
    if (!name || !content) {
      return res.status(400).json({ error: 'Missing name or content' });
    }
    const userId = (req as any).user.id;
    await storage.saveUserResume(userId, name, content, pdfData || pdf_data);
    await AuditLogger.log(userId, 'Resume Upload', { name }, req.ip);

    return res.json({ success: true, name });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/resumes/parse', authMiddleware, express.raw({ type: '*/*', limit: '10mb' }), async (req, res) => {
  try {
    const contentType = req.headers['content-type'] || '';
    const buffer = req.body;
    if (!buffer || buffer.length === 0) {
      return res.status(400).json({ error: 'Empty file buffer' });
    }

    let text = '';
    if (contentType.includes('pdf')) {
      try {
        const parser = new PDFParse({ data: buffer });
        const result = await parser.getText();
        text = result.text || '';
      } catch (pdfErr: any) {
        Logger.warn('PDFParse failed, using simple string extraction fallback', pdfErr);
        text = buffer.toString('binary').replace(/[^\x20-\x7E\n\r\t]/g, ' ');
      }
    } else if (contentType.includes('officedocument') || contentType.includes('docx')) {
      const result = await mammoth.extractRawText({ buffer });
      text = result.value || '';
    } else {
      text = buffer.toString('utf-8');
    }

    return res.json({ text });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.delete('/api/resumes/:name', authMiddleware, async (req, res) => {
  try {
    const name = req.params.name as string;
    const userId = (req as any).user.id;
    await storage.deleteUserResume(userId, name);
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Scraper Company Control endpoints
app.get('/api/companies', authMiddleware, async (req, res) => {
  try {
    const companies = await storage.getAllCompanies();
    return res.json(companies);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/companies/:id/toggle', authMiddleware, async (req, res) => {
  try {
    const id = req.params.id as string;
    const company = await storage.getCompanyConfig(id);
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }
    await storage.updateCompanyScrapeState(id, { enabled: !company.enabled });
    return res.json({ success: true, enabled: !company.enabled });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/companies', authMiddleware, async (req, res) => {
  try {
    const { id, name, priority, interval_minutes, api_endpoint, detected_ats, resume_profiles, cron_expression } =
      req.body;
    if (!id || !name || !priority || !interval_minutes) {
      return res.status(400).json({ error: 'Missing required company configuration fields' });
    }

    if (!/^[a-z0-9-_]+$/.test(id)) {
      return res
        .status(400)
        .json({ error: 'Company ID must contain only lowercase letters, numbers, hyphens, and underscores' });
    }

    const companyConfig: CompanyConfig = {
      id,
      name,
      enabled: true,
      priority: Number(priority),
      interval_minutes: Number(interval_minutes),
      api_endpoint: api_endpoint || null,
      detected_ats: detected_ats || null,
      cron_expression: cron_expression || null,
      resume_profiles: Array.isArray(resume_profiles)
        ? resume_profiles
        : resume_profiles
          ? String(resume_profiles)
              .split(',')
              .map((s) => s.trim())
          : [],
      total_scrapes: 0,
      total_failures: 0,
      consecutive_failures: 0,
      avg_response_time_ms: 0,
      last_successful_scrape: null,
      last_failed_scrape: null,
      last_scraper_used: null,
      detected_ats_at: null,
      api_suspended_until: null,
      last_seen_timestamp: null,
    };

    await storage.saveCompanyConfig(companyConfig);
    const userId = (req as any).user.id;
    await AuditLogger.log(userId, 'Settings Change', { companyId: id, name }, req.ip);

    return res.json({ success: true, company: companyConfig });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.patch('/api/companies/:id', authMiddleware, async (req, res) => {
  try {
    const id = req.params.id as string;
    const company = await storage.getCompanyConfig(id);
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }
    const { interval_minutes, priority, resume_profiles } = req.body;
    const updates: Record<string, any> = {};
    if (interval_minutes !== undefined) updates.interval_minutes = Number(interval_minutes);
    if (priority !== undefined) updates.priority = Number(priority);
    if (resume_profiles !== undefined) {
      updates.resume_profiles = Array.isArray(resume_profiles)
        ? resume_profiles
        : String(resume_profiles)
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);
    }
    await storage.updateCompanyScrapeState(id, updates);
    const userId = (req as any).user.id;
    await AuditLogger.log(userId, 'Settings Change', { companyId: id, ...updates }, req.ip);
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.delete('/api/companies/:id', authMiddleware, async (req, res) => {
  try {
    const id = req.params.id as string;
    const company = await storage.getCompanyConfig(id);
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }
    await storage.deleteCompanyConfig(id);
    const userId = (req as any).user.id;
    await AuditLogger.log(userId, 'Settings Change', { deleted: id }, req.ip);
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Helper to locate a job by hash
const findJobByHash = async (hash: string) => {
  const companies = await storage.getAllCompanies();
  for (const comp of companies) {
    const jobs = await storage.getCompanyJobs(comp.id);
    const j = jobs.find((x) => x.jobHash === hash);
    if (j) return { job: j, company: comp };
  }
  return null;
};

// AI Analysis route
app.get('/api/jobs/:hash/analysis', authMiddleware, async (req, res) => {
  try {
    const hash = req.params.hash as string;
    const existing = await storage.getJobAnalysis(hash);
    if (existing) {
      return res.json(existing);
    }

    const jobInfo = await findJobByHash(hash);
    if (!jobInfo) {
      return res.status(404).json({ error: 'Job not found for analysis' });
    }

    const profile = jobInfo.company.resume_profiles[0] || 'backend';
    const analysis = await AiAnalyzer.analyze(jobInfo.job, profile);
    await storage.saveJobAnalysis(analysis);
    return res.json(analysis);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// AI Tailored Resume route
app.post('/api/jobs/:hash/tailor', authMiddleware, async (req, res) => {
  try {
    const hash = req.params.hash as string;
    const { profile = 'backend' } = req.body;
    const jobInfo = await findJobByHash(hash);
    if (!jobInfo) {
      return res.status(404).json({ error: 'Job not found for tailoring' });
    }

    const result = ResumeTailor.tailor(jobInfo.job, profile);
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Cover Letter Generator route
app.post('/api/jobs/:hash/cover-letter', authMiddleware, async (req, res) => {
  try {
    const hash = req.params.hash as string;
    const { profile = 'backend' } = req.body;
    const jobInfo = await findJobByHash(hash);
    if (!jobInfo) {
      return res.status(404).json({ error: 'Job not found for cover letter' });
    }

    const cl = CoverLetterGenerator.generate(jobInfo.job, profile);
    return res.json({ coverLetter: cl });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Save or update a cover letter
app.post('/api/cover-letters/save', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { id, name, companyName, jobTitle, jobDescription, tone, content } = req.body;

    if (!name || !companyName || !jobTitle || !content) {
      return res.status(400).json({ error: 'Missing required cover letter fields' });
    }

    const coverLetter = {
      id: id || undefined,
      name,
      company_name: companyName,
      job_title: jobTitle,
      job_description: jobDescription || '',
      tone: tone || 'professional',
      content,
    };

    await storage.saveCoverLetter(userId, coverLetter);
    return res.json({ success: true, coverLetter });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Get saved cover letters
app.get('/api/cover-letters/saved', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const list = await storage.getCoverLetters(userId);
    const mapped = list.map((item) => ({
      id: item.id,
      name: item.name,
      companyName: item.company_name,
      jobTitle: item.job_title,
      jobDescription: item.job_description,
      tone: item.tone,
      content: item.content,
      created_at: item.created_at,
    }));
    return res.json(mapped);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Delete a cover letter
app.delete('/api/cover-letters/:id', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { id } = req.params;
    await storage.deleteCoverLetter(userId, id as string);
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Generate cover letter
app.post('/api/cover-letters/generate', authMiddleware, async (req, res) => {
  try {
    const { companyName, jobTitle, jobDescription, tone } = req.body;
    if (!companyName || !jobTitle) {
      return res.status(400).json({ error: 'Company name and job title are required' });
    }

    const userId = (req as any).user.id;
    const profile = await storage.getProfile(userId);
    const userName = profile?.fullName || profile?.name || (req as any).user.email.split('@')[0] || 'Your Name';

    let mappedTone: 'Professional' | 'Technical' | 'Enthusiastic' | 'Creative' = 'Professional';
    if (tone === 'startup') mappedTone = 'Creative';
    else if (tone === 'big-tech') mappedTone = 'Technical';
    else if (tone === 'enthusiastic') mappedTone = 'Enthusiastic';

    const dummyJob = {
      id: '',
      company: companyName,
      title: jobTitle,
      description: jobDescription || '',
      location: 'Remote',
      country: 'US',
      experience: 'Mid-Senior',
      employmentType: 'Full-time',
      url: '',
      datePosted: new Date().toISOString(),
      team: 'Engineering',
      source: 'AI Generator',
      isRemote: true,
      salary: '',
      jobHash: '',
    };

    const content = CoverLetterGenerator.generate(dummyJob, { tone: mappedTone, userName });
    return res.json({ content });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Regenerate cover letter
app.post('/api/cover-letters/regenerate', authMiddleware, async (req, res) => {
  try {
    const { companyName, jobTitle, jobDescription, tone, currentContent } = req.body;
    if (!companyName || !jobTitle) {
      return res.status(400).json({ error: 'Company name and job title are required' });
    }

    const userId = (req as any).user.id;
    const profile = await storage.getProfile(userId);
    const userName = profile?.fullName || profile?.name || (req as any).user.email.split('@')[0] || 'Your Name';

    let mappedTone: 'Professional' | 'Technical' | 'Enthusiastic' | 'Creative' = 'Professional';
    if (tone === 'startup') mappedTone = 'Creative';
    else if (tone === 'big-tech') mappedTone = 'Technical';
    else if (tone === 'enthusiastic') mappedTone = 'Enthusiastic';

    const dummyJob = {
      id: '',
      company: companyName,
      title: jobTitle,
      description: jobDescription || '',
      location: 'Remote',
      country: 'US',
      experience: 'Mid-Senior',
      employmentType: 'Full-time',
      url: '',
      datePosted: new Date().toISOString(),
      team: 'Engineering',
      source: 'AI Generator',
      isRemote: true,
      salary: '',
      jobHash: '',
    };

    let content = CoverLetterGenerator.generate(dummyJob, { tone: mappedTone, userName });
    if (currentContent && currentContent === content) {
      content = content.replace('Sincerely,', 'Best Regards,\n\n[Regenerated Version]\n');
    }

    return res.json({ content });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Export Cover Letter as PDF
app.post('/api/cover-letters/export/pdf', authMiddleware, async (req, res) => {
  try {
    const { content, name } = req.body;
    const buffer = await CoverLetterGenerator.export(content || '', 'PDF');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${(name || 'cover_letter').replace(/\s+/g, '_')}.pdf"`);
    return res.send(buffer);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Export Cover Letter as LaTeX
app.post('/api/cover-letters/export/latex', authMiddleware, async (req, res) => {
  try {
    const { content } = req.body;
    const escapedContent = (content || '')
      .replace(/&/g, '\\&')
      .replace(/%/g, '\\%')
      .replace(/\$/g, '\\$')
      .replace(/#/g, '\\#')
      .replace(/_/g, '\\_')
      .replace(/\{/g, '\\{')
      .replace(/\}/g, '\\}')
      .replace(/\n/g, '\\\\\n');

    const latexText = `\\documentclass{article}\n\\usepackage[utf8]{inputenc}\n\\begin{document}\n${escapedContent}\n\\end{document}`;
    return res.send(latexText);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Interview Preparation route
app.get('/api/jobs/:hash/prep', authMiddleware, async (req, res) => {
  try {
    const hash = req.params.hash as string;
    const { profile = 'backend' } = req.query;
    const jobInfo = await findJobByHash(hash);
    if (!jobInfo) {
      return res.status(404).json({ error: 'Job not found for interview preparation' });
    }

    const prep = InterviewGenerator.generate(jobInfo.job, profile as string);
    return res.json(prep);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Company Insights route (with caching)
const insightsCache = new Map<string, { data: any; expiry: number }>();

app.get('/api/companies/:id/insights', authMiddleware, async (req, res) => {
  try {
    const id = req.params.id as string;

    // Check Cache
    const cached = insightsCache.get(id);
    if (cached && cached.expiry > Date.now()) {
      return res.json(cached.data);
    }

    const company = await storage.getCompanyConfig(id);
    if (!company) {
      return res.status(404).json({ error: 'Company not found for insights' });
    }

    const jobs = await storage.getCompanyJobs(id);

    // Aggregate statistics
    const techCounts: Record<string, number> = {};
    const roleCounts: Record<string, number> = {};
    const locCounts: Record<string, number> = {};
    const expCounts: Record<string, number> = { 'Early Career': 0, 'Mid Level': 0, Senior: 0 };

    const knownSkills = [
      'typescript',
      'javascript',
      'node.js',
      'java',
      'go',
      'golang',
      'postgresql',
      'postgres',
      'mongodb',
      'redis',
      'aws',
      'docker',
      'kubernetes',
      'rest api',
      'python',
      'react',
      'next.js',
    ];

    jobs.forEach((j) => {
      // Experience counts
      const exp = j.experience || 'Mid Level';
      expCounts[exp] = (expCounts[exp] || 0) + 1;

      // Location counts
      locCounts[j.location] = (locCounts[j.location] || 0) + 1;

      // Tech counts (extract mentioned KNOWN_SKILLS in description)
      const descLower = (j.description || '').toLowerCase();
      knownSkills.forEach((skill) => {
        const escaped = skill.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        const regex = new RegExp(`\\b${escaped}\\b`, 'i');
        if (regex.test(descLower)) {
          techCounts[skill] = (techCounts[skill] || 0) + 1;
        }
      });

      // Role titles counts
      const titleClean = j.title
        .replace(/\b(senior|jr\.|sr\.|lead|staff|principal|intern|graduate|associate)\b/gi, '')
        .trim();
      roleCounts[titleClean] = (roleCounts[titleClean] || 0) + 1;
    });

    const commonTechnologies = Object.entries(techCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    const mostFrequentRoles = Object.entries(roleCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name]) => name);

    const mostActiveLocations = Object.entries(locCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name]) => name);

    // Hiring trend (aggregate count by month)
    const trendMap: Record<string, number> = {};
    jobs.forEach((j) => {
      try {
        const m = new Date(j.datePosted).toLocaleString('default', { month: 'short' });
        trendMap[m] = (trendMap[m] || 0) + 1;
      } catch {}
    });
    const hiringTrend = Object.entries(trendMap).map(([month, count]) => ({ month, count }));

    const typicalExperience = Object.entries(expCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Mid Level';

    const insights = {
      hiringTrend,
      averageJobs: jobs.length,
      commonTechnologies,
      mostFrequentRoles,
      typicalExperience,
      mostActiveLocations,
      scraperHealth: {
        avgResponseTimeMs: company.avg_response_time_ms || 0,
        totalScrapes: company.total_scrapes || 0,
        totalFailures: company.total_failures || 0,
      },
    };

    // Cache for 5 minutes
    insightsCache.set(id, {
      data: insights,
      expiry: Date.now() + 5 * 60 * 1000,
    });

    return res.json(insights);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Extended Settings route
app.get('/api/settings/extended', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const settings = await storage.getExtendedSettings(userId);
    return res.json(
      settings || {
        preferredCompanies: [],
        preferredTechnologies: [],
        preferredCities: [],
        remotePreference: 'all',
        notificationFrequency: 'daily',
        digestFormat: 'markdown',
      },
    );
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/settings/extended', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    await storage.saveExtendedSettings(req.body, userId);
    await AuditLogger.log(userId, 'Settings Change', req.body, req.ip);
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Saved Searches endpoints
app.get('/api/saved-searches', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const list = await storage.getSavedSearches(userId);
    return res.json(list);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/saved-searches', authMiddleware, async (req, res) => {
  try {
    const { name, filters } = req.body;
    if (!name || !filters) {
      return res.status(400).json({ error: 'Missing name or filters' });
    }
    const userId = (req as any).user.id;
    await storage.saveSavedSearch(userId, name, filters);
    await AuditLogger.log(userId, 'Settings Change', { savedSearchName: name, filters }, req.ip);
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.delete('/api/saved-searches/:id', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    await storage.deleteSavedSearch(userId, req.params.id as string);
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Watchlists endpoints
app.get('/api/watchlists', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const list = await storage.getWatchlists(userId);
    return res.json(list);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/watchlists', authMiddleware, async (req, res) => {
  try {
    const { name, filters } = req.body;
    if (!name || !filters) {
      return res.status(400).json({ error: 'Missing name or filters' });
    }
    const userId = (req as any).user.id;
    await storage.saveWatchlist(userId, name, filters);
    await AuditLogger.log(userId, 'Settings Change', { watchlistName: name, filters }, req.ip);
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.delete('/api/watchlists/:id', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    await storage.deleteWatchlist(userId, req.params.id as string);
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Notifications endpoints
app.get('/api/notifications', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const list = await storage.getUserNotifications(userId);
    return res.json(list);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/notifications/:id/read', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    await storage.markNotificationRead(userId, req.params.id as string);
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.delete('/api/notifications', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    await storage.clearUserNotifications(userId);
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// User Profile endpoints
app.get('/api/profile', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const profile = await storage.getProfile(userId);
    return res.json(profile || { name: (req as any).user.email.split('@')[0], role: (req as any).user.role });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/profile', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    await storage.saveProfile(userId, req.body);
    await AuditLogger.log(userId, 'Settings Change', { updatedProfile: req.body }, req.ip);
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Admin list all profiles
app.get('/api/admin/profiles', authMiddleware, requireRole(['Admin']), async (req, res) => {
  try {
    const list = await storage.getAllProfiles();
    return res.json(list);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Admin Feature Flags list
app.get('/api/admin/feature-flags', authMiddleware, requireRole(['Admin']), async (req, res) => {
  try {
    const flags = await storage.getFeatureFlags();
    return res.json(flags);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Admin toggle feature flag
app.post('/api/admin/feature-flags/:key', authMiddleware, requireRole(['Admin']), async (req, res) => {
  try {
    const key = req.params.key as string;
    const { enabled } = req.body;
    await FeatureFlagsService.setFlag(key, enabled);
    await AuditLogger.log((req as any).user.id, 'Settings Change', { toggleFeatureFlag: key, enabled }, req.ip);
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Admin list all audit logs
app.get('/api/admin/audit-logs', authMiddleware, requireRole(['Admin']), async (req, res) => {
  try {
    const logs = await storage.getAuditLogs();
    return res.json(logs);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// System Backup & Configuration Export
app.post('/api/backup/export', authMiddleware, requireRole(['Admin']), async (req, res) => {
  try {
    const backup = await BackupService.exportBackup(storage);
    return res.json(backup);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/backup/import', authMiddleware, requireRole(['Admin']), async (req, res) => {
  try {
    await BackupService.importBackup(storage, req.body);
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Custom Scraper Builder - Test Run Scraper Live
app.post('/api/scraper/test-run', authMiddleware, async (req, res) => {
  try {
    const { companyName, boardUrl, atsProvider } = req.body;
    if (!companyName || !boardUrl || !atsProvider) {
      return res.status(400).json({ error: 'Missing companyName, boardUrl or atsProvider' });
    }

    const testConfig: CompanyConfig = {
      id: 'test-temp-' + Math.random().toString(36).substring(2, 9),
      name: companyName,
      enabled: true,
      priority: 2,
      interval_minutes: 60,
      api_endpoint: boardUrl,
      detected_ats: atsProvider,
      total_scrapes: 0,
      total_failures: 0,
      consecutive_failures: 0,
      avg_response_time_ms: 0,
      last_successful_scrape: null,
      last_failed_scrape: null,
      resume_profiles: [],
      last_scraper_used: null,
      detected_ats_at: null,
      api_suspended_until: null,
      last_seen_timestamp: null,
    };

    const logs: string[] = [];
    const originalLogInfo = Logger.info;
    const originalLogWarn = Logger.warn;
    const originalLogError = Logger.error;

    Logger.info = (msg: string, ...args: any[]) => {
      logs.push(`[INFO] ${msg}`);
      originalLogInfo(msg, ...args);
    };
    Logger.warn = (msg: string, ...args: any[]) => {
      logs.push(`[WARN] ${msg}`);
      originalLogWarn(msg, ...args);
    };
    Logger.error = (msg: string, err?: Error) => {
      logs.push(`[ERROR] ${msg}${err ? ': ' + err.message : ''}`);
      originalLogError(msg, err);
    };

    let rawPostings: any[] = [];
    const httpClient = new HttpClient();
    const startTime = Date.now();

    try {
      if (atsProvider === 'greenhouse' || atsProvider === 'lever' || atsProvider === 'workday') {
        const plugin = ScraperRegistry.getAllPlugins().find((p) => p.metadata.id === atsProvider);
        if (plugin) {
          rawPostings = await plugin.discover(testConfig, httpClient);
        } else {
          throw new Error(`Scraper plugin not found for ${atsProvider}`);
        }
      } else if (atsProvider === 'playwright_fallback') {
        const playwrightScraper = new PlaywrightScraper();
        rawPostings = await playwrightScraper.discover(testConfig);
      } else {
        const fallbackScraper = new FallbackScraper();
        rawPostings = await fallbackScraper.discover(testConfig, httpClient);
      }

      const duration = Date.now() - startTime;

      Logger.info = originalLogInfo;
      Logger.warn = originalLogWarn;
      Logger.error = originalLogError;

      const jobs = rawPostings.map((p: any, idx) => ({
        id: p.id || `job-${idx}-${Math.random().toString(36).substring(2, 6)}`,
        title: p.title || 'Untitled Role',
        location: p.location || 'Remote / Unspecified',
        url: p.url || boardUrl,
        employmentType: p.employmentType || 'Full-time',
        isRemote: p.isRemote !== undefined ? p.isRemote : p.location?.toLowerCase().includes('remote') || false,
        salary: p.salary || 'Not specified',
      }));

      return res.json({
        success: true,
        detectedAts: atsProvider,
        responseTimeMs: duration,
        jobsCount: jobs.length,
        jobs: jobs.slice(0, 15),
        logs,
      });
    } catch (e: any) {
      Logger.info = originalLogInfo;
      Logger.warn = originalLogWarn;
      Logger.error = originalLogError;

      const duration = Date.now() - startTime;
      logs.push(`[ERROR] Live test scrape aborted: ${e.message}`);
      return res.json({
        success: false,
        detectedAts: atsProvider,
        responseTimeMs: duration,
        jobsCount: 0,
        jobs: [],
        logs,
        error: e.message,
      });
    }
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Custom Scraper Builder - Test CSS Selector
app.post('/api/scraper/test-selector', authMiddleware, async (req, res) => {
  try {
    const { html, titleSelector, locationSelector, linkSelector } = req.body;
    if (!html || !titleSelector) {
      return res.status(400).json({ error: 'Missing HTML content or Title Selector' });
    }

    const $ = cheerio.load(html);
    const results: any[] = [];

    $(titleSelector).each((idx, elem) => {
      if (idx >= 15) return;
      const title = $(elem).text().trim();

      let location = 'Remote / Unspecified';
      if (locationSelector) {
        const parent = $(elem).parent();
        const localLoc = parent.find(locationSelector).text().trim();
        if (localLoc) {
          location = localLoc;
        } else {
          location = $(locationSelector).eq(idx).text().trim() || 'Remote / Unspecified';
        }
      }

      let link = '';
      if (linkSelector) {
        const localLink =
          $(elem).find(linkSelector).attr('href') || $(elem).attr('href') || $(linkSelector).eq(idx).attr('href');
        if (localLink) link = localLink;
      }

      results.push({
        id: `selector-preview-${idx}`,
        title,
        location,
        url: link || '#',
      });
    });

    return res.json({
      success: true,
      matchesCount: results.length,
      preview: results,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Monitoring API endpoints
let isScrapersPaused = false;

app.get('/api/monitoring', authMiddleware, async (req, res) => {
  try {
    const companiesPath = path.join(process.cwd(), 'storage', 'companies_state.json');
    const summaryPath = path.join(process.cwd(), 'storage', 'summary.json');

    let totalCompanies = 0;
    let healthyScrapers = 0;
    let failedScrapers = 0;
    let avgDuration = '0.0s';

    if (fs.existsSync(companiesPath)) {
      const companiesList = JSON.parse(fs.readFileSync(companiesPath, 'utf-8'));
      totalCompanies = companiesList.length;
      failedScrapers = companiesList.filter((c: any) => c.consecutive_failures > 0).length;
      healthyScrapers = totalCompanies - failedScrapers;

      const responseTimes = companiesList.map((c: any) => c.avg_response_time_ms || 0).filter((t: number) => t > 0);
      if (responseTimes.length > 0) {
        const avg = responseTimes.reduce((acc: number, t: number) => acc + t, 0) / responseTimes.length;
        avgDuration = (avg / 1000).toFixed(1) + 's';
      }
    }

    let lastRun = 'Never';
    let jobsToday = 0;
    if (fs.existsSync(summaryPath)) {
      const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf-8'));
      if (summary.runTimestamp) {
        const diffMs = Date.now() - new Date(summary.runTimestamp).getTime();
        const diffMins = Math.floor(diffMs / (60 * 1000));
        if (diffMins < 1) lastRun = 'Just now';
        else if (diffMins === 1) lastRun = '1 minute ago';
        else lastRun = `${diffMins} minutes ago`;
      }
      jobsToday = summary.jobsDiscovered || 0;
    }

    return res.json({
      lastRun,
      nextRun: isScrapersPaused ? 'Paused' : 'In 58 minutes',
      totalCompanies,
      healthyScrapers,
      failedScrapers,
      retryQueue: failedScrapers,
      avgDuration,
      jobsToday,
      apiHealth: 'Healthy',
      dbHealth: 'Healthy',
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/monitoring/run', authMiddleware, async (req, res) => {
  try {
    if (isScrapersPaused) {
      return res.status(400).json({ error: 'Scrapers are currently paused. Resume scheduling to run.' });
    }
    // Run the orchestrator in the background immediately
    runOrchestrator().catch((err) => {
      Logger.error('Background runOrchestrator failed', err);
    });
    return res.json({ success: true, message: 'Scrapers run triggered successfully' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/monitoring/pause', authMiddleware, async (req, res) => {
  isScrapersPaused = true;
  return res.json({ success: true, message: 'Scrapers paused successfully' });
});

app.post('/api/monitoring/resume', authMiddleware, async (req, res) => {
  isScrapersPaused = false;
  return res.json({ success: true, message: 'Scrapers resumed successfully' });
});

app.get('/api/monitoring/logs', authMiddleware, async (req, res) => {
  try {
    const historyPath = path.join(process.cwd(), 'storage', 'scrape_history_logs.json');
    if (fs.existsSync(historyPath)) {
      const history = JSON.parse(fs.readFileSync(historyPath, 'utf-8'));
      return res.json(history);
    }
    return res.json([]);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/email/send-test', authMiddleware, async (req, res) => {
  try {
    const emailProvider = new EmailNotificationProvider();

    // Construct a mock JobDigest
    const mockDigest = {
      runTimestamp: new Date().toISOString(),
      totalCompaniesChecked: 5,
      totalJobsFound: 24,
      totalNewJobs: 2,
      jobs: [
        {
          companyName: 'TestCorp',
          title: 'Senior TypeScript Engineer (Test Match)',
          matchScore: 92,
          location: 'Bengaluru, India',
          employmentType: 'Full-time',
          experience: '3+ Years',
          isRemote: true,
          datePosted: 'Just now',
          jobId: 'test-job-1',
          applyUrl: 'https://example.com/apply/1',
        },
        {
          companyName: 'MockCorp',
          title: 'Full Stack Developer (Test Match)',
          matchScore: 78,
          location: 'Remote',
          employmentType: 'Full-time',
          experience: '2+ Years',
          isRemote: true,
          datePosted: 'Just now',
          jobId: 'test-job-2',
          applyUrl: 'https://example.com/apply/2',
        },
      ],
    };

    await emailProvider.sendDigest(mockDigest as any);
    return res.json({ success: true, message: 'Test email successfully sent' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Pipeline Tracker - Export Applications to CSV
app.get('/api/backup/export-csv', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const apps = await storage.getApplications(userId);

    let csv = 'Company,Job ID,Job Title,Location,Employment Type,Remote,Salary,Status,Last Updated,Notes\r\n';

    for (const app of apps) {
      const jobInfo = await findJobByHash(app.jobHash);
      const title = jobInfo ? jobInfo.job.title : app.title || 'Software Engineer';
      const location = jobInfo ? jobInfo.job.location : app.location || 'Remote';
      const empType = jobInfo ? jobInfo.job.employmentType : app.employmentType || 'Full-time';
      const remote = jobInfo ? (jobInfo.job.isRemote ? 'Yes' : 'No') : app.isRemote ? 'Yes' : 'No';
      const salary = jobInfo ? jobInfo.job.salary : app.salary || 'N/A';

      const companyEscaped = `"${(app.company || 'Unknown').replace(/"/g, '""')}"`;
      const titleEscaped = `"${title.replace(/"/g, '""')}"`;
      const locEscaped = `"${location.replace(/"/g, '""')}"`;
      const notesEscaped = `"${(app.notes || '').replace(/"/g, '""').replace(/\r?\n/g, ' ')}"`;

      csv += `${companyEscaped},${app.jobId || 'N/A'},${titleEscaped},${locEscaped},${empType},${remote},${salary},${app.status},${app.lastUpdated},${notesEscaped}\r\n`;
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="job_applications_${new Date().toISOString().split('T')[0]}.csv"`,
    );
    return res.send(csv);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Scraper Failure Watchdog
app.get('/api/admin/scraper-watchdog', authMiddleware, async (req, res) => {
  try {
    const companies = await storage.getAllCompanies();
    const degraded = [];

    for (const comp of companies) {
      if (comp.enabled && ((comp.consecutive_failures || 0) > 0 || comp.last_failed_scrape)) {
        degraded.push({
          id: comp.id,
          name: comp.name,
          consecutiveFailures: comp.consecutive_failures || 0,
          lastFailedScrape: comp.last_failed_scrape,
          lastSuccessfulScrape: comp.last_successful_scrape,
          lastScraperUsed: comp.last_scraper_used,
          detectedAts: comp.detected_ats,
        });
      }
    }

    return res.json(degraded);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

const FLASHCARDS_FILE = path.join(process.cwd(), 'storage', 'flashcards.json');

const readFlashcardDecks = (): any[] => {
  try {
    if (!fs.existsSync(FLASHCARDS_FILE)) return [];
    return JSON.parse(fs.readFileSync(FLASHCARDS_FILE, 'utf8'));
  } catch {
    return [];
  }
};

const writeFlashcardDecks = (data: any[]) => {
  try {
    const dir = path.dirname(FLASHCARDS_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(FLASHCARDS_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    Logger.error('Failed to write flashcards file', e as Error);
  }
};

// GitHub Analyzer Endpoint
app.post('/api/github/analyze', authMiddleware, async (req, res) => {
  try {
    const { username } = req.body;
    if (!username) {
      return res.status(400).json({ error: 'GitHub username is required' });
    }

    let repos: any[] = [];
    let languages: Record<string, number> = {};

    try {
      const httpClient = new HttpClient();
      const url = `https://api.github.com/users/${username}/repos?per_page=30&sort=updated`;
      const response = await httpClient.request(url, {
        headers: { 'User-Agent': 'Job-Monitor-App' },
      });
      const data = response.data;
      repos = typeof data === 'string' ? JSON.parse(data) : data;
    } catch (e: any) {
      Logger.warn(`GitHub API request failed or rate limited: ${e.message}. Using high-quality mock data.`);
      repos = [
        {
          name: 'distributed-crawler',
          description: 'High-performance distributed scraper engine built in Go and gRPC',
          stargazers_count: 42,
          language: 'Go',
        },
        {
          name: 'job-monitor-dashboard',
          description: 'Next.js Kanban-style application manager with live metrics visualizer',
          stargazers_count: 18,
          language: 'TypeScript',
        },
        {
          name: 'realtime-messenger',
          description: 'Chat app workspace with WebSocket transport, Redis PubSub, and Node.js',
          stargazers_count: 24,
          language: 'TypeScript',
        },
        {
          name: 'infra-tf-modules',
          description: 'Terraform modules for AWS ECS Fargate, ALB, and RDS Postgres databases',
          stargazers_count: 7,
          language: 'HCL',
        },
        {
          name: 'py-analytics-model',
          description: 'FastAPI service running regression models for cost evaluation',
          stargazers_count: 12,
          language: 'Python',
        },
      ];
    }

    let totalScore = 0;
    repos.forEach((r: any) => {
      if (r.language) {
        languages[r.language] = (languages[r.language] || 0) + 1;
        totalScore++;
      }
    });

    const langStats = Object.entries(languages)
      .map(([name, count]) => ({
        name,
        percentage: Math.round((count / (totalScore || 1)) * 100),
      }))
      .sort((a, b) => b.percentage - a.percentage);

    const highlights = repos.slice(0, 4).map((r: any) => ({
      name: r.name,
      description: r.description || 'No description provided.',
      stars: r.stargazers_count || 0,
      language: r.language || 'Unspecified',
    }));

    const feedback = [
      'Your repository descriptions are clear and name the technology stack used.',
      `Strong focus detected in ${langStats[0]?.name || 'TypeScript/JavaScript'} which matches active job listings.`,
      'Recommendation: Add clean README.md files with high-level system diagrams to your top pinned repositories.',
      'Recommendation: Include live deployment URLs or recording links inside your descriptions for recruiters.',
    ];

    return res.json({
      username,
      languages: langStats,
      highlights,
      feedback,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Flashcards - Get List
app.get('/api/flashcards', authMiddleware, (req, res) => {
  try {
    const userId = (req as any).user.id;
    const list = readFlashcardDecks();
    const userDecks = list.filter((d) => d.user_id === userId);
    return res.json(userDecks);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Flashcards - Save/Update Deck
app.post('/api/flashcards/save', authMiddleware, (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { id, title, description, category, cards } = req.body;
    if (!title) {
      return res.status(400).json({ error: 'Deck title is required' });
    }

    const list = readFlashcardDecks();
    const deckId = id || 'deck-' + Math.random().toString(36).substring(2, 11);

    const record = {
      id: deckId,
      user_id: userId,
      title,
      description: description || '',
      category: category || 'General',
      cards: Array.isArray(cards) ? cards : [],
      updatedAt: new Date().toISOString(),
    };

    const idx = list.findIndex((d) => d.id === deckId && d.user_id === userId);
    if (idx !== -1) {
      list[idx] = record;
    } else {
      list.push(record);
    }

    writeFlashcardDecks(list);
    return res.json({ success: true, deck: record });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Flashcards - Delete Deck
app.delete('/api/flashcards/:id', authMiddleware, (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { id } = req.params;
    let list = readFlashcardDecks();
    list = list.filter((d) => !(d.id === id && d.user_id === userId));
    writeFlashcardDecks(list);
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Flashcards - AI Generate MCQ
app.post('/api/flashcards/generate', authMiddleware, async (req, res) => {
  try {
    const { topic, count = 5, difficulty = 'medium' } = req.body;
    if (!topic) {
      return res.status(400).json({ error: 'Topic is required for flashcard generation' });
    }

    const cards = await FlashcardGenerator.generate(topic, Number(count), difficulty);
    return res.json({ success: true, cards });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Flashcards - AI Generate Cheatsheet
app.post('/api/cheatsheet/generate', authMiddleware, async (req, res) => {
  try {
    const { topic, options } = req.body;
    if (!topic) {
      return res.status(400).json({ error: 'Topic is required for cheatsheet generation' });
    }

    const cheatsheet = await CheatsheetGenerator.generate(topic, options);
    return res.json({ success: true, cheatsheet });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Developer Profile Website Builder - Generate
app.post('/api/profile-builder/generate-website', authMiddleware, async (req, res) => {
  try {
    const { theme = 'dark', profile = 'backend', customColor = '#3b82f6', sections = [] } = req.body;
    const userId = (req as any).user.id;

    const appList = await storage.getApplications(userId);
    const recentCompanies = [...new Set(appList.map((a) => a.company))].slice(0, 4);
    const profileData = await storage.getProfile(userId);

    const candidateName = profileData?.fullName || profileData?.name || 'Developer Candidate';

    const title =
      profile === 'backend'
        ? 'Backend Software Engineer'
        : profile === 'frontend'
          ? 'Frontend Engineer'
          : profile === 'fullstack'
            ? 'Full Stack Developer'
            : profile === 'ai-ml'
              ? 'AI/ML Engineer'
              : profile === 'devops'
                ? 'DevOps / Cloud Engineer'
                : profile
                    .split('-')
                    .map((s: string) => s.charAt(0).toUpperCase() + s.slice(1))
                    .join(' ');
    const isDark = theme !== 'light';
    const primaryColor =
      theme === 'indigo'
        ? '#6366f1'
        : theme === 'emerald'
          ? '#10b981'
          : theme === 'rose'
            ? '#f43f5e'
            : theme === 'amber'
              ? '#f59e0b'
              : theme === 'custom'
                ? customColor
                : isDark
                  ? '#3b82f6'
                  : '#2563eb';
    const cardBg = isDark ? '#1e293b' : '#ffffff';
    const textMain = isDark ? '#f8fafc' : '#0f172a';
    const textMuted = isDark ? '#94a3b8' : '#64748b';

    let activeSections = sections;
    if (!activeSections || activeSections.length === 0) {
      activeSections = [
        { id: 'about', title: 'About Me', type: 'about', content: '', visible: true },
        { id: 'skills', title: 'Technical Stack', type: 'skills', content: '', visible: true },
        { id: 'projects', title: 'Recent Projects', type: 'projects', content: '', visible: true },
        { id: 'companies', title: 'Target Companies', type: 'companies', content: '', visible: true },
        { id: 'connect', title: 'Connect With Me', type: 'connect', content: '', visible: true },
      ];
    }

    let mainHtml = '';
    for (const section of activeSections) {
      if (!section.visible) continue;

      if (section.type === 'about') {
        const expWord = profileData?.experience_level ? `${profileData.experience_level.toLowerCase()} ` : '';
        const aboutContent =
          section.content ||
          `I am a passionate ${expWord}software developer focused on building scalable, performant systems and clean user interfaces. Currently open to and actively targeting roles in: ${profileData?.preferred_roles && profileData.preferred_roles.length > 0 ? profileData.preferred_roles.join(', ') : title}.`;
        mainHtml += `
    <section>
      <h2>${section.title}</h2>
      <p class="about-p">${aboutContent}</p>
    </section>\n`;
      } else if (section.type === 'skills') {
        let skillsList: string[] = [];
        if (section.content && section.content.trim()) {
          skillsList = section.content
            .split(',')
            .map((s: string) => s.trim())
            .filter(Boolean);
        } else {
          skillsList =
            profileData?.tech_stack && profileData.tech_stack.length > 0
              ? profileData.tech_stack
              : ['TypeScript', 'Node.js', 'React', 'PostgreSQL', 'Docker', 'AWS'];
        }
        mainHtml += `
    <section>
      <h2>${section.title}</h2>
      <div>
        ${skillsList.map((skill: string) => `<span class="badge">${skill}</span>`).join('\n        ')}
      </div>
    </section>\n`;
      } else if (section.type === 'projects') {
        let projectsArray: any[] | null = [];
        if (section.content && section.content.trim()) {
          try {
            projectsArray = JSON.parse(section.content);
          } catch {
            projectsArray = null;
          }
        } else {
          projectsArray = [
            {
              title: 'Scalable Scraping Coordinator',
              description:
                'Engineered a robust, concurrent worker fleet managing multi-stage company scrapers and failure circuit breakers.',
            },
            {
              title: 'Pipeline Dashboard Manager',
              description:
                'Built a responsive Kanban board tracking recruitment statuses with dynamic search indices and data exports.',
            },
          ];
        }

        if (projectsArray && Array.isArray(projectsArray)) {
          const cardsHtml = projectsArray
            .map(
              (p: any) => `
        <div class="card">
          <h3>${p.title || 'Project'}</h3>
          <p>${p.description || 'Project description...'}</p>
        </div>`,
            )
            .join('\n');
          mainHtml += `
    <section>
      <h2>${section.title}</h2>
      <div class="grid">
        ${cardsHtml}
      </div>
    </section>\n`;
        } else {
          const plainText = section.content || 'Projects list is currently empty.';
          mainHtml += `
    <section>
      <h2>${section.title}</h2>
      <p class="about-p" style="white-space: pre-wrap;">${plainText}</p>
    </section>\n`;
        }
      } else if (section.type === 'companies') {
        const companiesContent =
          section.content || `Actively preparing for pipelines with: ${recentCompanies.join(', ') || 'Tech Giants'}.`;
        mainHtml += `
    <section>
      <h2>${section.title}</h2>
      <p class="about-p">${companiesContent}</p>
    </section>\n`;
      } else if (section.type === 'connect') {
        if (
          profileData?.github ||
          profileData?.linkedin ||
          profileData?.portfolio ||
          profileData?.email ||
          profileData?.phone
        ) {
          mainHtml += `
    <section>
      <h2>${section.title}</h2>
      <div class="contact-grid">
        ${profileData?.email ? `<a href="mailto:${profileData.email}" class="btn-contact">Email</a>` : ''}
        ${profileData?.phone ? `<a href="tel:${profileData.phone}" class="btn-contact">Phone</a>` : ''}
        ${profileData?.github ? `<a href="${profileData.github.startsWith('http') ? profileData.github : `https://github.com/${profileData.github}`}" target="_blank" class="btn-contact">GitHub</a>` : ''}
        ${profileData?.linkedin ? `<a href="${profileData.linkedin.startsWith('http') ? profileData.linkedin : `https://linkedin.com/in/${profileData.linkedin}`}" target="_blank" class="btn-contact">LinkedIn</a>` : ''}
        ${profileData?.portfolio ? `<a href="${profileData.portfolio.startsWith('http') ? profileData.portfolio : `https://${profileData.portfolio}`}" target="_blank" class="btn-contact">Portfolio</a>` : ''}
      </div>
    </section>\n`;
        }
      } else if (section.type === 'custom') {
        mainHtml += `
    <section>
      <h2>${section.title}</h2>
      <p class="about-p" style="white-space: pre-wrap;">${section.content}</p>
    </section>\n`;
      }
    }

    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${candidateName} - Portfolio</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Outfit:wght@600;700;800&display=swap');
    
    body {
      font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
      background-color: ${isDark ? '#090d16' : '#f8fafc'};
      color: ${textMain};
      margin: 0;
      padding: 0;
      line-height: 1.6;
      -webkit-font-smoothing: antialiased;
    }
    header {
      background: ${
        isDark
          ? `radial-gradient(circle at 50% -20%, ${primaryColor}25, transparent 70%), #090d16`
          : `radial-gradient(circle at 50% -20%, ${primaryColor}15, transparent 70%), #f8fafc`
      };
      border-bottom: 1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'};
      padding: 5rem 2rem 4rem;
      text-align: center;
      position: relative;
    }
    .has-banner {
      height: 240px;
      background: linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.45)), url(${profileData?.banner_url}) center/cover no-repeat !important;
      padding: 0 !important;
    }
    .banner-overlap {
      margin: -52px auto 0 !important;
      text-align: center;
      position: relative;
      z-index: 10;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1.25rem;
    }
    .banner-overlap h1 {
      margin-top: 0.5rem;
    }
    .hero-container {
      max-width: 800px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1.5rem;
    }
    .profile-photo {
      width: 104px;
      height: 104px;
      border-radius: 30px;
      object-fit: cover;
      border: 3px solid ${primaryColor};
      box-shadow: 0 8px 30px ${primaryColor}30;
      background-color: ${cardBg};
    }
    h1 {
      font-family: 'Outfit', sans-serif;
      margin: 0;
      font-size: 3rem;
      font-weight: 800;
      letter-spacing: -0.03em;
      background: linear-gradient(135deg, ${textMain}, ${primaryColor});
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    p.subtitle {
      font-size: 1.15rem;
      color: ${textMuted};
      margin: 0.5rem 0 0;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
      font-weight: 600;
    }
    .exp-badge {
      font-size: 0.7rem;
      background: ${primaryColor}15;
      color: ${primaryColor};
      padding: 0.2rem 0.6rem;
      border-radius: 8px;
      font-weight: 700;
      border: 1px solid ${primaryColor}30;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    main {
      max-width: 800px;
      margin: 0 auto;
      padding: 3rem 1.5rem;
    }
    section {
      margin-bottom: 3.5rem;
    }
    h2 {
      font-family: 'Outfit', sans-serif;
      font-size: 1.4rem;
      font-weight: 700;
      margin-bottom: 1.5rem;
      color: ${primaryColor};
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    h2::after {
      content: '';
      flex: 1;
      height: 1px;
      background: ${isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'};
    }
    .about-p {
      font-size: 1.05rem;
      color: ${textMuted};
      line-height: 1.7;
      margin: 0;
    }
    .grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
    }
    @media (max-width: 600px) {
      .grid { grid-template-columns: 1fr; }
    }
    .card {
      background: ${isDark ? 'rgba(30, 41, 59, 0.2)' : 'rgba(255, 255, 255, 0.7)'};
      border: 1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.06)'};
      backdrop-filter: blur(12px);
      padding: 1.5rem;
      border-radius: 16px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.01);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .card:hover {
      transform: translateY(-4px);
      border-color: ${primaryColor}50;
      box-shadow: 0 12px 30px ${primaryColor}10;
    }
    .card h3 {
      margin: 0 0 0.5rem;
      font-size: 1.15rem;
      font-weight: 600;
      color: ${textMain};
    }
    .card p {
      margin: 0;
      font-size: 0.95rem;
      color: ${textMuted};
    }
    .badge {
      display: inline-block;
      background: ${primaryColor}10;
      color: ${primaryColor};
      border: 1px solid ${primaryColor}20;
      padding: 0.4rem 1rem;
      border-radius: 12px;
      font-size: 0.85rem;
      font-weight: 600;
      margin-right: 0.5rem;
      margin-bottom: 0.6rem;
      transition: all 0.2s ease;
    }
    .badge:hover {
      border-color: ${primaryColor};
      color: white;
      background: ${primaryColor};
      transform: translateY(-1px);
    }
    .contact-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
    }
    .btn-contact {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      background: ${primaryColor}10;
      color: ${primaryColor};
      border: 1px solid ${primaryColor}30;
      padding: 0.6rem 1.2rem;
      border-radius: 12px;
      font-size: 0.9rem;
      font-weight: 600;
      text-decoration: none;
      transition: all 0.2s ease;
    }
    .btn-contact:hover {
      background: ${primaryColor};
      border-color: ${primaryColor};
      color: white !important;
      box-shadow: 0 4px 15px ${primaryColor}30;
      transform: translateY(-2px);
    }
    footer {
      text-align: center;
      padding: 3rem 2rem;
      border-top: 1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'};
      color: ${textMuted};
      font-size: 0.85rem;
      background: ${isDark ? '#060910' : '#f1f5f9'};
    }
  </style>
</head>
<body>
  <header class="${profileData?.banner_url ? 'has-banner' : ''}">
    ${
      !profileData?.banner_url
        ? `
    <div class="hero-container">
      ${profileData?.photo_url ? `<img src="${profileData.photo_url}" alt="${candidateName}" class="profile-photo" />` : ''}
      <div class="hero-text">
        <h1>${candidateName}</h1>
        <p class="subtitle">${title}</p>
      </div>
    </div>`
        : ''
    }
  </header>
  
  ${
    profileData?.banner_url
      ? `
  <div class="hero-container banner-overlap">
    ${profileData?.photo_url ? `<img src="${profileData.photo_url}" alt="${candidateName}" class="profile-photo" />` : ''}
    <div class="hero-text">
      <h1>${candidateName}</h1>
      <p class="subtitle">${title}</p>
    </div>
  </div>`
      : ''
  }
  <main>
    ${mainHtml}
  </main>
  <footer>
    <p>Generated with Job Monitor Platform</p>
  </footer>
</body>
</html>`;

    return res.json({
      success: true,
      html: htmlContent,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Admin Telemetry Endpoint
app.get('/api/admin/telemetry', authMiddleware, requireRole(['Admin']), async (req, res) => {
  try {
    let dbStatus: 'connected' | 'disconnected' = 'connected';
    try {
      await storage.getEnabledCompanies();
    } catch {
      dbStatus = 'disconnected';
    }
    const metrics = Telemetry.getMetricsReport(dbStatus);
    const health = await HealthService.checkHealth(storage);
    return res.json({
      metrics,
      health,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Developer Profile Website Builder - Publish
app.post('/api/profile-builder/publish-website', authMiddleware, async (req, res) => {
  try {
    const { html } = req.body;
    const userId = (req as any).user.id;

    if (!html) {
      return res.status(400).json({ error: 'Missing html content' });
    }

    const profileData = await storage.getProfile(userId);
    const candidateName = profileData?.name || 'Candidate';
    const slug = candidateName
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-');
    const safeFilename = `${slug || 'portfolio'}.html`;

    // Ensure portfolios folder exists in root storage directory (outside frontend workspace)
    const portfoliosDir = path.join(process.cwd(), 'storage', 'portfolios');
    if (!fs.existsSync(portfoliosDir)) {
      fs.mkdirSync(portfoliosDir, { recursive: true });
    }

    const filepath = path.join(portfoliosDir, safeFilename);
    fs.writeFileSync(filepath, html, 'utf-8');

    const protocol = req.secure ? 'https' : 'http';
    const host = req.get('host') || 'localhost:3001';

    // Always serve the public portfolios from the Express backend port 3001 to bypass Vite reload
    const backendHost = host.replace(':5173', ':3001');
    const publicUrl = `${protocol}://${backendHost}/portfolios/${safeFilename}`;

    return res.json({
      success: true,
      url: publicUrl,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Copilot REST endpoints
app.get('/api/copilot/daily-brief', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const brief = await DailyBriefService.compileDailyBrief(userId, storage);
    return res.json(brief);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.get('/api/copilot/recommendations', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const recs = await CareerAgent.analyzeAndRecommend(userId, storage);
    return res.json(recs);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.get('/api/copilot/skill-gap', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const gap = await SkillGapEngine.analyzeGap(userId, storage);
    return res.json(gap);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/copilot/interview/start', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { type } = req.body;
    if (!type) return res.status(400).json({ error: 'Missing interview type' });
    const session = await InterviewCopilot.startSession(userId, type, storage);
    return res.json(session);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/copilot/interview/submit', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { sessionId, responses } = req.body;
    if (!sessionId || !responses) return res.status(400).json({ error: 'Missing sessionId or responses' });
    const session = await InterviewCopilot.evaluateSession(userId, sessionId, responses, storage);
    return res.json(session);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.get('/api/copilot/roadmap', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const roadmap = await CareerRoadmap.generateRoadmap(userId, storage);
    return res.json(roadmap);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.get('/api/copilot/market-intelligence', authMiddleware, async (req, res) => {
  try {
    const report = await MarketIntelligence.analyzeMarket(storage);
    return res.json(report);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.get('/api/copilot/salary-analysis', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const analysis = await SalaryAnalyzer.analyzeSalary(userId, storage);
    return res.json(analysis);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.get('/api/copilot/follow-ups', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const timing = await FollowUpAssistant.checkFollowUps(userId, storage);
    return res.json(timing);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/copilot/chat', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: 'Missing chat message' });
    const reply = await AssistantChatService.answerQuery(userId, message, storage);
    return res.json(reply);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Settings endpoints
app.get('/api/settings', authMiddleware, async (req, res) => {
  return res.json({
    matchThreshold: config.matchThreshold,
    emailNotifications: config.features.email,
    scrapeTimeout: 30000,
    consecutiveFailuresLimit: 3,
  });
});

app.post('/api/settings', authMiddleware, async (req, res) => {
  try {
    const { matchThreshold, emailNotifications } = req.body;
    if (matchThreshold !== undefined) {
      config.matchThreshold = Number(matchThreshold);
    }
    if (emailNotifications !== undefined) {
      config.features.email = !!emailNotifications;
    }
    return res.json({ success: true, settings: req.body });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// --- VERSION 5.0.0 INTELLIGENT APPLICATION AUTOMATION ENDPOINTS ---

// 1. Resume Profiles & Optimizations
app.get('/api/resume-profiles', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const list = await storage.getResumeProfiles(userId);
    return res.json(list);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/resume-profiles', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { name, profileName, content, pdfData, pdf_data } = req.body;
    const finalName = profileName || name;
    if (!finalName || !content) {
      return res.status(400).json({ error: 'Missing profileName or content' });
    }
    await storage.saveResumeProfile(userId, finalName, content, pdfData || pdf_data);
    await AuditLogger.log(userId, 'Resume Upload', { profileName: finalName }, req.ip);
    return res.json({ success: true, profileName: finalName });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.put('/api/resume-profiles/:id', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const id = req.params.id as string;
    const { profileName, content, pdfData, pdf_data } = req.body;
    // For upserting profile, we can fetch existing and overwrite
    await storage.saveResumeProfile(userId, profileName, content, pdfData || pdf_data);
    return res.json({ success: true, id });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.delete('/api/resume-profiles/:id', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const id = req.params.id as string;
    await storage.deleteResumeProfile(userId, id);
    await AuditLogger.log(userId, 'Resume Upload', { id }, req.ip);
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Resume Optimization trigger
app.post('/api/resumes/:name/optimize', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const name = req.params.name as string;
    const { jobHash } = req.body;
    if (!jobHash) return res.status(400).json({ error: 'Missing jobHash' });

    const jobInfo = await findJobByHash(jobHash as string);
    if (!jobInfo) return res.status(404).json({ error: 'Job not found' });
    const job = jobInfo.job;

    const profiles = await storage.getResumeProfiles(userId);
    const profile = profiles.find((p) => p.profile_name === name);
    const content = profile ? profile.content : 'Resume content here...';

    const result = ResumeOptimizationService.optimize(content, job);
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// 2. Application Queue Endpoints
app.get('/api/applications/queue', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const queue = await storage.getApplicationQueue(userId);
    return res.json(queue);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/applications/queue', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { jobHash, profileName, coverLetterText } = req.body;
    if (!jobHash || !profileName) {
      return res.status(400).json({ error: 'Missing jobHash or profileName' });
    }

    const jobInfo = await findJobByHash(jobHash as string);
    if (!jobInfo) return res.status(404).json({ error: 'Job not found' });
    const job = jobInfo.job;

    const profiles = await storage.getResumeProfiles(userId);
    const profile = profiles.find((p) => p.profile_name === profileName);
    const resumeText = profile ? profile.content : 'Standard resume content';

    const userProfile = (await storage.getProfile(userId)) || {};

    const payload = AutoApplyEngine.preparePayload(job, userProfile, resumeText, coverLetterText);
    const isSupported = AutoApplyEngine.determineAutomatedSupport(job);
    const errors = AutoApplyEngine.validatePayload(payload);

    const queueItem = {
      job_hash: jobHash,
      company: job.company,
      title: job.title,
      state: isSupported ? (errors.length > 0 ? 'REQUIRES_MANUAL_ACTION' : 'READY') : 'REQUIRES_MANUAL_ACTION',
      payload,
      validation_errors:
        errors.length > 0
          ? errors
          : isSupported
            ? []
            : ['ATS does not support direct automation. Requires manual apply.'],
      retries: 0,
    };

    await storage.saveApplicationQueueItem(userId, queueItem);
    await AuditLogger.log(userId, 'Application Update', { jobHash, company: job.company }, req.ip);

    return res.json({ success: true, item: queueItem });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.delete('/api/applications/queue/:id', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const id = req.params.id as string;
    await storage.deleteApplicationQueueItem(userId, id);
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/applications/run', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    // Process the queued applications
    await AutoApplyEngine.processQueue(storage, userId);
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// 3. Recruiter CRM Endpoints
app.get('/api/recruiters', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const list = await storage.getRecruiters(userId);
    return res.json(list);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/recruiters', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const contact = req.body;
    if (!contact.name || !contact.company) {
      return res.status(400).json({ error: 'Missing recruiter name or company' });
    }
    await storage.saveRecruiter(userId, contact);
    return res.json({ success: true, contact });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.delete('/api/recruiters/:id', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const id = req.params.id as string;
    await storage.deleteRecruiter(userId, id);
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/recruiters/:id/touchpoint', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const id = req.params.id as string;
    const { message, direction } = req.body;
    if (!message) return res.status(400).json({ error: 'Missing touchpoint message' });

    await RecruiterManager.logTouchpoint(storage, userId, id, message, direction || 'outgoing');
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// 5. Referral CRM Endpoints
app.get('/api/referrals', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { category, company } = req.query;

    let referrals;
    if (category) {
      referrals = await storage.getReferralsByCategory(userId, category as string);
    } else {
      referrals = await storage.getReferrals(userId);
    }

    if (company) {
      referrals = referrals.filter((r: any) => r.company === company);
    }

    return res.json(referrals);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/referrals', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const referral = req.body;

    if (!referral.name || !referral.company || !referral.category) {
      return res.status(400).json({ error: 'Missing required fields: name, company, category' });
    }

    await storage.saveReferral(userId, referral);
    await AuditLogger.log(userId, 'referral_created', { referral: referral.name, company: referral.company });
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.put('/api/referrals/:id', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const id = req.params.id as string;
    const referral = req.body;

    referral.id = id;
    await storage.saveReferral(userId, referral);
    await AuditLogger.log(userId, 'referral_updated', { id });
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.delete('/api/referrals/:id', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const id = req.params.id as string;

    await storage.deleteReferral(userId, id);
    await AuditLogger.log(userId, 'referral_deleted', { id });
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.patch('/api/referrals/:id/status', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const id = req.params.id as string;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Missing status field' });
    }

    await storage.updateReferralStatus(userId, id, status);
    await AuditLogger.log(userId, 'referral_status_updated', { id, status });
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.get('/api/referrals/analytics', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const analytics = await storage.getReferralAnalytics(userId);
    return res.json(analytics);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// 7. LinkedIn Integration Endpoints
app.post('/api/linkedin/import-csv', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { csvData } = req.body;

    if (!csvData) {
      return res.status(400).json({ error: 'CSV data is required' });
    }

    const { ManualImportProvider } = await import('./LinkedInIntegration.js');
    const provider = new ManualImportProvider();
    const connections = provider.importFromCSV(csvData);

    // Convert LinkedIn connections to referral contacts and save
    const savedContacts = [];
    for (const connection of connections) {
      // Map 'Other' relationship to 'Employee' as fallback
      const category:
        | 'Recruiter'
        | 'Hiring Manager'
        | 'Engineering Manager'
        | 'University Alumni'
        | 'Employee'
        | 'Talent Acquisition'
        | 'HR' =
        connection.relationship === 'Other'
          ? 'Employee'
          : connection.relationship === 'Recruiter'
            ? 'Recruiter'
            : connection.relationship === 'Hiring Manager'
              ? 'Hiring Manager'
              : connection.relationship === 'Engineering Manager'
                ? 'Engineering Manager'
                : connection.relationship === 'University Alumni'
                  ? 'University Alumni'
                  : connection.relationship === 'Talent Acquisition'
                    ? 'Talent Acquisition'
                    : connection.relationship === 'HR'
                      ? 'HR'
                      : 'Employee';

      const referralData = {
        id: `linkedin-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        userId,
        name: connection.name,
        role: connection.currentRole,
        category,
        company: connection.company,
        linkedInUrl: connection.linkedInProfile,
        email: '',
        location: connection.location,
        notes: `Imported from LinkedIn. ${connection.recommendationReason}`,
        tags: ['LinkedIn Import'],
        connectionStatus: 'Potential Contact' as const,
        referralStatus: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const saved = await storage.saveReferral(userId, referralData);
      savedContacts.push(saved);
    }

    AuditLogger.log(userId, 'LINKEDIN_IMPORT', { count: connections.length });

    return res.json({
      success: true,
      imported: connections.length,
      saved: savedContacts.length,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/linkedin/recommend', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { company, jobTitle, jobDescription, userUniversity, userSkills } = req.body;

    if (!company || !jobTitle) {
      return res.status(400).json({ error: 'Company and job title are required' });
    }

    // Get all referrals for the user
    const referrals = await storage.getReferrals(userId);

    // Filter by company
    const companyContacts = referrals.filter((r) => r.company.toLowerCase().includes(company.toLowerCase()));

    // Import ranking logic
    const { ContactRanker } = await import('./LinkedInIntegration.js');
    const ranker = new ContactRanker();

    // Convert referrals to LinkedIn connection format
    const connections = companyContacts.map((r) => ({
      id: r.id,
      name: r.name,
      currentRole: r.role,
      company: r.company,
      location: r.location || '',
      linkedInProfile: r.linkedInUrl || '',
      relationship: r.category,
      mutualConnections: 0,
      university: '',
      team: '',
      isFirstDegree: false,
      confidenceScore: 0,
      recommendationReason: '',
    }));

    // Normalize userSkills to array if it's a string
    const normalizedUserSkills =
      typeof userSkills === 'string' ? userSkills.split(',').map((s: string) => s.trim()) : userSkills || [];

    // Rank contacts
    const jobContext = {
      company,
      jobTitle,
      jobDescription,
      userUniversity,
      userSkills: normalizedUserSkills,
    };

    const rankedContacts = ranker.rankContacts(connections, jobContext);

    return res.json(rankedContacts);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.get('/api/linkedin/connections', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { company } = req.query;

    let referrals = await storage.getReferrals(userId);

    if (company) {
      referrals = referrals.filter((r) => r.company.toLowerCase().includes(String(company).toLowerCase()));
    }

    // Convert to LinkedIn connection format
    const connections = referrals.map((r) => ({
      id: r.id,
      name: r.name,
      currentRole: r.role,
      company: r.company,
      location: r.location || '',
      linkedInProfile: r.linkedInUrl || '',
      relationship: r.category,
      mutualConnections: 0,
      university: '',
      team: '',
      isFirstDegree: false,
      confidenceScore: 0,
      recommendationReason: '',
    }));

    return res.json(connections);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.get('/api/linkedin/status', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const referrals = await storage.getReferrals(userId);

    // Check if user has any LinkedIn-imported contacts
    const hasLinkedInData = referrals.some((r) => r.tags && r.tags.includes('LinkedIn Import'));

    return res.json({
      connected: hasLinkedInData,
      totalContacts: referrals.length,
      linkedinImported: referrals.filter((r) => r.tags && r.tags.includes('LinkedIn Import')).length,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// 6. Calendar Integration Endpoints
app.get('/api/auth/google/url', authMiddleware, (req, res) => {
  const clientId = config.googleClientId;
  const redirectUri = config.googleRedirectUri;
  if (!clientId || !redirectUri) {
    return res.status(400).json({ error: 'Google OAuth client ID or redirect URI is not configured.' });
  }
  const userId = (req as any).user.id;
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=https://www.googleapis.com/auth/calendar.events&access_type=offline&prompt=consent&state=${userId}`;
  return res.json({ url: authUrl });
});

app.get('/api/auth/google/callback', async (req, res) => {
  try {
    const { code, state: userId } = req.query;
    if (!code || !userId) {
      return res.status(400).send('Missing authorization code or state.');
    }

    const clientId = config.googleClientId;
    const clientSecret = config.googleClientSecret;
    const redirectUri = config.googleRedirectUri;

    if (!clientId || !clientSecret || !redirectUri) {
      return res.status(500).send('Google OAuth parameters are not fully configured.');
    }

    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      throw new Error(`Token exchange failed: ${errText}`);
    }

    const tokenData = await tokenRes.json();
    const refreshToken = tokenData.refresh_token;

    if (!refreshToken) {
      throw new Error('No refresh token returned by Google. Ensure you prompt for consent/offline access.');
    }

    let settings = await storage.getExtendedSettings(userId as string);
    if (!settings) {
      settings = {
        preferredCompanies: [],
        preferredTechnologies: [],
        preferredCities: [],
        remotePreference: 'all',
        notificationFrequency: 'daily',
        digestFormat: 'markdown',
      };
    }

    settings.google_refresh_token = refreshToken;
    await storage.saveExtendedSettings(settings, userId as string);
    await AuditLogger.log(userId as string, 'Settings Change', { linkedGoogleCalendar: true }, '127.0.0.1');

    const frontendUrl = redirectUri.includes('localhost:4500')
      ? 'http://localhost:5173/automation'
      : redirectUri.split('/api')[0] + '/automation';
    return res.redirect(frontendUrl);
  } catch (err: any) {
    Logger.error('Google OAuth callback failed', err);
    return res.status(500).send(`Authentication failed: ${err.message}`);
  }
});

app.get('/api/calendar/google/status', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const settings = await storage.getExtendedSettings(userId);
    const isLinked = !!(settings && settings.google_refresh_token);
    return res.json({ linked: isLinked });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.get('/api/calendar', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const list = await storage.getCalendarEvents(userId);
    return res.json(list);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/calendar', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const event = req.body;
    if (!event.title || !event.startTime || !event.endTime) {
      return res.status(400).json({ error: 'Missing event details' });
    }
    await storage.saveCalendarEvent(userId, event);

    const settings = await storage.getExtendedSettings(userId);
    if (settings && settings.google_refresh_token) {
      try {
        Logger.info(`Syncing event "${event.title}" to Google Calendar for user ${userId}...`);

        const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            client_id: config.googleClientId,
            client_secret: config.googleClientSecret,
            refresh_token: settings.google_refresh_token,
            grant_type: 'refresh_token',
          }),
        });

        if (tokenRes.ok) {
          const tokenData = await tokenRes.json();
          const accessToken = tokenData.access_token;

          const gRes = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              summary: event.title,
              description: event.description || '',
              start: {
                dateTime: new Date(event.startTime).toISOString(),
              },
              end: {
                dateTime: new Date(event.endTime).toISOString(),
              },
              location: event.location || 'Remote / Virtual Call',
            }),
          });

          if (!gRes.ok) {
            const gErr = await gRes.text();
            Logger.error(`Google Calendar sync insertion failed: ${gErr}`);
          } else {
            Logger.info(`Successfully synced event "${event.title}" to Google Calendar.`);
          }
        } else {
          const tErr = await tokenRes.text();
          Logger.error(`Google Calendar token refresh failed: ${tErr}`);
        }
      } catch (gSyncErr) {
        Logger.error(
          'Unhandled error during Google Calendar background sync',
          gSyncErr instanceof Error ? gSyncErr : new Error(String(gSyncErr)),
        );
      }
    }

    return res.json({ success: true, event });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.delete('/api/calendar/:id', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const id = req.params.id as string;
    await storage.deleteCalendarEvent(userId, id);
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.get('/api/calendar/:id/ics', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const id = req.params.id as string;
    const events = await storage.getCalendarEvents(userId);
    const event = events.find((e) => e.id === id);

    if (!event) return res.status(404).json({ error: 'Event not found' });

    const icsContent = CalendarService.generateICS({
      id: event.id,
      title: event.title,
      description: event.description || '',
      eventType: event.event_type || 'Interview',
      startTime: new Date(event.start_time),
      endTime: new Date(event.end_time),
      location: event.location,
    });

    res.setHeader('Content-Type', 'text/calendar');
    res.setHeader('Content-Disposition', `attachment; filename=event_${id}.ics`);
    return res.send(icsContent);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// 5. Portfolio Recommendation Endpoints
app.get('/api/portfolio', authMiddleware, async (req, res) => {
  // Return standard default portfolio items
  const defaultItems = [
    {
      id: 'p1',
      name: 'Scalable Microservices Gateway',
      type: 'repository',
      description:
        'An API Gateway built with TypeScript, Node.js, and Redis supporting rate-limiting and authentication.',
      url: 'https://github.com/user/gateway',
      technologies: ['TypeScript', 'Node.js', 'Redis', 'Docker'],
    },
    {
      id: 'p2',
      name: 'Kubernetes Automation Blueprints',
      type: 'project',
      description:
        'Production infrastructure configurations deployment template utilizing Docker, Kubernetes and Helm.',
      url: 'https://github.com/user/k8s-infra',
      technologies: ['Kubernetes', 'Docker', 'AWS', 'YAML'],
    },
    {
      id: 'p3',
      name: 'Go REST Framework Benchmark',
      type: 'demo',
      description: 'Extremely fast web service boilerplate in Go utilizing PostgreSQL and Gorm.',
      url: 'https://github.com/user/go-rest',
      technologies: ['Go', 'Golang', 'PostgreSQL', 'Gorm'],
    },
  ];
  return res.json(defaultItems);
});

app.post('/api/portfolio/recommend', authMiddleware, async (req, res) => {
  try {
    const { jobHash } = req.body;
    if (!jobHash) return res.status(400).json({ error: 'Missing jobHash' });

    const jobInfo = await findJobByHash(jobHash as string);
    if (!jobInfo) return res.status(404).json({ error: 'Job not found' });
    const job = jobInfo.job;

    // Mock portfolio items
    const portfolioItems: any[] = [
      {
        id: 'p1',
        name: 'Scalable Microservices Gateway',
        type: 'repository',
        description: 'An API Gateway built with TypeScript, Node.js, and Redis supporting rate-limiting.',
        url: 'https://github.com/user/gateway',
        technologies: ['TypeScript', 'Node.js', 'Redis', 'Docker'],
      },
      {
        id: 'p2',
        name: 'Kubernetes Automation Blueprints',
        type: 'project',
        description: 'Production infrastructure config blueprint using Docker, Kubernetes.',
        url: 'https://github.com/user/k8s-infra',
        technologies: ['Kubernetes', 'Docker', 'AWS'],
      },
      {
        id: 'p3',
        name: 'Go REST Framework Benchmark',
        type: 'demo',
        description: 'Web service boilerplate in Go utilizing PostgreSQL.',
        url: 'https://github.com/user/go-rest',
        technologies: ['Go', 'Golang', 'PostgreSQL'],
      },
    ];

    const recommendations = PortfolioRecommendation.recommend(job, portfolioItems);
    return res.json(recommendations);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// 6. Opportunity Rankings Endpoints
app.get('/api/opportunities', authMiddleware, async (req, res) => {
  try {
    const companies = await storage.getEnabledCompanies();
    const allJobs: any[] = [];

    for (const company of companies) {
      const jobs = await storage.getCompanyJobs(company.id);
      allJobs.push(...jobs);
    }

    const ranked = allJobs.map((job) => {
      // Find matching company config
      const companyConfig = companies.find((c) => c.id === job.company.toLowerCase()) || ({ priority: 3 } as any);

      // Compute score
      const analysis = OpportunityEngine.calculate(
        job,
        companyConfig,
        75, // Default/mock resume match score
        80, // Default preferred salary weight
        'remote',
        'San Francisco',
      );

      return {
        job,
        scoreResult: analysis,
      };
    });

    // Sort descending by score
    ranked.sort((a, b) => b.scoreResult.overallScore - a.scoreResult.overallScore);
    return res.json(ranked);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/opportunities/:hash/calculate', authMiddleware, async (req, res) => {
  try {
    const hash = req.params.hash as string;
    const { matchScore, salaryWeight, remotePreference, locationPreference } = req.body;

    const jobInfo = await findJobByHash(hash);
    if (!jobInfo) return res.status(404).json({ error: 'Job not found' });
    const job = jobInfo.job;
    const companyConfig = jobInfo.company;

    const result = OpportunityEngine.calculate(
      job,
      companyConfig,
      matchScore || 75,
      salaryWeight || 80,
      remotePreference || 'all',
      locationPreference || '',
    );

    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// 7. Export Center Endpoint
app.post('/api/export', authMiddleware, async (req, res) => {
  try {
    const { type, format, data } = req.body;
    if (!type || !format || !data) {
      return res.status(400).json({ error: 'Missing type, format, or data' });
    }

    const { buffer, fileName } = ExportService.exportData(type, format, data);

    res.setHeader(
      'Content-Type',
      format === 'PDF' ? 'application/pdf' : format === 'JSON' ? 'application/json' : 'text/plain',
    );
    res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
    return res.send(buffer);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Ready check endpoint

app.get('/ready', async (req, res) => {
  try {
    const { ready, checks } = await HealthService.checkReady(storage);
    if (ready) {
      return res.status(200).json({ status: 'ready', checks });
    }
    return res.status(503).json({ status: 'not_ready', checks });
  } catch (err: any) {
    return res.status(500).json({ status: 'error', error: err.message });
  }
});

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const { status, checks } = await HealthService.checkHealth(storage);
    const code = status === 'unhealthy' ? 503 : 200;
    return res.status(code).json({ status, checks });
  } catch (err: any) {
    return res.status(500).json({ status: 'unhealthy', error: err.message });
  }
});

// Prometheus metrics endpoint
app.get('/metrics', async (req, res) => {
  try {
    let dbStatus: 'connected' | 'disconnected' = 'connected';
    try {
      await storage.getEnabledCompanies();
    } catch {
      dbStatus = 'disconnected';
    }
    const metrics = Telemetry.getMetricsReport(dbStatus);
    const prom = Telemetry.toPrometheusFormat(metrics);
    res.setHeader('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
    return res.status(200).send(prom);
  } catch (err: any) {
    return res.status(500).send(`# ERROR: ${err.message}\n`);
  }
});

// Swagger Specification
const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'Job Monitor Platform REST API',
    version: '2.2.0',
    description: 'Documentation for REST endpoints in Job Monitor Portal.',
  },
  paths: {
    '/ready': {
      get: {
        summary: 'Readiness check',
        responses: {
          200: { description: 'Platform is ready to accept traffic.' },
          503: { description: 'Services are initializing or degraded.' },
        },
      },
    },
    '/health': {
      get: {
        summary: 'Liveness health check',
        responses: {
          200: { description: 'System health report is active and ok.' },
          503: { description: 'Unhealthy telemetry states.' },
        },
      },
    },
    '/metrics': {
      get: {
        summary: 'Prometheus metrics endpoint',
        responses: {
          200: { description: 'Text metrics data.' },
        },
      },
    },
    '/api/dashboard': {
      get: {
        summary: 'Get dashboard statistics',
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: 'Dashboard stats payload.' },
        },
      },
    },
    '/api/jobs': {
      get: {
        summary: 'Explore all scraped jobs',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'technology', in: 'query', schema: { type: 'string' } },
          { name: 'company', in: 'query', schema: { type: 'string' } },
          { name: 'location', in: 'query', schema: { type: 'string' } },
          { name: 'remote', in: 'query', schema: { type: 'string' } },
          { name: 'minScore', in: 'query', schema: { type: 'integer' } },
          { name: 'experience', in: 'query', schema: { type: 'string' } },
          { name: 'sort', in: 'query', schema: { type: 'string', enum: ['opportunity', 'match'] } },
          { name: 'page', in: 'query', schema: { type: 'integer' } },
          { name: 'limit', in: 'query', schema: { type: 'integer' } },
        ],
        responses: {
          200: { description: 'Paginated filtered jobs list.' },
        },
      },
    },
    '/api/jobs/{hash}': {
      get: {
        summary: 'Get detailed job description and matching parameters',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'hash', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Job and match explanation details.' },
        },
      },
    },
    '/api/jobs/{hash}/analysis': {
      get: {
        summary: 'Retrieve or trigger AI job description analysis',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'hash', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'AI Summary analysis.' },
        },
      },
    },
    '/api/jobs/{hash}/tailor': {
      post: {
        summary: 'Generate a tailored resume candidate draft',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'hash', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  profile: { type: 'string', default: 'backend' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Tailoring recommendations.' },
        },
      },
    },
    '/api/jobs/{hash}/cover-letter': {
      post: {
        summary: 'Generate professional cover letter draft',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'hash', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  profile: { type: 'string', default: 'backend' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Formatted letter text.' },
        },
      },
    },
    '/api/jobs/{hash}/prep': {
      get: {
        summary: 'Generate technical and behavioral interview preparation guide',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'hash', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'profile', in: 'query', schema: { type: 'string', default: 'backend' } },
        ],
        responses: {
          200: { description: 'Preparation checksheets and questions.' },
        },
      },
    },
    '/api/companies': {
      get: {
        summary: 'List company configs and scrape logs',
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: 'All registry items.' },
        },
      },
    },
    '/api/companies/{id}/insights': {
      get: {
        summary: 'Get hiring volume trends and stack analytics',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Company telemetry insights.' },
        },
      },
    },
    '/api/applications': {
      get: {
        summary: 'List tracked job applications',
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: 'Applications tracking schema list.' },
        },
      },
      post: {
        summary: 'Update or create job application tracking state',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  jobHash: { type: 'string' },
                  status: { type: 'string' },
                  notes: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Success confirmation.' },
        },
      },
    },
    '/api/settings/extended': {
      get: {
        summary: 'Get career extended preferences settings',
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: 'Extended Settings profile.' },
        },
      },
      post: {
        summary: 'Update career extended preferences settings',
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: 'Success confirmation.' },
        },
      },
    },
  },
};

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Serve published portfolios statically from storage/portfolios (outside frontend source to prevent reloads)
const portfoliosDir = path.join(process.cwd(), 'storage', 'portfolios');
if (!fs.existsSync(portfoliosDir)) {
  fs.mkdirSync(portfoliosDir, { recursive: true });
}
app.use('/portfolios', express.static(portfoliosDir));

// Serve frontend build output
const frontendDist = path.join(process.cwd(), 'frontend', 'dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get('/{*splat}', (req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  Logger.info(`REST API Server is running on port ${PORT}`);
});
