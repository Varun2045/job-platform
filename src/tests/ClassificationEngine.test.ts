import { ConfigValidator } from '../core/ConfigValidator.js';
import { HybridExperienceClassifier } from '../core/HybridExperienceClassifier.js';
import { DepartmentClassifier } from '../core/DepartmentClassifier.js';
import { JobTagger } from '../core/JobTagger.js';
import { RuleEngine } from '../core/RuleEngine.js';
import { ExplainableScoringEngine } from '../core/ExplainableScoringEngine.js';
import { ClassificationMetrics } from '../core/ClassificationMetrics.js';
import { Job } from '../companies/Scraper.js';

describe('Production Classification Engine Tests', () => {
  it('should validate JSON configurations without syntax errors', () => {
    const report = ConfigValidator.validateAll();
    expect(report.valid).toBe(true);
    expect(report.errors).toHaveLength(0);
  });

  it('should classify explicit experience requirements correctly', () => {
    const res = HybridExperienceClassifier.classify(
      'Software Engineer',
      'Requires 0-2 years of experience in JavaScript and Node.js.',
      '',
      'Google'
    );
    expect(res.level).toMatch(/Entry Level|Internship/);
    expect(res.confidence).toBe(100);
    expect(res.source).toBe('ExplicitExperience');
  });

  it('should classify company-specific level mappings (Google L6 -> Staff)', () => {
    const res = HybridExperienceClassifier.classify(
      'Software Engineer (L6)',
      'Lead backend infrastructure teams.',
      '',
      'Google'
    );
    expect(res.level).toBe('Staff Engineer');
    expect(res.confidence).toBe(95);
    expect(res.source).toBe('CompanyMapping');
  });

  it('should classify 28 department taxonomy with weighted keywords', () => {
    const res = DepartmentClassifier.classify(
      'Senior PyTorch Machine Learning Engineer',
      'Build LLM serving pipelines using PyTorch, CUDA, and Python.'
    );
    expect(res.primaryDepartment).toBe('AI / Machine Learning');
    expect(res.confidence).toBeGreaterThanOrEqual(80);
    expect(res.matchedKeywords.length).toBeGreaterThan(0);
  });

  it('should evaluate declarative rule engine conditions', () => {
    const action = RuleEngine.evaluate({
      description: 'H1B Visa sponsorship provided for qualified candidates.',
      salary: 'Not Specified',
    });
    expect(action.addedTags).toContain('Visa Sponsorship');
    expect(action.qualityFlags).toContain('missing_salary');
  });

  it('should tag jobs and identify quality flags', () => {
    const tagRes = JobTagger.tag({
      title: 'Senior React Developer',
      location: 'Remote, India',
      isRemote: true,
      description: 'Short desc',
    });
    expect(tagRes.tags).toContain('Remote');
    expect(tagRes.qualityFlags).toContain('incomplete_description');
  });

  it('should generate user-derived match scores and explainable badges', () => {
    const mockJob: Job = {
      company: 'Google',
      id: 'job-123',
      title: 'Senior Software Engineer',
      location: 'Bangalore, India',
      country: 'India',
      experience: 'Senior',
      employmentType: 'Full-time',
      url: 'https://careers.google.com/jobs/123',
      datePosted: new Date().toISOString(),
      team: 'Cloud Engineering',
      source: 'greenhouse',
      isRemote: true,
      salary: '$180,000',
      description: 'Build high scale cloud infrastructure.',
      jobHash: 'hash-123',
    };

    const match = ExplainableScoringEngine.calculateMatch(
      mockJob,
      90,
      'Bangalore',
      'Senior (5–8 Years)',
      ['TypeScript', 'Node.js']
    );

    expect(match.totalScore).toBeGreaterThanOrEqual(80);
    expect(match.scoreExplanation.total).toBe(match.totalScore);
    expect(match.recommendationBadges).toContain('Top Match');
    expect(match.whyRecommended.length).toBeGreaterThan(0);
  });

  it('should record non-blocking telemetry metrics', () => {
    ClassificationMetrics.getInstance().recordClassification(12, 98, 'Google', 'Software Engineering');
    const report = ClassificationMetrics.getInstance().getReport();
    expect(report.jobsClassified).toBeGreaterThan(0);
    expect(report.confidenceDistribution.highPct).toBeGreaterThanOrEqual(0);
  });
});
