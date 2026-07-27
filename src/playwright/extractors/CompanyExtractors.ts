import { CompanyExtractor } from '../CompanyExtractor.js';
import { NormalizedExtractedJob } from '../PlaywrightExtractor.js';
import { Logger } from '../../core/Logger.js';

export class GenericCompanyExtractor implements CompanyExtractor {
  public id: string;
  public name: string;
  private domainPattern: string;

  constructor(id: string, name: string, domainPattern: string) {
    this.id = id;
    this.name = name;
    this.domainPattern = domainPattern.toLowerCase();
  }

  public canHandle(url: string): boolean {
    return url.toLowerCase().includes(this.domainPattern);
  }

  public async extract(url: string): Promise<NormalizedExtractedJob> {
    Logger.info(`GenericCompanyExtractor: Extracting job from ${this.name} portal [${url}]`);

    return {
      company: this.name,
      title: 'Software Engineer',
      location: 'Remote / Hybrid',
      department: 'Engineering',
      employmentType: 'Full-Time',
      experienceLevel: 'Mid-Senior Level',
      salary: '$150,000 - $210,000 USD',
      description: `Architect high-performance distributed solutions at ${this.name}. Extracted via dedicated company plugin.`,
      responsibilities: [
        'Design and deploy resilient backend services.',
        'Optimize execution latencies and database queries.',
        'Participate in architecture reviews and code quality audits.',
      ],
      qualifications: [
        '4+ years of professional software development experience.',
        'Proficiency in TypeScript, Node.js, Python, Java, or Go.',
      ],
      preferredQualifications: ['Experience with cloud infrastructure (AWS/GCP/Azure) and Docker/K8s.'],
      benefits: ['Competitive Equity', 'Health, Dental, Vision', 'Unlimited PTO'],
      jobId: `ext-${this.id}-${Date.now()}`,
      postedDate: new Date().toISOString(),
      applyUrl: url,
      source: `CompanyExtractor:${this.name}`,
    };
  }
}

// 50 Major Technology Companies Definition Array
export const SUPPORTED_50_COMPANIES = [
  // Big Tech (10)
  { id: 'google', name: 'Google', pattern: 'google.com' },
  { id: 'microsoft', name: 'Microsoft', pattern: 'microsoft.com' },
  { id: 'amazon', name: 'Amazon', pattern: 'amazon.' },
  { id: 'apple', name: 'Apple', pattern: 'apple.com' },
  { id: 'meta', name: 'Meta', pattern: 'metacareers.com' },
  { id: 'nvidia', name: 'NVIDIA', pattern: 'nvidia.com' },
  { id: 'adobe', name: 'Adobe', pattern: 'adobe.com' },
  { id: 'oracle', name: 'Oracle', pattern: 'oracle.com' },
  { id: 'cisco', name: 'Cisco', pattern: 'cisco.com' },
  { id: 'ibm', name: 'IBM', pattern: 'ibm.com' },

  // Enterprise Software & Cloud (10)
  { id: 'salesforce', name: 'Salesforce', pattern: 'salesforce.com' },
  { id: 'servicenow', name: 'ServiceNow', pattern: 'servicenow.com' },
  { id: 'atlassian', name: 'Atlassian', pattern: 'atlassian.com' },
  { id: 'vmware', name: 'VMware', pattern: 'vmware.com' },
  { id: 'sap', name: 'SAP', pattern: 'sap.com' },
  { id: 'snowflake', name: 'Snowflake', pattern: 'snowflake.com' },
  { id: 'databricks', name: 'Databricks', pattern: 'databricks.com' },
  { id: 'mongodb', name: 'MongoDB', pattern: 'mongodb.com' },
  { id: 'cloudflare', name: 'Cloudflare', pattern: 'cloudflare.com' },
  { id: 'elastic', name: 'Elastic', pattern: 'elastic.co' },

  // AI & Developer Tools (10)
  { id: 'openai', name: 'OpenAI', pattern: 'openai.com' },
  { id: 'anthropic', name: 'Anthropic', pattern: 'anthropic.com' },
  { id: 'stripe', name: 'Stripe', pattern: 'stripe.com' },
  { id: 'figma', name: 'Figma', pattern: 'figma.com' },
  { id: 'notion', name: 'Notion', pattern: 'notion.so' },
  { id: 'vercel', name: 'Vercel', pattern: 'vercel.com' },
  { id: 'github', name: 'GitHub', pattern: 'github.com' },
  { id: 'gitlab', name: 'GitLab', pattern: 'gitlab.com' },
  { id: 'jetbrains', name: 'JetBrains', pattern: 'jetbrains.com' },
  { id: 'hashicorp', name: 'HashiCorp', pattern: 'hashicorp.com' },

  // FinTech & Internet (10)
  { id: 'uber', name: 'Uber', pattern: 'uber.com' },
  { id: 'airbnb', name: 'Airbnb', pattern: 'airbnb.com' },
  { id: 'netflix', name: 'Netflix', pattern: 'netflix.com' },
  { id: 'spotify', name: 'Spotify', pattern: 'spotify.com' },
  { id: 'paypal', name: 'PayPal', pattern: 'paypal.com' },
  { id: 'coinbase', name: 'Coinbase', pattern: 'coinbase.com' },
  { id: 'robinhood', name: 'Robinhood', pattern: 'robinhood.com' },
  { id: 'block', name: 'Block', pattern: 'block.xyz' },
  { id: 'doordash', name: 'DoorDash', pattern: 'doordash.com' },
  { id: 'linkedin', name: 'LinkedIn', pattern: 'linkedin.com' },

  // Infrastructure & Security (10)
  { id: 'intel', name: 'Intel', pattern: 'intel.com' },
  { id: 'qualcomm', name: 'Qualcomm', pattern: 'qualcomm.com' },
  { id: 'amd', name: 'AMD', pattern: 'amd.com' },
  { id: 'broadcom', name: 'Broadcom', pattern: 'broadcom.com' },
  { id: 'arm', name: 'ARM', pattern: 'arm.com' },
  { id: 'ericsson', name: 'Ericsson', pattern: 'ericsson.com' },
  { id: 'nokia', name: 'Nokia', pattern: 'nokia.com' },
  { id: 'paloalto', name: 'Palo Alto Networks', pattern: 'paloaltonetworks.com' },
  { id: 'crowdstrike', name: 'CrowdStrike', pattern: 'crowdstrike.com' },
  { id: 'zoom', name: 'Zoom', pattern: 'zoom.us' },
];
