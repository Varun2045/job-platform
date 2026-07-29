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

// Verified Workday URLs Dictionary
const WORKDAY_KNOWN_URLS: Record<string, { careerPage: string; jobBoardUrl: string }> = {
  'Adobe': { careerPage: 'https://www.adobe.com/careers.html', jobBoardUrl: 'https://adobe.wd5.myworkdayjobs.com/external_experienced' },

  'Broadcom': { careerPage: 'https://www.broadcom.com/company/careers', jobBoardUrl: 'https://broadcom.wd1.myworkdayjobs.com/External_Career' },
  'Cisco': { careerPage: 'https://jobs.cisco.com', jobBoardUrl: 'https://jobs.cisco.com/jobs/SearchJobs' },


  'Expedia': { careerPage: 'https://careers.expediagroup.com/jobs/', jobBoardUrl: 'https://expedia.wd108.myworkdayjobs.com/en-US/search' },
  'GE Aerospace': { careerPage: 'https://geaerospace.wd5.myworkdayjobs.com/GE_ExternalSite', jobBoardUrl: 'https://geaerospace.wd5.myworkdayjobs.com/GE_ExternalSite' },
  'GE Vernova': { careerPage: 'https://gevernova.wd5.myworkdayjobs.com/Vernova_ExternalSite', jobBoardUrl: 'https://gevernova.wd5.myworkdayjobs.com/Vernova_ExternalSite' },
  'GE HealthCare': { careerPage: 'https://gehc.wd5.myworkdayjobs.com/GEHC_ExternalSite', jobBoardUrl: 'https://gehc.wd5.myworkdayjobs.com/GEHC_ExternalSite' },
  'HP Inc.': { careerPage: 'https://jobs.hp.com', jobBoardUrl: 'https://hp.wd5.myworkdayjobs.com/ExternalCareerSite' },
  'HPE': { careerPage: 'https://careers.hpe.com', jobBoardUrl: 'https://hpe.wd5.myworkdayjobs.com/Jobsathpe' },
  'Mastercard': { careerPage: 'https://careers.mastercard.com', jobBoardUrl: 'https://mastercard.wd1.myworkdayjobs.com/CorporateCareers' },
  'NVIDIA': { careerPage: 'https://www.nvidia.com/en-us/about-nvidia/careers', jobBoardUrl: 'https://nvidia.wd5.myworkdayjobs.com/NVIDIAExternalCareerSite' },
  'Oracle': { careerPage: 'https://www.oracle.com/careers', jobBoardUrl: 'https://eeho.fa.us2.oraclecloud.com/hcmUI/CandidateExperience/en/sites/jobsearch' },
  'Pfizer': { careerPage: 'https://www.pfizer.com/about/careers', jobBoardUrl: 'https://pfizer.wd1.myworkdayjobs.com/PfizerCareers' },
  'Qualcomm': { careerPage: 'https://www.qualcomm.com/company/careers', jobBoardUrl: 'https://qualcomm.wd5.myworkdayjobs.com/External' },
  'Salesforce': { careerPage: 'https://careers.salesforce.com', jobBoardUrl: 'https://salesforce.wd12.myworkdayjobs.com/External_Career_Site' },
  'Siemens': { careerPage: 'https://jobs.siemens.com', jobBoardUrl: 'https://siemens.wd3.myworkdayjobs.com/Siemens_Careers' },
  'Tesla': { careerPage: 'https://www.tesla.com/careers', jobBoardUrl: 'https://tesla.wd1.myworkdayjobs.com/Tesla_Careers' },
  'Walmart': { careerPage: 'https://careers.walmart.com', jobBoardUrl: 'https://walmart.wd5.myworkdayjobs.com/WalmartExternal' },
  'CrowdStrike': { careerPage: 'https://www.crowdstrike.com/careers', jobBoardUrl: 'https://crowdstrike.wd5.myworkdayjobs.com/CrowdStrikeCareers' },
  'Palo Alto Networks': { careerPage: 'https://www.paloaltonetworks.com/company/careers', jobBoardUrl: 'https://paloaltonetworks.wd1.myworkdayjobs.com/External' },
  'PayPal': { careerPage: 'https://www.paypal.com/us/webapps/mpp/jobs', jobBoardUrl: 'https://paypal.wd1.myworkdayjobs.com/paypal-careers' },
  'Zoom': { careerPage: 'https://careers.zoom.us', jobBoardUrl: 'https://zoom.wd5.myworkdayjobs.com/Zoom' },
  'PwC': { careerPage: 'https://www.pwc.com/careers', jobBoardUrl: 'https://pwc.wd1.myworkdayjobs.com/PwC_Careers' },
  'BrowserStack': { careerPage: 'https://www.browserstack.com/careers', jobBoardUrl: 'https://browserstack.wd3.myworkdayjobs.com/External' },
  'Autodesk': { careerPage: 'https://www.autodesk.com/careers', jobBoardUrl: 'https://autodesk.wd1.myworkdayjobs.com/Ext' },
  'BlackRock': { careerPage: 'https://www.blackrock.com/corporate/careers', jobBoardUrl: 'https://blackrock.wd1.myworkdayjobs.com/BlackRock_Professional' },
  'Expedia': { careerPage: 'https://www.expediagroup.com/careers', jobBoardUrl: 'https://expedia.wd5.myworkdayjobs.com/External' },
  'HP Inc.': { careerPage: 'https://jobs.hp.com', jobBoardUrl: 'https://hp.wd5.myworkdayjobs.com/External' },
  'HPE': { careerPage: 'https://careers.hpe.com', jobBoardUrl: 'https://hpe.wd5.myworkdayjobs.com/External' },
  'Logitech': { careerPage: 'https://www.logitech.com/en-us/about/careers.html', jobBoardUrl: 'https://logitech.wd5.myworkdayjobs.com/Logitech' },
  'Nike': { careerPage: 'https://jobs.nike.com', jobBoardUrl: 'https://nike.wd1.myworkdayjobs.com/External' },
  'Okta': { careerPage: 'https://www.okta.com/company/careers', jobBoardUrl: 'https://okta.wd1.myworkdayjobs.com/External' },
  'Red Hat': { careerPage: 'https://www.redhat.com/en/jobs', jobBoardUrl: 'https://redhat.wd5.myworkdayjobs.com/jobs' },
  'Splunk': { careerPage: 'https://www.splunk.com/en_us/careers.html', jobBoardUrl: 'https://splunk.wd1.myworkdayjobs.com/External' },
  'Zscaler': { careerPage: 'https://www.zscaler.com/careers', jobBoardUrl: 'https://zscaler.wd1.myworkdayjobs.com/Zscaler' },
};

