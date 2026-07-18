import { Job } from '../companies/Scraper.js';

export interface PortfolioItem {
  id: string;
  name: string;
  type: 'repository' | 'project' | 'certificate' | 'demo';
  description: string;
  url: string;
  technologies: string[];
}

export interface RecommendationMatch {
  item: PortfolioItem;
  relevanceScore: number;
  reason: string;
}

export class PortfolioRecommendation {
  /**
   * Evaluates a user's portfolio items against a job description, returning items ranked by relevance.
   */
  public static recommend(job: Job, items: PortfolioItem[]): RecommendationMatch[] {
    const jobText = `${job.title} ${job.description}`.toLowerCase();
    const recommendations: RecommendationMatch[] = [];

    for (const item of items) {
      let matchedTech: string[] = [];
      let relevanceScore = 0;

      // Calculate matches based on technologies list
      item.technologies.forEach((tech) => {
        const lowerTech = tech.toLowerCase();
        if (jobText.includes(lowerTech)) {
          matchedTech.push(tech);
          relevanceScore += 30; // 30 points per matching technology
        }
      });

      // Boost score if description contains matches
      const itemDescWords = item.description.toLowerCase().split(/\s+/);
      let descMatches = 0;
      itemDescWords.forEach((word) => {
        if (word.length > 3 && jobText.includes(word)) {
          descMatches++;
        }
      });
      relevanceScore += Math.min(descMatches * 2, 20); // cap description text overlap points at 20

      // Normalize score to maximum of 100
      relevanceScore = Math.min(relevanceScore, 100);

      if (relevanceScore > 0) {
        recommendations.push({
          item,
          relevanceScore,
          reason: `Matches key technologies requested in the posting: ${matchedTech.join(', ')}.`,
        });
      }
    }

    // Sort descending by relevance score
    return recommendations.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }
}
