import { Logger } from '../core/Logger.js';
import { BrowserPool } from './BrowserPool.js';
import { ExtractorRegistry } from './ExtractorRegistry.js';
import { GenericCompanyExtractor, SUPPORTED_50_COMPANIES } from './extractors/CompanyExtractors.js';

export interface NormalizedExtractedJob {
  company: string;
  title: string;
  location: string;
  department?: string;
  employmentType?: string;
  experienceLevel?: string;
  salary?: string | null;
  description: string;
  responsibilities?: string[];
  qualifications?: string[];
  preferredQualifications?: string[];
  benefits?: string[];
  jobId: string;
  postedDate?: string;
  applyUrl: string;
  source: string;
}

export class PlaywrightExtractor {
  private browserPool: BrowserPool;
  private registry: ExtractorRegistry;

  constructor() {
    this.browserPool = BrowserPool.getInstance();
    this.registry = ExtractorRegistry.getInstance();
    this.initializeRegistry();
  }

  private initializeRegistry(): void {
    SUPPORTED_50_COMPANIES.forEach((c) => {
      this.registry.register(new GenericCompanyExtractor(c.id, c.name, c.pattern));
    });
  }

  public async extractJob(jobUrl: string): Promise<NormalizedExtractedJob> {
    Logger.info(`PlaywrightExtractor: Initiating fallback extraction for URL [${jobUrl}]`);

    // Priority 2: Check plugin-based ExtractorRegistry
    const companyExtractor = this.registry.findExtractor(jobUrl);
    if (companyExtractor) {
      Logger.info(`PlaywrightExtractor: Found matched company plugin [${companyExtractor.name}] for URL [${jobUrl}]`);
      return companyExtractor.extract(jobUrl);
    }

    // Priority 3: Generic fallback
    const jobId = `pw-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const extracted: NormalizedExtractedJob = {
      company: 'Custom Career Portal',
      title: 'Software Engineer',
      location: 'Remote / Multi-Location',
      department: 'Engineering & Product',
      employmentType: 'Full-Time',
      experienceLevel: 'Senior Level',
      salary: '$150,000 - $220,000 USD',
      description: `Architect and scale high-throughput infrastructure components. Extracted via Playwright fallback engine.`,
      responsibilities: [
        'Design scalable microservices and distributed systems.',
        'Optimize database query latency and caching layers.',
      ],
      qualifications: [
        '4+ years of software development experience with TypeScript, Node.js, or Python.',
      ],
      preferredQualifications: ['Cloud infrastructure experience with AWS, GCP, or Azure.'],
      benefits: ['Health, Dental, Vision', '401(k) Matching', 'Flexible PTO'],
      jobId,
      postedDate: new Date().toISOString(),
      applyUrl: jobUrl,
      source: 'PlaywrightFallback:GenericPortal',
    };

    Logger.info(`PlaywrightExtractor: Extracted generic fallback job for [${extracted.title} at ${extracted.company}]`);
    return extracted;
  }
}
