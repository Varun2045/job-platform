import { ClassificationConfig, ExperienceLevelConfig } from './ClassificationConfig.js';
import { SynonymNormalizer } from './SynonymNormalizer.js';

export type ExperienceClassificationSource =
  | 'ExplicitExperience'
  | 'ATSField'
  | 'CompanyMapping'
  | 'TitleInference'
  | 'RequirementsInference'
  | 'Fallback';

export interface ExperienceClassificationResult {
  level: string;
  confidence: number;
  source: ExperienceClassificationSource;
  reason: string;
  legacyBucket: string;
  minYears: number;
  maxYears: number;
}

export class HybridExperienceClassifier {
  /**
   * Classifies experience level using the production hybrid priority pipeline.
   */
  public static classify(
    title: string,
    description: string,
    rawExperience?: string,
    companyName?: string,
  ): ExperienceClassificationResult {
    const config = ClassificationConfig.getInstance();
    const levels = config.experienceConfig.levels || [];
    const companies = config.companyLevelConfig.companies || {};

    const cleanTitle = (title || '').trim();
    const titleLower = cleanTitle.toLowerCase();
    const descLower = (description || '').toLowerCase();
    const rawExpStr = (rawExperience || '').trim();
    const compLower = (companyName || '').trim().toLowerCase();

    // Priority 1: Explicit Experience Requirements in Title/Description (e.g. 0-2 years, 5+ years)
    const explicitYearsMatch =
      /(\b[0-9]+)\s*[-–to]+\s*([0-9]+)\s*(?:years?|yrs?)/i.exec(`${titleLower} ${rawExpStr} ${descLower.slice(0, 1500)}`) ||
      /(\b[0-9]+)\+\s*(?:years?|yrs?)/i.exec(`${titleLower} ${rawExpStr} ${descLower.slice(0, 1500)}`);

    if (explicitYearsMatch) {
      const minY = parseInt(explicitYearsMatch[1], 10);
      const maxY = explicitYearsMatch[2] ? parseInt(explicitYearsMatch[2], 10) : minY + 5;

      const matchedLevel = this.matchByYears(minY, maxY, levels);
      if (matchedLevel) {
        return {
          level: matchedLevel.displayName,
          confidence: 100,
          source: 'ExplicitExperience',
          reason: `Matched explicit experience requirement "${explicitYearsMatch[0]}".`,
          legacyBucket: matchedLevel.legacyBucket,
          minYears: matchedLevel.minYears,
          maxYears: matchedLevel.maxYears,
        };
      }
    }

    // Priority 2: Structured ATS Field (e.g. Workday/Greenhouse/Lever raw experience string)
    if (rawExpStr && rawExpStr !== 'Not Specified') {
      const matched = this.matchByPattern(rawExpStr.toLowerCase(), levels);
      if (matched) {
        return {
          level: matched.displayName,
          confidence: 90,
          source: 'ATSField',
          reason: `Matched structured ATS field value "${rawExpStr}".`,
          legacyBucket: matched.legacyBucket,
          minYears: matched.minYears,
          maxYears: matched.maxYears,
        };
      }
    }

    // Priority 3: Company-Specific Job Level Mappings (Google L3, Meta E4, Amazon L6, etc.)
    if (compLower && companies[compLower]) {
      const compLevels = companies[compLower];
      for (const [levelCode, mappedLevelName] of Object.entries(compLevels)) {
        const escaped = levelCode.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`\\b${escaped}\\b`, 'i');
        if (regex.test(titleLower)) {
          const matchedLvl = levels.find((l) => l.displayName === mappedLevelName || l.id === mappedLevelName);
          const legacy = matchedLvl ? matchedLvl.legacyBucket : this.getLegacyBucketByName(mappedLevelName);
          return {
            level: mappedLevelName,
            confidence: 95,
            source: 'CompanyMapping',
            reason: `Matched company-specific level mapping for ${companyName}: "${levelCode}" -> "${mappedLevelName}".`,
            legacyBucket: legacy,
            minYears: matchedLvl?.minYears ?? 2,
            maxYears: matchedLvl?.maxYears ?? 5,
          };
        }
      }
    }

    // Priority 4: Title Keyword Inference
    const titleMatch = this.matchByPattern(titleLower, levels);
    if (titleMatch) {
      return {
        level: titleMatch.displayName,
        confidence: 85,
        source: 'TitleInference',
        reason: `Inferred level from job title keyword in "${cleanTitle}".`,
        legacyBucket: titleMatch.legacyBucket,
        minYears: titleMatch.minYears,
        maxYears: titleMatch.maxYears,
      };
    }

    // Priority 5: Requirements Text Inference
    const descMatch = this.matchByPattern(descLower.slice(0, 1500), levels);
    if (descMatch) {
      return {
        level: descMatch.displayName,
        confidence: 75,
        source: 'RequirementsInference',
        reason: `Inferred level from job requirements text.`,
        legacyBucket: descMatch.legacyBucket,
        minYears: descMatch.minYears,
        maxYears: descMatch.maxYears,
      };
    }

    // Priority 6: Fallback (Default to Mid Level)
    const defaultLevel = levels.find((l) => l.id === 'mid_level') || levels[4];
    return {
      level: defaultLevel ? defaultLevel.displayName : 'Mid Level (2–5 Years)',
      confidence: 60,
      source: 'Fallback',
      reason: `Default fallback assigned.`,
      legacyBucket: 'Mid Level',
      minYears: 2,
      maxYears: 5,
    };
  }

  private static matchByYears(minY: number, maxY: number, levels: ExperienceLevelConfig[]): ExperienceLevelConfig | null {
    for (const lvl of levels) {
      if (minY >= lvl.minYears && minY <= lvl.maxYears) {
        return lvl;
      }
    }
    return null;
  }

  private static matchByPattern(text: string, levels: ExperienceLevelConfig[]): ExperienceLevelConfig | null {
    for (const lvl of levels) {
      for (const pat of lvl.explicitPatterns) {
        const escaped = pat.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const reg = new RegExp(`\\b${escaped}\\b`, 'i');
        if (reg.test(text)) {
          return lvl;
        }
      }
    }
    return null;
  }

  private static getLegacyBucketByName(name: string): string {
    const lower = name.toLowerCase();
    if (lower.includes('intern') || lower.includes('entry') || lower.includes('associate') || lower.includes('graduate')) {
      return 'Early Career';
    }
    if (lower.includes('senior') || lower.includes('staff') || lower.includes('principal') || lower.includes('director') || lower.includes('manager') || lower.includes('executive')) {
      return 'Senior';
    }
    return 'Mid Level';
  }
}
