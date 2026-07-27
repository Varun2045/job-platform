import { StorageProvider, Offer } from '../storage/StorageProvider.js';
import { Logger } from './Logger.js';

export interface TotalCompBreakdown {
  baseSalary: number;
  signingBonus: number;
  annualBonusAmount: number;
  annualizedEquity: number;
  firstYearTotalComp: number;
  annualizedTotalComp: number;
  fourYearTotalComp: number;
}

export interface OfferAnalysisResult {
  offer: Offer;
  breakdown: TotalCompBreakdown;
  percentileRank: number;
  negotiationScript: string;
}

export interface OfferComparisonResult {
  offers: OfferAnalysisResult[];
  highestFirstYear: OfferAnalysisResult | null;
  highestAnnualized: OfferAnalysisResult | null;
}

export class OfferAnalyzer {
  constructor(private storage: StorageProvider) {}

  /**
   * Calculates detailed multi-year total compensation breakdown.
   */
  public calculateTotalCompensation(
    baseSalary: number,
    signingBonus: number = 0,
    annualBonusPct: number = 0,
    equityValue: number = 0,
    vestingYears: number = 4,
  ): TotalCompBreakdown {
    const validBase = Math.max(0, baseSalary);
    const validSign = Math.max(0, signingBonus);
    const validBonusPct = Math.max(0, annualBonusPct);
    const validEquity = Math.max(0, equityValue);
    const validVesting = Math.max(1, vestingYears);

    const annualBonusAmount = Math.round(validBase * (validBonusPct / 100));
    const annualizedEquity = Math.round(validEquity / validVesting);

    const firstYearTotalComp = validBase + validSign + annualBonusAmount + annualizedEquity;
    const annualizedTotalComp = validBase + annualBonusAmount + annualizedEquity;
    const fourYearTotalComp = validBase * 4 + validSign + annualBonusAmount * 4 + validEquity;

    return {
      baseSalary: validBase,
      signingBonus: validSign,
      annualBonusAmount,
      annualizedEquity,
      firstYearTotalComp,
      annualizedTotalComp,
      fourYearTotalComp,
    };
  }

  /**
   * Evaluates an individual offer and generates structured comp analysis & negotiation scripts.
   */
  public analyzeOffer(offer: Offer, _candidateMatchScore: number = 85): OfferAnalysisResult {
    const breakdown = this.calculateTotalCompensation(
      offer.baseSalary,
      offer.signingBonus ?? 0,
      offer.annualBonusPct ?? 0,
      offer.equityValue ?? 0,
      offer.vestingYears ?? 4,
    );

    // Estimate percentile rank against baseline software engineering compensation ($140k avg)
    const benchmark = 140000;
    const ratio = breakdown.annualizedTotalComp / benchmark;
    let percentileRank = Math.min(99, Math.max(10, Math.round(ratio * 50)));

    const targetIncrease = Math.round(offer.baseSalary * 0.1);
    const negotiationScript = `Dear Hiring Manager,\n\nThank you for extending the offer for the ${offer.location || 'target'} role. I am extremely excited about the opportunity. Based on my technical experience and current market alignment for this scope, I would like to discuss adjusting the base salary to $${(offer.baseSalary + targetIncrease).toLocaleString()} or exploring a signing bonus. I look forward to finalizing the details.\n\nBest regards,`;

    return {
      offer,
      breakdown,
      percentileRank,
      negotiationScript,
    };
  }

  /**
   * Compares multiple offers for a user and ranks them by total compensation.
   */
  public async compareOffers(userId: string): Promise<OfferComparisonResult> {
    const rawOffers = await this.storage.getOffers(userId);
    if (!rawOffers || rawOffers.length === 0) {
      return {
        offers: [],
        highestFirstYear: null,
        highestAnnualized: null,
      };
    }

    const analyzed = rawOffers.map((o) => this.analyzeOffer(o));

    const sortedFirstYear = [...analyzed].sort(
      (a, b) => b.breakdown.firstYearTotalComp - a.breakdown.firstYearTotalComp,
    );
    const sortedAnnualized = [...analyzed].sort(
      (a, b) => b.breakdown.annualizedTotalComp - a.breakdown.annualizedTotalComp,
    );

    Logger.info(`OfferAnalyzer: Compared ${analyzed.length} offers for user ${userId}`);

    return {
      offers: sortedAnnualized,
      highestFirstYear: sortedFirstYear[0] || null,
      highestAnnualized: sortedAnnualized[0] || null,
    };
  }
}
