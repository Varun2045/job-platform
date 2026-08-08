import fs from 'fs';
import path from 'path';
import { Logger } from './Logger.js';

export interface ExtractorStats {
  successCount: number;
  failureCount: number;
  avgRuntimeMs: number;
  avgJobsFound: number;
  lastValidationDate: string | null;
  lastFailureReason: string | null;
  confidence: number; // 0 to 100
}

export interface CompanyHistory {
  companyId: string;
  preferredExtractor: string | null;
  lastSuccessfulExtractor: string | null;
  stats: Record<string, ExtractorStats>; // key: extractorName
}

export class ExtractorRegistry {
  private static registryFile = path.join(process.cwd(), 'storage', 'extractor_registry.json');
  private static data: Record<string, CompanyHistory> = {};

  static {
    this.load();
  }

  private static load(): void {
    try {
      const dir = path.dirname(this.registryFile);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      if (fs.existsSync(this.registryFile)) {
        this.data = JSON.parse(fs.readFileSync(this.registryFile, 'utf8'));
      }
    } catch (err: any) {
      Logger.error('[ExtractorRegistry] Failed to load registry file', err);
    }
  }

  private static save(): void {
    try {
      fs.writeFileSync(this.registryFile, JSON.stringify(this.data, null, 2), 'utf8');
    } catch (err: any) {
      Logger.error('[ExtractorRegistry] Failed to write registry file', err);
    }
  }

  public static getHistory(companyId: string): CompanyHistory | null {
    return this.data[companyId] || null;
  }

  public static recordRun(
    companyId: string,
    extractorName: string,
    success: boolean,
    durationMs: number,
    jobsFound: number,
    errorMsg?: string
  ): void {
    if (!this.data[companyId]) {
      this.data[companyId] = {
        companyId,
        preferredExtractor: null,
        lastSuccessfulExtractor: null,
        stats: {}
      };
    }

    const history = this.data[companyId];
    if (!history.stats[extractorName]) {
      history.stats[extractorName] = {
        successCount: 0,
        failureCount: 0,
        avgRuntimeMs: 0,
        avgJobsFound: 0,
        lastValidationDate: null,
        lastFailureReason: null,
        confidence: 50 // initial baseline
      };
    }

    const stats = history.stats[extractorName];

    if (success) {
      stats.successCount++;
      stats.avgRuntimeMs = Math.round((stats.avgRuntimeMs * (stats.successCount - 1) + durationMs) / stats.successCount);
      stats.avgJobsFound = Math.round((stats.avgJobsFound * (stats.successCount - 1) + jobsFound) / stats.successCount);
      history.lastSuccessfulExtractor = extractorName;
    } else {
      stats.failureCount++;
      stats.lastFailureReason = errorMsg || 'Unknown error';
    }

    stats.lastValidationDate = new Date().toISOString();

    // Confidence: Success rate penalized slightly by high runtime latency
    const successRate = stats.successCount / (stats.successCount + stats.failureCount || 1);
    const latencyPenalty = Math.min(15, stats.avgRuntimeMs / 1000); // max 15% penalty for slow runtimes
    stats.confidence = Math.max(0, Math.round(successRate * 100 - latencyPenalty));

    // Update preferred extractor (highest confidence above 40%)
    let bestExtractor: string | null = null;
    let maxConfidence = -1;

    for (const [name, s] of Object.entries(history.stats)) {
      if (s.confidence > maxConfidence && s.confidence >= 40) {
        maxConfidence = s.confidence;
        bestExtractor = name;
      }
    }
    history.preferredExtractor = bestExtractor;

    this.save();
  }

  public static getAllHistory(): Record<string, CompanyHistory> {
    return this.data;
  }

  public static clear(): void {
    this.data = {};
    this.save();
  }
}
