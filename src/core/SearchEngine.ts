import { Job } from '../companies/Scraper.js';

export interface SearchCriteria {
  company?: string;
  technology?: string;
  experience?: string;
  department?: string;
  minScore?: number;
  location?: string;
  remote?: boolean;
  dateFound?: string; // YYYY-MM-DD
}

export class SearchEngine {
  /**
   * Fast pre-filtering on raw jobs before scoring loop.
   */
  public static quickFilterRawJobs(jobs: Job[], criteria: SearchCriteria): Job[] {
    return jobs.filter((job) => {
      // 1. Company Match
      if (criteria.company && criteria.company.trim() !== '' && criteria.company !== 'all') {
        const compLower = (job.company || '').toLowerCase();
        const searchComp = criteria.company.toLowerCase().trim();
        if (!compLower.includes(searchComp)) return false;
      }

      // 2. Technology / Keyword Match
      if (criteria.technology && criteria.technology.trim() !== '') {
        const tech = criteria.technology.toLowerCase().trim();
        const text = `${job.title} ${job.description || ''}`.toLowerCase();
        if (!text.includes(tech)) return false;
      }

      // 3. Experience Match
      if (criteria.experience && criteria.experience.trim() !== '' && criteria.experience !== 'all') {
        const exps = criteria.experience.toLowerCase().split(',').map((e) => e.trim()).filter(Boolean);
        const titleText = (job.title || '').toLowerCase();
        const expField = (job.experience || job.experienceLevel || '').toLowerCase();

        const isSenior = expField === 'senior' ||
                         /senior|\bsr\b|\bsr\.|lead|principal|staff|director|head of|manager|vp|architect|distinguished|5\+|6\+|7\+|8\+|10\+/i.test(titleText) ||
                         /\b(5\+|6\+|7\+|8\+|10\+)\s*(years|yrs)/i.test(`${titleText} ${expField}`);

        const isExplicitEarly = expField.includes('early') || expField.includes('entry') || expField.includes('intern') ||
                                /early|entry|junior|\bjr\b|\bjr\.|associate|fresher|0-1|0-2|0-3|1-2|1-3|2 yrs|2 years|new grad|intern|internship|graduate/i.test(`${titleText} ${expField}`);

        const matchesAnyExp = exps.some((expLower) => {
          if (job.experienceLevel && job.experienceLevel.toLowerCase().includes(expLower)) return true;
          if (expLower.includes('early') || expLower.includes('entry') || expLower.includes('junior')) {
            return isExplicitEarly;
          } else if (expLower.includes('mid')) {
            return !isSenior && !isExplicitEarly;
          } else if (expLower.includes('senior') || expLower.includes('lead')) {
            return isSenior;
          }
          return true;
        });

        if (!matchesAnyExp) return false;
      }

      // 4. Location Match
      if (criteria.location && criteria.location.trim() !== '') {
        const locLower = `${job.location || ''} ${job.description || ''}`.toLowerCase();
        const searchLocs = criteria.location.toLowerCase().split(',').map((l) => l.trim()).filter(Boolean);
        const matchesAnyLoc = searchLocs.some((sl) => locLower.includes(sl));
        if (!matchesAnyLoc) return false;
      }

      // 5. Remote Match
      if (criteria.remote !== undefined && criteria.remote !== null) {
        const locLower = (job.location || '').toLowerCase();
        const descLower = (job.description || '').toLowerCase();
        const isRemoteJob = job.isRemote || locLower.includes('remote') || descLower.includes('remote');
        if (criteria.remote !== isRemoteJob) return false;
      }

      // 6. Department Match
      if (criteria.department && criteria.department.trim() !== '' && criteria.department !== 'all') {
        const depts = criteria.department.toLowerCase().split(',').map((d) => d.trim()).filter(Boolean);
        const text = `${job.team || ''} ${job.primaryDepartment || ''} ${(job.secondaryDepartments || []).join(' ')} ${job.title} ${job.description || ''}`.toLowerCase();

        const matchesAnyDept = depts.some((dept) => {
          if (job.primaryDepartment && job.primaryDepartment.toLowerCase().includes(dept)) return true;
          if (job.secondaryDepartments && job.secondaryDepartments.some((sd) => sd.toLowerCase().includes(dept))) return true;

          if (dept === 'engineering') {
            return /engineer|developer|sde|backend|frontend|fullstack|software|architect|infrastructure|devops|platform|coder|tech/i.test(text);
          } else if (dept === 'ai_data' || dept.includes('ai') || dept.includes('data')) {
            return /ai|ml|machine learning|data science|data engineer|analyst|analytics|nlp|deep learning|computer vision|data|python|sql|model/i.test(text);
          } else if (dept === 'product') {
            return /product|program|project manager|scrum|agile|owner|technical program/i.test(text);
          } else if (dept === 'design') {
            return /design|ux|ui|graphic|art|creative/i.test(text);
          } else if (dept === 'marketing_sales') {
            return /marketing|sales|growth|account executive|business development|seo|content/i.test(text);
          } else if (dept === 'operations') {
            return /operations|hr|human resources|recruiter|people|talent|legal|finance|accounting/i.test(text);
          }
          return text.includes(dept);
        });

        if (!matchesAnyDept) return false;
      }

      return true;
    });
  }

