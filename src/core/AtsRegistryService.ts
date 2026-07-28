import { SUPPORTED_50_COMPANIES } from '../playwright/extractors/CompanyExtractors.js';

export type ParserCategoryType = 'Native ATS' | 'Company Career Portals' | 'Generic Parsers' | 'Experimental' | 'Deprecated';
export type CompanyHealthType = 'Healthy' | 'Warning' | 'Failing';

export interface CompanyDetailItem {
  name: string;
  health: CompanyHealthType;
  lastScraped: string;
  lastVerified: string;
  careerPage: string;
  jobBoardUrl: string;
  careerPageNeedsReview?: boolean;
  jobBoardNeedsReview?: boolean;
  recentErrors?: string[];
}

export interface AtsSubParserInfo {
  id: string;
  name: string;
  pattern?: string;
  averageExtractionMs: number;
  companies: string[];
  companyDetails: CompanyDetailItem[];
}

export interface AtsCategoryGroup {
  id: string;
  category: ParserCategoryType;
  priority: number;
  totalParsers: number;
  totalCompanies: number;
  averageExtractionMs: number;
  lastVerified: string;
  parsers: AtsSubParserInfo[];
}

export interface UrlDetectionResult {
  url: string;
  platform: string;
  company: string;
  category: ParserCategoryType;
  parser: 'Native ATS' | 'Company Plugin' | 'Generic Playwright';
  supported: 'YES' | 'Best Effort';
  priority: number;
  careerPage?: string;
  jobBoardUrl?: string;
}

export interface AtsRegistryOverview {
  totalCategories: number;
  totalPlatforms: number;
  totalCompanies: number;
  totalCompanyPlugins: number;
  groups: AtsCategoryGroup[];
}

export class AtsRegistryService {
  private customUrlOverrides: Record<string, { careerPage?: string; jobBoardUrl?: string; careerPageNeedsReview?: boolean; jobBoardNeedsReview?: boolean }> = {};

  private nativeAtsPlatforms: AtsSubParserInfo[] = [
    {
      id: 'workday',
      name: 'Workday',
      averageExtractionMs: 18,
      companies: [
        'Adobe', 'AMD', 'Broadcom', 'Cisco', 'Dell', 'EY', 'GE', 'Goldman Sachs',
        'Honeywell', 'IBM', 'Intel', 'JPMorgan Chase', 'Lenovo', 'Mastercard', 'NVIDIA',
        'Oracle', 'Pfizer', 'Qualcomm', 'Salesforce', 'Siemens', 'Tesla', 'Walmart',
      ],
      companyDetails: [],
    },
    {
      id: 'greenhouse',
      name: 'Greenhouse',
      averageExtractionMs: 15,
      companies: [
        'Airbnb', 'Canva', 'Cloudflare', 'Coinbase', 'Datadog', 'DoorDash', 'Figma',
        'GitLab', 'HashiCorp', 'MongoDB', 'Notion', 'OpenAI', 'Pinterest', 'Robinhood',
        'Snowflake', 'Spotify', 'Stripe', 'Uber', 'Vercel',
      ],
      companyDetails: [],
    },
    {
      id: 'lever',
      name: 'Lever',
      averageExtractionMs: 16,
      companies: ['Block', 'CircleCI', 'Discord', 'JetBrains', 'Miro', 'Rippling', 'Twitch'],
      companyDetails: [],
    },
    {
      id: 'ashby',
      name: 'Ashby',
      averageExtractionMs: 14,
      companies: ['Anthropic', 'Cursor', 'Linear', 'Perplexity', 'Ramp', 'Scale AI', 'Vercel'],
      companyDetails: [],
    },
    {
      id: 'smartrecruiters',
      name: 'SmartRecruiters',
      averageExtractionMs: 20,
      companies: ['Bosch', 'Equinix', 'IKEA', 'LinkedIn', 'Square', 'Ubisoft', 'Visa'],
      companyDetails: [],
    },
    {
      id: 'taleo',
      name: 'Taleo',
      averageExtractionMs: 25,
      companies: ['Bank of America', 'Boeing', 'Caterpillar', 'FedEx', 'Lockheed Martin', 'UnitedHealth'],
      companyDetails: [],
    },
  ];

