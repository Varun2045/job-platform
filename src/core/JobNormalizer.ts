import crypto from 'crypto';
import { RawJob, Job, CompanyConfig } from '../companies/Scraper.js';
import { SkillNormalizer } from './ResumeMatcher.js';
import { HybridExperienceClassifier } from './HybridExperienceClassifier.js';
import { DepartmentClassifier } from './DepartmentClassifier.js';
import { JobTagger } from './JobTagger.js';
import { FreshnessCalculator } from './FreshnessCalculator.js';
import { ClassificationConfig } from './ClassificationConfig.js';
import { ClassificationMetrics } from './ClassificationMetrics.js';

export class JobNormalizer {
  /**
   * Helper to strip HTML tags and clean up whitespace.
   */
  public static cleanHtml(html: string): string {
    if (!html) return '';
    // Strip tags
    let text = html.replace(/<[^>]*>/g, ' ');
    // Decode common entities
    text = text
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");
    // Normalize spaces
    return text.replace(/\s+/g, ' ').trim();
  }

  /**
   * Normalizes a RawJob into a canonical Job model.
   */
  public static normalize(raw: RawJob, company: CompanyConfig): Job {
    const cleanedTitle = SkillNormalizer.normalizeText(this.cleanHtml(raw.title) || 'Software Engineer');
    const cleanedLocation = this.cleanHtml(raw.location) || 'India';
    const cleanedDescription = SkillNormalizer.normalizeText(this.cleanHtml(raw.description || ''));

    // Heuristics for remote
    const isRemote = !!(
      raw.isRemote ||
      /remote/i.test(cleanedTitle) ||
      /remote/i.test(cleanedLocation) ||
      /work from home/i.test(cleanedDescription.slice(0, 1000))
    );

    // Heuristics for country
    let country = raw.country || 'India';
    if (!raw.country) {
      if (
        /india/i.test(cleanedLocation) ||
        /bangalore|bengaluru|hyderabad|pune|gurugram|noida|chennai|mumbai/i.test(cleanedLocation)
      ) {
        country = 'India';
      } else if (isRemote) {
        country = 'India'; // default remote jobs to target location
      } else {
        country = 'Global';
      }
    }

    const startMs = Date.now();

    // 1. Production-Grade Hybrid Experience Classification
    const expResult = HybridExperienceClassifier.classify(cleanedTitle, cleanedDescription, raw.experience, raw.company);

    // 2. Production-Grade 28-Category Department Classification
    const deptResult = DepartmentClassifier.classify(cleanedTitle, cleanedDescription, raw.team);

    // 3. Automated Job Tagging & Quality Flags
    const tagResult = JobTagger.tag({
      title: cleanedTitle,
      description: cleanedDescription,
      location: cleanedLocation,
      isRemote,
      experience: expResult.level,
      employmentType: raw.employmentType || 'Full-time',
      salary: raw.salary || 'Not Specified',
      source: raw.source || company.detected_ats || 'unknown',
      company: raw.company,
    });

    // 4. Continuous Freshness Score
    const datePostedStr = raw.datePosted || new Date().toISOString();
    const freshnessScore = FreshnessCalculator.calculateScore(datePostedStr);

    // Standardize source name
    const source = raw.source || company.detected_ats || 'unknown';

    // Generate unique Job Hash (Deduplication Key)
    const normalizedCompany = raw.company.trim().toLowerCase();
    const normalizedId = raw.id.trim();
    const jobHash = crypto.createHash('sha256').update(`${normalizedCompany}_${normalizedId}`).digest('hex');

    const versionsMap = ClassificationConfig.getInstance().getConfigVersionsMap();

    // Non-blocking telemetry metrics recording
    ClassificationMetrics.getInstance().recordClassification(
      Date.now() - startMs,
      expResult.confidence,
      raw.company,
      deptResult.primaryDepartment
    );

    return {
      company: raw.company,
      id: raw.id,
      title: cleanedTitle,
      location: cleanedLocation,
      country: country,
      experience: expResult.legacyBucket, // Legacy compatibility bucket (Early Career, Mid Level, Senior)
      employmentType: raw.employmentType || 'Full-time',
      url: raw.url,
      datePosted: datePostedStr,
      team: deptResult.primaryDepartment,
      source: source,
      isRemote: isRemote,
      salary: raw.salary || 'Not Specified',
      description: cleanedDescription,
      jobHash: jobHash,
      // Precomputed Metadata
      classificationVersion: 'v1',
      configVersionsMap: versionsMap,
      experienceLevel: expResult.level,
      experienceReason: expResult.reason,
      experienceSource: expResult.source,
      primaryDepartment: deptResult.primaryDepartment,
      secondaryDepartments: deptResult.secondaryDepartments,
      tags: tagResult.tags,
      qualityFlags: tagResult.qualityFlags,
      confidenceBreakdown: {
        overall: Math.round((expResult.confidence + deptResult.confidence + tagResult.confidence) / 3),
        experience: expResult.confidence,
        department: deptResult.confidence,
        location: 100,
        tags: tagResult.confidence,
      },
      freshnessScore: freshnessScore,
      classificationHistory: [
        {
          classificationVersion: 'v1',
          timestamp: new Date().toISOString(),
          level: expResult.level,
          primaryDepartment: deptResult.primaryDepartment,
          confidence: Math.round((expResult.confidence + deptResult.confidence) / 2),
        },
      ],
    };
  }
}
