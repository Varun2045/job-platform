import { Job } from '../companies/Scraper.js';
import { ResumeMatcher } from './ResumeMatcher.js';

export interface AnalysisResult {
  jobHash: string;
  summary: string;
  whyMatches: string;
  missingSkills: string[];
  resumeImprovements: string[];
  difficulty: 'Easy' | 'Medium' | 'Hard';
  prepTopics: string[];
}

export class AiAnalyzer {
  public static async analyze(job: Job, profile: string): Promise<AnalysisResult> {
    const explanation = ResumeMatcher.explain(job, profile);
    const titleLower = job.title.toLowerCase();

    // 1. Determine difficulty
    let difficulty: 'Easy' | 'Medium' | 'Hard' = 'Medium';
    if (explanation.overallScore >= 85 && explanation.missingSkills.length <= 1) {
      difficulty = 'Easy';
    } else if (
      explanation.overallScore < 60 ||
      explanation.missingSkills.length >= 4 ||
      /senior|lead|principal|staff|manager/i.test(titleLower)
    ) {
      difficulty = 'Hard';
    }

    // 2. Generate plain English summary
    let summary = `This is a ${job.experience} level ${job.title} role at ${job.company} located in ${job.location}. `;
    if (job.isRemote) {
      summary += 'The position supports fully remote work. ';
    }
    summary +=
      'The team is responsible for developing robust system components, maintaining codebase health, and working cross-functionally to ship software products at scale.';

    // 3. Generate why matches
    let whyMatches = `Your profile shows a match index of ${explanation.overallScore}%. `;
    if (explanation.strengths.length > 0) {
      whyMatches += `Key alignment areas include: ${explanation.strengths.join(', ')}.`;
    } else {
      whyMatches += 'The role aligns with your general technology baseline and experience expectations.';
    }

    // 4. Generate resume improvements
    const resumeImprovements: string[] = [];
    if (explanation.missingSkills.length > 0) {
      explanation.missingSkills.slice(0, 3).forEach((skill) => {
        resumeImprovements.push(
          `Add a project bullet detail demonstrating practical application of ${skill} to address the team requirements.`,
        );
      });
    } else {
      const mainSkills = explanation.matchedSkills.slice(0, 2);
      if (mainSkills.length > 0) {
        resumeImprovements.push(
          `Highlight your advanced competencies in ${mainSkills.join(' and ')} in the profile introduction.`,
        );
      }
    }
    resumeImprovements.push(
      'Quantify your metrics (e.g. latency reduction, API throughput increases, cost savings) to emphasize impact.',
    );

    // 5. Generate prep topics
    const prepTopics: string[] = [];
    if (explanation.missingSkills.length > 0) {
      explanation.missingSkills.forEach((skill) => {
        prepTopics.push(`Core architecture patterns and operations of ${skill}`);
      });
    }
    prepTopics.push('System Design: architectural planning, caching layers, and partitioning databases');
    prepTopics.push('Software Engineering: test coverage, concurrency, and clean code principles');
    prepTopics.push('Behavioral: prepare STAR method answers emphasizing leadership and project troubleshooting');

    return {
      jobHash: job.jobHash,
      summary,
      whyMatches,
      missingSkills: explanation.missingSkills,
      resumeImprovements,
      difficulty,
      prepTopics,
    };
  }
}
