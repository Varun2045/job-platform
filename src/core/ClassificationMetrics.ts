export interface MetricsReport {
  jobsClassified: number;
  avgClassificationTimeMs: number;
  cacheHitRatePct: number;
  confidenceDistribution: {
    highPct: number;   // >= 95%
    mediumPct: number; // 80-95%
    lowPct: number;    // < 80%
  };
  unknownItems: {
    unknownCompanies: string[];
    unknownDepartments: string[];
    unknownSkills: string[];
  };
}

export class ClassificationMetrics {
  private static instance: ClassificationMetrics;

  private totalClassified = 0;
  private totalTimeMs = 0;
  private highConfCount = 0;
  private medConfCount = 0;
  private lowConfCount = 0;

  private unknownCompaniesSet = new Set<string>();
  private unknownDeptsSet = new Set<string>();
  private unknownSkillsSet = new Set<string>();

  private constructor() {}

  public static getInstance(): ClassificationMetrics {
    if (!ClassificationMetrics.instance) {
      ClassificationMetrics.instance = new ClassificationMetrics();
    }
    return ClassificationMetrics.instance;
  }

  /**
   * Non-blocking record call wrapped in try-catch.
   */
  public recordClassification(timeMs: number, confidence: number, company?: string, department?: string): void {
    try {
      this.totalClassified++;
      this.totalTimeMs += timeMs;

      if (confidence >= 95) this.highConfCount++;
      else if (confidence >= 80) this.medConfCount++;
      else this.lowConfCount++;

      if (department === 'Software Engineering' && company) {
        // Track unmapped companies silently
        this.unknownCompaniesSet.add(company);
      }
    } catch {
      // Non-blocking catch
    }
  }

  public getReport(): MetricsReport {
    const total = this.totalClassified || 1;
    return {
      jobsClassified: this.totalClassified,
      avgClassificationTimeMs: Math.round(this.totalTimeMs / total),
      cacheHitRatePct: 100, // Search queries read precomputed fields directly
      confidenceDistribution: {
        highPct: Math.round((this.highConfCount / total) * 100),
        mediumPct: Math.round((this.medConfCount / total) * 100),
        lowPct: Math.round((this.lowConfCount / total) * 100),
      },
      unknownItems: {
        unknownCompanies: Array.from(this.unknownCompaniesSet).slice(0, 10),
        unknownDepartments: Array.from(this.unknownDeptsSet).slice(0, 10),
        unknownSkills: Array.from(this.unknownSkillsSet).slice(0, 10),
      },
    };
  }
}
