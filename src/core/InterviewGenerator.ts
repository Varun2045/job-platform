import { Job } from '../companies/Scraper.js';
import { ResumeMatcher } from './ResumeMatcher.js';

export interface InterviewPrepResult {
  technicalQuestions: string[];
  behavioralQuestions: string[];
  companyResearch: string;
  starExamples: string[];
  prepChecklist: string[];
  resources: string[];
  difficultyScore: number;
}

export class InterviewGenerator {
  public static generate(job: Job, profile: string): InterviewPrepResult {
    const explanation = ResumeMatcher.explain(job, profile);
    const titleLower = job.title.toLowerCase();

    // 1. Calculate difficulty score (1-10)
    let difficultyScore = 5;
    if (/senior|lead|principal|staff|manager/i.test(titleLower)) {
      difficultyScore = 8;
    } else if (/junior|intern|associate/i.test(titleLower)) {
      difficultyScore = 3;
    }
    if (explanation.missingSkills.length >= 3) {
      difficultyScore = Math.min(10, difficultyScore + 1);
    }

    // 2. Generate Technical Questions
    const technicalQuestions: string[] = [];
    const techStack = [...explanation.matchedSkills, ...explanation.missingSkills];
    
    if (techStack.includes('react') || techStack.includes('next.js') || techStack.includes('nextjs')) {
      technicalQuestions.push('Explain the lifecycle of React Server Components and their integration with SSR layouts.');
      technicalQuestions.push('How would you optimize a rendering bottleneck in a large list component in React?');
    }
    if (techStack.includes('node.js') || techStack.includes('nodejs') || techStack.includes('express') || techStack.includes('nestjs')) {
      technicalQuestions.push('Detail the internal stages of the Node.js event loop and task queue operations.');
      technicalQuestions.push('Explain how to perform memory leak profiling on a running Express backend services process.');
    }
    if (techStack.includes('java') || techStack.includes('spring boot') || techStack.includes('springboot')) {
      technicalQuestions.push('Describe the Spring Bean lifecycle and how dependency injection profiles are configured.');
      technicalQuestions.push('Explain garbage collection options (e.g. G1GC, ZGC) and parameters to troubleshoot JVM heap sizes.');
    }
    if (techStack.includes('typescript') || techStack.includes('javascript')) {
      technicalQuestions.push('How does TypeScript resolve types structures? Explain conditional types and index signature access.');
    }
    if (techStack.includes('postgresql') || techStack.includes('postgres') || techStack.includes('sql')) {
      technicalQuestions.push('Describe database partition techniques and indexes structures (B-Tree vs Gin index).');
    }

    if (technicalQuestions.length < 3) {
      technicalQuestions.push('How do you design a distributed caching middleware using Redis clusters?');
      technicalQuestions.push('Explain strategies for handling database transactions integrity across multiple decoupled services.');
      technicalQuestions.push('Explain how to debug a sudden memory leak in a production runtime container.');
    }

    // 3. Generate Behavioral Questions
    const behavioralQuestions = [
      'Describe a time you resolved a major production bug under intense time constraints.',
      'Explain a project scenario where you had to prioritize codebase refactoring over new product features.',
      'Tell me about a time you had a difference of opinion with a colleague and how you aligned to resolve it.',
      'Detail how you handle requirements changes in the middle of a sprint planning lifecycle.'
    ];

    // 4. Company Research details
    const companyResearch = `${job.company} focuses heavily on engineering scalability and quality. Their technical interview loops assess coding readability, system edge cases, clean architectures, and behavioral responses centered around speed, ownership, and collaboration.`;

    // 5. STAR Response Examples
    const starExamples = [
      '**Situation**: Application API throughput degraded under 3x traffic spikes.\n**Task**: Bring API latencies back down below 200ms.\n**Action**: Implemented Redis cache caching layers and DB connection pools.\n**Result**: Response latency dropped by 50% and throughput stabilized.',
      '**Situation**: Transitioning legacy workflows created regressions risks.\n**Task**: Refactor legacy microservices backend without interruption.\n**Action**: Wrote integration tests and routed traffic using canary deployment flags.\n**Result**: Completed codebase migration with zero service interruptions.'
    ];

    // 6. Preparation Checklist
    const prepChecklist = [
      `Review and practice matching keywords: ${explanation.matchedSkills.slice(0, 3).join(', ')}`,
      `Research missing stack requirements: ${explanation.missingSkills.slice(0, 2).join(', ')}`,
      'Formulate at least 3 STAR answers demonstrating engineering projects',
      'Test workspace environment compile configurations for live programming challenges',
      `Check recent product updates or corporate blogs for ${job.company}`
    ];

    // 7. Reference Resources
    const resources = [
      'System Design Architectures (Reference Guide)',
      'Designing Data-Intensive Applications (Technical textbook)',
      'STAR Method Behavioral responses formatting guide',
      `Official Developer documentation guides for ${techStack.slice(0, 2).join(' & ')}`
    ];

    return {
      technicalQuestions,
      behavioralQuestions,
      companyResearch,
      starExamples,
      prepChecklist,
      resources,
      difficultyScore
    };
  }
}