// Custom portal overrides for companies that left their listed ATS
const LEVER_KNOWN_URLS: Record<string, string> = {};

// Taleo companies have moved to modern portals (taleo.net subdomains are dead)
const TALEO_KNOWN_URLS: Record<string, { careerPage: string; jobBoardUrl: string }> = {
  'Boeing':           { careerPage: 'https://jobs.boeing.com', jobBoardUrl: 'https://jobs.boeing.com' },
  'Caterpillar':      { careerPage: 'https://careers.caterpillar.com', jobBoardUrl: 'https://careers.caterpillar.com/en/jobs/' },
  'FedEx':            { careerPage: 'https://careers.fedex.com', jobBoardUrl: 'https://careers.fedex.com' },
  'Lockheed Martin':  { careerPage: 'https://www.lockheedmartinjobs.com', jobBoardUrl: 'https://www.lockheedmartinjobs.com' },
  'UnitedHealth':     { careerPage: 'https://careers.unitedhealthgroup.com', jobBoardUrl: 'https://careers.unitedhealthgroup.com' },
};

const ORACLECLOUD_KNOWN_URLS: Record<string, { careerPage: string; jobBoardUrl: string }> = {
  'Oracle':         { careerPage: 'https://www.oracle.com/careers', jobBoardUrl: 'https://eeho.fa.us2.oraclecloud.com/hcmUI/CandidateExperience/en/sites/jobsearch' },
  'KPMG':           { careerPage: 'https://ejgk.fa.em2.oraclecloud.com/careers', jobBoardUrl: 'https://ejgk.fa.em2.oraclecloud.com/careers' },
  'JPMorgan Chase': { careerPage: 'https://careers.jpmorganchase.com', jobBoardUrl: 'https://jpmc.fa.oraclecloud.com/hcmUI/CandidateExperience/en/sites/CX_1001/jobs' },
  'Honeywell':      { careerPage: 'https://careers.honeywell.com', jobBoardUrl: 'https://careers.honeywell.com/en/sites/Honeywell' },
};

