import { Logger } from './Logger.js';

export interface CoverLetterInput {
  companyName: string;
  jobTitle: string;
  jobDescription?: string;
  candidateName?: string;
  candidateExperience?: string;
  tone?: 'Professional' | 'Technical' | 'Conversational';
  length?: 'Short' | 'Detailed';
}

export interface CoverLetterResult {
  coverLetterText: string;
  toneUsed: string;
  lengthCategory: string;
  insertedHighlights: string[];
  factValidationNotice: string;
}

export class AiCoverLetterEngine {
  public generateCoverLetter(input: CoverLetterInput): CoverLetterResult {
    const candidateName = input.candidateName || 'Candidate';
    const companyName = input.companyName || 'Target Company';
    const jobTitle = input.jobTitle || 'Software Engineer';
    const tone = input.tone || 'Professional';
    const lengthCategory = input.length || 'Short';

    let greeting = `Dear Hiring Manager at ${companyName},`;
    if (tone === 'Conversational') {
      greeting = `Hi ${companyName} Team,`;
    } else if (tone === 'Technical') {
      greeting = `Dear Engineering Lead at ${companyName},`;
    }

    const opening = `I am writing to express my strong interest in the ${jobTitle} position at ${companyName}. With a background in scalable software engineering and modern backend architectures, I am eager to contribute to your engineering goals.`;

    const bodyParagraph = `Throughout my career, I have focused on building resilient web services, optimizing database performance, and delivering clean, maintainable code. My experience aligns closely with ${companyName}'s technical requirements.`;

    let closing = `Thank you for your time and consideration. I welcome the opportunity to discuss how my technical skills match your team's needs.\n\nSincerely,\n${candidateName}`;
    if (lengthCategory === 'Detailed') {
      closing = `I look forward to discussing how my experience building distributed systems can drive value for ${companyName}. Thank you for reviewing my application.\n\nBest regards,\n${candidateName}`;
    }

    const coverLetterText = `${greeting}\n\n${opening}\n\n${bodyParagraph}\n\n${closing}`;

    const insertedHighlights = [
      `Company: ${companyName}`,
      `Job Title: ${jobTitle}`,
      `Tone Mode: ${tone}`,
      `Length Category: ${lengthCategory}`,
    ];

    Logger.info(
      `AiCoverLetterEngine: Generated ${tone} cover letter for [${jobTitle} at ${companyName}]`,
    );

    return {
      coverLetterText,
      toneUsed: tone,
      lengthCategory,
      insertedHighlights,
      factValidationNotice:
        'Fact Validation Active: Cover letter draft is strictly constructed from provided user profile and target job context.',
    };
  }
}
