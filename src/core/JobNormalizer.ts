import crypto from 'crypto';
import { RawJob, Job, CompanyConfig } from '../companies/Scraper.js';
import { SkillNormalizer } from './SkillNormalizer.js';

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
      if (/india/i.test(cleanedLocation) || /bangalore|bengaluru|hyderabad|pune|gurugram|noida|chennai|mumbai/i.test(cleanedLocation)) {
        country = 'India';
      } else if (isRemote) {
        country = 'India'; // default remote jobs to target location
      } else {
        country = 'Global';
      }
    }

    // Heuristics for experience level
    let experience = raw.experience || 'Entry Level';
    if (!raw.experience) {
      const descLower = cleanedDescription.toLowerCase();
      const titleLower = cleanedTitle.toLowerCase();
      if (/graduate|intern|new grad|university graduate|early career|entry level/i.test(titleLower) || /graduate|intern|new grad/i.test(descLower)) {
        experience = 'Early Career';
      } else if (/senior|sr\.|lead|principal/i.test(titleLower)) {
        experience = 'Senior';
      } else if (/manager|director|vp/i.test(titleLower)) {
        experience = 'Management';
      } else {
        experience = 'Mid Level';
      }
    }

    // Standardize source name
    const source = raw.source || company.detected_ats || 'unknown';

    // Generate unique Job Hash (Deduplication Key)
    const normalizedCompany = raw.company.trim().toLowerCase();
    const normalizedId = raw.id.trim();
    const jobHash = crypto
      .createHash('sha256')
      .update(`${normalizedCompany}_${normalizedId}`)
      .digest('hex');

    return {
      company: raw.company,
      id: raw.id,
      title: cleanedTitle,
      location: cleanedLocation,
      country: country,
      experience: experience,
      employmentType: raw.employmentType || 'Full-time',
      url: raw.url,
      datePosted: raw.datePosted || new Date().toISOString(),
      team: raw.team || 'Engineering',
      source: source,
      isRemote: isRemote,
      salary: raw.salary || 'Not Specified',
      description: cleanedDescription,
      jobHash: jobHash
    };
  }
}
