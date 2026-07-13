import { Job } from '../companies/Scraper.js';
import { StorageProvider } from '../storage/StorageProvider.js';
import { Logger } from './Logger.js';

export type AutoApplyState = 
  | 'NEW'
  | 'READY'
  | 'QUEUED'
  | 'SUBMITTED'
  | 'FAILED'
  | 'REQUIRES_MANUAL_ACTION';

export interface ApplicationQueueItem {
  id?: string;
  job_hash: string;
  company: string;
  title: string;
  state: AutoApplyState;
  payload: any;
  validation_errors: string[];
  retries: number;
}

export class AutoApplyEngine {
  public static determineAutomatedSupport(job: Job): boolean {
    const url = job.url.toLowerCase();
    // Support lever and greenhouse portals
    if (url.includes('lever.co') || url.includes('greenhouse.io') || url.includes('boards.greenhouse.io')) {
      return true;
    }
    // Workday and custom forms require manual intervention
    return false;
  }

  public static detectExternalRedirect(url: string): boolean {
    const lower = url.toLowerCase();
    return lower.includes('workday') || lower.includes('myworkdayjobs') || lower.includes('icims') || lower.includes('taleo');
  }

  public static preparePayload(job: Job, profile: any, resumeContent: string, coverLetter?: string): any {
    return {
      jobHash: job.jobHash,
      company: job.company,
      title: job.title,
      applyUrl: job.url,
      fullName: profile.fullName || profile.name || 'Anonymous User',
      email: profile.email || 'user@example.com',
      phone: profile.phone || '',
      resumeText: resumeContent,
      coverLetterText: coverLetter || '',
      submittedAt: null
    };
  }

  public static validatePayload(payload: any): string[] {
    const errors: string[] = [];
    if (!payload.fullName || payload.fullName.trim() === 'Anonymous User') {
      errors.push('Full name is required');
    }
    if (!payload.email || !payload.email.includes('@')) {
      errors.push('Valid email address is required');
    }
    if (!payload.resumeText || payload.resumeText.length < 50) {
      errors.push('Valid resume content is required');
    }
    return errors;
  }

  public static async processQueue(storage: StorageProvider, userId: string): Promise<void> {
    Logger.info(`AutoApplyEngine: Initiating application queue run for user: ${userId}`);
    const items = await storage.getApplicationQueue(userId);
    const queuedItems = items.filter(item => item.state === 'QUEUED' || item.state === 'NEW');

    for (const item of queuedItems) {
      try {
        Logger.info(`Processing application for ${item.title} at ${item.company}`);
        const errors = this.validatePayload(item.payload);

        if (errors.length > 0) {
          item.state = 'REQUIRES_MANUAL_ACTION';
          item.validation_errors = errors;
          await storage.saveApplicationQueueItem(userId, item);
          continue;
        }

        // Simulate submission (external redirects require manual steps)
        if (this.detectExternalRedirect(item.payload.applyUrl)) {
          item.state = 'REQUIRES_MANUAL_ACTION';
          item.validation_errors = ['Redirects to external Workday/Applicant Tracking system. Manual submission required.'];
          await storage.saveApplicationQueueItem(userId, item);
          continue;
        }

        // Mock HTTP post action to simulate Lever/Greenhouse form submissions
        item.state = 'SUBMITTED';
        item.payload.submittedAt = new Date().toISOString();
        await storage.saveApplicationQueueItem(userId, item);

        // Save status in tracking pipeline
        await storage.saveApplication({
          jobHash: item.job_hash,
          company: item.company,
          jobId: item.payload.applyUrl,
          status: 'Applied',
          appliedDate: new Date().toISOString().split('T')[0],
          resumeUsed: 'Optimized Version',
          notes: 'Auto-submitted by Career Copilot Engine.',
          lastUpdated: new Date().toISOString()
        }, userId);

        Logger.info(`Successfully auto-applied to ${item.company} for ${item.title}`);
      } catch (err: any) {
        Logger.error(`Auto-apply attempt failed for ${item.company}`, err);
        item.retries += 1;
        if (item.retries >= 3) {
          item.state = 'FAILED';
          item.validation_errors = [`Failed after max retries: ${err.message}`];
        } else {
          item.state = 'QUEUED';
        }
        await storage.saveApplicationQueueItem(userId, item);
      }
    }
  }
}
