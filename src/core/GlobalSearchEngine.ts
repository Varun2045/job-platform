import { StorageProvider, SavedExtensionJob } from '../storage/StorageProvider.js';
import { Application } from '../companies/Scraper.js';
import { Logger } from './Logger.js';

export interface GlobalSearchResult {
  applications: Application[];
  inboxJobs: SavedExtensionJob[];
  totalMatches: number;
}

export class GlobalSearchEngine {
  private storage: StorageProvider;

  constructor(storage: StorageProvider) {
    this.storage = storage;
  }

  public async search(query: string, userId?: string): Promise<GlobalSearchResult> {
    if (!query || query.trim() === '') {
      return { applications: [], inboxJobs: [], totalMatches: 0 };
    }

    const q = query.toLowerCase().trim();
    const apps = await this.storage.getApplications(userId);
    const jobs = await this.storage.getExtensionJobs(userId);

    const matchedApps = apps.filter((app) => {
      return (
        (app.company && app.company.toLowerCase().includes(q)) ||
        (app.title && app.title.toLowerCase().includes(q)) ||
        (app.location && app.location.toLowerCase().includes(q)) ||
        (app.status && app.status.toLowerCase().includes(q)) ||
        (app.notes && app.notes.toLowerCase().includes(q))
      );
    });

    const matchedJobs = jobs.filter((job) => {
      return (
        job.companyName.toLowerCase().includes(q) ||
        job.jobTitle.toLowerCase().includes(q) ||
        (job.location && job.location.toLowerCase().includes(q)) ||
        job.status.toLowerCase().includes(q) ||
        (job.description && job.description.toLowerCase().includes(q))
      );
    });

    const totalMatches = matchedApps.length + matchedJobs.length;

    Logger.info(`GlobalSearchEngine: Search for "${query}" returned ${totalMatches} total matches.`);

    return {
      applications: matchedApps,
      inboxJobs: matchedJobs,
      totalMatches,
    };
  }
}
