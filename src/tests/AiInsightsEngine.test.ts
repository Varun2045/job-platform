import { describe, it, expect, beforeEach } from '@jest/globals';
import { AiInsightsEngine } from '../core/AiInsightsEngine.js';
import { FileStorage } from '../storage/FileStorage.js';

describe('AiInsightsEngine Unit Tests', () => {
  let storage: FileStorage;
  let engine: AiInsightsEngine;

  beforeEach(() => {
    storage = new FileStorage();
    engine = new AiInsightsEngine(storage);
  });

  it('should generate empirical application insights', async () => {
    const insights = await engine.generateInsights('test-user-99');

    expect(insights.totalApplications).toBeGreaterThanOrEqual(0);
    expect(typeof insights.interviewConversionRatePct).toBe('number');
    expect(typeof insights.offerConversionRatePct).toBe('number');
    expect(Array.isArray(insights.recommendations)).toBe(true);
    expect(insights.recommendations.length).toBeGreaterThan(0);
  });
});
