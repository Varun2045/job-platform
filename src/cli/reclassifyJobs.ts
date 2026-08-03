import { FileStorage } from '../storage/FileStorage.js';
import { SupabaseStorage } from '../storage/SupabaseStorage.js';
import { StorageProvider } from '../storage/StorageProvider.js';
import { config } from '../config/config.js';
import { JobNormalizer } from '../core/JobNormalizer.js';
import { Job } from '../companies/Scraper.js';

console.log('=== Batch Historical Job Reclassification Tool ===\n');

async function run() {
  const storage: StorageProvider = config.isLocal ? new FileStorage() : new SupabaseStorage();
  await storage.initialize();

  const jobs = await storage.getAllJobs();
  console.log(`Loaded ${jobs.length} stored job records.`);

  const companyJobsMap: Record<string, Job[]> = {};

  let reclassified = 0;
  for (const job of jobs) {
    const rawJob = {
      company: job.company,
      id: job.id,
      title: job.title,
      location: job.location,
      country: job.country,
      experience: job.experience,
      employmentType: job.employmentType,
      url: job.url,
      datePosted: job.datePosted,
      team: job.team,
      source: job.source,
      description: job.description,
      isRemote: job.isRemote,
      salary: job.salary,
    };

    const companyConfig = {
      id: job.company.toLowerCase(),
      name: job.company,
      enabled: true,
      priority: 5,
      interval_minutes: 60,
      resume_profiles: [],
      avg_response_time_ms: 100,
      total_scrapes: 1,
      total_failures: 0,
    };

    const normalized = JobNormalizer.normalize(rawJob, companyConfig);
    normalized.classificationHistory = [
      ...(job.classificationHistory || []),
      {
        classificationVersion: 'v1',
        timestamp: new Date().toISOString(),
        level: normalized.experienceLevel || 'Mid Level',
        primaryDepartment: normalized.primaryDepartment || 'Software Engineering',
        confidence: normalized.confidenceBreakdown?.overall || 85,
      },
    ];

    const cId = job.company.toLowerCase();
    if (!companyJobsMap[cId]) companyJobsMap[cId] = [];
    companyJobsMap[cId].push(normalized);
    reclassified++;
  }

  for (const [cId, updatedJobs] of Object.entries(companyJobsMap)) {
    await storage.saveCompanyJobs(cId, updatedJobs);
  }

  console.log(`\n✅ Successfully reclassified ${reclassified} historical jobs.`);
}

run().catch((err) => {
  console.error('❌ Reclassification Error:', err);
  process.exit(1);
});
