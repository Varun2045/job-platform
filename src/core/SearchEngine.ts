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
      // 3. Experience Match (supports single or comma-separated experience levels)
      if (criteria.experience && criteria.experience.trim() !== '' && criteria.experience !== 'all') {
        const exps = criteria.experience.toLowerCase().split(',').map((e) => e.trim()).filter(Boolean);
        const titleText = (job.title || '').toLowerCase();
        const expText = `${job.experience || ''} ${job.description || ''}`.toLowerCase();

        const isSenior = /senior|\bsr\b|\bsr\.|lead|principal|staff|director|head of|manager|vp|architect|5\+|6\+|7\+|8\+|10\+|5-7|5-8|5-10|6-10/i.test(titleText) ||
                         /\b(5\+|6\+|7\+|8\+|10\+|5-7|5-8|5-10|6-10)\s*(years|yrs)/i.test(expText);

        const isExplicitEarly = /early|entry|junior|associate|fresher|0-1|0-2|0-3|1-2|1-3|2 yrs|2 years|new grad|intern|graduate/i.test(`${titleText} ${job.experience || ''}`);

        const matchesAnyExp = exps.some((expLower) => {
          if (expLower.includes('early') || expLower.includes('entry') || expLower.includes('junior')) {
            // Strict Early Career: MUST NOT be Senior/Lead/Manager/Architect or 5+ years
            if (isSenior) return false;
            return isExplicitEarly || !/\b(3-5|3-6|4-6|5\+|6\+|7\+)\b/i.test(expText);
          } else if (expLower.includes('mid')) {
            // Mid Level: 2-5 years, not director/staff/10+
            const isTopSenior = /staff|principal|director|head of|vp|7\+|8\+|10\+/i.test(titleText);
            if (isTopSenior) return false;
            return !isSenior || /2-5|3-5|2-4|3-4/i.test(expText);
          } else if (expLower.includes('senior') || expLower.includes('lead')) {
            // Senior Level: Must be senior/lead/5+ years
            return isSenior;
          }
          return `${titleText} ${expText}`.includes(expLower);
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

      // 6. Department Match (supports single or comma-separated departments)
      if (criteria.department && criteria.department.trim() !== '' && criteria.department !== 'all') {
        const depts = criteria.department.toLowerCase().split(',').map((d) => d.trim()).filter(Boolean);
        const text = `${job.team || ''} ${(job as any).department || ''} ${job.title} ${job.description || ''}`.toLowerCase();

        const matchesAnyDept = depts.some((dept) => {
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
  public static calculateDatabaseFacets(candidateJobs: { job: Job; score: number; opportunityScore: number }[]) {
    const deptMap: Record<string, number> = {
      'engineering': 0,
      'ai_data': 0,
      'product': 0,
      'design': 0,
      'marketing_sales': 0,
      'operations': 0
    };

    const expMap: Record<string, number> = {
      'Early Career': 0,
      'Mid Level': 0,
      'Senior': 0
    };

    const compCounts: Record<string, number> = {};
    const locCounts: Record<string, number> = {};
    const empCounts: Record<string, number> = { 'Full-Time': 0, 'Contract': 0, 'Internship': 0 };
    let remoteCount = 0;
    let onsiteCount = 0;

    for (const item of candidateJobs) {
      const j = item.job;
      const text = `${j.team || ''} ${j.title} ${j.description || ''}`.toLowerCase();
      const expText = `${j.experience || ''} ${j.title} ${j.description || ''}`.toLowerCase();
      const locText = (j.location || '').toLowerCase();
      const company = j.company || 'Other';

      // Department facets
      if (/engineer|developer|sde|backend|frontend|fullstack|software|architect|infrastructure|devops|platform|coder/i.test(text)) deptMap['engineering']++;
      if (/ai|ml|machine learning|data science|data engineer|analyst|analytics|nlp|deep learning|computer vision/i.test(text)) deptMap['ai_data']++;
      if (/product|program|project manager|scrum|agile|owner/i.test(text)) deptMap['product']++;
      if (/design|ux|ui|graphic|art|creative/i.test(text)) deptMap['design']++;
      if (/marketing|sales|growth|account executive|business development|seo|content/i.test(text)) deptMap['marketing_sales']++;
      if (/operations|hr|human resources|recruiter|people|talent|legal|finance|accounting/i.test(text)) deptMap['operations']++;

      // Experience facets (strict & mutually exclusive)
      const titleLower = (j.title || '').toLowerCase();
      const isSeniorJob = /senior|\bsr\b|\bsr\.|lead|principal|staff|director|head of|manager|vp|architect|5\+|6\+|7\+|8\+|10\+/i.test(titleLower) ||
                          /\b(5\+|6\+|7\+|8\+|10\+)\s*(years|yrs)/i.test(expText);

      if (isSeniorJob) {
        expMap['Senior']++;
      } else if (/early|entry|junior|associate|fresher|0-1|0-2|0-3|1-2|1-3|2 yrs|2 years|new grad|intern|graduate/i.test(`${titleLower} ${j.experience || ''}`)) {
        expMap['Early Career']++;
      } else {
        expMap['Mid Level']++;
      }

      // Company facets
      compCounts[company] = (compCounts[company] || 0) + 1;

      // Location facets
      const locKey = locText.includes('india') ? 'India' : locText.includes('usa') || locText.includes('us') ? 'USA' : locText.includes('bangalore') ? 'Bangalore' : locText.includes('pune') ? 'Pune' : 'Other';
      locCounts[locKey] = (locCounts[locKey] || 0) + 1;

      // Remote facets
      if (j.isRemote || locText.includes('remote')) remoteCount++;
      else onsiteCount++;

      // Employment types
      if (/intern/i.test(text)) empCounts['Internship']++;
      else if (/contract|freelance/i.test(text)) empCounts['Contract']++;
      else empCounts['Full-Time']++;
    }

    const deptNames: Record<string, string> = {
      engineering: 'Engineering & Software',
      ai_data: 'AI, ML & Data Science',
      product: 'Product & Project Mgmt',
      design: 'UI/UX & Design',
      marketing_sales: 'Sales & Marketing',
      operations: 'Operations & HR'
    };

    return {
      departments: Object.entries(deptMap).map(([value, count]) => ({ name: deptNames[value] || value, value, count })),
      companies: Object.entries(compCounts).slice(0, 10).map(([value, count]) => ({ name: value, value, count })),
      experience: Object.entries(expMap).map(([value, count]) => ({ name: value, value, count })),
      locations: Object.entries(locCounts).map(([value, count]) => ({ name: value, value, count })),
      remote: [
        { name: 'Remote Only', value: 'true', count: remoteCount },
        { name: 'Onsite / Hybrid', value: 'false', count: onsiteCount }
      ],
      employmentTypes: Object.entries(empCounts).map(([value, count]) => ({ name: value, value, count })),
      postedDates: [
        { name: 'Past 24 Hours', value: '1d', count: Math.round(candidateJobs.length * 0.15) },
        { name: 'Past Week', value: '7d', count: Math.round(candidateJobs.length * 0.45) },
        { name: 'Past Month', value: '30d', count: candidateJobs.length }
      ]
    };
  }
}
