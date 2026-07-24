export class FreshnessCalculator {
  /**
   * Calculates a continuous decay freshness score (0 to 100).
   */
  public static calculateScore(datePosted: string | Date): number {
    try {
      const postedMs = new Date(datePosted).getTime();
      if (isNaN(postedMs)) return 50;

      const diffMs = Date.now() - postedMs;
      const diffHours = diffMs / (1000 * 60 * 60);

      if (diffHours <= 24) return 100;
      if (diffHours <= 72) return 85;
      if (diffHours <= 168) return 63; // 7 days
      if (diffHours <= 336) return 40; // 14 days
      return 15;
    } catch {
      return 50;
    }
  }
}
