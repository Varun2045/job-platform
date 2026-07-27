import { describe, it, expect } from '@jest/globals';
import { AiResumeTailorEngine } from '../core/AiResumeTailorEngine.js';

describe('AiResumeTailorEngine Unit Tests', () => {
  const engine = new AiResumeTailorEngine();

  it('should calculate keyword match density and extract missing skills', () => {
    const result = engine.tailorResume({
      jobId: 'job-ts-dev',
      jobDescription: 'Looking for a Senior TypeScript developer proficient in Node.js, Express, React, PostgreSQL, Docker, AWS, and Kubernetes.',
      resumeContent: 'Experienced Software Engineer skilled in TypeScript, Node.js, React, and Express.',
    });

    expect(result.matchDensityPct).toBeGreaterThan(0);
    expect(result.matchedKeywords).toContain('typescript');
    expect(result.matchedKeywords).toContain('react');
    expect(result.missingKeywords).toContain('aws');
    expect(result.missingKeywords).toContain('kubernetes');
    expect(result.factValidationNotice).toContain('Zero-Fabrication Guardrail Active');
  });
});
