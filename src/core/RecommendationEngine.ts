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
    settings: ExtendedSettings | null
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
    } catch (e) {}

    // 5. Competition (10%)
    let scoreCompetition = 80;
    const highCompBrands = ['google', 'apple', 'microsoft', 'amazon', 'meta', 'netflix', 'uber', 'airbnb', 'stripe'];
    const isHighComp = highCompBrands.some(brand => companyLower.includes(brand));
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
      const matchesCity = preferredCities.some(city => locationLower.includes(city.toLowerCase()));
      if (matchesCity || (job.isRemote && preferredCities.some(c => c.toLowerCase() === 'remote'))) {
        scoreLocation = 100;
      }
    } else {
      const defaults = ['india', 'bangalore', 'bengaluru', 'hyderabad', 'pune', 'remote'];
      const matchesDefault = defaults.some(city => locationLower.includes(city));
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
      (0.35 * scoreMatch) +
      (0.10 * scoreGrowth) +
      (0.10 * scoreQuality) +
      (0.10 * scoreFreshness) +
      (0.10 * scoreCompetition) +
      (0.10 * scoreRemote) +
      (0.10 * scoreLocation) +
      (0.05 * scoreExperience);

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
        experience: scoreExperience
      }
    };
  }

  public static rank(
    recommendations: ScoredJobRecommendation[],
    sortBy: 'match' | 'opportunity' = 'opportunity'
  ): ScoredJobRecommendation[] {
    return [...recommendations].sort((a, b) => {
      if (sortBy === 'opportunity') {
        return b.opportunityScore - a.opportunityScore || b.matchScore - a.matchScore;
      }
      return b.matchScore - a.matchScore || b.opportunityScore - a.opportunityScore;
    });
  }
}
