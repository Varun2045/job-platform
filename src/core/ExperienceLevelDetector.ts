/**
 * Experience Level Detection Utility
 * Helps classify job experience levels from job titles and descriptions
 */

export enum ExperienceLevel {
  ENTRY_LEVEL = 'Entry Level',
  ASSOCIATE = 'Associate',
  MID_LEVEL = 'Mid Level',
  SENIOR = 'Senior',
  LEAD = 'Lead',
  MANAGER = 'Manager',
  DIRECTOR = 'Director',
  EXECUTIVE = 'Executive',
  UNKNOWN = 'Unknown'
}

export interface ExperienceLevelResult {
  level: ExperienceLevel;
  confidence: number;
  reason: string;
}

export class ExperienceLevelDetector {
  private static ENTRY_LEVEL_PATTERNS = [
    // Common entry-level patterns
    /\bentry[- ]?level\b/i,
    /\bjunior\b/i,
    /\bintern\b/i,
    /\binternship\b/i,
    /\bgraduate\b/i,
    /\btrainee\b/i,
    /\bco-op\b/i,
    /\bstudent\b/i,
    /\bcampus\b/i,
    /\b0[- ]?\d?\s*(years?|yrs?)\s*(of\s*)?(experience|exp)\b/i,
    /\bfresh?\s*grad\b/i,
    /\bnew\s*grad\b/i,
    /\brecent\s*grad\b/i,
    /\b[- ]?1\s*(years?|yrs?)\s*(of\s*)?(experience|exp)\b/i,
    /\b[- ]?\d?\s*[- ]?1\s*(years?|yrs?)\s*(of\s*)?(experience|exp)\b/i,
  ];

  private static ASSOCIATE_PATTERNS = [
    /\bassociate\b/i,
    /\b[- ]?2\s*(years?|yrs?)\s*(of\s*)?(experience|exp)\b/i,
    /\b[- ]?1[- ]?2\s*(years?|yrs?)\s*(of\s*)?(experience|exp)\b/i,
  ];

  private static MID_LEVEL_PATTERNS = [
    /\b[- ]?3[- ]?5\s*(years?|yrs?)\s*(of\s*)?(experience|exp)\b/i,
    /\b[- ]?3\s*(years?|yrs?)\s*(of\s*)?(experience|exp)\b/i,
    /\b[- ]?4\s*(years?|yrs?)\s*(of\s*)?(experience|exp)\b/i,
    /\b[- ]?5\s*(years?|yrs?)\s*(of\s*)?(experience|exp)\b/i,
  ];

  private static SENIOR_PATTERNS = [
    /\bsenior\b/i,
    /\bsr\.?\b/i,
    /\bstaff\b/i,
    /\b[- ]?5[- ]?8\s*(years?|yrs?)\s*(of\s*)?(experience|exp)\b/i,
    /\b[- ]?6\s*(years?|yrs?)\s*(of\s*)?(experience|exp)\b/i,
    /\b[- ]?7\s*(years?|yrs?)\s*(of\s*)?(experience|exp)\b/i,
    /\b[- ]?8\s*(years?|yrs?)\s*(of\s*)?(experience|exp)\b/i,
  ];

  private static LEAD_PATTERNS = [
    /\blead\b/i,
    /\bprincipal\b/i,
    /\b[- ]?8[- ]?10\s*(years?|yrs?)\s*(of\s*)?(experience|exp)\b/i,
    /\b[- ]?9\s*(years?|yrs?)\s*(of\s*)?(experience|exp)\b/i,
    /\b[- ]?10\s*(years?|yrs?)\s*(of\s*)?(experience|exp)\b/i,
  ];

  private static MANAGER_PATTERNS = [
    /\bmanager\b/i,
    /\bhead\b/i,
    /\bpeople\s*manager\b/i,
    /\bengineering\s*manager\b/i,
    /\btechnical\s*manager\b/i,
    /\b[- ]?10[- ]?\d+\s*(years?|yrs?)\s*(of\s*)?(experience|exp)\b/i,
  ];

