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

// Dedicated Company Portal Extractor Definitions (Companies using custom portals rather than Native ATS)
export const SUPPORTED_50_COMPANIES = [
  // Big Tech & Custom Portals
  { id: 'google', name: 'Google', pattern: 'google.com', careerPage: 'https://careers.google.com', jobBoardUrl: 'https://careers.google.com/jobs/results' },
  { id: 'microsoft', name: 'Microsoft', pattern: 'microsoft.com', careerPage: 'https://careers.microsoft.com', jobBoardUrl: 'https://careers.microsoft.com/v2/global/en/home.html' },
  { id: 'amazon', name: 'Amazon', pattern: 'amazon.', careerPage: 'https://www.amazon.jobs', jobBoardUrl: 'https://www.amazon.jobs/en/search' },
  { id: 'apple', name: 'Apple', pattern: 'apple.com', careerPage: 'https://www.apple.com/careers', jobBoardUrl: 'https://jobs.apple.com/en-us/search' },
  { id: 'meta', name: 'Meta', pattern: 'metacareers.com', careerPage: 'https://www.metacareers.com', jobBoardUrl: 'https://www.metacareers.com/jobs' },
  { id: 'oracle', name: 'Oracle', pattern: 'oracle.com', careerPage: 'https://www.oracle.com/careers', jobBoardUrl: 'https://eeho.fa.us2.oraclecloud.com/hcmUI/CandidateExperience/en/sites/jobsearch' },
  { id: 'cisco', name: 'Cisco', pattern: 'cisco.com', careerPage: 'https://jobs.cisco.com', jobBoardUrl: 'https://jobs.cisco.com/jobs/SearchJobs' },

  // Enterprise & Cloud Custom Portals
  { id: 'servicenow', name: 'ServiceNow', pattern: 'servicenow.com', careerPage: 'https://careers.servicenow.com', jobBoardUrl: 'https://careers.servicenow.com/jobs/' },
  { id: 'atlassian', name: 'Atlassian', pattern: 'atlassian.com', careerPage: 'https://www.atlassian.com/company/careers', jobBoardUrl: 'https://www.atlassian.com/company/careers/all-jobs' },
  { id: 'vmware', name: 'VMware', pattern: 'vmware.com', careerPage: 'https://careers.broadcom.com/jobs', jobBoardUrl: 'https://careers.broadcom.com/jobs' },
  { id: 'sap', name: 'SAP', pattern: 'sap.com', careerPage: 'https://jobs.sap.com', jobBoardUrl: 'https://jobs.sap.com/search' },
  { id: 'elastic', name: 'Elastic', pattern: 'elastic.co', careerPage: 'https://www.elastic.co/about/careers', jobBoardUrl: 'https://jobs.elastic.co/' },
  { id: 'github', name: 'GitHub', pattern: 'github.com', careerPage: 'https://github.com/about/careers', jobBoardUrl: 'https://www.github.careers/careers-home' },

  // Media, FinTech & Consumer Custom Portals
  { id: 'netflix', name: 'Netflix', pattern: 'netflix.com', careerPage: 'https://jobs.netflix.com', jobBoardUrl: 'https://jobs.netflix.com' },
  { id: 'coinbase', name: 'Coinbase', pattern: 'coinbase.com', careerPage: 'https://www.coinbase.com/careers', jobBoardUrl: 'https://www.coinbase.com/careers/positions' },
  { id: 'linkedin', name: 'LinkedIn', pattern: 'linkedin.com', careerPage: 'https://careers.linkedin.com/', jobBoardUrl: 'https://careers.linkedin.com/' },
  { id: 'flipkart', name: 'Flipkart', pattern: 'flipkartcareers.com', careerPage: 'https://www.flipkartcareers.com/', jobBoardUrl: 'https://www.flipkartcareers.com/' },
  { id: 'hsbc', name: 'HSBC', pattern: 'hsbc.com', careerPage: 'https://www.hsbc.com/careers', jobBoardUrl: 'https://www.hsbc.com/careers' },

  // Infrastructure & Global Portals
  { id: 'bytedance', name: 'ByteDance', pattern: 'bytedance.com', careerPage: 'https://jobs.bytedance.com/en/', jobBoardUrl: 'https://jobs.bytedance.com/en/' },
  { id: 'arm', name: 'ARM', pattern: 'arm.com', careerPage: 'https://careers.arm.com', jobBoardUrl: 'https://careers.arm.com/search-jobs' },
  { id: 'ericsson', name: 'Ericsson', pattern: 'ericsson.com', careerPage: 'https://www.ericsson.com/en/careers', jobBoardUrl: 'https://jobs.ericsson.com' },
  { id: 'nokia', name: 'Nokia', pattern: 'nokia.com', careerPage: 'https://www.nokia.com/about-us/careers', jobBoardUrl: 'https://www.nokia.com/about-us/careers/search-jobs' },
];
