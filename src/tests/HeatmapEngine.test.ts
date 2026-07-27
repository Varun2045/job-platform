import { HeatmapEngine } from '../core/HeatmapEngine.js';
import { FileStorage } from '../storage/FileStorage.js';

describe('HeatmapEngine Unit Tests', () => {
  let storage: FileStorage;
  let engine: HeatmapEngine;

  beforeAll(async () => {
    storage = new FileStorage();
    await storage.initialize();
    engine = new HeatmapEngine(storage);
  });

  it('should extract normalized keywords from text', () => {
    const keywords = engine.extractKeywords('Seeking a Senior TypeScript and Node.js Developer with React expertise.');
    expect(keywords).toContain('typescript');
    expect(keywords).toContain('node.js');
    expect(keywords).toContain('react');
    expect(keywords).not.toContain('with');
  });

  it('should calculate match density percentage', () => {
    expect(engine.calculateMatchDensity(5, 10)).toBe(50);
    expect(engine.calculateMatchDensity(0, 10)).toBe(0);
    expect(engine.calculateMatchDensity(10, 0)).toBe(0);
  });

  it('should generate heatmap comparing resume against job description', () => {
    const jobDesc = 'We require TypeScript, Node.js, Docker, Kubernetes, and PostgreSQL.';
    const resume = 'Jane Doe is experienced in TypeScript, Node.js, and PostgreSQL.';

    const heatmap = engine.generateHeatmap('job-123', 'resume-456', jobDesc, resume);
    expect(heatmap.jobId).toBe('job-123');
    expect(heatmap.matchedKeywords).toContain('typescript');
    expect(heatmap.matchedKeywords).toContain('node.js');
    expect(heatmap.missingKeywords).toContain('kubernetes');
    expect(heatmap.matchDensityPct).toBeGreaterThan(0);
  });
});
