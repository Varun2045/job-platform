import { Job } from '../companies/Scraper.js';

export interface SearchCriteria {
  company?: string;
  technology?: string;
  experience?: string;
  department?: string;
  minScore?: number;
  location?: string;
  remote?: boolean | string;
  employmentType?: string;
  tags?: string;
  qualityFlags?: string;
  recommendations?: string;
  minConfidence?: number;
  minYearsExp?: number;
  maxYearsExp?: number;
  minSalary?: number;
  maxSalary?: number;
  requiredSkills?: string;
  preferredSkills?: string;
  dateRange?: string;
}

export class SearchEngine {
  /**
   * Fast pre-filtering on raw jobs before scoring loop.
   */
  public static quickFilterRawJobs(jobs: Job[], criteria: SearchCriteria): Job[] {
    return jobs.filter((job) => {
      // 1. Company Match (Support multi-select comma separated values)
      if (criteria.company && criteria.company.trim() !== '' && criteria.company !== 'all') {
        const comps = criteria.company.toLowerCase().split(',').map((c) => c.trim()).filter(Boolean);
        const compLower = (job.company || '').toLowerCase();
        const matchesAnyComp = comps.some((c) => compLower.includes(c));
        if (!matchesAnyComp) return false;
      }

      // 2. Technology / Global Keyword Match
      if (criteria.technology && criteria.technology.trim() !== '') {
        const tech = criteria.technology.toLowerCase().trim();
        const titleLower = (job.title || '').toLowerCase();
        const descLower = (job.description || '').toLowerCase();
        const compLower = (job.company || '').toLowerCase();
        const deptLower = (job.primaryDepartment || '').toLowerCase();
        const tagsStr = (job.tags || []).join(' ').toLowerCase();

        if (
          !titleLower.includes(tech) &&
          !descLower.includes(tech) &&
          !compLower.includes(tech) &&
          !deptLower.includes(tech) &&
          !tagsStr.includes(tech)
        ) {
          return false;
        }
      }

      // 3. Experience Match (Multi-select)
      if (criteria.experience && criteria.experience.trim() !== '' && criteria.experience !== 'all') {
        const exps = criteria.experience.toLowerCase().split(',').map((e) => e.trim()).filter(Boolean);
        const expLevel = (job.experienceLevel || job.experience || '').toLowerCase();
        const matchesAnyExp = exps.some((expLower) => expLevel.includes(expLower));
        if (!matchesAnyExp) return false;
      }

      // 4. Department Match (Multi-select)
      if (criteria.department && criteria.department.trim() !== '' && criteria.department !== 'all') {
        const depts = criteria.department.toLowerCase().split(',').map((d) => d.trim()).filter(Boolean);
        const primary = (job.primaryDepartment || '').toLowerCase();
        const secondary = (job.secondaryDepartments || []).map((d) => d.toLowerCase());
        const matchesAnyDept = depts.some((dept) => primary.includes(dept) || secondary.some((s) => s.includes(dept)));
        if (!matchesAnyDept) return false;
      }

      // 5. Location Match (Multi-select)
      if (criteria.location && criteria.location.trim() !== '' && criteria.location !== 'all') {
        const locs = criteria.location.toLowerCase().split(',').map((l) => l.trim()).filter(Boolean);
        const city = (job.locationHierarchy?.city || '').toLowerCase();
        const state = (job.locationHierarchy?.state || '').toLowerCase();
        const country = (job.locationHierarchy?.country || job.country || '').toLowerCase();
        const rawLoc = (job.location || '').toLowerCase();

        const matchesAnyLoc = locs.some((l) => {
          if (l === 'remote worldwide') return job.isRemote || rawLoc.includes('remote');
          return city.includes(l) || state.includes(l) || country.includes(l) || rawLoc.includes(l);
        });
        if (!matchesAnyLoc) return false;
      }

      // 6. Remote / Work Mode Match (Multi-select)
      if (criteria.remote !== undefined && criteria.remote !== null && criteria.remote !== 'all') {
        const remOption = String(criteria.remote).toLowerCase();
        const rawLoc = (job.location || '').toLowerCase();
        const isRemote = job.isRemote || rawLoc.includes('remote');
        const isHybrid = rawLoc.includes('hybrid');

        if (remOption === 'true' && !isRemote) return false;
        if (remOption === 'false' && isRemote) return false;
        if (remOption === 'hybrid' && !isHybrid) return false;
      }

      // 7. Employment Type Match (Multi-select)
      if (criteria.employmentType && criteria.employmentType.trim() !== '' && criteria.employmentType !== 'all') {
        const emps = criteria.employmentType.toLowerCase().split(',').map((e) => e.trim()).filter(Boolean);
        const jobEmp = (job.employmentType || '').toLowerCase();
        const matchesAnyEmp = emps.some((e) => jobEmp.includes(e));
        if (!matchesAnyEmp) return false;
      }

      // 8. Tags Match (Multi-select)
      if (criteria.tags && criteria.tags.trim() !== '' && criteria.tags !== 'all') {
        const targetTags = criteria.tags.toLowerCase().split(',').map((t) => t.trim()).filter(Boolean);
        const jobTags = (job.tags || []).map((t) => t.toLowerCase());
        const matchesAnyTag = targetTags.some((tt) => jobTags.includes(tt));
        if (!matchesAnyTag) return false;
      }

      // 9. Quality Flags Match (Multi-select)
      if (criteria.qualityFlags && criteria.qualityFlags.trim() !== '' && criteria.qualityFlags !== 'all') {
        const targetFlags = criteria.qualityFlags.toLowerCase().split(',').map((f) => f.trim()).filter(Boolean);
        const jobFlags = (job.qualityFlags || []).map((f) => f.toLowerCase());
        const matchesAnyFlag = targetFlags.some((tf) => jobFlags.includes(tf));
        if (!matchesAnyFlag) return false;
      }

      // 10. Recommendations Match (Multi-select)
      if (criteria.recommendations && criteria.recommendations.trim() !== '' && criteria.recommendations !== 'all') {
        const targetRecs = criteria.recommendations.toLowerCase().split(',').map((r) => r.trim()).filter(Boolean);
        const jobRecs = (job.recommendationBadges || []).map((r) => r.toLowerCase());
        const matchesAnyRec = targetRecs.some((tr) => jobRecs.includes(tr));
        if (!matchesAnyRec) return false;
      }

      // 11. Min Confidence Match
      if (criteria.minConfidence !== undefined && criteria.minConfidence !== null) {
        const overallConf = job.confidenceBreakdown?.overall || 80;
        if (overallConf < criteria.minConfidence) return false;
      }

      // 12. Experience Years Slider Match
      if (criteria.minYearsExp !== undefined && criteria.minYearsExp !== null) {
        const minLvlYears = job.experienceLevel?.includes('0–2') ? 0 : job.experienceLevel?.includes('1–3') ? 1 : job.experienceLevel?.includes('2–5') ? 2 : job.experienceLevel?.includes('5–8') ? 5 : 0;
        if (minLvlYears < criteria.minYearsExp) return false;
      }

      // 13. Salary Range Match
      if (criteria.minSalary !== undefined && criteria.minSalary !== null && job.salaryMin !== undefined) {
        if (job.salaryMin > 0 && job.salaryMin < criteria.minSalary) return false;
      }
      if (criteria.maxSalary !== undefined && criteria.maxSalary !== null && job.salaryMax !== undefined) {
        if (job.salaryMax > 0 && job.salaryMax > criteria.maxSalary) return false;
      }

      // 14. Required Skills Match (Multi-select)
      if (criteria.requiredSkills && criteria.requiredSkills.trim() !== '') {
        const targetSkills = criteria.requiredSkills.toLowerCase().split(',').map((s) => s.trim()).filter(Boolean);
        const jobSkills = (job.requiredSkills || []).map((s) => s.toLowerCase());
        const matchesAnySkill = targetSkills.some((ts) => jobSkills.includes(ts));
        if (!matchesAnySkill) return false;
      }

      // 15. Freshness/Date Range Match
      if (criteria.dateRange && criteria.dateRange.trim() !== '') {
        const daysLimit = criteria.dateRange === '1d' ? 1 : criteria.dateRange === '3d' ? 3 : criteria.dateRange === '7d' ? 7 : criteria.dateRange === '30d' ? 30 : 365;
        const postedTime = new Date(job.datePosted || 0).getTime();
        const diffDays = (Date.now() - postedTime) / (1000 * 60 * 60 * 24);
        if (diffDays > daysLimit) return false;
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
  /**
   * Database-Layer Facet Aggregator with Sibling-Level Isolation & Caching Strategy
   * Computes dynamic cascading counts for 28 departments, 11 experience levels, tags, and more.
   */
  public static calculateCascadingFacets(
    candidateJobs: { job: Job; score: number; opportunityScore: number }[],
    activeCriteria: SearchCriteria
  ) {
    const getFilteredJobs = (excludeKeys: string[]) => {
      const criteriaCopy = { ...activeCriteria };
      for (const k of excludeKeys) {
        delete (criteriaCopy as any)[k];
      }
      const rawJobs = candidateJobs.map((item) => item.job);
      const filteredRaw = this.quickFilterRawJobs(rawJobs, criteriaCopy);
      const hashes = new Set(filteredRaw.map((j) => j.jobHash));
      return candidateJobs.filter((item) => hashes.has(item.job.jobHash));
    };

    // Calculate departments (exclude 'department' criteria)
    const deptJobs = getFilteredJobs(['department']);
    const deptCounts: Record<string, number> = {};
    for (const item of deptJobs) {
      const d = item.job.primaryDepartment || 'Software Engineering';
      deptCounts[d] = (deptCounts[d] || 0) + 1;
      if (item.job.secondaryDepartments) {
        for (const sd of item.job.secondaryDepartments) {
          if (sd !== d) {
            deptCounts[sd] = (deptCounts[sd] || 0) + 1;
          }
        }
      }
    }

    // Calculate experienceLevels (exclude 'experience' criteria)
    const expJobs = getFilteredJobs(['experience']);
    const expCounts: Record<string, number> = {};
    for (const item of expJobs) {
      const lvl = item.job.experienceLevel || 'Mid Level (2–5 Years)';
      expCounts[lvl] = (expCounts[lvl] || 0) + 1;
    }

    // Calculate employmentTypes (exclude 'employmentType' criteria)
    const empJobs = getFilteredJobs(['employmentType']);
    const empCounts: Record<string, number> = {};
    for (const item of empJobs) {
      const emp = item.job.employmentType || 'Full-Time';
      empCounts[emp] = (empCounts[emp] || 0) + 1;
    }

    // Calculate locations (exclude 'location' criteria)
    const locJobs = getFilteredJobs(['location']);
    const locCounts: Record<string, number> = {};
    for (const item of locJobs) {
      const city = item.job.locationHierarchy?.city || 'Other';
      locCounts[city] = (locCounts[city] || 0) + 1;
    }

    // Calculate companies (exclude 'company' criteria)
    const compJobs = getFilteredJobs(['company']);
    const compCounts: Record<string, number> = {};
    for (const item of compJobs) {
      const comp = item.job.company || 'Other';
      compCounts[comp] = (compCounts[comp] || 0) + 1;
    }

    // Calculate skills (exclude 'requiredSkills' criteria)
    const skillJobs = getFilteredJobs(['requiredSkills']);
    const skillCounts: Record<string, number> = {};
    for (const item of skillJobs) {
      const skills = item.job.requiredSkills || [];
      for (const s of skills) {
        skillCounts[s] = (skillCounts[s] || 0) + 1;
      }
    }

    // Calculate tags (exclude 'tags' criteria)
    const tagJobs = getFilteredJobs(['tags']);
    const tagCounts: Record<string, number> = {};
    for (const item of tagJobs) {
      const tags = item.job.tags || [];
      for (const t of tags) {
        tagCounts[t] = (tagCounts[t] || 0) + 1;
      }
    }

    // Calculate recommendations (exclude 'recommendations' criteria)
    const recJobs = getFilteredJobs(['recommendations']);
    const recCounts: Record<string, number> = {};
    for (const item of recJobs) {
      const recs = item.job.recommendationBadges || [];
      for (const r of recs) {
        recCounts[r] = (recCounts[r] || 0) + 1;
      }
    }

    // Calculate qualityFlags (exclude 'qualityFlags' criteria)
    const qualJobs = getFilteredJobs(['qualityFlags']);
    const qualCounts: Record<string, number> = {};
    for (const item of qualJobs) {
      const flags = item.job.qualityFlags || [];
      for (const f of flags) {
        qualCounts[f] = (qualCounts[f] || 0) + 1;
      }
    }

    // Format & sort helpers (Selected first -> count descending -> alphabetical)
    const formatFacetList = (counts: Record<string, number>, activeList: string[], group?: string) => {
      const entries = Object.entries(counts).map(([name, count]) => {
        const selected = activeList.includes(name);
        return {
          id: name.toLowerCase().replace(/[^a-z0-9]/g, '_'),
          label: name,
          count,
          selected,
          group: group || 'General',
          icon: 'tag',
        };
      });
      return entries.sort((a, b) => {
        if (a.selected && !b.selected) return -1;
        if (!a.selected && b.selected) return 1;
        if (b.count !== a.count) return b.count - a.count;
        return a.label.localeCompare(b.label);
      });
    };

    const activeDepts = activeCriteria.department ? activeCriteria.department.split(',') : [];
    const activeExps = activeCriteria.experience ? activeCriteria.experience.split(',') : [];
    const activeEmps = activeCriteria.employmentType ? activeCriteria.employmentType.split(',') : [];
    const activeLocs = activeCriteria.location ? activeCriteria.location.split(',') : [];
    const activeComps = activeCriteria.company ? activeCriteria.company.split(',') : [];
    const activeSkills = activeCriteria.requiredSkills ? activeCriteria.requiredSkills.split(',') : [];
    const activeTags = activeCriteria.tags ? activeCriteria.tags.split(',') : [];
    const activeRecs = activeCriteria.recommendations ? activeCriteria.recommendations.split(',') : [];
    const activeQuals = activeCriteria.qualityFlags ? activeCriteria.qualityFlags.split(',') : [];

    let minSalary = 0;
    let maxSalary = 250000;
    const allSalaries = candidateJobs.map((j) => j.job.salaryMax || 0).filter((s) => s > 0);
    if (allSalaries.length > 0) {
      maxSalary = Math.max(...allSalaries);
    }

    return {
      version: 'v1',
      generatedAt: new Date().toISOString(),
      facets: {
        departments: formatFacetList(deptCounts, activeDepts, 'Department'),
        experienceLevels: formatFacetList(expCounts, activeExps, 'Experience'),
        employmentTypes: formatFacetList(empCounts, activeEmps, 'Employment'),
        locations: formatFacetList(locCounts, activeLocs, 'Location').slice(0, 30),
        companies: formatFacetList(compCounts, activeComps, 'Company').slice(0, 20),
        skills: formatFacetList(skillCounts, activeSkills, 'Skills').slice(0, 50),
        tags: formatFacetList(tagCounts, activeTags, 'Tags'),
        recommendations: formatFacetList(recCounts, activeRecs, 'Recommendations'),
        qualityFlags: formatFacetList(qualCounts, activeQuals, 'Quality'),
      },
      ranges: {
        salary: { min: minSalary, max: maxSalary },
        experienceYears: { min: 0, max: 15 },
        matchScore: { min: 0, max: 100 },
      },
    };
  }

  /**
   * Legacy database facets compatibility wrapper.
   */
  public static calculateDatabaseFacets(candidateJobs: { job: Job; score: number; opportunityScore: number }[]) {
    return this.calculateCascadingFacets(candidateJobs, {});
  }
}