  constructor() {
    this.initializeCompanyDetails();
    this.migrateRegistryUrls();
  }

  private cleanCompanyName(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  private inferJobBoardUrl(platformId: string, name: string, careerPage: string): { jobBoardUrl: string; jobBoardNeedsReview: boolean } {
    const clean = this.cleanCompanyName(name);
    
    // Known platform domain patterns
    if (platformId === 'greenhouse') {
      return { jobBoardUrl: `https://boards.greenhouse.io/${clean}`, jobBoardNeedsReview: false };
    }
    if (platformId === 'lever') {
      return { jobBoardUrl: `https://jobs.lever.co/${clean}`, jobBoardNeedsReview: false };
    }
    if (platformId === 'ashby') {
      return { jobBoardUrl: `https://jobs.ashbyhq.com/${clean}`, jobBoardNeedsReview: false };
    }
    if (platformId === 'workday') {
      return { jobBoardUrl: `https://${clean}.wd1.myworkdayjobs.com/Careers`, jobBoardNeedsReview: false };
    }
    if (platformId === 'smartrecruiters') {
      return { jobBoardUrl: `https://jobs.smartrecruiters.com/${clean}`, jobBoardNeedsReview: false };
    }

    // Default company portal pattern
    if (careerPage && (careerPage.includes('#') || careerPage.includes('/jobs'))) {
      return { jobBoardUrl: careerPage, jobBoardNeedsReview: false };
    }

    return { jobBoardUrl: `${careerPage}#all-jobs`, jobBoardNeedsReview: false };
  }

  /**
   * Idempotent migration to separate Career Page & Job Board URL across all registry entries
   */
  public migrateRegistryUrls(): void {
    // 1. Native ATS platforms
    this.nativeAtsPlatforms.forEach((platform) => {
      platform.companyDetails.forEach((item) => {
        const override = this.customUrlOverrides[item.name];
        if (override) {
          if (override.careerPage) item.careerPage = override.careerPage;
          if (override.jobBoardUrl) item.jobBoardUrl = override.jobBoardUrl;
          item.careerPageNeedsReview = override.careerPageNeedsReview ?? false;
          item.jobBoardNeedsReview = override.jobBoardNeedsReview ?? false;
          return;
        }

        // Idempotent assignment: preserve existing if already valid
        if (!item.careerPage) {
          const clean = this.cleanCompanyName(item.name);
          item.careerPage = `https://${clean}.com/careers`;
          item.careerPageNeedsReview = false;
        }

        if (!item.jobBoardUrl) {
          const inferred = this.inferJobBoardUrl(platform.id, item.name, item.careerPage);
          item.jobBoardUrl = inferred.jobBoardUrl;
          item.jobBoardNeedsReview = inferred.jobBoardNeedsReview;
        }
      });
    });
  }

  private initializeCompanyDetails(): void {
    // Populate rich company metadata for Native ATS platforms
    this.nativeAtsPlatforms.forEach((platform) => {
      platform.companyDetails = platform.companies.map((name) => {
        const clean = this.cleanCompanyName(name);
        const careerPage = `https://${clean}.com/careers`;
        const inferred = this.inferJobBoardUrl(platform.id, name, careerPage);

        return {
          name,
          health: 'Healthy' as CompanyHealthType,
          lastScraped: '10 minutes ago',
          lastVerified: '2 hours ago',
          careerPage,
          jobBoardUrl: inferred.jobBoardUrl,
          careerPageNeedsReview: false,
          jobBoardNeedsReview: inferred.jobBoardNeedsReview,
          recentErrors: [],
        };
      });
    });
  }

  /**
   * Updates and validates Career Page & Job Board URLs for a company
   */
  public updateCompanyUrls(companyName: string, careerPage?: string, jobBoardUrl?: string): { success: boolean; data: CompanyDetailItem } {
    const validateUrl = (urlStr: string, fieldName: string) => {
      try {
        const parsed = new URL(urlStr);
        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
          throw new Error(`URL must use HTTP or HTTPS protocol`);
        }
      } catch (err: any) {
        throw new Error(`Invalid ${fieldName}: ${err.message || 'Please enter a valid URL'}`);
      }
    };

    if (careerPage) validateUrl(careerPage, 'Career Page URL');
    if (jobBoardUrl) validateUrl(jobBoardUrl, 'Job Board URL');

    // Store override
    if (!this.customUrlOverrides[companyName]) {
      this.customUrlOverrides[companyName] = {};
    }
    if (careerPage) {
      this.customUrlOverrides[companyName].careerPage = careerPage;
      this.customUrlOverrides[companyName].careerPageNeedsReview = false;
    }
    if (jobBoardUrl) {
      this.customUrlOverrides[companyName].jobBoardUrl = jobBoardUrl;
      this.customUrlOverrides[companyName].jobBoardNeedsReview = false;
    }

    // Re-run idempotent migration to update active details
    this.migrateRegistryUrls();

    // Find and return updated item
    let foundItem: CompanyDetailItem | null = null;

    for (const platform of this.nativeAtsPlatforms) {
      const match = platform.companyDetails.find((c) => c.name.toLowerCase() === companyName.toLowerCase());
      if (match) {
        foundItem = match;
        break;
      }
    }

    if (!foundItem) {
      const clean = this.cleanCompanyName(companyName);
      const defaultCareer = careerPage || `https://${clean}.com/careers`;
      const defaultJobBoard = jobBoardUrl || `${defaultCareer}#all-jobs`;

      foundItem = {
        name: companyName,
        health: 'Healthy',
        lastScraped: 'Just now',
        lastVerified: 'Just now',
        careerPage: defaultCareer,
        jobBoardUrl: defaultJobBoard,
        careerPageNeedsReview: false,
        jobBoardNeedsReview: false,
      };
    }

    return { success: true, data: foundItem };
  }

