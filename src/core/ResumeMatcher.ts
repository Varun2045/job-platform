import fs from 'fs';
import path from 'path';
import { Job } from '../companies/Scraper.js';
import { config } from '../config/config.js';
import { Logger } from './Logger.js';

export class ResumeMatcher {
  public static readonly VERSION = '1.0';

  private static readonly STOPWORDS = new Set([
    'a',
    'about',
    'above',
    'after',
    'again',
    'against',
    'all',
    'am',
    'an',
    'and',
    'any',
    'are',
    'arent',
    'as',
    'at',
    'be',
    'because',
    'been',
    'before',
    'being',
    'below',
    'between',
    'both',
    'but',
    'by',
    'cant',
    'cannot',
    'could',
    'did',
    'didnt',
    'do',
    'does',
    'doesnt',
    'doing',
    'dont',
    'down',
    'during',
    'each',
    'few',
    'for',
    'from',
    'further',
    'had',
    'hadnt',
    'has',
    'hasnt',
    'have',
    'havent',
    'having',
    'he',
    'hed',
    'hell',
    'hes',
    'her',
    'here',
    'heres',
    'hers',
    'herself',
    'him',
    'himself',
    'his',
    'how',
    'hows',
    'i',
    'id',
    'ill',
    'im',
    'ive',
    'if',
    'in',
    'into',
    'is',
    'isnt',
    'it',
    'its',
    'itself',
    'lets',
    'me',
    'more',
    'most',
    'mustnt',
    'my',
    'myself',
    'no',
    'nor',
    'not',
    'of',
    'off',
    'on',
    'once',
    'only',
    'or',
    'other',
    'ought',
    'our',
    'ours',
    'ourselves',
    'out',
    'over',
    'own',
    'same',
    'shant',
    'she',
    'shed',
    'shell',
    'shes',
    'should',
    'shouldnt',
    'so',
    'some',
    'such',
    'than',
    'that',
    'thats',
    'the',
    'their',
    'theirs',
    'them',
    'themselves',
    'then',
    'there',
    'theres',
    'these',
    'they',
    'theyd',
    'theyll',
    'theyre',
    'theyve',
    'this',
    'those',
    'through',
    'to',
    'too',
    'under',
    'until',
    'up',
    'very',
    'was',
    'wasnt',
    'we',
    'wed',
    'well',
    'were',
    'weve',
    'werent',
    'what',
    'whats',
    'when',
    'whens',
    'where',
    'wheres',
    'which',
    'while',
    'who',
    'whos',
    'whom',
    'why',
    'whys',
    'with',
    'wont',
    'would',
    'wouldnt',
    'you',
    'youd',
    'youll',
    'youre',
    'youve',
    'your',
    'yours',
    'yourself',
    'yourselves',
  ]);

  private static readonly KNOWN_SKILLS = [
    'typescript',
    'javascript',
    'node.js',
    'nodejs',
    'nestjs',
    'express',
    'spring boot',
    'springboot',
    'java',
    'go',
    'golang',
    'postgresql',
    'postgres',
    'mongodb',
    'redis',
    'elasticsearch',
    'aws',
    'amazon web services',
    'gcp',
    'google cloud',
    'docker',
    'kubernetes',
    'microservices',
    'rest api',
    'rest apis',
    'graphql',
    'distributed systems',
    'system design',
    'python',
    'pytorch',
    'tensorflow',
    'machine learning',
    'deep learning',
    'nlp',
    'llm',
    'transformers',
    'rag',
    'langchain',
    'vector database',
    'c++',
    'c#',
    'rust',
    'sql',
    'nosql',
    'react',
    'next.js',
    'nextjs',
    'ci/cd',
    'github actions',
  ];

  /**
   * Helper to load resume text by profile name.
   */
  private static loadResumeText(profile: string): string {
    const resumesDir = path.join(process.cwd(), 'resumes');
    const resumePath = path.join(resumesDir, `${profile}.txt`);

    if (fs.existsSync(resumePath)) {
      return fs.readFileSync(resumePath, 'utf-8');
    }

    Logger.warn(`Resume profile "${profile}" file not found at ${resumePath}. Attempting default.`);
    // Search fallback files in case of relative path checks
    const defaultPath = path.join(process.cwd(), 'resumes', 'backend.txt');
    if (fs.existsSync(defaultPath)) {
      return fs.readFileSync(defaultPath, 'utf-8');
    }

    throw new Error(`Resume profile "${profile}" and default resumes could not be found.`);
  }

