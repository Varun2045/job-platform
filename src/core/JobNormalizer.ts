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

    // Parse salary min, max, and currency code
    let salaryMin = 0;
    let salaryMax = 0;
    let salaryCurrency = 'USD';
    const salaryStr = raw.salary || '';
    if (salaryStr && salaryStr !== 'Not Specified') {
      if (salaryStr.includes('₹') || salaryStr.includes('INR') || salaryStr.includes('LPA') || salaryStr.includes('Lakh')) {
        salaryCurrency = 'INR';
      } else if (salaryStr.includes('€') || salaryStr.includes('EUR')) {
        salaryCurrency = 'EUR';
      } else if (salaryStr.includes('£') || salaryStr.includes('GBP')) {
        salaryCurrency = 'GBP';
      }

      const numbers = salaryStr.replace(/,/g, '').match(/\d+/g);
      if (numbers && numbers.length > 0) {
        const nums = numbers.map(Number);
        if (nums.length === 1) {
          salaryMin = nums[0];
          salaryMax = nums[0];
        } else if (nums.length >= 2) {
          salaryMin = Math.min(nums[0], nums[1]);
          salaryMax = Math.max(nums[0], nums[1]);
        }
        if (salaryCurrency === 'INR' && salaryStr.toLowerCase().includes('lpa')) {
          salaryMin = salaryMin * 100000;
          salaryMax = salaryMax * 100000;
        }
      }
    }

    // Extract skills dynamically matching synonyms
    const synonymsObj = ClassificationConfig.getInstance().synonymsConfig?.synonyms || {};
    const skillSet = new Set<string>();
    const descLower = cleanedDescription.toLowerCase();
    const titleLower = cleanedTitle.toLowerCase();
    for (const [key, canonical] of Object.entries(synonymsObj)) {
      if (titleLower.includes(key.toLowerCase()) || descLower.includes(key.toLowerCase())) {
        skillSet.add(canonical);
      }
    }
    const requiredSkills = Array.from(skillSet);
    const preferredSkills = requiredSkills.slice(0, Math.max(1, Math.floor(requiredSkills.length / 3)));

    // Parse location hierarchy
    const locationParts = cleanedLocation.split(',').map((p) => p.trim()).filter(Boolean);
    let city = 'Other';
    let state = 'Other';
    let countryVal = country;
    if (locationParts.length === 1) {
      city = locationParts[0];
    } else if (locationParts.length === 2) {
      city = locationParts[0];
      countryVal = locationParts[1];
    } else if (locationParts.length >= 3) {
      city = locationParts[0];
      state = locationParts[1];
      countryVal = locationParts[2];
    }
    const locationHierarchy = {
      country: countryVal,
      state,
      city,
    };

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
      salaryMin,
      salaryMax,
      salaryCurrency,
      requiredSkills,
      preferredSkills,
      locationHierarchy,
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
