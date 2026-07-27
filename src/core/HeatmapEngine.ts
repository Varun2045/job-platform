import { StorageProvider, KeywordHeatmap } from '../storage/StorageProvider.js';
import { Logger } from './Logger.js';

export class HeatmapEngine {
  constructor(private storage: StorageProvider) {}

  /**
   * Tokenizes text and extracts normalized unique skill and domain keywords.
   */
  public extractKeywords(text: string): string[] {
    if (!text || text.trim() === '') return [];

    // Filter out common English stop words
    const stopWords = new Set([
      'the', 'and', 'for', 'with', 'you', 'that', 'this', 'have', 'from', 'are',
      'will', 'our', 'work', 'your', 'about', 'team', 'ability', 'experience',
      'required', 'preferred', 'skills', 'role', 'job', 'description', 'must',
    ]);

    // Clean, tokenize, and filter words
    const tokens = text
      .toLowerCase()
      .replace(/[^a-z0-9#+.]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length >= 2 && !stopWords.has(w));

    return Array.from(new Set(tokens));
  }

  /**
   * Calculates the density match percentage between matched keywords and total job keywords.
   */
  public calculateMatchDensity(matchedCount: number, totalJobKeywords: number): number {
    if (totalJobKeywords <= 0) return 0;
    const density = (matchedCount / totalJobKeywords) * 100;
    return Math.min(100, Math.max(0, Math.round(density * 10) / 10));
  }

  /**
   * Generates a side-by-side keyword match heatmap overlay comparing resume content against a job description.
   */
  public generateHeatmap(
    jobId: string,
    resumeProfileId: string,
    jobDescription: string,
    resumeContent: string,
  ): KeywordHeatmap {
    const jobKeywords = this.extractKeywords(jobDescription);
    const resumeKeywords = new Set(this.extractKeywords(resumeContent));

    const matchedKeywords: string[] = [];
    const missingKeywords: string[] = [];

    for (const kw of jobKeywords) {
      if (resumeKeywords.has(kw)) {
        matchedKeywords.push(kw);
      } else {
        missingKeywords.push(kw);
      }
    }

    const matchDensityPct = this.calculateMatchDensity(matchedKeywords.length, jobKeywords.length);

    Logger.info(
      `HeatmapEngine: Generated heatmap for Job [${jobId}] vs Resume [${resumeProfileId}] (Matched: ${matchedKeywords.length}, Missing: ${missingKeywords.length}, Density: ${matchDensityPct}%)`,
    );

    return {
      jobId,
      resumeProfileId,
      matchedKeywords,
      missingKeywords,
      matchDensityPct,
    };
  }
}