  /**
   * Tokenizes text into lowercase alphanumeric words.
   */
  private static tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s.\-_#+]/g, ' ') // Keep some technical characters like C++, C#, F#
      .split(/\s+/)
      .filter((word) => word.length > 1 && !this.STOPWORDS.has(word));
  }

  /**
   * Computes TF-IDF bag-of-words cosine similarity between two texts.
   */
  private static computeCosineSimilarity(text1: string, text2: string): number {
    const tokens1 = this.tokenize(text1);
    const tokens2 = this.tokenize(text2);

    const freqMap1 = new Map<string, number>();
    tokens1.forEach((t) => freqMap1.set(t, (freqMap1.get(t) ?? 0) + 1));

    const freqMap2 = new Map<string, number>();
    tokens2.forEach((t) => freqMap2.set(t, (freqMap2.get(t) ?? 0) + 1));

    // Calculate dot product
    let dotProduct = 0;
    const allUniqueTokens = new Set([...freqMap1.keys(), ...freqMap2.keys()]);

    for (const token of allUniqueTokens) {
      const f1 = freqMap1.get(token) ?? 0;
      const f2 = freqMap2.get(token) ?? 0;
      dotProduct += f1 * f2;
    }

    // Calculate magnitudes
    let mag1 = 0;
    for (const f of freqMap1.values()) {
      mag1 += f * f;
    }
    mag1 = Math.sqrt(mag1);

    let mag2 = 0;
    for (const f of freqMap2.values()) {
      mag2 += f * f;
    }
    mag2 = Math.sqrt(mag2);

    if (mag1 === 0 || mag2 === 0) return 0;
    return dotProduct / (mag1 * mag2);
  }

  /**
   * Evaluates the match score (0-100) for a job against a specific resume profile.
   */
  public static match(job: Job, profile: string): number {
    if (profile === '_skip_' || profile === 'none') {
      return 100;
    }
    const resumeText = this.loadResumeText(profile);
    const jobText = `${job.title} ${job.location} ${job.team} ${job.description}`;
    const jobTextLower = jobText.toLowerCase();

    // 1. Skills Match (40%)
    // Find all KNOWN_SKILLS mentioned in the job description
    const requiredSkills = this.KNOWN_SKILLS.filter((skill) => {
      const escaped = skill.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const regex = new RegExp(`\\b${escaped}\\b`, 'i');
      return regex.test(jobTextLower);
    });

    let matchedSkillsCount = 0;
    if (requiredSkills.length > 0) {
      requiredSkills.forEach((skill) => {
        const escaped = skill.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        const regex = new RegExp(`\\b${escaped}\\b`, 'i');
        if (regex.test(resumeText)) {
          matchedSkillsCount++;
        }
      });
    }

    const skillsScore = requiredSkills.length > 0 ? (matchedSkillsCount / requiredSkills.length) * 100 : 80; // default to 80% if job description mentions no specific technical skills

    // 2. Title Similarity (30%)
    let titleScore = 0;
    const titleLower = job.title.toLowerCase();

    // Heuristics based on profile name
    const targetTitles = profile.includes('ai')
      ? ['machine learning', 'ml', 'ai', 'data scientist', 'computer vision', 'nlp']
      : ['backend', 'software engineer', 'software developer', 'sde', 'engineer', 'developer'];

    const matchesTargetTitle = targetTitles.some((target) => titleLower.includes(target));
    if (matchesTargetTitle) {
      titleScore = 100;
    } else {
      // Partial title match checks
      titleScore = /engineer|developer/i.test(titleLower) ? 60 : 20;
    }

    // 3. Experience Match (15%)
    let experienceScore = 100;
    // Junior candidate target matches
    const isJuniorJob =
      /junior|early career|entry level|graduate|new grad|intern|associate|sde i\b/i.test(titleLower) ||
      /graduate|intern|new grad/i.test(job.description.toLowerCase());

    const isSeniorJob = /senior|sr\.|lead|principal|staff|manager|director|vp/i.test(titleLower);

    if (isJuniorJob) {
      experienceScore = 100;
    } else if (isSeniorJob) {
      experienceScore = 30; // heavy penalty for senior/lead positions
    } else {
      // General Software Engineer (mid-level SDE, SDE II)
      experienceScore = 80;
    }

    // 4. Location Match (10%)
    let locationScore = 0;
    const locationLower = job.location.toLowerCase();
    const matchesTargetLocation = /india|bangalore|bengaluru|hyderabad|pune|noida|gurugram|mumbai|chennai/i.test(
      locationLower,
    );

    if (matchesTargetLocation || job.isRemote) {
      locationScore = 100;
    } else {
      locationScore = 20; // low score for international non-remote postings
    }

    // 5. TF-IDF Cosine Similarity (5%)
    const tfidfSimilarity = this.computeCosineSimilarity(resumeText, job.description);
    const tfidfScore = tfidfSimilarity * 100;

    // 6. Calculate Weighted Overall Score
    const w = config.weights;
    const finalScore =
      (w.skills / 100) * skillsScore +
      (w.title / 100) * titleScore +
      (w.experience / 100) * experienceScore +
      (w.location / 100) * locationScore +
      (w.tfidf / 100) * tfidfScore;

    const roundedScore = Math.min(100, Math.max(0, Math.round(finalScore)));

    Logger.debug(
      `Match score calculated for job [${job.company} - ${job.title}]: ${roundedScore}% (Skills: ${skillsScore.toFixed(0)}, Title: ${titleScore}, Exp: ${experienceScore}, Loc: ${locationScore}, Cosine: ${tfidfScore.toFixed(0)})`,
    );
    return roundedScore;
  }

  public static explain(
    job: Job,
    profile: string,
  ): {
    overallScore: number;
    matchedSkills: string[];
    missingSkills: string[];
    strengths: string[];
    weaknesses: string[];
  } {
    if (profile === '_skip_' || profile === 'none') {
      return {
        overallScore: 100,
        matchedSkills: [],
        missingSkills: [],
        strengths: ['Resume matching disabled by user configuration.'],
        weaknesses: [],
      };
    }
    const resumeText = this.loadResumeText(profile);
    const jobText = `${job.title} ${job.location} ${job.team} ${job.description}`;
    const jobTextLower = jobText.toLowerCase();

    // 1. Find matched and missing skills
    const requiredSkills = this.KNOWN_SKILLS.filter((skill) => {
      const escaped = skill.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const regex = new RegExp(`\\b${escaped}\\b`, 'i');
      return regex.test(jobTextLower);
    });

    const matchedSkills: string[] = [];
    const missingSkills: string[] = [];

    requiredSkills.forEach((skill) => {
      const escaped = skill.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const regex = new RegExp(`\\b${escaped}\\b`, 'i');
      if (regex.test(resumeText)) {
        matchedSkills.push(skill);
      } else {
        missingSkills.push(skill);
      }
    });

    // 2. Score elements
    let titleScore = 0;
    const titleLower = job.title.toLowerCase();
    const targetTitles = profile.includes('ai')
      ? ['machine learning', 'ml', 'ai', 'data scientist', 'computer vision', 'nlp']
      : ['backend', 'software engineer', 'software developer', 'sde', 'engineer', 'developer'];
    const matchesTargetTitle = targetTitles.some((target) => titleLower.includes(target));
    if (matchesTargetTitle) {
      titleScore = 100;
    } else {
      titleScore = /engineer|developer/i.test(titleLower) ? 60 : 20;
    }

    const isJuniorJob =
      /junior|early career|entry level|graduate|new grad|intern|associate|sde i\b/i.test(titleLower) ||
      /graduate|intern|new grad/i.test(job.description.toLowerCase());
    const isSeniorJob = /senior|sr\.|lead|principal|staff|manager|director|vp/i.test(titleLower);
    let experienceScore = 100;
    if (isJuniorJob) {
      experienceScore = 100;
    } else if (isSeniorJob) {
      experienceScore = 30;
    } else {
      experienceScore = 80;
    }

    const locationLower = job.location.toLowerCase();
    const matchesTargetLocation = /india|bangalore|bengaluru|hyderabad|pune|noida|gurugram|mumbai|chennai/i.test(
      locationLower,
    );
    const locationScore = matchesTargetLocation || job.isRemote ? 100 : 20;

    const overallScore = this.match(job, profile);

    // 3. Build lists
    const strengths: string[] = [];
    const weaknesses: string[] = [];

    if (titleScore === 100) {
      strengths.push('Target job title matching your profile');
    }
    if (locationScore === 100) {
      strengths.push('Located in target region or supports Remote work');
    }
    if (experienceScore === 100) {
      strengths.push('Excellent alignment with target career stage');
    }
    if (matchedSkills.length >= 3) {
      strengths.push(`Strong overlap of key skills: ${matchedSkills.slice(0, 5).join(', ')}`);
    }

    if (missingSkills.length > 0) {
      weaknesses.push(`Missing critical skills: ${missingSkills.join(', ')}`);
    }
    if (experienceScore < 50) {
      weaknesses.push('Role requires more senior experience (potential level mismatch)');
    }
    if (locationScore < 50) {
      weaknesses.push('Requires relocation to non-target location');
    }

    return {
      overallScore,
      matchedSkills,
      missingSkills,
      strengths,
      weaknesses,
    };
  }
}
