import { Job } from '../companies/Scraper.js';

export interface ResumeOptimizationResult {
  original: string;
  improved: string;
  changes: {
    missingSkills: string[];
    suggestedBullets: string[];
    reorderedSkills: string[];
    optimizedSummary: string;
    explanation: string;
  };
}

export class ResumeOptimizationService {
  /**
   * Optimizes a resume content string to align with the requirements of a specific job posting.
   */
  public static optimize(resumeContent: string, job: Job): ResumeOptimizationResult {
    const jobText = `${job.title} ${job.description}`.toLowerCase();
    const resumeText = resumeContent.toLowerCase();

    // Identify standard skills present in job but missing from resume
    const standardSkills = [
      'TypeScript', 'Node.js', 'React', 'Go', 'Kubernetes', 'Docker', 
      'PostgreSQL', 'AWS', 'Python', 'Redis', 'CI/CD', 'Jest'
    ];

    const missingSkills = standardSkills.filter(
      skill => jobText.includes(skill.toLowerCase()) && !resumeText.includes(skill.toLowerCase())
    );

    // Reorder skills list to prioritize key technologies matching the job
    const matchingSkills = standardSkills.filter(
      skill => jobText.includes(skill.toLowerCase())
    );
    const reorderedSkills = [...matchingSkills, ...standardSkills.filter(s => !matchingSkills.includes(s))];

    // Generate custom improvements
    const optimizedSummary = `Results-driven Software Engineer with extensive experience building highly scalable applications. Proven expertise in ${matchingSkills.slice(0, 4).join(', ')}. Strong capability in system design, automation testing, and deploying robust cloud infrastructures.`;

    const suggestedBullets = [
      `Architected backend services leveraging ${matchingSkills.includes('Node.js') ? 'Node.js and ' : ''}${matchingSkills.includes('TypeScript') ? 'TypeScript' : 'Modern frameworks'}, increasing overall system throughput by 35%.`,
      `Designed containerized microservices deployment blueprints with Docker and Kubernetes, reducing deployment downtime to zero.`,
      `Optimized Postgres query performance and AWS cloud resource scaling, shaving off 20% from infrastructure costs.`
    ];

    // Append improved components to compile target resume
    let improvedResume = `${optimizedSummary}\n\n`;
    improvedResume += `Core Skills: ${reorderedSkills.join(', ')}\n\n`;
    improvedResume += `Experience:\n- Senior Software Engineer\n  * ${suggestedBullets.join('\n  * ')}\n\n`;
    improvedResume += resumeContent;

    return {
      original: resumeContent,
      improved: improvedResume,
      changes: {
        missingSkills,
        suggestedBullets,
        reorderedSkills,
        optimizedSummary,
        explanation: `Tailored the resume summary to highlight matching skills (${matchingSkills.slice(0, 3).join(', ')}). Added bullet points illustrating production use of containerization and database optimization. Prioritized technical skills to align with the job description keywords.`
      }
    };
  }
}
