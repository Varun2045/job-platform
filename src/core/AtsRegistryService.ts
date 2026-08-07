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
  totalNativeParsers: number;
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
  'Motorola Solutions': { careerPage: 'https://motorolasolutions.wd5.myworkdayjobs.com/Careers', jobBoardUrl: 'https://motorolasolutions.wd5.myworkdayjobs.com/Careers' },
  'NVIDIA': { careerPage: 'https://www.nvidia.com/en-us/about-nvidia/careers', jobBoardUrl: 'https://nvidia.wd5.myworkdayjobs.com/NVIDIAExternalCareerSite' },
  'Pfizer': { careerPage: 'https://www.pfizer.com/about/careers', jobBoardUrl: 'https://pfizer.wd1.myworkdayjobs.com/PfizerCareers' },
  'Red Hat': { careerPage: 'https://www.redhat.com/en/jobs', jobBoardUrl: 'https://redhat.wd5.myworkdayjobs.com/Jobs' },
  'Salesforce': { careerPage: 'https://careers.salesforce.com', jobBoardUrl: 'https://salesforce.wd12.myworkdayjobs.com/External_Career_Site' },
  'Samsung': { careerPage: 'http://sec.wd3.myworkdayjobs.com/Samsung_Careers', jobBoardUrl: 'http://sec.wd3.myworkdayjobs.com/Samsung_Careers' },
  'Siemens': { careerPage: 'https://jobs.siemens.com', jobBoardUrl: 'https://siemens.wd3.myworkdayjobs.com/Siemens_Careers' },
  'Slack': { careerPage: 'https://salesforce.wd12.myworkdayjobs.com/Slack', jobBoardUrl: 'https://salesforce.wd12.myworkdayjobs.com/Slack' },
  'Splunk': { careerPage: 'https://www.splunk.com/en_us/careers.html', jobBoardUrl: 'https://splunk.wd1.myworkdayjobs.com/External' },
  'Tesla': { careerPage: 'https://www.tesla.com/careers', jobBoardUrl: 'https://www.tesla.com/careers' },
  'Visa': { careerPage: 'https://careers.visa.com', jobBoardUrl: 'https://visa.wd5.myworkdayjobs.com/Visa' },
  'Walmart': { careerPage: 'https://careers.walmart.com', jobBoardUrl: 'https://walmart.wd5.myworkdayjobs.com/WalmartExternal' },
  'CrowdStrike': { careerPage: 'https://www.crowdstrike.com/careers', jobBoardUrl: 'https://crowdstrike.wd5.myworkdayjobs.com/CrowdStrikeCareers' },
  'Zoom': { careerPage: 'https://careers.zoom.us', jobBoardUrl: 'https://zoom.wd5.myworkdayjobs.com/Zoom' },
  'BrowserStack': { careerPage: 'https://www.browserstack.com/careers', jobBoardUrl: 'https://browserstack.wd3.myworkdayjobs.com/External' },
  'Autodesk': { careerPage: 'https://www.autodesk.com/careers', jobBoardUrl: 'https://autodesk.wd1.myworkdayjobs.com/Ext' },
  'BlackRock': { careerPage: 'https://www.blackrock.com/corporate/careers', jobBoardUrl: 'https://blackrock.wd1.myworkdayjobs.com/BlackRock_Professional' },
  'Logitech': { careerPage: 'https://www.logitech.com/en-us/about/careers.html', jobBoardUrl: 'https://logitech.wd5.myworkdayjobs.com/Logitech' },
  'Zscaler': { careerPage: 'https://www.zscaler.com/careers', jobBoardUrl: 'https://zscaler.wd1.myworkdayjobs.com/Zscaler' },
  'Uniphore': { careerPage: 'https://www.uniphore.com/careers/', jobBoardUrl: 'https://uniphore.wd503.myworkdayjobs.com/Uniphore' },
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
  'Oracle':         { careerPage: 'https://careers.oracle.com/en/sites/jobsearch/jobs?location=India', jobBoardUrl: 'https://careers.oracle.com/en/sites/jobsearch/jobs?location=India' },
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
        'Adobe', 'Analog Devices', 'Applied Materials', 'ASML', 'Autodesk',
        'BlackRock', 'Broadcom', 'BrowserStack', 'Cadence Design Systems', 'CrowdStrike',
        'Expedia', 'Fortinet', 'GE Aerospace', 'GE HealthCare', 'GE Vernova', 'HP Inc.', 'HPE',
        'Informatica', 'Intel', 'Jio Hotstar', 'Juniper Networks', 'KLA Corporation', 'Lam Research',
        'Logitech', 'Marvell Technology', 'Mastercard', 'Motorola Solutions',
        'NetApp', 'NVIDIA', 'Optum', 'Pfizer', 'Philips', 'Red Hat', 'Rubrik', 'Salesforce',
        'Siemens', 'Slack', 'Splunk', 'Texas Instruments', 'Uniphore', 'Visa', 'Warner Bros. Discovery',
        'Workday', 'Zendesk', 'Zoom',
      ],
      companyDetails: [],
    },
    {
      id: 'greenhouse',
      name: 'Greenhouse',
      averageExtractionMs: 15,
      companies: [
        'Adyen', 'Affirm', 'Airbnb', 'Anthropic', 'Box',
        'ClickHouse', 'Cloudflare', 'Cockroach Labs',
        'CoreWeave', 'Dagster Labs', 'Databricks', 'Datadog', 'DoorDash', 'Fastly', 'GitLab', 'Grafana Labs',
        'Groww', 'Graviton Research Capital', 'Headlands Tech', 'Hudson River Trading', 'InMobi',
        'Instacart', 'JetBrains', 'Jump Trading', 'Klaviyo', 'LaunchDarkly',
        'Netlify', 'NK Securities Research', 'Old Mission Capital', 'Optiver', 'PagerDuty', 'PhonePe', 'Pinterest', 'PlanetScale',
        'Postman', 'Pulumi', 'Pure Storage', 'Razorpay', 'Reddit',
        'Samsara', 'SmartBear', 'Sourcegraph',
        'Sumo Logic', 'Toast', 'Together AI', 'Tower Research Capital', 'Twilio', 'Twitch',
        'Vercel', 'Waymo',
      ],
      companyDetails: [],
    },
    {
      id: 'ashby',
      name: 'Ashby',
      averageExtractionMs: 14,
      companies: [
        'Airbyte', 'Anyscale', 'Baseten', 'Character.ai', 'Chroma', 'Classplus', 'Clerk', 'Cognition AI', 'Cohere', 'Confluent', 'Cursor',
        'ElevenLabs', 'Harvey', 'Ideogram', 'LangChain', 'Linear', 'Luma AI', 'Mercor', 'Mistral AI',
        'Modal Labs', 'Neon', 'Notion', 'OpenAI', 'Perplexity', 'Photoroom', 'Pinecone',
        'Qdrant', 'Railway', 'Ramp', 'Redis', 'Render', 'Replicate', 'Replit', 'Resend', 'Rocketlane', 'Sentry',
        'Snowflake', 'Supabase', 'Superhuman', 'Temporal', 'Turso', 'Vellum', 'World Labs',
      ],
      companyDetails: [],
    },
    {
      id: 'lever',
      name: 'Lever',
      averageExtractionMs: 16,
      companies: ['CRED', 'Meesho', 'Mindtickle', 'Palantir', 'Paytm', 'Spotify'],
      companyDetails: [],
    },
    {
      id: 'oraclecloud',
      name: 'Oracle Cloud',
      averageExtractionMs: 22,
      companies: ['Honeywell', 'JPMorgan Chase', 'KPMG', 'Oracle', 'Tesco Bengaluru'],
      companyDetails: [],
    },
    {
      id: 'taleo',
      name: 'Taleo',
      averageExtractionMs: 25,
      companies: ['Boeing', 'Caterpillar', 'FedEx', 'Lockheed Martin'],
      companyDetails: [],
    },
    {
      id: 'phenom',
      name: 'Phenom',
      averageExtractionMs: 21,
      companies: ['Barclays', 'Fidelity Investments', "Lowe's India", 'Wells Fargo'],
      companyDetails: [],
    },
    {
      id: 'smartrecruiters',
      name: 'SmartRecruiters',
      averageExtractionMs: 20,
      companies: ['Arista Networks', 'Bosch', 'Canva', 'Freshworks', 'Ubisoft'],
      companyDetails: [],
    },
    {
      id: 'avature',
      name: 'Avature',
      averageExtractionMs: 24,
      companies: ['Bloomberg', 'Deutsche Bank', 'UBS'],
      companyDetails: [],
    },
    {
      id: 'eightfold',
      name: 'Eightfold',
      averageExtractionMs: 22,
      companies: ['American Express', 'Micron Technology', 'PayPal'],
      companyDetails: [],
    },
    {
      id: 'darwinbox',
      name: 'Darwinbox',
      averageExtractionMs: 26,
      companies: ['Darwinbox', 'NxtWave', 'Porter', 'Rapido'],
      companyDetails: [],
    },
    {
      id: 'workable',
      name: 'Workable',
      averageExtractionMs: 19,
      companies: ['Hugging Face'],
      companyDetails: [],
    },
    {
      id: 'talent500',
      name: 'Talent500',
      averageExtractionMs: 25,
      companies: ['American Airlines GCC'],
      companyDetails: [],
    },
    {
      id: 'applytojob',
      name: 'ApplyToJob',
      averageExtractionMs: 18,
      companies: ['Jar'],
      companyDetails: [],
    },
    {
      id: 'freshteam',
      name: 'Freshteam',
      averageExtractionMs: 17,
      companies: ['Smallcase'],
      companyDetails: [],
    },
    {
      id: 'kekahire',
      name: 'Keka Hire',
      averageExtractionMs: 18,
      companies: ['Adda247', 'Eka Care'],
      companyDetails: [],
    },
    {
      id: 'weekday',
      name: 'Weekday',
      averageExtractionMs: 19,
      companies: ['Ather Energy', 'PhysicsWallah'],
      companyDetails: [],
    },
    {
      id: 'trakstar',
      name: 'Trakstar Hire',
      averageExtractionMs: 20,
      companies: ['BookMyShow'],
      companyDetails: [],
    },
    {
      id: 'peoplestrong',
      name: 'PeopleStrong',
      averageExtractionMs: 22,
      companies: ['Elasticrun'],
      companyDetails: [],
    },
    {
      id: 'zohorecruit',
      name: 'Zoho Recruit',
      averageExtractionMs: 18,
      companies: ['Increff'],
      companyDetails: [],
    },
    {
      id: 'consider',
      name: 'Consider',
      averageExtractionMs: 20,
      companies: ['WinZO'],
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
      'Freshworks': 'freshworks',
      'Ubisoft': 'ubisoft2',
    };

    // Known platform domain patterns
    if (platformId === 'greenhouse') {
      if (name === 'Box') {
        return { jobBoardUrl: 'https://job-boards.greenhouse.io/boxinc', jobBoardNeedsReview: false };
      }
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
      if (name === 'Together AI') {
        return { jobBoardUrl: 'https://job-boards.greenhouse.io/togetherai', jobBoardNeedsReview: false };
      }
      if (name === 'Vercel') {
        return { jobBoardUrl: 'https://job-boards.greenhouse.io/vercel', jobBoardNeedsReview: false };
      }
      if (name === 'Twilio') {
        return { jobBoardUrl: 'https://job-boards.greenhouse.io/twilio', jobBoardNeedsReview: false };
      }
      if (name === 'NK Securities' || name === 'NK Securities Research') {
        return { jobBoardUrl: 'https://job-boards.greenhouse.io/nksecuritiesresearch', jobBoardNeedsReview: false };
      }
      if (name === 'Pulumi') {
        return { jobBoardUrl: 'https://job-boards.greenhouse.io/pulumicorporation', jobBoardNeedsReview: false };
      }
      if (name === 'Sourcegraph') {
        return { jobBoardUrl: 'https://job-boards.greenhouse.io/sourcegraph91', jobBoardNeedsReview: false };
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
    if (platformId === 'applytojob') {
      if (name === 'Jar') {
        return { jobBoardUrl: 'https://changejar.applytojob.com/apply/', jobBoardNeedsReview: false };
      }
      return { jobBoardUrl: `https://${clean}.applytojob.com/apply/`, jobBoardNeedsReview: false };
    }
    if (platformId === 'freshteam') {
      return { jobBoardUrl: `https://${clean}.freshteam.com/jobs`, jobBoardNeedsReview: false };
    }
    if (platformId === 'kekahire') {
      if (name === 'Adda247') {
        return { jobBoardUrl: 'https://adda247.keka.com/careers/', jobBoardNeedsReview: false };
      }
      if (name === 'Eka Care') {
        return { jobBoardUrl: 'https://ekacare.keka.com/careers/', jobBoardNeedsReview: false };
      }
      return { jobBoardUrl: `https://${clean}.keka.com/careers/`, jobBoardNeedsReview: false };
    }
    if (platformId === 'weekday') {
      if (name === 'PhysicsWallah') {
        return { jobBoardUrl: 'https://jobs.lsvp.com/jobs/physicswallah', jobBoardNeedsReview: false };
      }
      return { jobBoardUrl: `https://careers.atherenergy.com/jobs`, jobBoardNeedsReview: false };
    }
    if (platformId === 'trakstar') {
      if (name === 'BookMyShow') {
        return { jobBoardUrl: 'https://in.bookmyshow.com/careers/job-listing', jobBoardNeedsReview: false };
      }
      return { jobBoardUrl: careerPage, jobBoardNeedsReview: false };
    }
    if (platformId === 'peoplestrong') {
      if (name === 'Elasticrun') {
        return { jobBoardUrl: 'https://elasticruncareers.peoplestrong.com/job/joblist', jobBoardNeedsReview: false };
      }
      return { jobBoardUrl: careerPage, jobBoardNeedsReview: false };
    }
    if (platformId === 'zohorecruit') {
      if (name === 'Increff') {
        return { jobBoardUrl: 'https://increff.zohorecruit.com/careers', jobBoardNeedsReview: false };
      }
      return { jobBoardUrl: `https://${clean}.zohorecruit.com/careers`, jobBoardNeedsReview: false };
    }
    if (platformId === 'darwinbox') {
      if (name === 'Porter') {
        return { jobBoardUrl: 'https://porter.darwinbox.in/ms/candidatev2/main/careers/home', jobBoardNeedsReview: false };
      }
      if (name === 'Rapido') {
        return { jobBoardUrl: 'https://rapido.darwinbox.in/ms/candidatev2/main', jobBoardNeedsReview: false };
      }
      return { jobBoardUrl: careerPage, jobBoardNeedsReview: false };
    }
    if (platformId === 'consider') {
      if (name === 'WinZO') {
        return { jobBoardUrl: 'https://consider.com/boards/vc/griffin-gaming/jobs/winzo', jobBoardNeedsReview: false };
      }
      return { jobBoardUrl: careerPage, jobBoardNeedsReview: false };
    }
    if (careerPage && (careerPage.includes('#') || careerPage.includes('/jobs'))) {
      return { jobBoardUrl: careerPage, jobBoardNeedsReview: false };
    }

    return { jobBoardUrl: `${careerPage}#all-jobs`, jobBoardNeedsReview: false };
  }

  private formatTimeAgo(dateInput?: string | Date | null): string {
    if (!dateInput) return 'Never';
    try {
      const past = new Date(dateInput).getTime();
      if (isNaN(past)) return 'Never';
      const diffMs = Date.now() - past;
      if (diffMs < 0) return 'Just now';
      
      const diffSecs = Math.floor(diffMs / 1000);
      if (diffSecs < 60) return 'Just now';
      
      const diffMins = Math.floor(diffSecs / 60);
      if (diffMins < 60) return `${diffMins}m ago`;
      
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d ago`;
    } catch {
      return 'Never';
    }
  }

  /**
   * Idempotent migration to separate Career Page & Job Board URL across all registry entries
   */
  public migrateRegistryUrls(dbCompanies?: Array<any>): void {
    const dbMap = new Map<string, any>();
    if (dbCompanies && Array.isArray(dbCompanies)) {
      for (const c of dbCompanies) {
        dbMap.set(c.name.toLowerCase(), c);
        dbMap.set(c.id.toLowerCase(), c);
      }
    }

    // 1. Native ATS platforms
    this.nativeAtsPlatforms.forEach((platform) => {
      platform.companyDetails.forEach((item) => {
        const override = this.customUrlOverrides[item.name];
        const dbComp = dbMap.get(item.name.toLowerCase()) || dbMap.get(item.name.toLowerCase().replace(/\s+/g, ''));
        
        if (override) {
          if (override.careerPage) item.careerPage = override.careerPage;
          if (override.jobBoardUrl) item.jobBoardUrl = override.jobBoardUrl;
          item.careerPageNeedsReview = override.careerPageNeedsReview ?? false;
          item.jobBoardNeedsReview = override.jobBoardNeedsReview ?? false;
          return;
        }

        // Use database fields if available
        if (dbComp) {
          if (dbComp.api_endpoint) {
            item.jobBoardUrl = dbComp.api_endpoint;
            if (!item.careerPage) {
              item.careerPage = dbComp.api_endpoint;
            }
            item.jobBoardNeedsReview = false;
          }

          if (dbComp.last_successful_scrape) {
            item.lastScraped = this.formatTimeAgo(dbComp.last_successful_scrape);
          } else {
            item.lastScraped = 'Never';
          }

          const lastVerify = dbComp.last_failed_scrape && (!dbComp.last_successful_scrape || new Date(dbComp.last_failed_scrape) > new Date(dbComp.last_successful_scrape))
            ? dbComp.last_failed_scrape
            : dbComp.last_successful_scrape;
          item.lastVerified = this.formatTimeAgo(lastVerify);

          if (dbComp.enabled === false) {
            item.health = 'Warning';
          } else if (dbComp.consecutive_failures > 0) {
            item.health = dbComp.consecutive_failures >= 3 ? 'Failing' : 'Warning';
          } else {
            item.health = 'Healthy';
          }
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

  public getRegistryOverview(
    healthMap?: Record<string, CompanyHealthType>,
    dbCompanies?: Array<any>,
  ): AtsRegistryOverview {
    // Re-run migration to ensure full consistency
    this.migrateRegistryUrls(dbCompanies);

    const getHealth = (compName: string): CompanyHealthType => {
      if (!healthMap) return 'Healthy';
      const key = compName.toLowerCase();
      return healthMap[key] || 'Healthy';
    };

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
        companyDetails: p.companyDetails.map((detail) => ({
          ...detail,
          health: getHealth(detail.name),
        })),
      })),
    };

    // Track existing companies already in native ATS engines
    const existingCompanyNames = new Set<string>();
    nativeGroup.parsers.forEach((p) => p.companies.forEach((name) => existingCompanyNames.add(name.toLowerCase())));

    // 2. Company & Dedicated Scraper Parsers Category Group (5 Dedicated Parsers)
    const dedicatedPluginsRaw = [
      { id: 'amazon', name: 'Amazon Dedicated Parser', pattern: 'amazon.jobs', company: 'Amazon', url: 'https://amazon.jobs' },
      { id: 'apple', name: 'Apple Dedicated Parser', pattern: 'jobs.apple.com', company: 'Apple', url: 'https://jobs.apple.com' },
      { id: 'google', name: 'Google Dedicated Parser', pattern: 'careers.google.com', company: 'Google', url: 'https://careers.google.com' },
      { id: 'meta', name: 'Meta Dedicated Parser', pattern: 'metacareers.com', company: 'Meta', url: 'https://www.metacareers.com' },
      { id: 'microsoft', name: 'Microsoft Dedicated Parser', pattern: 'careers.microsoft.com', company: 'Microsoft', url: 'https://careers.microsoft.com' },
    ];

    const dedicatedPlugins: AtsSubParserInfo[] = dedicatedPluginsRaw.map((p) => {
      existingCompanyNames.add(p.company.toLowerCase());
      const override = this.customUrlOverrides[p.company];
      const careerPage = override?.careerPage || p.url;
      const jobBoardUrl = override?.jobBoardUrl || p.url;
      const compHealth = getHealth(p.company);

      return {
        id: `plugin-${p.id}`,
        name: p.name,
        pattern: p.pattern,
        averageExtractionMs: 145,
        companies: [p.company],
        companyDetails: [
          {
            name: p.company,
            health: compHealth,
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

    const dedicatedGroup: AtsCategoryGroup = {
      id: 'dedicated-plugins',
      category: 'Company & Dedicated Scraper Parsers' as any,
      priority: 2,
      totalParsers: dedicatedPlugins.length,
      totalCompanies: dedicatedPlugins.length,
      averageExtractionMs: 145,
      lastVerified: 'Today',
      parsers: dedicatedPlugins,
    };

    // 3. Company Career Portals Category Group (Remaining Registered Database Companies)
    const companyPluginParsers: AtsSubParserInfo[] = SUPPORTED_50_COMPANIES
      .filter((c: any) => !existingCompanyNames.has(c.name.toLowerCase()))
      .map((c: any) => {
        existingCompanyNames.add(c.name.toLowerCase());
        const override = this.customUrlOverrides[c.name];
        const careerPage = override?.careerPage || c.careerPage || `https://${c.pattern}/careers`;
        const jobBoardUrl = override?.jobBoardUrl || c.jobBoardUrl || `https://${c.pattern}/careers#all-jobs`;
        const compHealth = getHealth(c.name);

        return {
          id: `plugin-${c.id}`,
          name: `${c.name} Careers`,
          pattern: c.pattern,
          averageExtractionMs: 320,
          companies: [c.name],
          companyDetails: [
            {
              name: c.name,
              health: compHealth,
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

    // Dynamically include all remaining companies from the database
    if (dbCompanies && Array.isArray(dbCompanies)) {
      for (const c of dbCompanies) {
        const nameLower = c.name.toLowerCase();
        if (!existingCompanyNames.has(nameLower)) {
          existingCompanyNames.add(nameLower);
          const override = this.customUrlOverrides[c.name];
          const careerPage = override?.careerPage || c.careerPage || c.url || c.api_endpoint || `https://${nameLower.replace(/\s+/g, '')}.com/careers`;
          const jobBoardUrl = override?.jobBoardUrl || c.jobBoardUrl || c.api_endpoint || `${careerPage}#jobs`;
          const compHealth = getHealth(c.name);

          companyPluginParsers.push({
            id: `plugin-${c.id || nameLower.replace(/\s+/g, '-')}`,
            name: `${c.name} Careers`,
            pattern: nameLower.replace(/\s+/g, ''),
            averageExtractionMs: 350,
            companies: [c.name],
            companyDetails: [
              {
                name: c.name,
                health: compHealth,
                lastScraped: c.last_successful_scrape ? 'Recently' : 'Pending',
                lastVerified: 'Today',
                careerPage,
                jobBoardUrl,
                careerPageNeedsReview: override?.careerPageNeedsReview ?? false,
                jobBoardNeedsReview: override?.jobBoardNeedsReview ?? false,
                recentErrors: [],
              },
            ],
          });
        }
      }
    }

    const companyPortalsGroup: AtsCategoryGroup = {
      id: 'company-portals',
      category: 'Company Career Portals',
      priority: 3,
      totalParsers: companyPluginParsers.length,
      totalCompanies: companyPluginParsers.length,
      averageExtractionMs: 320,
      lastVerified: 'Today',
      parsers: companyPluginParsers.sort((a, b) => a.name.localeCompare(b.name)),
    };

    const groups = [nativeGroup, dedicatedGroup, companyPortalsGroup];
    const totalCompanies = groups.reduce((acc, g) => acc + g.totalCompanies, 0);

    return {
      totalCategories: groups.length,
      totalPlatforms: nativeGroup.totalParsers + dedicatedGroup.totalParsers + companyPortalsGroup.totalParsers,
      totalCompanies,
      totalCompanyPlugins: dedicatedGroup.totalParsers + companyPortalsGroup.totalParsers,
      totalNativeParsers: nativeGroup.totalParsers,
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

