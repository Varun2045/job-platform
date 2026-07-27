import { NormalizedExtractedJob } from './PlaywrightExtractor.js';

export interface CompanyExtractor {
  id: string;
  name: string;
  canHandle(url: string): boolean;
  extract(url: string): Promise<NormalizedExtractedJob>;
}
