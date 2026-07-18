import { SkillNormalizer } from '../core/ResumeMatcher.js';

describe('SkillNormalizer', () => {
  it('should normalize individual skills correctly', () => {
    expect(SkillNormalizer.normalize('nodejs')).toBe('Node.js');
    expect(SkillNormalizer.normalize('reactjs')).toBe('React');
    expect(SkillNormalizer.normalize('postgres')).toBe('PostgreSQL');
    expect(SkillNormalizer.normalize('unknown')).toBe('unknown');
  });

  it('should normalize skills within text blocks', () => {
    const text = 'Looking for a reactjs developer with node skills and postgres knowledge.';
    const normalized = SkillNormalizer.normalizeText(text);
    expect(normalized).toContain('React');
    expect(normalized).toContain('Node.js');
    expect(normalized).toContain('PostgreSQL');
  });
});
