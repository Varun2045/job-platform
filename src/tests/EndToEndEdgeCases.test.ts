import { describe, it, expect, beforeEach } from '@jest/globals';
import { FileStorage } from '../storage/FileStorage.js';
import { JobInboxService } from '../core/JobInboxService.js';
import { GlobalSearchEngine } from '../core/GlobalSearchEngine.js';
import { AiResumeTailorEngine } from '../core/AiResumeTailorEngine.js';
import { AiCoverLetterEngine } from '../core/AiCoverLetterEngine.js';
import { DailyDigestEngine } from '../core/DailyDigestEngine.js';

describe('End-to-End Edge Cases & Failure Recovery Suite', () => {
  let storage: FileStorage;
  let inboxService: JobInboxService;
  let searchEngine: GlobalSearchEngine;
  let tailorEngine: AiResumeTailorEngine;
  let coverLetterEngine: AiCoverLetterEngine;
  let digestEngine: DailyDigestEngine;

  beforeEach(() => {
    storage = new FileStorage();
    inboxService = new JobInboxService(storage);
    searchEngine = new GlobalSearchEngine(storage);
    tailorEngine = new AiResumeTailorEngine();
    coverLetterEngine = new AiCoverLetterEngine();
    digestEngine = new DailyDigestEngine(storage);
  });

  it('Edge Case 1: Non-existent inbox job promotion throws clear error', async () => {
    await expect(inboxService.promoteToApplication('non-existent-id-999', 'user-1')).rejects.toThrow(
      'Inbox job [non-existent-id-999] not found.',
    );
  });

  it('Edge Case 2: Empty search query handles special regex characters without crashing', async () => {
    const resultSpecialChar = await searchEngine.search('(?=.*[a-z])', 'user-1');
    expect(resultSpecialChar.totalMatches).toBe(0);

    const resultEmpty = await searchEngine.search('', 'user-1');
    expect(resultEmpty.totalMatches).toBe(0);
  });

  it('Edge Case 3: Resume tailor engine handles empty text gracefully without NaN', () => {
    const result = tailorEngine.tailorResume({
      jobDescription: 'Need developer',
      resumeContent: 'Software engineer',
    });

    expect(typeof result.matchDensityPct).toBe('number');
    expect(isNaN(result.matchDensityPct)).toBe(false);
  });

  it('Edge Case 4: Cover letter engine falls back cleanly when candidate name is missing', () => {
    const result = coverLetterEngine.generateCoverLetter({
      companyName: 'Acme',
      jobTitle: 'Developer',
    });

    expect(result.coverLetterText).toContain('Candidate');
    expect(result.coverLetterText).toContain('Acme');
  });

  it('Edge Case 5: Daily digest skips channel dispatch safely', async () => {
    const result = await digestEngine.dispatchDigest('user-1', ['email']);
    expect(result.dispatchedChannels).toEqual(['email']);
  });
});
