import { Job, CompanyConfig } from '../companies/Scraper.js';

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
    locationPreference: string // preferred location name
  ): OpportunityScoreResult {
    let score = 0;
    const strengths: string[] = [];
    const weaknesses: string[] = [];

    // 1. Resume Match Score (30% weight)
    const matchVal = Math.min(Math.max(matchScore, 0), 100);
    score += matchVal * 0.30;
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
    score += remoteScore * 0.10;
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
    score += locationScore * 0.10;
    if (locationScore === 100) {
      strengths.push(`Geographical location (${job.location}) matches preferred area.`);
    }

    // 6. Experience Fit Heuristic (10% weight)
    // Assume 100 fit if standard, mock 80% otherwise
    const expScore = 80;
    score += expScore * 0.10;

    // 7. Freshness index (10% weight)
    // If posted 'today' or 'yesterday' score high, else lower
    const datePosted = (job.datePosted || '').toLowerCase();
    let freshnessScore = 50;
    if (datePosted.includes('today') || datePosted.includes('hour') || datePosted.includes('1 day')) {
      freshnessScore = 100;
    }
    score += freshnessScore * 0.10;
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
      weaknesses
    };
  }
}
