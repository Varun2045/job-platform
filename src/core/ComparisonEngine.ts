import { Job } from '../companies/Scraper.js';
import { DuplicateDetector } from './DuplicateDetector.js';

export interface ComparisonResult {
  added: Job[];
  expired: Job[];
  modified: {
    previous: Job;
    current: Job;
    changes: string[];
  }[];
}

export class ComparisonEngine {
  /**
   * Compares the previous run jobs with the current run jobs for a company.
   * Leverages smart duplicate detection to catch slightly changed titles/descriptions.
   */
  public static compare(previousJobs: Job[], currentJobs: Job[]): ComparisonResult {
    const prevMap = new Map<string, Job>();
    previousJobs.forEach((j) => prevMap.set(j.id, j));

    const currMap = new Map<string, Job>();
    currentJobs.forEach((j) => currMap.set(j.id, j));

    const added: Job[] = [];
    const expired: Job[] = [];
    const modified: ComparisonResult['modified'] = [];
    const matchedPrevIds = new Set<string>();

    // Find added and modified
    for (const [id, currJob] of currMap.entries()) {
      const prevJob = prevMap.get(id);
      if (prevJob) {
        matchedPrevIds.add(id);
        const changes: string[] = [];

        if (prevJob.title !== currJob.title) {
          changes.push(`title ("${prevJob.title}" -> "${currJob.title}")`);
        }
        if (prevJob.location !== currJob.location) {
          changes.push(`location ("${prevJob.location}" -> "${currJob.location}")`);
        }
        if (prevJob.isRemote !== currJob.isRemote) {
          changes.push(`isRemote (${prevJob.isRemote} -> ${currJob.isRemote})`);
        }
        if (prevJob.experience !== currJob.experience) {
          changes.push(`experience ("${prevJob.experience}" -> "${currJob.experience}")`);
        }
        if (prevJob.salary !== currJob.salary) {
          changes.push(`salary ("${prevJob.salary}" -> "${currJob.salary}")`);
        }
        if (prevJob.description !== currJob.description) {
          changes.push('description');
        }
        if (prevJob.url !== currJob.url) {
          changes.push(`url ("${prevJob.url}" -> "${currJob.url}")`);
        }

        if (changes.length > 0) {
          modified.push({
            previous: prevJob,
            current: currJob,
            changes
          });
        }
      } else {
        // Fuzzy duplicate check against unmatched previous jobs
        let fuzzyMatch: Job | null = null;
        for (const pj of previousJobs) {
          if (!matchedPrevIds.has(pj.id) && DuplicateDetector.isDuplicate(pj, currJob)) {
            fuzzyMatch = pj;
            break;
          }
        }

        if (fuzzyMatch) {
          matchedPrevIds.add(fuzzyMatch.id);
          const changes: string[] = ['duplicate (fuzzy matching detected near-identical repost)'];
          if (fuzzyMatch.title !== currJob.title) {
            changes.push(`title ("${fuzzyMatch.title}" -> "${currJob.title}")`);
          }
          if (fuzzyMatch.location !== currJob.location) {
            changes.push(`location ("${fuzzyMatch.location}" -> "${currJob.location}")`);
          }
          if (fuzzyMatch.description !== currJob.description) {
            changes.push('description');
          }
          if (fuzzyMatch.url !== currJob.url) {
            changes.push(`url ("${fuzzyMatch.url}" -> "${currJob.url}")`);
          }

          modified.push({
            previous: fuzzyMatch,
            current: currJob,
            changes
          });
        } else {
          added.push(currJob);
        }
      }
    }

    // Find expired
    for (const [id, prevJob] of prevMap.entries()) {
      if (!matchedPrevIds.has(id)) {
        expired.push(prevJob);
      }
    }

    return {
      added,
      expired,
      modified
    };
  }
}
