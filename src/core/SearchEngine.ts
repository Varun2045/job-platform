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
        const expLower = criteria.experience.toLowerCase().trim();
        const expText = `${job.experience || ''} ${job.title} ${job.description || ''}`.toLowerCase();

        if (expLower.includes('early') || expLower.includes('entry') || expLower.includes('junior')) {
          // Early career = 0-2 years: exclude roles explicitly requiring 5+ years, senior, staff, lead, principal
          const isExplicitSenior = /senior|sr\.|lead|principal|staff|director|head of|5\+|6\+|7\+|8\+|10\+|5-7|5-8|5-10|6-10/i.test(expText);
          const isExplicitEarly = /early|entry|junior|associate|fresher|0-1|0-2|0-3|1-2|1-3|2 yrs|2 years|new grad|intern|graduate/i.test(expText);
          if (isExplicitSenior && !isExplicitEarly) return false;
        } else if (expLower.includes('mid')) {
          // Mid level = 2-5 years: exclude director/staff/10+ year roles
          const isExplicitTopSenior = /staff|principal|director|head of|7\+|8\+|10\+|7-10|8-10|10\+/i.test(expText);
          if (isExplicitTopSenior) return false;
        } else if (expLower.includes('senior') || expLower.includes('lead')) {
          // Senior = 5+ years: require senior/lead/staff/5+ years
          const isSenior = /senior|lead|sr\.|staff|principal|director|5\+|6\+|7\+|8\+|9\+|10\+|5-7|5-8|5-10/i.test(expText);
          if (!isSenior) return false;
        }
      }

      // 3. Location Match
      if (criteria.location && criteria.location.trim() !== '') {
        const locLower = (job.location || '').toLowerCase();
        const searchLoc = criteria.location.toLowerCase().trim();
        if (!locLower.includes(searchLoc)) return false;
      }

      // 4. Remote Match
      if (criteria.remote !== undefined && criteria.remote !== null) {
        const locLower = (job.location || '').toLowerCase();
        const descLower = (job.description || '').toLowerCase();
        const isRemoteJob = job.isRemote || locLower.includes('remote') || descLower.includes('remote');
        if (criteria.remote !== isRemoteJob) return false;
      }

      // 5. Department Match
      if (criteria.department && criteria.department.trim() !== '' && criteria.department !== 'all') {
        const dept = criteria.department.toLowerCase().trim();
        const text = `${job.team || ''} ${job.title} ${job.description || ''}`.toLowerCase();

        if (dept === 'engineering') {
          if (!/engineer|developer|sde|backend|frontend|fullstack|software|architect|infrastructure|devops|platform|coder/i.test(text)) return false;
        } else if (dept === 'ai_data') {
          if (!/ai|ml|machine learning|data science|data engineer|analyst|analytics|nlp|deep learning|computer vision/i.test(text)) return false;
        } else if (dept === 'product') {
          if (!/product|program|project manager|scrum|agile|owner|technical program/i.test(text)) return false;
        } else if (dept === 'design') {
          if (!/design|ux|ui|graphic|art|creative/i.test(text)) return false;
        } else if (dept === 'marketing_sales') {
          if (!/marketing|sales|growth|account executive|business development|seo|content/i.test(text)) return false;
        } else if (dept === 'operations') {
          if (!/operations|hr|human resources|recruiter|people|talent|legal|finance|accounting/i.test(text)) return false;
        } else {
          if (!text.includes(dept)) return false;
        }
      }

      return true;
    });
  }

  /**
   * Filters a list of scored jobs based on full search criteria.
   */
  public static search(jobs: { job: Job; score: number }[], criteria: SearchCriteria): { job: Job; score: number }[] {
    return jobs.filter((item) => {
      const { job, score } = item;

      // 1. Company Match
      if (criteria.company && criteria.company.trim() !== '' && criteria.company !== 'all') {
        const compLower = job.company.toLowerCase();
        const searchComp = criteria.company.toLowerCase().trim();
        if (!compLower.includes(searchComp)) {
          return false;
        }
      }

      // 2. Technology Match
      if (criteria.technology && criteria.technology.trim() !== '') {
        const tech = criteria.technology.toLowerCase().trim();
        const text = `${job.title} ${job.description}`.toLowerCase();
        if (!text.includes(tech)) {
          return false;
        }
      }

      // 3. Experience Match
      if (criteria.experience && criteria.experience.trim() !== '' && criteria.experience !== 'all') {
        const expLower = criteria.experience.toLowerCase().trim();
        const expText = `${job.experience || ''} ${job.title} ${job.description || ''}`.toLowerCase();

        if (expLower.includes('early') || expLower.includes('entry') || expLower.includes('junior')) {
          const isExplicitSenior = /senior|sr\.|lead|principal|staff|director|head of|5\+|6\+|7\+|8\+|10\+|5-7|5-8|5-10|6-10/i.test(expText);
          const isExplicitEarly = /early|entry|junior|associate|fresher|0-1|0-2|0-3|1-2|1-3|2 yrs|2 years|new grad|intern|graduate/i.test(expText);
          if (isExplicitSenior && !isExplicitEarly) return false;
        } else if (expLower.includes('mid')) {
          const isExplicitTopSenior = /staff|principal|director|head of|7\+|8\+|10\+|7-10|8-10|10\+/i.test(expText);
          if (isExplicitTopSenior) return false;
        } else if (expLower.includes('senior') || expLower.includes('lead')) {
          const isSenior = /senior|lead|sr\.|staff|principal|director|5\+|6\+|7\+|8\+|9\+|10\+|5-7|5-8|5-10/i.test(expText);
          if (!isSenior) return false;
        }
      }

      // 4. Department Match
      if (criteria.department && criteria.department.trim() !== '' && criteria.department !== 'all') {
        const dept = criteria.department.toLowerCase().trim();
        const text = `${job.team || ''} ${job.title} ${job.description}`.toLowerCase();

        if (dept === 'engineering') {
          if (!/engineer|developer|sde|backend|frontend|fullstack|software|architect|infrastructure|devops|platform|coder/i.test(text)) return false;
        } else if (dept === 'ai_data') {
          if (!/ai|ml|machine learning|data science|data engineer|analyst|analytics|nlp|deep learning|computer vision/i.test(text)) return false;
        } else if (dept === 'product') {
          if (!/product|program|project manager|scrum|agile|owner/i.test(text)) return false;
        } else if (dept === 'design') {
          if (!/design|ux|ui|graphic|art|creative/i.test(text)) return false;
        } else if (dept === 'marketing_sales') {
          if (!/marketing|sales|growth|account executive|business development|seo|content/i.test(text)) return false;
        } else if (dept === 'operations') {
          if (!/operations|hr|human resources|recruiter|people|talent|legal|finance|accounting/i.test(text)) return false;
        } else {
          if (!text.includes(dept)) return false;
        }
      }

      // 5. Match Score Match
      if (criteria.minScore !== undefined && criteria.minScore !== null) {
        if (score < criteria.minScore) {
          return false;
        }
      }

      // 6. Location Match
      if (criteria.location && criteria.location.trim() !== '') {
        const locLower = job.location.toLowerCase();
        const searchLoc = criteria.location.toLowerCase().trim();
        if (!locLower.includes(searchLoc)) {
          return false;
        }
      }

      // 7. Remote Match
      if (criteria.remote !== undefined && criteria.remote !== null) {
        const locLower = job.location.toLowerCase();
        const descLower = job.description.toLowerCase();
        const isRemoteJob = job.isRemote || locLower.includes('remote') || descLower.includes('remote');
        if (criteria.remote !== isRemoteJob) {
          return false;
        }
      }

      // 8. Date Found Match
      if (criteria.dateFound && criteria.dateFound.trim() !== '') {
        const searchTime = new Date(criteria.dateFound).getTime();
        const postedTime = new Date(job.datePosted || 0).getTime();
        if (postedTime < searchTime) {
          return false;
        }
      }

      return true;
    });
  }
}
