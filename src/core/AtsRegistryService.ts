import { SUPPORTED_50_COMPANIES } from '../playwright/extractors/CompanyExtractors.js';

export type ParserCategoryType = 'Native ATS' | 'Company Career Portals' | 'Generic Parsers' | 'Experimental' | 'Deprecated';
export type ParserStatusType = 'Supported' | 'Experimental' | 'Deprecated' | 'Best Effort';

export interface AtsSubParserInfo {
  id: string;
  name: string;
  pattern?: string;
  averageExtractionMs: number;
  companies: string[];
}

export interface AtsCategoryGroup {
  id: string;
  category: ParserCategoryType;
  priority: number;
  status: ParserStatusType;
  totalParsers: number;
  totalCompanies: number;
  averageExtractionMs: number;
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
}

export interface AtsRegistryOverview {
  totalCategories: number;
  totalPlatforms: number;
  totalCompanies: number;
  totalCompanyPlugins: number;
  totalGenericExtractors: number;
  groups: AtsCategoryGroup[];
}

export class AtsRegistryService {
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
    },
    {
      id: 'lever',
      name: 'Lever',
      averageExtractionMs: 16,
      companies: ['Block', 'CircleCI', 'Discord', 'JetBrains', 'Miro', 'Rippling', 'Twitch'],
    },
    {
      id: 'ashby',
      name: 'Ashby',
      averageExtractionMs: 14,
      companies: ['Anthropic', 'Cursor', 'Linear', 'Perplexity', 'Ramp', 'Scale AI', 'Vercel'],
    },
    {
      id: 'smartrecruiters',
      name: 'SmartRecruiters',
      averageExtractionMs: 20,
      companies: ['Bosch', 'Equinix', 'IKEA', 'LinkedIn', 'Square', 'Ubisoft', 'Visa'],
    },
    {
      id: 'taleo',
      name: 'Taleo',
      averageExtractionMs: 25,
      companies: ['Bank of America', 'Boeing', 'Caterpillar', 'FedEx', 'Lockheed Martin', 'UnitedHealth'],
    },
  ];

  public getRegistryOverview(): AtsRegistryOverview {
    // 1. Group Native ATS Parsers
    const nativeGroup: AtsCategoryGroup = {
      id: 'native-ats',
      category: 'Native ATS',
      priority: 1,
      status: 'Supported',
      totalParsers: this.nativeAtsPlatforms.length,
      totalCompanies: this.nativeAtsPlatforms.reduce((acc, p) => acc + p.companies.length, 0),
      averageExtractionMs: 18,
      parsers: this.nativeAtsPlatforms.map((p) => ({
        ...p,
        companies: [...p.companies].sort((a, b) => a.localeCompare(b)),
      })),
    };

    // 2. Group 50 Company Plugins under single Company Career Portals category
    const companyPluginParsers: AtsSubParserInfo[] = SUPPORTED_50_COMPANIES.map((c) => ({
      id: `plugin-${c.id}`,
      name: `${c.name} Careers`,
      pattern: c.pattern,
      averageExtractionMs: 350,
      companies: [c.name],
    }));

    const companyPortalsGroup: AtsCategoryGroup = {
      id: 'company-portals',
      category: 'Company Career Portals',
      priority: 2,
      status: 'Supported',
      totalParsers: companyPluginParsers.length,
      totalCompanies: companyPluginParsers.length,
      averageExtractionMs: 350,
      parsers: companyPluginParsers.sort((a, b) => a.name.localeCompare(b.name)),
    };

    // 3. Group Generic Playwright Fallback
    const genericGroup: AtsCategoryGroup = {
      id: 'generic-parsers',
      category: 'Generic Parsers',
      priority: 3,
      status: 'Best Effort',
      totalParsers: 1,
      totalCompanies: 0, // Dynamic coverage
      averageExtractionMs: 650,
      parsers: [
        {
          id: 'generic-playwright',
          name: 'Playwright Heuristic Extractor',
          averageExtractionMs: 650,
          companies: ['All Unlisted Custom Portals'],
        },
      ],
    };

    const groups = [nativeGroup, companyPortalsGroup, genericGroup];
    const totalCompanies = groups.reduce((acc, g) => acc + g.totalCompanies, 0);

    return {
      totalCategories: groups.length,
      totalPlatforms: nativeGroup.totalParsers + companyPortalsGroup.totalParsers + 1,
      totalCompanies,
      totalCompanyPlugins: SUPPORTED_50_COMPANIES.length,
      totalGenericExtractors: 1,
      groups,
    };
  }

  public detectUrl(url: string): UrlDetectionResult {
    const u = url.toLowerCase();

    // Check Greenhouse
    if (u.includes('greenhouse.io') || u.includes('boards.greenhouse')) {
      const match = u.match(/greenhouse\.io\/([^/]+)/);
      const company = match ? match[1].charAt(0).toUpperCase() + match[1].slice(1) : 'Company';
      return { url, platform: 'Greenhouse', company, category: 'Native ATS', parser: 'Native ATS', supported: 'YES', priority: 1 };
    }

    // Check Lever
    if (u.includes('lever.co') || u.includes('jobs.lever')) {
      const match = u.match(/lever\.co\/([^/]+)/);
      const company = match ? match[1].charAt(0).toUpperCase() + match[1].slice(1) : 'Company';
      return { url, platform: 'Lever', company, category: 'Native ATS', parser: 'Native ATS', supported: 'YES', priority: 1 };
    }

    // Check Ashby
    if (u.includes('ashbyhq.com')) {
      const match = u.match(/ashbyhq\.com\/([^/]+)/);
      const company = match ? match[1].charAt(0).toUpperCase() + match[1].slice(1) : 'Company';
      return { url, platform: 'Ashby', company, category: 'Native ATS', parser: 'Native ATS', supported: 'YES', priority: 1 };
    }

    // Check Workday
    if (u.includes('workday.com') || u.includes('myworkdayjobs.com')) {
      return { url, platform: 'Workday', company: 'Workday Enterprise', category: 'Native ATS', parser: 'Native ATS', supported: 'YES', priority: 1 };
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
    };
  }
}
