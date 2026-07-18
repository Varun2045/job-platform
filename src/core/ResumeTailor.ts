import fs from 'fs';
import path from 'path';
import { Job } from '../companies/Scraper.js';
import { ResumeMatcher } from './ResumeMatcher.js';

export interface TailoredResumeResult {
  tailoredResume: string;
  missingKeywords: string[];
  betterBulletPoints: string[];
  skillsToEmphasize: string[];
}

export class ResumeTailor {
  public static tailor(job: Job, profile: string): TailoredResumeResult {
    const explanation = ResumeMatcher.explain(job, profile);
    const resumesDir = path.join(process.cwd(), 'resumes');
    const resumePath = path.join(resumesDir, `${profile.toLowerCase()}.txt`);

    let originalResume = 'Professional Software Engineer Background';
    if (fs.existsSync(resumePath)) {
      originalResume = fs.readFileSync(resumePath, 'utf-8');
    }

    const missingKeywords = explanation.missingSkills;
    const skillsToEmphasize = explanation.matchedSkills;

    const betterBulletPoints: string[] = [];
    if (missingKeywords.length > 0) {
      missingKeywords.slice(0, 3).forEach((kw) => {
        betterBulletPoints.push(
          `Architected and deployed system services utilizing ${kw} to improve process reliability by 25%.`,
        );
      });
    } else {
      betterBulletPoints.push(
        'Engineered system features resulting in a 20% throughput performance boost across APIs.',
      );
    }
    if (skillsToEmphasize.length > 0) {
      betterBulletPoints.push(
        `Leveraged ${skillsToEmphasize.slice(0, 3).join(', ')} to construct robust database schema queries and services.`,
      );
    }

    let tailoredResume = `# ${profile.toUpperCase()} DEVELOPER PROFILE - TAILORED FOR ${job.company.toUpperCase()}\n\n`;
    tailoredResume += '## SUMMARY OF QUALIFICATIONS\n';
    tailoredResume += `Results-driven software professional specializing in the implementation of high-throughput services. `;
    if (skillsToEmphasize.length > 0) {
      tailoredResume += `Expertise in ${skillsToEmphasize.slice(0, 4).join(', ')}. `;
    }
    if (missingKeywords.length > 0) {
      tailoredResume += `Familiarity with team tools including ${missingKeywords.join(', ')}.`;
    }
    tailoredResume += '\n\n';

    tailoredResume += '## CORE TECHNICAL SKILLS\n';
    tailoredResume += `- **Primary Stack**: ${[...skillsToEmphasize, ...missingKeywords].join(', ')}\n`;
    tailoredResume += `- **Platforms & Methodologies**: System Design, Microservices, REST APIs, CI/CD pipelines\n\n`;

    tailoredResume += '## TAILORED PROFESSIONAL EXPERIENCES\n';
    tailoredResume += `### Software Development Engineer - Focus: ${job.title}\n`;
    betterBulletPoints.forEach((bullet) => {
      tailoredResume += `- ${bullet}\n`;
    });
    tailoredResume += '\n';

    tailoredResume += '## GENERAL PROFESSIONAL BACKGROUND\n';
    tailoredResume += originalResume.substring(0, 600) + '... [Experience details truncated for tailoring]';

    return {
      tailoredResume,
      missingKeywords,
      betterBulletPoints,
      skillsToEmphasize,
    };
  }
}
