import { ConfigValidator } from '../core/ConfigValidator.js';
import { HybridExperienceClassifier } from '../core/HybridExperienceClassifier.js';
import { DepartmentClassifier } from '../core/DepartmentClassifier.js';
import { JobTagger } from '../core/JobTagger.js';

console.log('=== Classification System Validation ===\n');

// 1. Validate JSON Configurations
const report = ConfigValidator.validateAll();
if (report.valid) {
  console.log('✅ Configuration Files: 100% Valid');
} else {
  console.error('❌ Configuration Files Errors:');
  report.errors.forEach((e) => console.error(`  - ${e}`));
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

console.log('\n=== Benchmark Sample Classifications ===');
for (const sample of sampleJobs) {
  const exp = HybridExperienceClassifier.classify(sample.title, sample.description, '', sample.company);
  const dept = DepartmentClassifier.classify(sample.title, sample.description);
  const tag = JobTagger.tag(sample);

  console.log(`\nTitle: "${sample.title}" (${sample.company})`);
  console.log(`  - Experience Level: ${exp.level} (Confidence: ${exp.confidence}%, Source: ${exp.source})`);
  console.log(`  - Primary Dept:     ${dept.primaryDepartment} (Secondary: ${dept.secondaryDepartments.join(', ') || 'None'})`);
  console.log(`  - Tags:             ${tag.tags.join(', ')}`);
}

console.log('\n✅ Offline Classification Validation Completed Successfully!');
