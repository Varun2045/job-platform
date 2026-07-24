import { Job } from '../companies/Scraper.js';
import { FreshnessCalculator } from './FreshnessCalculator.js';

export interface ScoreExplanation {
  skills: number;
  experience: number;
  department: number;
  location: number;
  company: number;
  resume: number;
  title: number;
  total: number;
}

export interface UserDerivedMatchResult {
  totalScore: number;
  scoreExplanation: ScoreExplanation;
  recommendationBadges: string[];
  whyRecommended: string[];
}

export class ExplainableScoringEngine {
  /**
   * Dynamically calculates user-derived match scores, soft penalties, score explanation objects, and recommendation badges per user/query.
   */
  public static calculateMatch(
    job: Job,
    resumeScore: number = 85,
    userPreferredLocation: string = 'India',
    userExperiencePref: string = 'Early Career',
    matchedSkillsList: string[] = ['TypeScript', 'Node.js', 'React'],
  ): UserDerivedMatchResult {
    const titleLower = (job.title || '').toLowerCase();
    const companyLower = (job.company || '').toLowerCase();
    const locationLower = (job.location || '').toLowerCase();
    const jobExp = job.experience || 'Mid Level';

    const badgesSet = new Set<string>();
    const whyBullets: string[] = [];

    // 1. Skills Match (35%)
    let skillsScore = Math.min(100, Math.max(0, resumeScore));
    if (matchedSkillsList.length > 0) {
      whyBullets.push(`✓ ${matchedSkillsList.slice(0, 3).join(', ')} match your technical skills`);
      badgesSet.add('Skill Match');
    }

    // 2. Experience Match (20%) - Soft penalty based on level gap
    let experienceScore = 100;
    const isSeniorJob = /senior|staff|lead|principal|director|manager/i.test(jobExp) || /senior|staff|lead|principal/i.test(titleLower);
    const isEarlyPref = /early|entry|intern|junior|associate/i.test(userExperiencePref);

    if (isSeniorJob && isEarlyPref) {
      experienceScore = 45; // Soft penalty instead of hard drop
      whyBullets.push(`⚠️ Senior position requires higher experience level`);
    } else {
      experienceScore = 95;
      whyBullets.push(`✓ Experience level (${jobExp}) aligns with your profile`);
    }

    // 3. Title Match (10%)
    let titleScore = 70;
    if (/engineer|developer|sde|backend|frontend|fullstack|data|ai/i.test(titleLower)) {
      titleScore = 100;
    }

    // 4. Department Match (10%)
    let deptScore = 90;
    whyBullets.push(`✓ Role in ${job.team || (job as any).primaryDepartment || 'Engineering'}`);

    // 5. Location Match (10%)
    let locationScore = 50;
    if (job.isRemote || locationLower.includes(userPreferredLocation.toLowerCase())) {
      locationScore = 100;
      whyBullets.push(`✓ Location (${job.isRemote ? 'Remote' : job.location}) matches your target area`);
    }

    // 6. Resume Match (10%)
    let resumeMatchScore = Math.min(100, Math.max(0, resumeScore));
    if (resumeMatchScore >= 80) {
      badgesSet.add('Resume Match');
      whyBullets.push(`✓ High resume match score (${resumeMatchScore}%)`);
    }

    // 7. Company Preference (5%)
    let companyScore = 70;
    const tier1Brands = ['google', 'meta', 'amazon', 'microsoft', 'apple', 'uber', 'netflix', 'stripe'];
    if (tier1Brands.some((brand) => companyLower.includes(brand))) {
      companyScore = 100;
      badgesSet.add('Trending Company');
      badgesSet.add('Preferred Company');
      whyBullets.push(`✓ Tier-1 Tech Company (${job.company})`);
    }

    // Freshness check for badges
    const freshness = FreshnessCalculator.calculateScore(job.datePosted);
    if (freshness >= 85) {
      badgesSet.add('Recently Posted');
    }

    // Weighted Formula calculation
    const weightedTotal = Math.round(
      0.35 * skillsScore +
      0.20 * experienceScore +
      0.10 * titleScore +
      0.10 * deptScore +
      0.10 * locationScore +
      0.10 * resumeMatchScore +
      0.05 * companyScore
    );

    if (weightedTotal >= 80) {
      badgesSet.add('Top Match');
    }

    const explanation: ScoreExplanation = {
      skills: Math.round(skillsScore * 0.35),
      experience: Math.round(experienceScore * 0.20),
      title: Math.round(titleScore * 0.10),
      department: Math.round(deptScore * 0.10),
      location: Math.round(locationScore * 0.10),
      resume: Math.round(resumeMatchScore * 0.10),
      company: Math.round(companyScore * 0.05),
      total: weightedTotal,
    };

    return {
      totalScore: weightedTotal,
      scoreExplanation: explanation,
      recommendationBadges: Array.from(badgesSet),
      whyRecommended: whyBullets,
    };
  }
}