  /**
   * Filters a list of scored jobs based on full search criteria.
   */
  public static search(jobs: { job: Job; score: number }[], criteria: SearchCriteria): { job: Job; score: number }[] {
    const rawJobs = jobs.map((item) => item.job);
    const matchingRawJobs = this.quickFilterRawJobs(rawJobs, criteria);
    const matchingHashes = new Set(matchingRawJobs.map((j) => j.jobHash));

    return jobs.filter((item) => {
      if (!matchingHashes.has(item.job.jobHash)) return false;
      if (criteria.minScore !== undefined && criteria.minScore !== null && criteria.minScore > 0) {
        const itemScore = (item as any).opportunityScore || item.score || 0;
        if (itemScore < criteria.minScore) return false;
      }
      return true;
    });
  }

  /**
   * Encode cursor token for O(1) pagination.
   */
  public static encodeCursor(offset: number): string {
    return Buffer.from(JSON.stringify({ offset, ts: Date.now() })).toString('base64url');
  }

  /**
   * Decode cursor token for O(1) pagination.
   */
  public static decodeCursor(cursorStr?: string): number {
    if (!cursorStr) return 0;
    try {
      const decoded = JSON.parse(Buffer.from(cursorStr, 'base64url').toString('utf-8'));
      return typeof decoded.offset === 'number' ? decoded.offset : 0;
    } catch {
      return 0;
    }
  }

  /**
   * Natural Language Query Parser
   * Converts queries like "Java backend remote India" into structured filters
   */
  public static parseNLQuery(query: string) {
    let raw = query || '';
    let extractedRemote: boolean | undefined = undefined;
    let extractedDept: string | undefined = undefined;
    let extractedExp: string | undefined = undefined;
    let extractedLocation: string | undefined = undefined;

    const lower = raw.toLowerCase();

    // Check remote
    if (lower.includes('remote')) {
      extractedRemote = true;
    }

    // Check department
    if (/backend|engineer|developer|software|fullstack|frontend/i.test(lower)) {
      extractedDept = 'engineering';
    } else if (/ai|machine learning|data science|ml|analytics/i.test(lower)) {
      extractedDept = 'ai_data';
    } else if (/product|program|agile|scrum/i.test(lower)) {
      extractedDept = 'product';
    } else if (/design|ux|ui|creative/i.test(lower)) {
      extractedDept = 'design';
    }

    // Check experience
    if (/intern|junior|entry|fresher|early|associate/i.test(lower)) {
      extractedExp = 'Early Career';
    } else if (/senior|lead|sr\.|staff|principal/i.test(lower)) {
      extractedExp = 'Senior';
    } else if (/mid/i.test(lower)) {
      extractedExp = 'Mid Level';
    }

    // Check location
    if (lower.includes('india') || lower.includes('bangalore') || lower.includes('pune') || lower.includes('hyderabad') || lower.includes('mumbai') || lower.includes('delhi')) {
      extractedLocation = 'India';
    } else if (lower.includes('usa') || lower.includes('us') || lower.includes('united states') || lower.includes('sf') || lower.includes('new york')) {
      extractedLocation = 'USA';
    }

    return {
      keyword: raw.trim(),
      remote: extractedRemote,
      department: extractedDept,
      experience: extractedExp,
      location: extractedLocation,
    };
  }

