import { Job } from '../companies/Scraper.js';

export class DuplicateDetector {
  private static getTokens(str: string): Set<string> {
    return new Set(
      str
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter((w) => w.length > 1)
    );
  }

  private static computeJaccard(str1: string, str2: string): number {
    const s1 = this.getTokens(str1);
    const s2 = this.getTokens(str2);
    if (s1.size === 0 && s2.size === 0) return 1.0;
    if (s1.size === 0 || s2.size === 0) return 0.0;
    
    const intersection = new Set([...s1].filter((x) => s2.has(x)));
    const union = new Set([...s1, ...s2]);
    return intersection.size / union.size;
  }

  /**
   * Evaluates if two jobs are duplicates based on fuzzy similarity of title, location, and description.
   */
  public static isDuplicate(job1: Job, job2: Job): boolean {
    if (job1.id === job2.id && job1.company === job2.company) return true;
    if (job1.url === job2.url) return true;

    // 1. Title Similarity (Threshold: 0.75)
    const titleSim = this.computeJaccard(job1.title, job2.title);
    if (titleSim < 0.75) return false;

    // 2. Location Similarity
    const loc1 = job1.location.toLowerCase();
    const loc2 = job2.location.toLowerCase();
    const locContains = loc1.includes(loc2) || loc2.includes(loc1);
    const locSim = this.computeJaccard(job1.location, job2.location);
    if (!locContains && locSim < 0.5) return false;

    // 3. Description Similarity (Threshold: 0.8)
    const descSim = this.computeJaccard(job1.description, job2.description);
    if (descSim < 0.8) return false;

    return true;
  }
}
