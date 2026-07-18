import { Job } from '../companies/Scraper.js';

export interface SearchCriteria {
  company?: string;
  technology?: string;
  experience?: string;
  minScore?: number;
  location?: string;
  remote?: boolean;
  dateFound?: string; // YYYY-MM-DD
}

export class SearchEngine {
  /**
   * Filters a list of jobs based on search criteria.
   */
  public static search(jobs: { job: Job; score: number }[], criteria: SearchCriteria): { job: Job; score: number }[] {
    return jobs.filter((item) => {
      const { job, score } = item;

      // 1. Company Match
      if (criteria.company && criteria.company.trim() !== '') {
        const compLower = job.company.toLowerCase();
        const searchComp = criteria.company.toLowerCase().trim();
        if (!compLower.includes(searchComp)) {
          return false;
        }
      }

      // 2. Technology Match
      if (criteria.technology && criteria.technology.trim() !== '') {
        const tech = criteria.technology.toLowerCase().trim();
        const text = `${job.title} ${job.description}`.toLowerCase();
        if (!text.includes(tech)) {
          return false;
        }
      }

      // 3. Experience Match
      if (criteria.experience && criteria.experience.trim() !== '') {
        const searchExp = criteria.experience.toLowerCase().trim();
        const expText = `${job.experience || ''} ${job.title} ${job.description}`.toLowerCase();
        if (!expText.includes(searchExp)) {
          return false;
        }
      }

      // 4. Match Score Match
      if (criteria.minScore !== undefined && criteria.minScore !== null) {
        if (score < criteria.minScore) {
          return false;
        }
      }

      // 5. Location Match
      if (criteria.location && criteria.location.trim() !== '') {
        const locLower = job.location.toLowerCase();
        const searchLoc = criteria.location.toLowerCase().trim();
        if (!locLower.includes(searchLoc)) {
          return false;
        }
      }

      // 6. Remote Match
      if (criteria.remote !== undefined && criteria.remote !== null) {
        const locLower = job.location.toLowerCase();
        const descLower = job.description.toLowerCase();
        const isRemoteJob = job.isRemote || locLower.includes('remote') || descLower.includes('remote');
        if (criteria.remote !== isRemoteJob) {
          return false;
        }
      }

      // 7. Date Found Match
      if (criteria.dateFound && criteria.dateFound.trim() !== '') {
        const searchTime = new Date(criteria.dateFound).getTime();
        const postedTime = new Date(job.datePosted || 0).getTime();
        if (postedTime < searchTime) {
          return false;
        }
      }

      return true;
    });
  }
}
