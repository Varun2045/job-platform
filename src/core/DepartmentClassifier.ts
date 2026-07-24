import { ClassificationConfig, DepartmentKeywordConfig } from './ClassificationConfig.js';
import { SynonymNormalizer } from './SynonymNormalizer.js';

export interface DepartmentClassificationResult {
  primaryDepartment: string;
  secondaryDepartments: string[];
  confidence: number;
  matchedKeywords: Array<{ keyword: string; weight: number }>;
  legacyBucket: string;
}

export class DepartmentClassifier {
  /**
   * Classifies primary and secondary departments across 28 categories.
   */
  public static classify(title: string, description: string, team?: string): DepartmentClassificationResult {
    const config = ClassificationConfig.getInstance();
    const departments = config.departmentConfig.departments || [];

    const fullText = `${title || ''} ${team || ''} ${description || ''}`.toLowerCase();
    const normalizedText = SynonymNormalizer.normalizeTextBody(fullText);

    const scores: Array<{
      dept: DepartmentKeywordConfig;
      score: number;
      matches: Array<{ keyword: string; weight: number }>;
    }> = [];

    for (const dept of departments) {
      let totalScore = 0;
      const matched: Array<{ keyword: string; weight: number }> = [];

      for (const kw of dept.keywords) {
        const kwLower = kw.keyword.toLowerCase();
        const weight = kw.currentWeight || kw.defaultWeight || 5;
        const escaped = kwLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        // Title matches get double weight
        const titleRegex = new RegExp(`\\b${escaped}\\b`, 'i');
        if (titleRegex.test(title.toLowerCase())) {
          totalScore += weight * 2;
          matched.push({ keyword: kw.keyword, weight: weight * 2 });
        } else if (titleRegex.test(normalizedText)) {
          totalScore += weight;
          matched.push({ keyword: kw.keyword, weight });
        }
      }

      if (totalScore > 0) {
        scores.push({ dept, score: totalScore, matches: matched });
      }
    }

    scores.sort((a, b) => b.score - a.score);

    if (scores.length === 0) {
      return {
        primaryDepartment: 'Software Engineering',
        secondaryDepartments: [],
        confidence: 60,
        matchedKeywords: [],
        legacyBucket: 'engineering',
      };
    }

    const primary = scores[0];
    const secondaries = scores.slice(1, 3).map((s) => s.dept.displayName);
    const confidence = Math.min(100, Math.max(65, Math.round(70 + Math.min(primary.score, 30))));

    return {
      primaryDepartment: primary.dept.displayName,
      secondaryDepartments: secondaries,
      confidence: confidence,
      matchedKeywords: primary.matches,
      legacyBucket: primary.dept.legacyBucket || 'engineering',
    };
  }
}
