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

  it('should extract normalized keywords and multi-word technology phrases from text', () => {
    const text = 'Seeking a Senior Software Engineer with Spring Boot, REST API, React Native, and PostgreSQL expertise.';
    const keywords = engine.extractKeywords(text);
    
    expect(keywords).toContain('spring boot');
    expect(keywords).toContain('rest api');
    expect(keywords).toContain('react native');
    expect(keywords).toContain('postgresql');
    expect(keywords).not.toContain('seeking');
    expect(keywords).not.toContain('with');
  });

  it('should normalize synonyms and morphological variants', () => {
    const jobDesc = 'We require PostgreSQL, React, Node.js, AWS, and Docker containerization.';
    const resume = 'Experienced engineer proficient in postgres, reactjs, nodejs, aws cloud services, and docker containers.';

    const heatmap = engine.generateHeatmap('job-1', 'resume-1', jobDesc, resume);
    
    expect(heatmap.overallAtsScore).toBe(100);
    expect(heatmap.matchedKeywords.length).toBe(5);
    expect(heatmap.missingKeywords.length).toBe(0);

    const matchTypes = heatmap.matchedDetails.map(m => m.matchType);
    expect(matchTypes).toContain('synonym');
  });

  it('should calculate category breakdown and generate insights', () => {
    const jobDesc = 'Seeking Java, Python, Spring Boot, PostgreSQL, AWS, Docker, Kubernetes, and Terraform.';
    const resume = 'Backend engineer with Java, Python, Spring Boot, PostgreSQL, and AWS experience.';

    const heatmap = engine.generateHeatmap('job-2', 'resume-2', jobDesc, resume);

    expect(heatmap.categoryBreakdown.length).toBeGreaterThan(0);
    expect(heatmap.insights.length).toBeGreaterThan(0);
    expect(heatmap.insights[0]).toMatch(/Resume matches \d+% of required ATS keywords/);
    expect(heatmap.missingKeywords).toContain('kubernetes');
    expect(heatmap.missingKeywords).toContain('terraform');
  });

  it('should complete extraction and comparison for large job descriptions within milliseconds', () => {
    const largeDesc = ('Seeking Java, Python, TypeScript, Spring Boot, React, Docker, Kubernetes, AWS, PostgreSQL, Redis, Kafka. '.repeat(500));
    const largeResume = ('Skilled in Java, Python, Spring Boot, React, Docker, AWS, PostgreSQL, Redis. '.repeat(200));

    const start = Date.now();
    const heatmap = engine.generateHeatmap('perf-job', 'perf-resume', largeDesc, largeResume);
    const durationMs = Date.now() - start;

    expect(durationMs).toBeLessThan(1000); // Must be fast (< 1s)
    expect(heatmap.overallAtsScore).toBeGreaterThan(0);
  });
});
