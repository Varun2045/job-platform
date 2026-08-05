import crypto from 'crypto';
import { RawJob, Job, CompanyConfig } from '../companies/Scraper.js';
import { HybridExperienceClassifier } from './HybridExperienceClassifier.js';
import { DepartmentClassifier } from './DepartmentClassifier.js';
import { JobTagger } from './JobTagger.js';
import { FreshnessCalculator } from './FreshnessCalculator.js';
import { ClassificationConfig } from './ClassificationConfig.js';
import { ClassificationMetrics } from './ClassificationMetrics.js';

class SkillNormalizer {
  static normalizeText(text: string): string {
    return text.trim().replace(/\s+/g, ' ');
  }
}

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

  public static normalizeExperienceLevel(level: string): string {
    const normalized = (level || '').trim();
    const lower = normalized.toLowerCase();
    
    if (lower === 'intern' || lower.includes('internship') || lower.includes('co-op')) return 'Internship';
    if (lower === 'new grad' || lower.includes('new graduate') || lower.includes('fresher') || lower.includes('campus hire')) return 'New Graduate';
    if (lower.includes('entry level') || lower.includes('early career') || lower.includes('junior') || lower.includes('jr.')) return 'Entry Level (0–2 Years)';
    if (lower.includes('associate') || lower.includes('sde i') || lower.includes('swe i') || lower.includes('level 1')) return 'Associate (1–3 Years)';
    if (lower.includes('mid level') || lower.includes('mid') || lower.includes('sde ii') || lower.includes('swe ii') || lower.includes('level 2')) return 'Mid Level (2–5 Years)';
    if (lower.includes('senior') || lower.includes('sr.') || lower.includes('sde iii') || lower.includes('swe iii') || lower.includes('level 3')) return 'Senior (5–8 Years)';
    if (lower.includes('staff')) return 'Staff Engineer';
    if (lower.includes('principal') || lower.includes('distinguished') || lower.includes('fellow')) return 'Principal Engineer';
    if (lower.includes('engineering manager') || lower.includes('em') || lower.includes('development manager') || lower.includes('lead manager')) return 'Engineering Manager';
    if (lower.includes('director')) return 'Director';
    if (lower.includes('vp') || lower.includes('vice president') || lower.includes('executive') || lower.includes('cto') || lower.includes('chief architect')) return 'Executive';
    
    return 'Mid Level (2–5 Years)';
  }

  public static normalizeEmploymentType(emp: string): string {
    const normalized = (emp || '').trim().toLowerCase().replace(/[-_]/g, ' ');
    if (normalized.includes('full time') || normalized.includes('fulltime') || normalized.includes('permanent')) return 'Full-time';
    if (normalized.includes('part time') || normalized.includes('parttime')) return 'Part-time';
    if (normalized.includes('intern') || normalized.includes('co op')) return 'Internship';
    if (normalized.includes('contract') || normalized.includes('temp') || normalized.includes('temporary')) return 'Temporary';
    if (normalized.includes('freelance')) return 'Freelance';
    if (normalized.includes('apprentice') || normalized.includes('trainee')) return 'Apprenticeship';
    if (normalized.includes('graduate')) return 'Graduate Program';
    if (normalized.includes('co-op')) return 'Co-op';
    if (normalized.includes('seasonal')) return 'Seasonal';
    if (normalized.includes('volunteer')) return 'Volunteer';
    if (normalized.includes('consult')) return 'Consultant';
    return 'Full-time'; // Default fallback
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
      employmentType: JobNormalizer.normalizeEmploymentType(raw.employmentType || 'Full-time'),
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
      experienceLevel: JobNormalizer.normalizeExperienceLevel(expResult.level),
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
          level: JobNormalizer.normalizeExperienceLevel(expResult.level),
          primaryDepartment: deptResult.primaryDepartment,
          confidence: Math.round((expResult.confidence + deptResult.confidence) / 2),
        },
      ],
    };
  }
}