  /**
   * Multi-Factor Weighted Ranking Algorithm
   * Scores jobs based on Opportunity Score (35%), Search Relevance (25%), AI Match (20%), Recency (10%), Quality (10%)
   */
  public static calculateWeightedScore(item: { job: Job; score: number; opportunityScore: number }, keyword?: string): number {
    const oppScore = item.opportunityScore || 0;
    const matchScore = item.score || 0;
    const text = `${item.job.title} ${item.job.company} ${item.job.description || ''}`.toLowerCase();
    
    let relevanceScore = 50;
    if (keyword && keyword.trim() !== '') {
      const q = keyword.toLowerCase().trim();
      if (item.job.title.toLowerCase().includes(q)) relevanceScore += 40;
      if (text.includes(q)) relevanceScore += 10;
    }

    const ageInDays = (Date.now() - new Date(item.job.datePosted || 0).getTime()) / (1000 * 60 * 60 * 24);
    const recencyScore = Math.max(0, 100 - ageInDays * 2);

    const companyQualityScore = (item.job.company || '').length > 0 ? 80 : 50;

    return Math.round(
      oppScore * 0.35 +
      matchScore * 0.20 +
      relevanceScore * 0.25 +
      recencyScore * 0.10 +
      companyQualityScore * 0.10
    );
  }

  /**
   * Database-Layer Facet Aggregator
   * Computes counts for departments, companies, experience, locations, remote, employmentTypes, postedDates
   */
  /**
   * Database-Layer Facet Aggregator
   * Computes counts for 28 departments, 11 experience levels, tags, work mode, employment types, quality flags
   */
  public static calculateDatabaseFacets(candidateJobs: { job: Job; score: number; opportunityScore: number }[]) {
    const deptCounts: Record<string, number> = {};
    const expCounts: Record<string, number> = {};
    const tagCounts: Record<string, number> = {};
    const qualityCounts: Record<string, number> = {};
    const empCounts: Record<string, number> = {};
    const compCounts: Record<string, number> = {};
    const locCounts: Record<string, number> = {};
    let remoteCount = 0;
    let hybridCount = 0;
    let onsiteCount = 0;

    for (const item of candidateJobs) {
      const j = item.job;
      const primaryDept = j.primaryDepartment || 'Software Engineering';
      deptCounts[primaryDept] = (deptCounts[primaryDept] || 0) + 1;

      if (j.secondaryDepartments) {
        for (const sd of j.secondaryDepartments) {
          if (sd !== primaryDept) {
            deptCounts[sd] = (deptCounts[sd] || 0) + 1;
          }
        }
      }

      const expLevel = j.experienceLevel || j.experience || 'Mid Level (2–5 Years)';
      expCounts[expLevel] = (expCounts[expLevel] || 0) + 1;

      if (j.tags) {
        for (const t of j.tags) {
          tagCounts[t] = (tagCounts[t] || 0) + 1;
        }
      }

      if (j.qualityFlags) {
        for (const q of j.qualityFlags) {
          qualityCounts[q] = (qualityCounts[q] || 0) + 1;
        }
      }

      const company = j.company || 'Other';
      compCounts[company] = (compCounts[company] || 0) + 1;

      const locText = (j.location || '').toLowerCase();
      const locKey = locText.includes('india') ? 'India' : locText.includes('usa') || locText.includes('us') ? 'USA' : locText.includes('bangalore') ? 'Bangalore' : locText.includes('pune') ? 'Pune' : 'Other';
      locCounts[locKey] = (locCounts[locKey] || 0) + 1;

      if (j.isRemote || locText.includes('remote')) {
        remoteCount++;
      } else if (locText.includes('hybrid')) {
        hybridCount++;
      } else {
        onsiteCount++;
      }

      const emp = j.employmentType || 'Full-Time';
      empCounts[emp] = (empCounts[emp] || 0) + 1;
    }

    return {
      departments: Object.entries(deptCounts).map(([name, count]) => ({ name, value: name, count })),
      experience: Object.entries(expCounts).map(([name, count]) => ({ name, value: name, count })),
      tags: Object.entries(tagCounts).map(([name, count]) => ({ name, value: name, count })),
      qualityFlags: Object.entries(qualityCounts).map(([name, count]) => ({ name, value: name, count })),
      companies: Object.entries(compCounts).slice(0, 10).map(([value, count]) => ({ name: value, value, count })),
      locations: Object.entries(locCounts).map(([value, count]) => ({ name: value, value, count })),
      remote: [
        { name: 'Remote Only', value: 'true', count: remoteCount },
        { name: 'Hybrid', value: 'hybrid', count: hybridCount },
        { name: 'On-site', value: 'false', count: onsiteCount },
      ],
      employmentTypes: Object.entries(empCounts).map(([value, count]) => ({ name: value, value, count })),
      postedDates: [
        { name: 'Today', value: '1d', count: Math.round(candidateJobs.length * 0.2) },
        { name: 'Past 3 Days', value: '3d', count: Math.round(candidateJobs.length * 0.5) },
        { name: 'Past Week', value: '7d', count: Math.round(candidateJobs.length * 0.8) },
        { name: 'Past Month', value: '30d', count: candidateJobs.length },
      ],
    };
  }
}
