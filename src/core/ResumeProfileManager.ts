import { Job } from '../companies/Scraper.js';
import { ResumeMatcher } from './ResumeMatcher.js';

export const SUPPORTED_PROFILES = [
  'Backend',
  'Frontend',
  'FullStack',
  'AI',
  'ML',
  'Data',
  'BusinessAnalyst'
] as const;

export type ResumeProfileName = typeof SUPPORTED_PROFILES[number];

export class ResumeProfileManager {
  /**
   * Matches a job description against all available resume profiles and returns the highest scoring profile.
   */
  public static recommendProfile(
    job: Job,
    profiles: { profile_name: string; content: string }[]
  ): { recommendedProfile: string; score: number } {
    if (profiles.length === 0) {
      return { recommendedProfile: 'Backend', score: 0 };
    }

    let highestScore = -1;
    let recommendedProfile = profiles[0].profile_name;

    for (const p of profiles) {
      // Mock score caching bypass or score computation
      // Since ResumeMatcher.match takes (job, profileName) where profileName represents path resumes/name.txt,
      // we can mock-simulate it or dynamically score the text overlap
      const score = this.calculateTextMatch(job, p.content);
      if (score > highestScore) {
        highestScore = score;
        recommendedProfile = p.profile_name;
      }
    }

    return { recommendedProfile, score: highestScore };
  }

  private static calculateTextMatch(job: Job, content: string): number {
    const jobText = `${job.title} ${job.description}`.toLowerCase();
    const resumeText = content.toLowerCase();

    // Check for exact skill keyword matches
    const commonKeywords = [
      'typescript', 'javascript', 'node.js', 'react', 'python', 'java', 'c++', 
      'go', 'golang', 'aws', 'docker', 'kubernetes', 'postgres', 'sql', 'nosql',
      'machine learning', 'artificial intelligence', 'tensor', 'pytorch', 'statistics'
    ];

    let matchCount = 0;
    let checkedKeywordsCount = 0;

    commonKeywords.forEach(kw => {
      if (jobText.includes(kw)) {
        checkedKeywordsCount++;
        if (resumeText.includes(kw)) {
          matchCount++;
        }
      }
    });

    if (checkedKeywordsCount === 0) {
      return 50; // neutral fallback
    }

    return Math.round((matchCount / checkedKeywordsCount) * 100);
  }
}
