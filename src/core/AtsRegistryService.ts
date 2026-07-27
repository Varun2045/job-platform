import { SUPPORTED_50_COMPANIES } from '../playwright/extractors/CompanyExtractors.js';

export interface AtsPlatformInfo {
  id: string;
  name: string;
  parserType: 'Native ATS' | 'Company Plugin' | 'Generic Playwright';
  averageExtractionMs: number;
  companies: string[];
}

export interface UrlDetectionResult {
  url: string;
  platform: string;
  company: string;
  parser: 'Native ATS' | 'Company Plugin' | 'Generic Playwright';
  supported: 'YES' | 'Best Effort';
}

export interface AtsRegistryOverview {
  totalPlatforms: number;
  totalCompanies: number;
  totalCompanyPlugins: number;
  totalGenericExtractors: number;
  platforms: AtsPlatformInfo[];
}

export class AtsRegistryService {
  private nativeAtsPlatforms: AtsPlatformInfo[] = [
    {
      id: 'workday',
      name: 'Workday',
      parserType: 'Native ATS',
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
      parserType: 'Native ATS',
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
      parserType: 'Native ATS',
      averageExtractionMs: 16,
      companies: ['Block', 'CircleCI', 'Discord', 'JetBrains', 'Miro', 'Rippling', 'Twitch'],
    },
    {
      id: 'ashby',
      name: 'Ashby',
      parserType: 'Native ATS',
      averageExtractionMs: 14,
      companies: ['Anthropic', 'Cursor', 'Linear', 'Perplexity', 'Ramp', 'Scale AI', 'Vercel'],
    },
    {
      id: 'smartrecruiters',
      name: 'SmartRecruiters',
      parserType: 'Native ATS',
      averageExtractionMs: 20,
      companies: ['Bosch', 'Equinix', 'IKEA', 'LinkedIn', 'Square', 'Ubisoft', 'Visa'],
    },
    {
      id: 'taleo',
      name: 'Taleo',
      parserType: 'Native ATS',
      averageExtractionMs: 25,
      companies: ['Bank of America', 'Boeing', 'Caterpillar', 'FedEx', 'Lockheed Martin', 'UnitedHealth'],
    },
  ];

  public getRegistryOverview(): AtsRegistryOverview {
    const pluginPlatforms: AtsPlatformInfo[] = SUPPORTED_50_COMPANIES.map((c) => ({
      id: `plugin-${c.id}`,
      name: `${c.name} Careers`,
      parserType: 'Company Plugin',
      averageExtractionMs: 350,
      companies: [c.name],
    }));

    const allPlatforms = [...this.nativeAtsPlatforms, ...pluginPlatforms];

    // Alphabetically sort companies inside each platform
    allPlatforms.forEach((p) => {
      p.companies.sort((a, b) => a.localeCompare(b));
    });

    const totalCompanies = allPlatforms.reduce((sum, p) => sum + p.companies.length, 0);

    return {
      totalPlatforms: allPlatforms.length,
      totalCompanies,
      totalCompanyPlugins: SUPPORTED_50_COMPANIES.length,
      totalGenericExtractors: 1,
      platforms: allPlatforms,
    };
  }

  public detectUrl(url: string): UrlDetectionResult {
    const u = url.toLowerCase();

    // Check Greenhouse
    if (u.includes('greenhouse.io') || u.includes('boards.greenhouse')) {
      const match = u.match(/greenhouse\.io\/([^/]+)/);
      const company = match ? match[1].charAt(0).toUpperCase() + match[1].slice(1) : 'Company';
      return { url, platform: 'Greenhouse', company, parser: 'Native ATS', supported: 'YES' };
    }

    // Check Lever
    if (u.includes('lever.co') || u.includes('jobs.lever')) {
      const match = u.match(/lever\.co\/([^/]+)/);
      const company = match ? match[1].charAt(0).toUpperCase() + match[1].slice(1) : 'Company';
      return { url, platform: 'Lever', company, parser: 'Native ATS', supported: 'YES' };
    }

    // Check Ashby
    if (u.includes('ashbyhq.com')) {
      const match = u.match(/ashbyhq\.com\/([^/]+)/);
      const company = match ? match[1].charAt(0).toUpperCase() + match[1].slice(1) : 'Company';
      return { url, platform: 'Ashby', company, parser: 'Native ATS', supported: 'YES' };
    }

    // Check Workday
    if (u.includes('workday.com') || u.includes('myworkdayjobs.com')) {
      return { url, platform: 'Workday', company: 'Workday Enterprise', parser: 'Native ATS', supported: 'YES' };
    }

    // Check 50 Company Plugins
    const matchedCompany = SUPPORTED_50_COMPANIES.find((c) => u.includes(c.pattern));
    if (matchedCompany) {
      return {
        url,
        platform: `${matchedCompany.name} Careers`,
        company: matchedCompany.name,
        parser: 'Company Plugin',
        supported: 'YES',
      };
    }

    // Generic Playwright Fallback
    return {
      url,
      platform: 'Custom Career Portal',
      company: 'Unknown',
      parser: 'Generic Playwright',
      supported: 'Best Effort',
    };
  }
}
