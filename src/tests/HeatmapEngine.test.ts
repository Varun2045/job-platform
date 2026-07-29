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

  it('should perform conservative evidence-based semantic skill inference', () => {
    const jobDesc = 'Seeking a Lead Software Engineer with strong Communication, Leadership, and Problem Solving skills.';
    const resume = 'Served as Publicity Head leading event organization and presentations. Conducted benchmarking, performance tuning, and adaptive algorithms optimization.';

    const heatmap = engine.generateHeatmap('job-semantic', 'resume-semantic', jobDesc, resume);
    
    expect(heatmap.semanticKeywords.length).toBeGreaterThan(0);
    
    const semKeywordsLower = heatmap.semanticKeywords.map(k => k.toLowerCase());
    expect(semKeywordsLower).toContain('problem solving');
    
    // Ensure semantic matches get 70% credit and are not marked as missing
    const missingLower = heatmap.missingKeywords.map(k => k.toLowerCase());
    expect(missingLower).not.toContain('problem solving');
  });

  it('should strictly exclude infrastructure tools like Kubernetes, AWS, Terraform from semantic inference', () => {
    const jobDesc = 'Requires Kubernetes, Terraform, AWS, Kafka, and Redis.';
    const resume = 'Experienced senior developer working on large-scale cloud projects.';

    const heatmap = engine.generateHeatmap('job-strict', 'resume-strict', jobDesc, resume);

    const semKeywordsLower = heatmap.semanticKeywords.map(k => k.toLowerCase());
    expect(semKeywordsLower).not.toContain('kubernetes');
    expect(semKeywordsLower).not.toContain('terraform');
    expect(semKeywordsLower).not.toContain('aws');
    expect(semKeywordsLower).not.toContain('kafka');
    expect(semKeywordsLower).not.toContain('redis');

    const missingLower = heatmap.missingKeywords.map(k => k.toLowerCase());
    expect(missingLower).toContain('kubernetes');
    expect(missingLower).toContain('terraform');
    expect(missingLower).toContain('aws');
  });

  it('should calculate highest impact improvements and score gains', () => {
    const jobDesc = 'Seeking Java, Python, Spring Boot, PostgreSQL, AWS, Docker, Kubernetes, and Terraform.';
    const resume = 'Backend engineer with Java, Python, Spring Boot, PostgreSQL, and AWS experience.';

    const heatmap = engine.generateHeatmap('job-impact', 'resume-impact', jobDesc, resume);

    expect(heatmap.highestImpactImprovements.length).toBeGreaterThan(0);
    expect(heatmap.totalEstimatedGain).toBeGreaterThan(0);

    const topImprovement = heatmap.highestImpactImprovements[0];
    expect(topImprovement.estimatedScoreGain).toBeGreaterThan(0);
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
