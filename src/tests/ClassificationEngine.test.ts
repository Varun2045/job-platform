import { ConfigValidator } from '../core/ConfigValidator.js';
import { HybridExperienceClassifier } from '../core/HybridExperienceClassifier.js';
import { DepartmentClassifier } from '../core/DepartmentClassifier.js';
import { JobTagger } from '../core/JobTagger.js';
import { RuleEngine } from '../core/RuleEngine.js';
import { ExplainableScoringEngine } from '../core/ExplainableScoringEngine.js';
import { ClassificationMetrics } from '../core/ClassificationMetrics.js';
import { Job } from '../companies/Scraper.js';
import { JobNormalizer } from '../core/JobNormalizer.js';
import { SearchEngine } from '../core/SearchEngine.js';

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
    expect(res.level).toMatch(/Entry Level|Internship|New Graduate/);
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

  it('should normalize salary, location hierarchy, and skills during ingestion', () => {
    const mockRawJob = {
      company: 'Google',
      id: 'job-999',
      title: 'Backend Node.js Developer',
      location: 'Bangalore, Karnataka, India',
      description: 'Requires Node.js and TypeScript. Salary: $120,000 to $160,000.',
      salary: '$120,000 - $160,000',
    };
    const mockCompany = { id: 'google', name: 'Google', enabled: true, priority: 2, interval_minutes: 60, resume_profiles: ['backend'], avg_response_time_ms: 200, total_scrapes: 0, total_failures: 0 };
    const normalized = JobNormalizer.normalize(mockRawJob as any, mockCompany);

    expect(normalized.salaryMin).toBe(120000);
    expect(normalized.salaryMax).toBe(160000);
    expect(normalized.salaryCurrency).toBe('USD');
    expect(normalized.requiredSkills).toContain('Node.js');
    expect(normalized.locationHierarchy).toEqual({
      country: 'India',
      state: 'Karnataka',
      city: 'Bangalore',
    });
  });

  it('should calculate cascading facets with sibling-level isolation', () => {
    const mockJobs = [
      {
        job: {
          company: 'Google',
          jobHash: 'h1',
          primaryDepartment: 'Backend Engineering',
          experienceLevel: 'Entry Level (0–2 Years)',
          isRemote: true,
          locationHierarchy: { country: 'India', state: 'Karnataka', city: 'Bangalore' },
        },
        score: 95,
        opportunityScore: 92,
      },
      {
        job: {
          company: 'Amazon',
          jobHash: 'h2',
          primaryDepartment: 'Frontend Engineering',
          experienceLevel: 'Senior (5–8 Years)',
          isRemote: false,
          locationHierarchy: { country: 'India', state: 'Karnataka', city: 'Bangalore' },
        },
        score: 75,
        opportunityScore: 70,
      },
    ];

    const criteria = {
      department: 'Backend Engineering',
    };

    const facetsResult = SearchEngine.calculateCascadingFacets(mockJobs as any, criteria);
    expect(facetsResult.version).toBe('v1');
    
    // For experienceLevels facet, the 'department' criteria is NOT excluded (since it is experienceLevels)
    // So it filters mockJobs down to only h1. Count for Entry Level should be 1.
    const entryFacet = facetsResult.facets.experienceLevels.find((f: any) => f.label === 'Entry Level (0–2 Years)');
    expect(entryFacet?.count).toBe(1);

    // For departments facet, 'department' criteria is excluded.
    // So both h1 and h2 are counted. Counts should be 1 for Backend and 1 for Frontend.
    const backendFacet = facetsResult.facets.departments.find((f: any) => f.label === 'Backend Engineering');
    const frontendFacet = facetsResult.facets.departments.find((f: any) => f.label === 'Frontend Engineering');
    expect(backendFacet?.count).toBe(1);
    expect(frontendFacet?.count).toBe(1);
  });
});
