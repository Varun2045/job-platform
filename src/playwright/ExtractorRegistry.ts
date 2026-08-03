import { CompanyExtractor } from './CompanyExtractor.js';
import { Logger } from '../core/Logger.js';

export class ExtractorRegistry {
  private static instance: ExtractorRegistry;
  private extractors: CompanyExtractor[] = [];

  private constructor() {}

  public static getInstance(): ExtractorRegistry {
    if (!ExtractorRegistry.instance) {
      ExtractorRegistry.instance = new ExtractorRegistry();
    }
    return ExtractorRegistry.instance;
  }

  public register(extractor: CompanyExtractor): void {
    if (!this.extractors.some((e) => e.id === extractor.id || e.name === extractor.name)) {
      this.extractors.push(extractor);
      Logger.info(`ExtractorRegistry: Registered company extractor [${extractor.name}]`);
    }
  }

  public findExtractor(url: string): CompanyExtractor | undefined {
    return this.extractors.find((ext) => ext.canHandle(url));
  }

  public getAllRegistered(): string[] {
    return this.extractors.map((e) => e.name);
  }
}
