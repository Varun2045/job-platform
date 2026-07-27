import { StorageProvider, VisaSponsor } from '../storage/StorageProvider.js';
import { Logger } from './Logger.js';

export interface CompanyVisaStatistics {
  sponsor: VisaSponsor | null;
  isVerifiedSponsor: boolean;
  approvalRating: 'High' | 'Moderate' | 'Low' | 'Unknown';
  summary: string;
}

export class VisaIntelligenceService {
  constructor(private storage: StorageProvider) {}

  /**
   * Searches the H1B visa sponsorship dataset by company name query.
   */
  public async searchCompany(query: string): Promise<VisaSponsor[]> {
    if (!query || query.trim() === '') return [];
    return this.storage.searchVisaSponsors(query);
  }

  /**
   * Retrieves verified visa statistics for a given company name.
   */
  public async getCompanyStatistics(companyName: string): Promise<CompanyVisaStatistics> {
    if (!companyName || companyName.trim() === '') {
      return {
        sponsor: null,
        isVerifiedSponsor: false,
        approvalRating: 'Unknown',
        summary: 'No company name provided for visa verification.',
      };
    }

    const sponsor = await this.storage.getVisaSponsor(companyName);

    if (!sponsor) {
      return {
        sponsor: null,
        isVerifiedSponsor: false,
        approvalRating: 'Unknown',
        summary: `No historical H1B visa sponsorship records found for "${companyName}".`,
      };
    }

    let approvalRating: 'High' | 'Moderate' | 'Low' = 'Moderate';
    if (sponsor.approvalRatePct >= 90) {
      approvalRating = 'High';
    } else if (sponsor.approvalRatePct < 75) {
      approvalRating = 'Low';
    }

    Logger.info(`VisaIntelligenceService: Retrieved visa stats for ${companyName} (${sponsor.totalLcas} LCAs, ${sponsor.approvalRatePct}% approval)`);

    return {
      sponsor,
      isVerifiedSponsor: sponsor.totalLcas > 0,
      approvalRating,
      summary: `${sponsor.companyName} submitted ${sponsor.totalLcas} LCAs with an approval rate of ${sponsor.approvalRatePct}% and an average salary of $${sponsor.avgSalary.toLocaleString()} (FY${sponsor.fiscalYear}).`,
    };
  }
}