  private static DIRECTOR_PATTERNS = [
    /\bdirector\b/i,
    /\bvp\b/i,
    /\bvice\s*president\b/i,
  ];

  private static EXECUTIVE_PATTERNS = [
    /\bexecutive\b/i,
    /\bceo\b/i,
    /\bcto\b/i,
    /\bcfo\b/i,
    /\bcoo\b/i,
    /\bc[- ]?level\b/i,
  ];

  /**
   * Detect experience level from job title and description
   */
  public static detect(
    title: string,
    description?: string
  ): ExperienceLevelResult {
    const titleLower = title.toLowerCase();
    const descLower = (description || '').toLowerCase();
    const combinedText = `${titleLower} ${descLower}`;

    // Check for executive level first (highest priority)
    if (this.EXECUTIVE_PATTERNS.some(pattern => pattern.test(titleLower))) {
      return {
        level: ExperienceLevel.EXECUTIVE,
        confidence: 0.9,
        reason: 'Executive pattern found in title'
      };
    }

    // Check for director level
    if (this.DIRECTOR_PATTERNS.some(pattern => pattern.test(titleLower))) {
      return {
        level: ExperienceLevel.DIRECTOR,
        confidence: 0.9,
        reason: 'Director pattern found in title'
      };
    }

    // Check for manager level
    if (this.MANAGER_PATTERNS.some(pattern => pattern.test(titleLower))) {
      return {
        level: ExperienceLevel.MANAGER,
        confidence: 0.9,
        reason: 'Manager pattern found in title'
      };
    }

    // Check for lead level
    if (this.LEAD_PATTERNS.some(pattern => pattern.test(titleLower))) {
      return {
        level: ExperienceLevel.LEAD,
        confidence: 0.85,
        reason: 'Lead pattern found in title'
      };
    }

    // Check for senior level
    if (this.SENIOR_PATTERNS.some(pattern => pattern.test(combinedText))) {
      return {
        level: ExperienceLevel.SENIOR,
        confidence: 0.8,
        reason: 'Senior pattern found in title or description'
      };
    }

    // Check for associate level
    if (this.ASSOCIATE_PATTERNS.some(pattern => pattern.test(combinedText))) {
      return {
        level: ExperienceLevel.ASSOCIATE,
        confidence: 0.75,
        reason: 'Associate pattern found in title or description'
      };
    }

    // Check for entry level
    if (this.ENTRY_LEVEL_PATTERNS.some(pattern => pattern.test(combinedText))) {
      return {
        level: ExperienceLevel.ENTRY_LEVEL,
        confidence: 0.85,
        reason: 'Entry level pattern found in title or description'
      };
    }

    // Default to mid-level if no specific patterns found
    return {
      level: ExperienceLevel.MID_LEVEL,
      confidence: 0.3,
      reason: 'No specific experience level pattern found, defaulting to mid-level'
    };
  }

  /**
   * Check if a job is entry-level (for filtering purposes)
   */
  public static isEntryLevel(title: string, description?: string): boolean {
    const result = this.detect(title, description);
    return result.level === ExperienceLevel.ENTRY_LEVEL || 
           result.level === ExperienceLevel.ASSOCIATE;
  }

  /**
   * Check if a job is senior or above (for filtering purposes)
   */
  public static isSeniorOrAbove(title: string, description?: string): boolean {
    const result = this.detect(title, description);
    return [
      ExperienceLevel.SENIOR,
      ExperienceLevel.LEAD,
      ExperienceLevel.MANAGER,
      ExperienceLevel.DIRECTOR,
      ExperienceLevel.EXECUTIVE
    ].includes(result.level);
  }

  /**
   * Extract years of experience from text
   */
  public static extractYearsOfExperience(text: string): number | null {
    const patterns = [
      /(\d+)\s*[- ]?\s*(years?|yrs?)\s*(of\s*)?(experience|exp)/i,
      /(\d+)\s*\+\s*(years?|yrs?)\s*(of\s*)?(experience|exp)/i,
      /experience\s*[:\-]?\s*(\d+)\s*[- ]?\s*(years?|yrs?)/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return parseInt(match[1], 10);
      }
    }

    return null;
  }
}
