import { describe, it, expect } from '@jest/globals';
import { AiCoverLetterEngine } from '../core/AiCoverLetterEngine.js';

describe('AiCoverLetterEngine Unit Tests', () => {
  const engine = new AiCoverLetterEngine();

  it('should generate a tailored cover letter without experience fabrication', () => {
    const result = engine.generateCoverLetter({
      companyName: 'Stripe',
      jobTitle: 'Staff Backend Engineer',
      candidateName: 'Jane Doe',
      tone: 'Technical',
      length: 'Detailed',
    });

    expect(result.coverLetterText).toContain('Stripe');
    expect(result.coverLetterText).toContain('Staff Backend Engineer');
    expect(result.coverLetterText).toContain('Dear Engineering Lead at Stripe');
    expect(result.toneUsed).toBe('Technical');
    expect(result.lengthCategory).toBe('Detailed');
    expect(result.factValidationNotice).toContain('Fact Validation Active');
  });
});