export class AtsRegistryService {
  private customUrlOverrides: Record<string, { careerPage?: string; jobBoardUrl?: string; careerPageNeedsReview?: boolean; jobBoardNeedsReview?: boolean }> = {};

  private nativeAtsPlatforms: AtsSubParserInfo[] = [
    {
      id: 'workday',
      name: 'Workday',
      averageExtractionMs: 18,
      companies: [
        'Adobe', 'Autodesk', 'BlackRock', 'Broadcom', 'BrowserStack', 'CrowdStrike', 'Expedia',
        'GE Aerospace', 'GE Vernova', 'GE HealthCare', 'HP Inc.', 'HPE', 'Intel',
        'Logitech', 'Mastercard', 'Nike', 'NVIDIA', 'Okta', 'Palo Alto Networks', 'PayPal', 'Pfizer', 'PwC',
        'Qualcomm', 'Red Hat', 'Salesforce', 'Siemens', 'Splunk', 'Tesla', 'Walmart', 'Zoom', 'Zscaler',
      ],
      companyDetails: [],
    },
    {
      id: 'greenhouse',
      name: 'Greenhouse',
      averageExtractionMs: 15,
      companies: [
        'Adyen', 'Airbnb', 'Anthropic', 'Cloudflare', 'Cockroach Labs',
        'Databricks', 'Datadog', 'GitLab',
        'Grafana Labs', 'Groww', 'Instacart', 'JetBrains', 'Klaviyo', 'MongoDB', 'Palantir', 'PhonePe', 'Razorpay',
        'Reddit', 'Retool', 'Robinhood', 'Roblox', 'Rubrik', 'Sentry', 'ShareChat', 'Twitch', 'Twilio',
        'Unacademy', 'Unity', 'Whatfix', 'Wiz', 'YubiKey', 'Zapier', 'Zepto',
      ],
      companyDetails: [],
    },
    {
      id: 'lever',
      name: 'Lever',
      averageExtractionMs: 16,
      companies: ['Meesho', 'Spotify'],
      companyDetails: [],
    },
    {
      id: 'ashby',
      name: 'Ashby',
      averageExtractionMs: 14,
      companies: ['Cursor', 'ElevenLabs', 'LangChain', 'Linear', 'Modal Labs', 'Neon', 'Notion', 'OpenAI', 'Perplexity', 'Pinecone', 'PlanetScale', 'PostHog', 'Ramp', 'Rippling', 'Scale AI', 'Snowflake', 'Supabase', 'Temporal', 'Together AI', 'Vercel', 'Weights & Biases'],
      companyDetails: [],
    },
    {
      id: 'smartrecruiters',
      name: 'SmartRecruiters',
      averageExtractionMs: 20,
      companies: ['Bosch', 'Freshworks', 'Miro', 'Pinterest', 'Square', 'Ubisoft', 'Visa'],
      companyDetails: [],
    },
    {
      id: 'taleo',
      name: 'Taleo',
      averageExtractionMs: 25,
      companies: ['Boeing', 'Caterpillar', 'FedEx', 'Lockheed Martin', 'UnitedHealth'],
      companyDetails: [],
    },
    {
      id: 'oraclecloud',
      name: 'Oracle Cloud',
      averageExtractionMs: 22,
      companies: ['Honeywell', 'JPMorgan Chase', 'KPMG', 'Oracle'],
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

    // Specific overrides for companies whose ATS slug differs from their clean name
    const ASHBY_SLUG_OVERRIDES: Record<string, string> = {
      'Scale AI': 'scaleai',
      'ElevenLabs': 'elevenlabs',
      'LangChain': 'langchain',
      'Loom': 'loom',
      'Modal Labs': 'modal',
      'Neon': 'neon',
      'Notion': 'notion',
      'OpenAI': 'openai',
      'Pinecone': 'pinecone',
      'PlanetScale': 'planetscale',
      'PostHog': 'posthog',
      'Rippling': 'rippling',
      'Snowflake': 'snowflake',
      'Supabase': 'supabase',
      'Temporal': 'temporal',
      'Together AI': 'together',
      'Weights & Biases': 'wandb',
    };

    const SMARTRECRUITERS_SLUG_OVERRIDES: Record<string, string> = {
      'Bosch': 'BoschGroup',
      'Miro': 'RealtimeBoard',
      'Pinterest': 'Pinterest',
    };

    // Known platform domain patterns
    if (platformId === 'greenhouse') {
      if (name === 'Twitch') {
        return { jobBoardUrl: 'https://job-boards.greenhouse.io/twitch', jobBoardNeedsReview: false };
      }
      if (name === 'Razorpay') {
        return { jobBoardUrl: 'https://job-boards.greenhouse.io/razorpaysoftwareprivatelimited', jobBoardNeedsReview: false };
      }
      if (name === 'Anthropic') {
        return { jobBoardUrl: 'https://job-boards.greenhouse.io/anthropic', jobBoardNeedsReview: false };
      }
      if (name === 'JetBrains') {
        return { jobBoardUrl: 'https://job-boards.eu.greenhouse.io/jetbrains', jobBoardNeedsReview: false };
      }
      return { jobBoardUrl: `https://boards.greenhouse.io/${clean}`, jobBoardNeedsReview: false };
    }
    if (platformId === 'lever') {
      if (LEVER_KNOWN_URLS[name]) {
        return { jobBoardUrl: LEVER_KNOWN_URLS[name], jobBoardNeedsReview: false };
      }
      return { jobBoardUrl: `https://jobs.lever.co/${clean}`, jobBoardNeedsReview: false };
    }
    if (platformId === 'ashby') {
      const slug = ASHBY_SLUG_OVERRIDES[name] || clean;
      return { jobBoardUrl: `https://jobs.ashbyhq.com/${slug}`, jobBoardNeedsReview: false };
    }
    if (platformId === 'workday') {
      if (WORKDAY_KNOWN_URLS[name]) {
        return { jobBoardUrl: WORKDAY_KNOWN_URLS[name].jobBoardUrl, jobBoardNeedsReview: false };
      }
      return { jobBoardUrl: `https://${clean}.wd1.myworkdayjobs.com/Careers`, jobBoardNeedsReview: true };
    }
    if (platformId === 'smartrecruiters') {
      const slug = SMARTRECRUITERS_SLUG_OVERRIDES[name] || clean;
      return { jobBoardUrl: `https://careers.smartrecruiters.com/${slug}`, jobBoardNeedsReview: false };
    }

    if (platformId === 'taleo') {
      if (TALEO_KNOWN_URLS[name]) {
        return { jobBoardUrl: TALEO_KNOWN_URLS[name].jobBoardUrl, jobBoardNeedsReview: false };
      }
      return { jobBoardUrl: `https://${clean}.taleo.net/careersection`, jobBoardNeedsReview: true };
    }
    if (platformId === 'oraclecloud') {
      if (ORACLECLOUD_KNOWN_URLS[name]) {
        return { jobBoardUrl: ORACLECLOUD_KNOWN_URLS[name].jobBoardUrl, jobBoardNeedsReview: false };
      }
      return { jobBoardUrl: careerPage, jobBoardNeedsReview: false };
    }
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
        const knownWorkday = WORKDAY_KNOWN_URLS[name];
        const careerPage = knownWorkday ? knownWorkday.careerPage : `https://${clean}.com/careers`;
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
    const companyPluginParsers: AtsSubParserInfo[] = SUPPORTED_50_COMPANIES.map((c: any) => {
      const override = this.customUrlOverrides[c.name];
      const careerPage = override?.careerPage || c.careerPage || `https://${c.pattern}/careers`;
      const jobBoardUrl = override?.jobBoardUrl || c.jobBoardUrl || `https://${c.pattern}/careers#all-jobs`;

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

