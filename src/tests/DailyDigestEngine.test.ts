import { describe, it, expect, beforeEach } from '@jest/globals';
import { DailyDigestEngine } from '../core/DailyDigestEngine.js';
import { FileStorage } from '../storage/FileStorage.js';

describe('DailyDigestEngine Unit Tests', () => {
  let storage: FileStorage;
  let engine: DailyDigestEngine;

  beforeEach(() => {
    storage = new FileStorage();
    engine = new DailyDigestEngine(storage);
  });

  it('should compile daily digest payload for user', async () => {
    const payload = await engine.compileDigest('test-user-123');

    expect(payload.userId).toBe('test-user-123');
    expect(payload.summaryDate).toBeDefined();
    expect(Array.isArray(payload.upcomingInterviews)).toBe(true);
    expect(Array.isArray(payload.dueFollowUps)).toBe(true);
  });

  it('should dispatch digest alerts cleanly', async () => {
    const result = await engine.dispatchDigest('test-user-123', ['email']);
    expect(result.dispatchedChannels).toContain('email');
  });
});