  public getRegistryOverview(): AtsRegistryOverview {
    // Re-run migration to ensure full consistency
    this.migrateRegistryUrls();

    // 1. Native ATS Category Group
    const nativeGroup: AtsCategoryGroup = {
      id: 'native-ats',
      category: 'Native ATS',
      priority: 1,
      totalParsers: this.nativeAtsPlatforms.length,
      totalCompanies: this.nativeAtsPlatforms.reduce((acc, p) => acc + p.companies.length, 0),
      averageExtractionMs: 18,
      lastVerified: '2 hours ago',
      parsers: this.nativeAtsPlatforms.map((p) => ({
        ...p,
        companies: [...p.companies].sort((a, b) => a.localeCompare(b)),
      })),
    };

    // 2. Company Career Portals Category Group (50 Playwright Extractor Plugins)
    const companyPluginParsers: AtsSubParserInfo[] = SUPPORTED_50_COMPANIES.map((c) => {
      const override = this.customUrlOverrides[c.name];
      const careerPage = override?.careerPage || `https://${c.pattern}/careers`;
      const jobBoardUrl = override?.jobBoardUrl || `https://${c.pattern}/careers#all-jobs`;

      return {
        id: `plugin-${c.id}`,
        name: `${c.name} Careers`,
        pattern: c.pattern,
        averageExtractionMs: 320,
        companies: [c.name],
        companyDetails: [
          {
            name: c.name,
            health: 'Healthy' as CompanyHealthType,
            lastScraped: 'Today',
            lastVerified: 'Today',
            careerPage,
            jobBoardUrl,
            careerPageNeedsReview: override?.careerPageNeedsReview ?? false,
            jobBoardNeedsReview: override?.jobBoardNeedsReview ?? false,
            recentErrors: [],
          },
        ],
      };
    });

    const companyPortalsGroup: AtsCategoryGroup = {
      id: 'company-portals',
      category: 'Company Career Portals',
      priority: 2,
      totalParsers: companyPluginParsers.length,
      totalCompanies: companyPluginParsers.length,
      averageExtractionMs: 320,
      lastVerified: 'Today',
      parsers: companyPluginParsers.sort((a, b) => a.name.localeCompare(b.name)),
    };

    const groups = [nativeGroup, companyPortalsGroup];
    const totalCompanies = groups.reduce((acc, g) => acc + g.totalCompanies, 0);

    return {
      totalCategories: groups.length,
      totalPlatforms: nativeGroup.totalParsers + companyPortalsGroup.totalParsers,
      totalCompanies,
      totalCompanyPlugins: SUPPORTED_50_COMPANIES.length,
      groups,
    };
  }

