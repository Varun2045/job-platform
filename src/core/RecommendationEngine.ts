import { Job, CompanyConfig } from '../companies/Scraper.js';
import { ExtendedSettings } from '../storage/StorageProvider.js';

export interface ScoredJobRecommendation {
  job: Job;
  matchScore: number;
  opportunityScore: number;
  breakdown: {
    match: number;
    growth: number;
    quality: number;
    freshness: number;
    competition: number;
    remote: number;
    location: number;
    experience: number;
  };
}

export class RecommendationEngine {
  public static calculateOpportunityScore(
    job: Job,
    matchScore: number,
    company: CompanyConfig | null,
    settings: ExtendedSettings | null,
  ): ScoredJobRecommendation {
    const titleLower = job.title.toLowerCase();
    const companyLower = job.company.toLowerCase();
    const locationLower = job.location.toLowerCase();

    // 1. Resume Match Score (35%)
    const scoreMatch = matchScore;

    // 2. Career Growth (10%)
    let scoreGrowth = 70;
    if (/senior|lead|principal|staff|manager|architect/i.test(titleLower)) {
      scoreGrowth = 100;
    } else if (/junior|intern|associate/i.test(titleLower)) {
      scoreGrowth = 40;
    }

    // 3. Company Quality (10%)
    let scoreQuality = 70;
    if (company) {
      const p = company.priority || 5;
      if (p <= 2) scoreQuality = 100;
      else if (p <= 5) scoreQuality = 80;
      else if (p <= 8) scoreQuality = 60;
      else scoreQuality = 40;
    }

    // 4. Freshness (10%)
    let scoreFreshness = 50;
    try {
      const postedDate = new Date(job.datePosted);
      const diffMs = Date.now() - postedDate.getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);
      if (diffDays <= 1) scoreFreshness = 100;
      else if (diffDays <= 3) scoreFreshness = 85;
      else if (diffDays <= 7) scoreFreshness = 65;
      else scoreFreshness = 30;
    } catch {}

    // 5. Competition (10%)
    let scoreCompetition = 80;
    const highCompBrands = ['google', 'apple', 'microsoft', 'amazon', 'meta', 'netflix', 'uber', 'airbnb', 'stripe'];
    const isHighComp = highCompBrands.some((brand) => companyLower.includes(brand));
    if (isHighComp) {
      scoreCompetition = 30;
    }

    // 6. Remote Preference (10%)
    let scoreRemote = 80;
    const prefRemote = settings?.remotePreference || 'all';
    if (prefRemote === 'remote') {
      scoreRemote = job.isRemote ? 100 : 20;
    } else if (prefRemote === 'onsite') {
      scoreRemote = !job.isRemote ? 100 : 20;
    } else if (prefRemote === 'hybrid') {
      scoreRemote = /hybrid/i.test(locationLower) ? 100 : 50;
    }

    // 7. Location Preference (10%)
    let scoreLocation = 40;
    const preferredCities = settings?.preferredCities || [];
    if (preferredCities.length > 0) {
      const matchesCity = preferredCities.some((city) => locationLower.includes(city.toLowerCase()));
      if (matchesCity || (job.isRemote && preferredCities.some((c) => c.toLowerCase() === 'remote'))) {
        scoreLocation = 100;
      }
    } else {
      const defaults = ['india', 'bangalore', 'bengaluru', 'hyderabad', 'pune', 'remote'];
      const matchesDefault = defaults.some((city) => locationLower.includes(city));
      if (matchesDefault) scoreLocation = 90;
    }

    // 8. Experience Match (5%)
    let scoreExperience = 70;
    const expJob = job.experience;
    if (/senior/i.test(expJob)) {
      scoreExperience = 80;
    } else if (/early career|junior/i.test(expJob)) {
      scoreExperience = 100;
    }

    // Calculate final weighted Opportunity Score
    const finalScore =
      0.35 * scoreMatch +
      0.1 * scoreGrowth +
      0.1 * scoreQuality +
      0.1 * scoreFreshness +
      0.1 * scoreCompetition +
      0.1 * scoreRemote +
      0.1 * scoreLocation +
      0.05 * scoreExperience;

    const opportunityScore = Math.min(100, Math.max(0, Math.round(finalScore)));

