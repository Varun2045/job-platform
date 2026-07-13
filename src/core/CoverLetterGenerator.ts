import { Job } from '../companies/Scraper.js';

export type CoverLetterTone = 'Professional' | 'Technical' | 'Enthusiastic' | 'Creative';

export interface CoverLetterOptions {
  recruiterName?: string;
  tone?: CoverLetterTone;
}

export class CoverLetterGenerator {
  /**
   * Generates a tailored cover letter based on company, role, recruiter, and tone options.
   * Supports backward compatible (job, profileName) signature.
   */
  public static generate(
    job: Job,
    profileOrOptions?: string | CoverLetterOptions,
    options: CoverLetterOptions = {}
  ): string {
    const company = job.company;
    const role = job.title;
    
    let tone: CoverLetterTone = 'Professional';
    let recruiter = 'Hiring Team';

    if (typeof profileOrOptions === 'string') {
      // Backward compatible path: profileName passed as string
      recruiter = 'Hiring Team';
      tone = 'Professional';
    } else if (profileOrOptions) {
      recruiter = profileOrOptions.recruiterName || 'Hiring Manager';
      tone = profileOrOptions.tone || 'Professional';
    }

    // Direct options take precedence
    if (options.recruiterName) recruiter = options.recruiterName;
    if (options.tone) tone = options.tone;

    let body = '';
    switch (tone) {
      case 'Technical':
        body = `I am writing to express my strong interest in the ${role} position at ${company}. With a deep background in systems engineering and backend microservices, I am eager to apply my skills to solve complex technical challenges at ${company}.`;
        break;
      case 'Enthusiastic':
        body = `I am thrilled to apply for the ${role} position at ${company}! I have long admired ${company}'s engineering culture, and I am excited to contribute my dedication and technical skills to your team.`;
        break;
      case 'Creative':
        body = `Every great product has a compelling story, and I want to help build the next chapter at ${company} as a ${role}. I excel at turning requirements into clean, functional code.`;
        break;
      case 'Professional':
      default:
        body = `Please accept this letter as application for the open ${role} position at ${company}. With several years of experience developing software and collaborating in agile teams, I am confident in my ability to immediately add value to your organization.`;
        break;
    }

    return `Dear ${recruiter},

${body}

In my previous roles, I have focused on building scalable services, improving automated testing coverage, and streamlining deployment pipelines. I would welcome the opportunity to discuss how my background aligns with the engineering needs at ${company}.

Thank you for your time and consideration.

Sincerely,
[Your Name]
`;
  }

  /**
   * Mock-exports a cover letter to various formats.
   */
  public static export(content: string, format: 'PDF' | 'Markdown' | 'DOCX'): Buffer {
    if (format === 'Markdown') {
      return Buffer.from(content, 'utf-8');
    }
    return Buffer.from(`MOCK-${format}-STREAM\n\n${content}`, 'utf-8');
  }
}
