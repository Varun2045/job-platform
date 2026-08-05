import { ConfigValidator } from '../core/ConfigValidator.js';
import { HybridExperienceClassifier } from '../core/HybridExperienceClassifier.js';
import { DepartmentClassifier } from '../core/DepartmentClassifier.js';
import { JobTagger } from '../core/JobTagger.js';
import { Logger } from '../core/Logger.js';

Logger.logInfo('=== Classification System Validation ===\n');

// 1. Validate JSON Configurations
const report = ConfigValidator.validateAll();
if (report.valid) {
  Logger.logInfo('✅ Configuration Files: 100% Valid');
} else {
  Logger.logError('❌ Configuration Files Errors:');
  report.errors.forEach((e) => Logger.logError(`  - ${e}`));
  process.exit(1);
}

// 2. Classify Benchmark Job Sample
const sampleJobs = [
  {
    title: 'Senior Staff Backend Engineer (L6)',
    company: 'Google',
    description: 'We are seeking a Senior Staff Engineer with 8+ years experience in Java, Microservices, and Distributed Systems.',
  },
  {
    title: 'Graduate SDE Intern 2026',
    company: 'Amazon',
    description: '0-1 years experience required. Campus hiring for final year university students.',
  },
  {
    title: 'AI Platform Engineer',
    company: 'Meta',
    description: 'Build PyTorch pipelines and PyTorch serving infrastructure. Requires Python, PyTorch, and CUDA.',
  },
];

Logger.logInfo('\n=== Benchmark Sample Classifications ===');
for (const sample of sampleJobs) {
  const exp = HybridExperienceClassifier.classify(sample.title, sample.description, '', sample.company);
  const dept = DepartmentClassifier.classify(sample.title, sample.description);
  const tag = JobTagger.tag(sample);

  Logger.logInfo(`\nTitle: "${sample.title}" (${sample.company})`);
  Logger.logInfo(`  - Experience Level: ${exp.level} (Confidence: ${exp.confidence}%, Source: ${exp.source})`);
  Logger.logInfo(`  - Primary Dept:     ${dept.primaryDepartment} (Secondary: ${dept.secondaryDepartments.join(', ') || 'None'})`);
  Logger.logInfo(`  - Tags:             ${tag.tags.join(', ')}`);
}

Logger.logInfo('\n✅ Offline Classification Validation Completed Successfully!');