    return {
      job,
      matchScore,
      opportunityScore,
      breakdown: {
        match: scoreMatch,
        growth: scoreGrowth,
        quality: scoreQuality,
        freshness: scoreFreshness,
        competition: scoreCompetition,
        remote: scoreRemote,
        location: scoreLocation,
        experience: scoreExperience,
      },
    };
  }

  public static rank(
    recommendations: ScoredJobRecommendation[],
    sortBy: 'match' | 'opportunity' = 'opportunity',
  ): ScoredJobRecommendation[] {
    return [...recommendations].sort((a, b) => {
      if (sortBy === 'opportunity') {
        return b.opportunityScore - a.opportunityScore || b.matchScore - a.matchScore;
      }
      return b.matchScore - a.matchScore || b.opportunityScore - a.opportunityScore;
    });
  }
}

export interface OpportunityScoreResult {
  overallScore: number;
  reasoning: string;
  strengths: string[];
  weaknesses: string[];
}

export class OpportunityEngine {
  /**
   * Calculates a weighted priority opportunity score (0 to 100) for a job candidate listing.
   */
  public static calculate(
    job: Job,
    company: CompanyConfig,
    matchScore: number,
    salaryWeight: number, // 0 to 100 preference score
    remotePreference: string, // 'remote', 'hybrid', 'onsite', 'all'
    locationPreference: string, // preferred location name
  ): OpportunityScoreResult {
    let score = 0;
    const strengths: string[] = [];
    const weaknesses: string[] = [];

    // 1. Resume Match Score (30% weight)
    const matchVal = Math.min(Math.max(matchScore, 0), 100);
    score += matchVal * 0.3;
    if (matchVal >= 85) {
      strengths.push(`High resume technical similarity matching score (${matchVal}%).`);
    } else if (matchVal < 60) {
      weaknesses.push(`Low technical skill alignment score (${matchVal}%).`);
    }

    // 2. Company Priority (15% weight)
    // Priority ranges from 1 to 5
    const priorityVal = Math.min(Math.max(company.priority || 3, 1), 5);
    score += (priorityVal / 5) * 100 * 0.15;
    if (priorityVal >= 4) {
      strengths.push(`Company is classified as high-priority target (Tier ${priorityVal}).`);
    }

    // 3. Salary Target Fit (15% weight)
    const salaryVal = Math.min(Math.max(salaryWeight, 0), 100);
    score += salaryVal * 0.15;
    if (salaryVal >= 80) {
      strengths.push('Remuneration details align with user target expectation.');
    } else if (salaryVal < 50) {
      weaknesses.push('Salary offering is below user baseline preferences.');
    }

    // 4. Remote Preference Alignment (10% weight)
    let remoteScore = 50;
    if (remotePreference === 'all') {
      remoteScore = 100;
    } else {
      const jobIsRemote = job.isRemote;
      if (remotePreference === 'remote' && jobIsRemote) remoteScore = 100;
      else if (remotePreference === 'onsite' && !jobIsRemote) remoteScore = 100;
      else if (remotePreference === 'hybrid') remoteScore = 80;
      else remoteScore = 20;
    }
    score += remoteScore * 0.1;
    if (remoteScore >= 80) {
      strengths.push(`Workplace model matches your remote working preferences (${remotePreference}).`);
    } else {
      weaknesses.push(`Workplace configuration (${job.isRemote ? 'Remote' : 'Onsite'}) deviates from preference.`);
    }

    // 5. Location Preference Alignment (10% weight)
    const jobLoc = (job.location || '').toLowerCase();
    const prefLoc = locationPreference.toLowerCase();
    let locationScore = 40;
    if (jobLoc.includes(prefLoc) || prefLoc.includes(jobLoc)) {
      locationScore = 100;
    }
    score += locationScore * 0.1;
    if (locationScore === 100) {
      strengths.push(`Geographical location (${job.location}) matches preferred area.`);
    }

    // 6. Experience Fit Heuristic (10% weight)
    // Assume 100 fit if standard, mock 80% otherwise
    const expScore = 80;
    score += expScore * 0.1;

    // 7. Freshness index (10% weight)
    // If posted 'today' or 'yesterday' score high, else lower
    const datePosted = (job.datePosted || '').toLowerCase();
    let freshnessScore = 50;
    if (datePosted.includes('today') || datePosted.includes('hour') || datePosted.includes('1 day')) {
      freshnessScore = 100;
    }
    score += freshnessScore * 0.1;
    if (freshnessScore === 100) {
      strengths.push('Fresh job posting, increasing application response probability.');
    }

    const overallScore = Math.round(score);
    const reasoning = `This opportunity scores ${overallScore}/100. It is driven by ${
      strengths.length > 0 ? strengths[0] : 'moderate skill alignment'
    } and offset by workplace model deviations if applicable.`;

    return {
      overallScore,
      reasoning,
      strengths,
      weaknesses,
    };
  }
}
