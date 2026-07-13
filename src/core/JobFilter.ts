import fs from 'fs';
import path from 'path';
import { Job } from '../companies/Scraper.js';
import { Logger } from './Logger.js';

export interface FilterConfig {
  minMatchScore: number;
  experienceMinYears?: number | null;
  experienceMaxYears?: number | null;
  workplaceTypes?: string[];
  cities?: string[];
  states?: string[];
  countries?: string[];
  employmentTypes?: string[];
  internship: boolean;
  newGrad: boolean;
  fullTime: boolean;
  contract: boolean;
}

export class JobFilter {
  private static getFilters(): FilterConfig {
    const defaultFilters: FilterConfig = {
      minMatchScore: 70,
      internship: true,
      newGrad: true,
      fullTime: true,
      contract: true
    };

    try {
      const filtersPath = path.join(process.cwd(), 'config', 'filters.json');
      if (fs.existsSync(filtersPath)) {
        const raw = fs.readFileSync(filtersPath, 'utf-8');
        return JSON.parse(raw) as FilterConfig;
      }
    } catch (e) {
      Logger.error('Failed to load filters.json, using defaults', e as any);
    }
    return defaultFilters;
  }

  public static matches(job: Job): boolean {
    const filters = this.getFilters();

    // 1. Workplace Type Check
    if (filters.workplaceTypes && filters.workplaceTypes.length > 0) {
      const locationLower = job.location.toLowerCase();
      const descLower = job.description.toLowerCase();
      const titleLower = job.title.toLowerCase();

      let jobWorkplace = 'onsite';
      if (job.isRemote || locationLower.includes('remote') || descLower.includes('remote') || titleLower.includes('remote')) {
        jobWorkplace = 'remote';
      } else if (locationLower.includes('hybrid') || descLower.includes('hybrid') || titleLower.includes('hybrid')) {
        jobWorkplace = 'hybrid';
      }

      const isAllowed = filters.workplaceTypes.some(t => t.toLowerCase() === jobWorkplace);
      if (!isAllowed) {
        return false;
      }
    }

    // 2. City, State, Country Check
    const locationLower = job.location.toLowerCase();
    const countryLower = job.country ? job.country.toLowerCase() : '';

    if (filters.cities && filters.cities.length > 0) {
      const matchesCity = filters.cities.some(c => locationLower.includes(c.toLowerCase()));
      if (!matchesCity) return false;
    }

    if (filters.states && filters.states.length > 0) {
      const matchesState = filters.states.some(s => locationLower.includes(s.toLowerCase()));
      if (!matchesState) return false;
    }

    if (filters.countries && filters.countries.length > 0) {
      const matchesCountry = filters.countries.some(c => 
        locationLower.includes(c.toLowerCase()) || countryLower.includes(c.toLowerCase())
      );
      if (!matchesCountry) return false;
    }

    // 3. Employment Category check
    const titleLower = job.title.toLowerCase();
    const descLower = job.description.toLowerCase();
    const typeLower = (job.employmentType || '').toLowerCase();

    const isInternship = typeLower.includes('intern') || titleLower.includes('intern') || typeLower.includes('co-op') || descLower.includes('co-op');
    const isNewGrad = titleLower.includes('new grad') || titleLower.includes('graduate') || titleLower.includes('early career') || titleLower.includes('entry level') || titleLower.includes('university grad');
    const isContract = typeLower.includes('contract') || typeLower.includes('temp') || titleLower.includes('contractor') || descLower.includes('contractor');
    
    // If it doesn't match any of the special categories, we treat it as fullTime/general SDE
    const isFullTime = !isInternship && !isNewGrad && !isContract;

    if (isInternship && !filters.internship) return false;
    if (isNewGrad && !filters.newGrad) return false;
    if (isContract && !filters.contract) return false;
    if (isFullTime && !filters.fullTime) return false;

    // 4. Custom Experience Years parse (optional filter)
    if (filters.experienceMinYears !== undefined && filters.experienceMinYears !== null) {
      const yrs = this.parseExperienceYears(job);
      if (yrs !== null && yrs < filters.experienceMinYears) return false;
    }
    if (filters.experienceMaxYears !== undefined && filters.experienceMaxYears !== null) {
      const yrs = this.parseExperienceYears(job);
      if (yrs !== null && yrs > filters.experienceMaxYears) return false;
    }

    return true;
  }

  private static parseExperienceYears(job: Job): number | null {
    const text = `${job.title} ${job.experience} ${job.description}`.toLowerCase();
    
    // Search for patterns like "3+ years", "3-5 years", "min 2 years"
    const regexes = [
      /(\d+)\s*(?:to|-)\s*(\d+)\s*(?:years|yrs)/i,
      /(\d+)\s*\+\s*(?:years|yrs)/i,
      /(?:minimum|at least|min)\s*(\d+)\s*(?:years|yrs)/i,
      /(\d+)\s*(?:years?|yrs?)\s+(?:of\s+)?experience/i
    ];

    for (const rx of regexes) {
      const match = text.match(rx);
      if (match) {
        // If range, return the lower end
        return parseInt(match[1], 10);
      }
    }

    return null;
  }
}