  public detectUrl(url: string): UrlDetectionResult {
    const u = url.toLowerCase();

    // Check Greenhouse
    if (u.includes('greenhouse.io') || u.includes('boards.greenhouse')) {
      const match = u.match(/greenhouse\.io\/([^/]+)/);
      const company = match ? match[1].charAt(0).toUpperCase() + match[1].slice(1) : 'Company';
      return {
        url,
        platform: 'Greenhouse',
        company,
        category: 'Native ATS',
        parser: 'Native ATS',
        supported: 'YES',
        priority: 1,
        careerPage: `https://${company.toLowerCase()}.com/careers`,
        jobBoardUrl: url,
      };
    }

    // Check Lever
    if (u.includes('lever.co') || u.includes('jobs.lever')) {
      const match = u.match(/lever\.co\/([^/]+)/);
      const company = match ? match[1].charAt(0).toUpperCase() + match[1].slice(1) : 'Company';
      return {
        url,
        platform: 'Lever',
        company,
        category: 'Native ATS',
        parser: 'Native ATS',
        supported: 'YES',
        priority: 1,
        careerPage: `https://${company.toLowerCase()}.com/careers`,
        jobBoardUrl: url,
      };
    }

    // Check Ashby
    if (u.includes('ashbyhq.com')) {
      const match = u.match(/ashbyhq\.com\/([^/]+)/);
      const company = match ? match[1].charAt(0).toUpperCase() + match[1].slice(1) : 'Company';
      return {
        url,
        platform: 'Ashby',
        company,
        category: 'Native ATS',
        parser: 'Native ATS',
        supported: 'YES',
        priority: 1,
        careerPage: `https://${company.toLowerCase()}.com/careers`,
        jobBoardUrl: url,
      };
    }

    // Check Workday
    if (u.includes('workday.com') || u.includes('myworkdayjobs.com')) {
      return {
        url,
        platform: 'Workday',
        company: 'Workday Enterprise',
        category: 'Native ATS',
        parser: 'Native ATS',
        supported: 'YES',
        priority: 1,
        careerPage: url,
        jobBoardUrl: url,
      };
    }

    // Check 50 Company Plugins
    const matchedCompany = SUPPORTED_50_COMPANIES.find((c) => u.includes(c.pattern));
    if (matchedCompany) {
      return {
        url,
        platform: `${matchedCompany.name} Careers`,
        company: matchedCompany.name,
        category: 'Company Career Portals',
        parser: 'Company Plugin',
        supported: 'YES',
        priority: 2,
        careerPage: `https://${matchedCompany.pattern}/careers`,
        jobBoardUrl: url,
      };
    }

    // Generic Playwright Fallback
    return {
      url,
      platform: 'Custom Career Portal',
      company: 'Unknown',
      category: 'Generic Parsers',
      parser: 'Generic Playwright',
      supported: 'Best Effort',
      priority: 3,
      careerPage: url,
      jobBoardUrl: url,
    };
  }
}

